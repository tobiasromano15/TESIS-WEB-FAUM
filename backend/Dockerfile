FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias para OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-dev libsm6 libxext6 libxrender1 libgtk2.0-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*
# Copiar dependencias del proyecto
COPY requirements.txt requirements.txt

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto para la aplicación
EXPOSE 5000

# Comando por defecto
CMD ["python", "app.py", "--debug"]