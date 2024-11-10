import imghdr
import os
import subprocess
from datetime import datetime
import FaumPipe
from PIL import Image
import io
import base64
import numpy as np

from flask import Flask, jsonify, request, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

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

@app.route('/microservicio1')
@login_required
def microservicio1():
    return jsonify({"message": "Microservicio 1 content"})


@app.route('/microservicio2')
@login_required
def microservicio2():
    return jsonify({"message": "Microservicio 2 content"})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)