import imghdr
import os
import subprocess
from datetime import datetime

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


@app.route('/analizar-malezas', methods=['POST'])
@login_required
def analizar_malezas():
    data = request.json
    modo = data.get('modo')
    imagen_data = data.get('imagen')

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

        # Aquí iría tu lógica de análisis de malezas
        # Por ahora, simularemos un resultado
        resultado = imagen
        analizar_imagen()
        imagen_analizada_filename = 'C:/Users/Tobi/Desktop/volumen/tmp/output.jpeg'
        imagen_analizada_filepath = os.path.join(UPLOAD_FOLDER, imagen_analizada_filename)
        #imagen.save(imagen_analizada_filepath)
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

def analizar_imagen():
        comando1 = '/app/fotos/jpgtopnm.sh /app/fotos/tmp/input.jpeg /app/fotos/tmp/input.pam'
        faum_command = f"faum -o /app/fotos/tmp/salida.pnm /app/fotos/tmp/input.pam"
        comando2 = 'pnmtojpeg /app/fotos/tmp/salida.pnm > /app/fotos/tmp/output.jpeg'
        container_id = '7362cd742238'
        ejecutar_comando_en_contenedor(container_id, comando1)
        ejecutar_comando_en_contenedor(container_id, faum_command)
        ejecutar_comando_en_contenedor(container_id, comando2)

def ejecutar_comando_en_contenedor(container_id, comando):
    try:
        # Ejecutar el comando dentro del contenedor usando docker exec
        result = subprocess.run(
            ["docker", "exec", container_id, "bash", "-c", comando],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        # Capturar y mostrar la salida
        print("Salida:", result.stdout.decode("utf-8"))
        print("Errores:", result.stderr.decode("utf-8"))
    except subprocess.CalledProcessError as e:
        print("Error al ejecutar el comando:", e.stderr.decode("utf-8"))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)