import imghdr
import os
import shutil
import subprocess
import traceback
from datetime import datetime
import FaumPipe
from PIL import Image
import io
import base64
import numpy as np
import requests
from flask import Flask, jsonify, request, session, send_file, stream_with_context, Response, logging
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from werkzeug.utils import secure_filename
import uuid
from pyodm import Node
import json


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

UPLOAD_FOLDER = 'C:/Users/Tobi/Desktop/volumen/tmp'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
            filename = f"input.{image_format}"

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
            FaumPipe.analizar_imagen_tiff(min_cluster,max_cluster)
            imagen_analizada_filename = 'C:/Users/Tobi/Desktop/volumen/tmp/output.tif'
        else:
            FaumPipe.analizar_imagen_jpeg(min_cluster,max_cluster)
            imagen_analizada_filename = 'C:/Users/Tobi/Desktop/volumen/tmp/output.jpeg'
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
        FaumPipe.aplicar_mascara_jpeg(transparencia,mascaras_str,color_fondo)
        imagen_analizada_filename = 'C:/Users/Tobi/Desktop/volumen/tmp/output_mask.jpeg'
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
        file_path = os.path.join('C:/Users/Tobi/Desktop/volumen/tmp', filename)
        return send_file(file_path, mimetype='image/jpeg')
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/imagen-analizada/<filename>', methods=['GET'])
@login_required
def obtener_imagen_analizada(filename):
    try:
        return send_file(os.path.join(UPLOAD_FOLDER, filename), mimetype='image/png')
    except FileNotFoundError:
        return jsonify({'error': 'Imagen no encontrada'}), 404

@app.route('/verificar-imagen/<filename>', methods=['GET'])
def verificar_imagen(filename):
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        return jsonify({'status': 'ready'})
    else:
        return jsonify({'status': 'processing'})

#STORAGE-------------------------------
STORAGE_FOLDER = 'user_storage'
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
#ODM --------------------------------


NODEODM_URL = "http://localhost:8000"  # URL de NodeODM


# Verificar autenticación
@app.route('/check-auth', methods=['GET'])
def check_auth():
    # Lógica de autenticación (modifícala según tu app)
    if request.cookies.get('session_id'):  # Ejemplo con cookies
        return jsonify({"status": "authenticated"}), 200
    return jsonify({"status": "unauthenticated"}), 401


# Proxy a la interfaz de NodeODM
@app.route('/odm-proxy/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_nodeodm(subpath):
    try:
        # Construir la URL final hacia NodeODM
        url = f"{NODEODM_URL}/{subpath}"

        # Redirigir la solicitud original al servidor NodeODM
        if request.method == 'GET':
            response = requests.get(url, params=request.args)
        elif request.method == 'POST':
            response = requests.post(url, data=request.form, files=request.files)
        elif request.method == 'PUT':
            response = requests.put(url, data=request.data)
        elif request.method == 'DELETE':
            response = requests.delete(url)
        else:
            return jsonify({"error": "Método HTTP no soportado"}), 405

        # Devolver la respuesta de NodeODM al cliente
        return Response(response.content, status=response.status_code,
                        content_type=response.headers.get('Content-Type'))

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Error al conectar con NodeODM", "details": str(e)}), 500


# Prueba de conexión a NodeODM
@app.route('/test-odm-connection', methods=['GET'])
def test_odm_connection():
    try:
        response = requests.get(f"{NODEODM_URL}/api/status")
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": "No se pudo conectar a NodeODM", "details": str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)