import imghdr
import os
import shutil
import subprocess
import traceback
from datetime import datetime

import cv2

import FaumPipe
from PIL import Image
import io
import base64
import numpy as np
import requests
from flask import Flask, jsonify, request, session, send_file, stream_with_context, Response, logging, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from werkzeug.utils import secure_filename
import uuid
from pyodm import Node
import json
from analizadorMaleza.hay_surcos import hay_surcos
from analizadorMaleza.weed_eraser import process_weed_eraser
from analizadorMaleza.filter_formations import process_filter_formations
import tempfile

# Inicializar la app Flask
app = Flask(__name__)

# Configuración de la base de datos
app.config['SECRET_KEY'] = 'mysecret'  # Clave secreta para los formularios
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # Base de datos SQLite
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Desactiva el seguimiento de modificaciones

# Inicializar SQLAlchemy con la app Flask
db.init_app(app)

# Configuración de Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # Redirige a la página de login si no estás autenticado

# Configurar CORS
CORS(app, supports_credentials=True)


# Cargar el usuario desde la base de datos
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Ruta de la página de inicio (Landing Page)
@app.route('/')
def index():
    return jsonify({"message": "Welcome to the API"})


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400

    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], password=hashed_password, email=data['email'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if 'username' not in data or 'password' not in data:
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({"message": "Logged in successfully"}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@app.route('/dashboard')
@login_required
def dashboard():
    return jsonify({"username": current_user.username})


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


def get_user_upload_folder():
    base_path = './user_storage'
    user_folder = os.path.join(base_path, str(current_user.id))
    upload_folder = os.path.join(user_folder, 'ResultadosFaum')
    # Crear las carpetas si no existen
    os.makedirs(user_folder, exist_ok=True)       # Crea la carpeta del usuario si no existe
    os.makedirs(upload_folder, exist_ok=True)     # Crea la carpeta 'tmp' del usuario si no existe
    return upload_folder
def get_user_upload_folder_tmp():
    base_path = './user_storage'
    user_folder = os.path.join(base_path, str(current_user.id))
    upload_folder = os.path.join(user_folder, 'tmp')
    # Crear las carpetas si no existen
    os.makedirs(user_folder, exist_ok=True)       # Crea la carpeta del usuario si no existe
    os.makedirs(upload_folder, exist_ok=True)     # Crea la carpeta 'tmp' del usuario si no existe
    return upload_folder
def get_user_upload_folder_root():
    base_path = './user_storage'
    user_folder = os.path.join(base_path, str(current_user.id))
    # Crear las carpetas si no existen
    os.makedirs(user_folder, exist_ok=True)       # Crea la carpeta del usuario si no existe
    return user_folder

image_format = ''
@app.route('/analizar-malezas', methods=['POST'])
@login_required
def analizar_malezas():
    data = request.json
    modo = data.get('modo')
    imagen_data = data.get('imagen')
    min_cluster = data.get('min')
    max_cluster = data.get('max')
    global image_format
    UPLOAD_FOLDER = get_user_upload_folder()
    if not imagen_data:
        return jsonify({'error': 'No se proporcionó imagen'}), 400

    try:
        if modo == 'completo':
            # La imagen completa viene como una cadena base64
            imagen_bytes = base64.b64decode(imagen_data.split(',')[1])

            # Detect the image format
            image_format = imghdr.what(None, h=imagen_bytes)
            if image_format is None:
                image_format = 'png'  # Default to PNG if format can't be detected

            # Generate a unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"input-{timestamp}.{image_format}"

            # Save the image in its original format
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            with open(filepath, 'wb') as f:
                f.write(imagen_bytes)

            imagen = Image.open(filepath)

        elif modo == 'region':
            # La región seleccionada viene como un objeto ImageData
            width = imagen_data['width']
            height = imagen_data['height']
            pixels = np.array(imagen_data['data'], dtype=np.uint8).reshape((height, width, 4))
            imagen = Image.fromarray(pixels)

            # For regions, we don't have the original format, so we'll save as PNG
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"region_seleccionada_{timestamp}.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            imagen.save(filepath, format='PNG')
        else:
            return jsonify({'error': 'Modo de análisis no válido'}), 400


        resultado = imagen
        if image_format == 'tif':
            FaumPipe.analizar_imagen_tiff(min_cluster,max_cluster,UPLOAD_FOLDER,filename)
            imagen_analizada_filename = os.path.join(UPLOAD_FOLDER, 'output.tif')
        else:
            FaumPipe.analizar_imagen_jpeg(min_cluster,max_cluster,UPLOAD_FOLDER,filename)
            imagen_analizada_filename = os.path.join(UPLOAD_FOLDER, 'output.jpeg')
        imagen_analizada_filepath = os.path.join(UPLOAD_FOLDER, imagen_analizada_filename)

        return jsonify({
            'mensaje': f'Análisis completado en modo {modo}. {resultado}',
            'detalles': {
                'modo': modo,
                'dimensiones': imagen.size,
                'archivo_guardado': filename,
                'archivo_analizado': imagen_analizada_filename
            }
        })
    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500


@app.route('/aplicar-mascara', methods=['POST'])
@login_required
def aplicar_mascara():
    try:
        data = request.json
        print(data)
        mascaras_activas = data.get('mascaras')
        color_fondo = data.get('color')
        transparencia = data.get('transparencia')
        mascaras_str = ",".join(map(str, mascaras_activas))
        print(transparencia, mascaras_str, color_fondo)
        color_fondo = color_fondo.replace('#','')
        UPLOAD_FOLDER = get_user_upload_folder()
        filename='output.jpeg'
        FaumPipe.aplicar_mascara_jpeg(transparencia,mascaras_str,color_fondo,UPLOAD_FOLDER,filename)
        imagen_analizada_filename = os.path.join(UPLOAD_FOLDER, 'output_mask.jpeg')         
        return jsonify({
            'mensaje': f'Análisis completado en modo',
            'detalles': {
                'mascaracas activas': mascaras_activas,
                'archivo_analizado': imagen_analizada_filename
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/aplicar-mascara/<filename>', methods=['GET'])
def get_masked_image(filename):
    try:
        UPLOAD_FOLDER = get_user_upload_folder()
        app.logger.info("RETURN MASKED IMAGE")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        return send_file(file_path, mimetype='image/jpeg')
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/imagen-analizada/<filename>', methods=['GET'])
@login_required
def obtener_imagen_analizada(filename):
    try:
        UPLOAD_FOLDER = get_user_upload_folder()
        return send_file(os.path.join(UPLOAD_FOLDER, filename), mimetype='image/jpeg')
    except FileNotFoundError:
        return jsonify({'error': 'Imagen no encontrada'}), 404

@app.route('/verificar-imagen/<filename>', methods=['GET'])
def verificar_imagen(filename):
    UPLOAD_FOLDER = get_user_upload_folder()
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        return jsonify({'status': 'ready'})
    else:
        return jsonify({'status': 'processing'})

#STORAGE-------------------------------
STORAGE_FOLDER = '/app/user_storage'
if not os.path.exists(STORAGE_FOLDER):
    os.makedirs(STORAGE_FOLDER)


@app.route('/storage', methods=['GET'])
@login_required
def get_user_storage():
    path = request.args.get('path', '')
    user_storage_dir = os.path.join(STORAGE_FOLDER, str(current_user.id))
    current_dir = os.path.join(user_storage_dir, path)

    if not os.path.exists(current_dir) or not current_dir.startswith(user_storage_dir):
        return jsonify({'error': 'Invalid path'}), 400

    storage_items = []
    for item in os.listdir(current_dir):
        item_path = os.path.join(current_dir, item)
        relative_path = os.path.relpath(item_path, user_storage_dir)
        if os.path.isfile(item_path):
            storage_items.append({
                'id': relative_path,
                'name': item,
                'type': 'file',
                'size': os.path.getsize(item_path),
                'lastModified': os.path.getmtime(item_path),
                'path': relative_path
            })
        elif os.path.isdir(item_path):
            storage_items.append({
                'id': relative_path,
                'name': item,
                'type': 'folder',
                'size': get_folder_size(item_path),
                'lastModified': os.path.getmtime(item_path),
                'path': relative_path
            })

    return jsonify(storage_items)


def get_folder_size(folder_path):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(folder_path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    return total_size


@app.route('/storage/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    path = request.form.get('path', '')
    user_storage_dir = os.path.join(STORAGE_FOLDER, str(current_user.id))
    save_path = os.path.join(user_storage_dir, path)

    if not os.path.exists(save_path) or not save_path.startswith(user_storage_dir):
        return jsonify({'error': 'Invalid path'}), 400

    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(save_path, filename))
        return jsonify({'message': 'File uploaded successfully'}), 200


@app.route('/storage/folder', methods=['POST'])
@login_required
def create_folder():
    data = request.json
    folder_name = data.get('name')
    path = data.get('path', '')

    if not folder_name:
        return jsonify({'error': 'Folder name is required'}), 400

    user_storage_dir = os.path.join(STORAGE_FOLDER, str(current_user.id))
    new_folder_path = os.path.join(user_storage_dir, path, folder_name)

    if not new_folder_path.startswith(user_storage_dir):
        return jsonify({'error': 'Invalid path'}), 400

    if os.path.exists(new_folder_path):
        return jsonify({'error': 'Folder already exists'}), 400

    os.makedirs(new_folder_path)
    return jsonify({'message': 'Folder created successfully'}), 200


@app.route('/storage/<path:item_path>', methods=['DELETE'])
@login_required
def delete_item(item_path):
    user_storage_dir = os.path.join(STORAGE_FOLDER, str(current_user.id))
    full_path = os.path.join(user_storage_dir, item_path)

    if not os.path.exists(full_path) or not full_path.startswith(user_storage_dir):
        return jsonify({'error': 'Invalid path'}), 400

    if os.path.isfile(full_path):
        os.remove(full_path)
    elif os.path.isdir(full_path):
        shutil.rmtree(full_path)
    else:
        return jsonify({'error': 'Item not found'}), 404

    return jsonify({'message': 'Item deleted successfully'}), 200
# Analizador -----------------------------------------------------------------
@app.route('/clasificar-cultivo', methods=['POST'])
@login_required
def clasificar_cultivo():
    try:
        # Leer 'archivoTemporal' en lugar de 'imagen'
        archivo_temporal = request.json['archivoTemporal']
        
        # Construir la ruta en la carpeta temporal (o donde lo guardes)
        # Ejemplo usando la misma lógica que /weed-eraser:
        user_folder = get_user_upload_folder_tmp()
        input_path = os.path.join(user_folder, archivo_temporal)
        
        if not os.path.exists(input_path):
            return jsonify({"error": "Archivo temporal no encontrado"}), 400

        # Cargar la imagen con OpenCV
        imagen = cv2.imread(input_path)  # Lee como BGR
        if imagen is None:
            return jsonify({"error": "No se pudo procesar la imagen"}), 400

        # Llamar a tu función hay_surcos
        resultado = hay_surcos(imagen)

        return jsonify({"esPostemergente": resultado})
    
    except Exception as e:
        print(f"Error en la clasificación del cultivo: {str(e)}")
        return jsonify({"error": "Error en la clasificación del cultivo"}), 500



@app.route('/apply-faum', methods=['POST'])
@login_required
def apply_faum():
    try:
        app.logger.info("Received request at /apply-faum")
        data = request.json
        archivo_temporal = data.get('archivoTemporal')
        app.logger.info(f"archivo_temporal received: {archivo_temporal}")

        if not archivo_temporal:
            app.logger.error("No se proporcionó archivoTemporal")
            return jsonify({'error': 'No se proporcionó archivoTemporal'}), 400

        UPLOAD_FOLDER = get_user_upload_folder_tmp()
        app.logger.info(f"Upload folder: {UPLOAD_FOLDER}")
        input_filepath = os.path.join(UPLOAD_FOLDER, archivo_temporal)
        app.logger.info(f"Input file path: {input_filepath}")

        if not os.path.exists(input_filepath):
            app.logger.error("Archivo temporal no encontrado")
            return jsonify({'error': 'Archivo temporal no encontrado'}), 400

        # Leer el archivo desde disco en lugar de decodificar base64
        with open(input_filepath, 'rb') as f:
            imagen_bytes = f.read()

        image_format = imghdr.what(None, h=imagen_bytes) or 'png'
        app.logger.info(f"Image format detected: {image_format}")

        timestamp = datetime.now()
        formatted_timestamp = timestamp.strftime("%Y%m%d_%H%M%S")
        input_filename = f"input_{formatted_timestamp}.{image_format}"
        input_filepath_new = os.path.join(UPLOAD_FOLDER, input_filename)

        # Guardar una copia del archivo (opcional, si es necesario)
        with open(input_filepath_new, 'wb') as f:
            f.write(imagen_bytes)
        app.logger.info(f"Image saved to {input_filepath_new}")

        min_cluster = 2
        max_cluster = 10
        app.logger.info("Starting image analysis with FAUM")

        if image_format == 'tif':
            analyzed_filename = FaumPipe.analizar_imagen_tiff(min_cluster, max_cluster, UPLOAD_FOLDER, input_filename)
        else:
            analyzed_filename = FaumPipe.analizar_imagen_jpeg(min_cluster, max_cluster, UPLOAD_FOLDER, input_filename)
        app.logger.info(f"Image analysis completed: {analyzed_filename}")

        # Step 2: Apply mask
        mascaras_activas = [3]
        color_fondo = '000000'
        transparencia = 500
        mascaras_str = ",".join(map(str, mascaras_activas))
        app.logger.info(f"Applying mask with params: transparencia={transparencia}, mascaras={mascaras_str}, color_fondo={color_fondo}")

        FaumPipe.aplicar_mascara_jpeg(transparencia, mascaras_str, color_fondo, UPLOAD_FOLDER, input_filename)
        masked_filename = f'output_mask_{formatted_timestamp}.jpeg'
        masked_filepath = os.path.join(UPLOAD_FOLDER, masked_filename)
        app.logger.info(f"Mask applied and saved: {masked_filename}")

        # Step 3: Return response
        return jsonify({
            'imagen': masked_filename,
            'metadata': {
                'fecha': timestamp.strftime("%d/%m/%Y"),
                'hora': timestamp.strftime("%H:%M:%S"),
                'timestamp': formatted_timestamp,
                'nombre_archivo': masked_filename
            }
        })

    except Exception as e:
        app.logger.error(f"Error in /apply-faum: {str(e)}")
        return jsonify({
            'error': f'Error al procesar la imagen: {str(e)}',
            'fecha': datetime.now().strftime("%d/%m/%Y"),
            'hora': datetime.now().strftime("%H:%M:%S")
        }), 500


## TO DO ENDPOINTS:
## weed-eraser 
## filter_formations
## canopeo
## cargar-imagen-temporal


@app.route('/storage/download')
@login_required
def download_file():
    path = request.args.get('path')
    if not path:
        return jsonify({'error': 'No path provided'}), 400

    # Ensure the path is secure and within the user's folder
    user_folder = get_user_upload_folder_root()
    full_path = os.path.abspath(os.path.join(user_folder, path))

    # Check if the path is still within the user's folder (prevent directory traversal)
    if not full_path.startswith(os.path.abspath(user_folder)):
        app.logger.error(f"Attempted access outside user folder: {full_path}")
        abort(403)  # Forbidden

    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        app.logger.error(f"File not found: {full_path}")
        return jsonify({'error': 'File not found'}), 404

    try:
        app.logger.info(f"Attempting to send file: {full_path}")
        return send_file(full_path, as_attachment=True)
    except Exception as e:
        app.logger.error(f"Error downloading file: {str(e)}")
        return jsonify({'error': 'Error downloading file'}), 500

@app.route('/weed-eraser', methods=['POST'])
@login_required
def weed_eraser():
    try:
        data = request.json
        archivo_temporal = data.get('archivoTemporal')
        
        if not archivo_temporal:
            return jsonify({'error': 'No se proporcionó archivo temporal'}), 400

        user_folder = get_user_upload_folder_tmp()
        input_path = os.path.join(user_folder, archivo_temporal)
        
        if not os.path.exists(input_path):
            return jsonify({'error': 'Archivo temporal no encontrado'}), 404

        # Process the image with weed-eraser
        img = cv2.imread(input_path)
        if img is None:
            return jsonify({'error': 'Error al leer la imagen'}), 400
        result = process_weed_eraser(img)
        
        # Save the processed image
        output_filename = f"weed_eraser_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        output_path = os.path.join(user_folder, output_filename)
        cv2.imwrite(output_path, result['image'])

        return jsonify({
            'resultado': 'Análisis de Weed Eraser completado',
            'imagenUrl': output_filename,
            'porcentajeMalezas': result['weed_percentage'],
            'areasCriticas': result['critical_areas']
        })

    except Exception as e:
        app.logger.error(f"Error in weed-eraser: {str(e)}")
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500


@app.route('/filter-formations', methods=['POST'])
@login_required
def filter_formations():
    try:
        data = request.json
        archivo_temporal = data.get('archivoTemporal')
        color_fondo = data.get('colorFondo', '#000000')  # Color de fondo por defecto negro
        
        if not archivo_temporal:
            return jsonify({'error': 'No se proporcionó archivo temporal'}), 400

        user_folder = get_user_upload_folder_tmp()
        input_path = os.path.join(user_folder, archivo_temporal)
        
        if not os.path.exists(input_path):
            return jsonify({'error': 'Archivo temporal no encontrado'}), 404

        # Process the image with filter-formations
        imagen_procesada, metadatos = process_filter_formations(input_path, color_fondo)
        
        # Save the processed image
        output_filename = f"filter_formations_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        output_path = os.path.join(user_folder, output_filename)
        cv2.imwrite(output_path, imagen_procesada)

        return jsonify({
            'resultado': 'Filtrado de formaciones completado',
            'imagenUrl': output_filename,
            'metadatos': metadatos
        })

    except Exception as e:
        app.logger.error(f"Error in filter-formations: {str(e)}")
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

@app.route('/cargar-imagen-temporal', methods=['POST'])
@login_required
def cargar_imagen_temporal():
    try:
        if 'imagen' not in request.files:
            return jsonify({'error': 'No se proporcionó imagen'}), 400

        imagen = request.files['imagen']
        if imagen.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400

        if imagen:
            # Create a temporary file
            user_folder = get_user_upload_folder_tmp()
            _, temp_path = tempfile.mkstemp(dir=user_folder, suffix='.jpg')
            
            # Save the uploaded image to the temporary file
            imagen.save(temp_path)
            
            # Get the filename of the temporary file
            temp_filename = os.path.basename(temp_path)
            
            return jsonify({
                'mensaje': 'Imagen cargada exitosamente',
                'archivoTemporal': temp_filename,
                'imagenUrl': f'/imagen-temporal/{temp_filename}'
            })

    except Exception as e:
        app.logger.error(f"Error in cargar-imagen-temporal: {str(e)}")
        return jsonify({'error': f'Error al cargar la imagen: {str(e)}'}), 500

@app.route('/imagen-temporal/<filename>', methods=['GET'])
@login_required
def obtener_imagen_temporal(filename):
    try:
        user_folder = get_user_upload_folder_tmp()
        return send_file(os.path.join(user_folder, filename), mimetype='image/jpeg')
    except FileNotFoundError:
        return jsonify({'error': 'Imagen temporal no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)

