from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

# Inicializamos SQLAlchemy
db = SQLAlchemy()


# Definimos el modelo de Usuario
class User(UserMixin, db.Model):
    # Nombre de la tabla en la base de datos
    __tablename__ = 'users'

    # Definimos las columnas
    id = db.Column(db.Integer, primary_key=True)  # ID del usuario, clave primaria
    username = db.Column(db.String(150), unique=True, nullable=False)  # Nombre de usuario, debe ser único
    password = db.Column(db.String(150), nullable=False)  # Contraseña del usuario

    # Puedes agregar más campos según tus necesidades, por ejemplo:
    email = db.Column(db.String(150), unique=True, nullable=True)  # Email opcional

    def __repr__(self):
        return f"<User {self.username}>"
