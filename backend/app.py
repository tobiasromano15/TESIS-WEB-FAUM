from flask import Flask, jsonify, request, session
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


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


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