from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import InputRequired, Length, EqualTo, ValidationError
from models import User

# Formulario de registro
class RegistrationForm(FlaskForm):
    username = StringField('Usuario', validators=[InputRequired(), Length(min=4, max=20)])
    password = PasswordField('Contraseña', validators=[InputRequired(), Length(min=8, max=20)])
    confirm_password = PasswordField('Confirmar Contraseña', validators=[InputRequired(), EqualTo('password')])
    submit = SubmitField('Registrarse')

    # Validación personalizada para evitar nombres de usuario duplicados
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Este nombre de usuario ya está en uso.')


# Formulario de inicio de sesión
class LoginForm(FlaskForm):
    username = StringField('Usuario', validators=[InputRequired(), Length(min=4, max=20)])
    password = PasswordField('Contraseña', validators=[InputRequired(), Length(min=8, max=20)])
    submit = SubmitField('Acceder')
