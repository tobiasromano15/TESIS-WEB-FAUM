import os
from pyodm import Node

# Conecta al nodo de OpenDroneMap
n = Node('localhost', 3000)

# Directorio que contiene las imágenes
image_directory = 'C:/Users/Tobi/Desktop/test'

# Lista de todas las imágenes en el directorio
image_files = [
    os.path.join(image_directory, file)
    for file in os.listdir(image_directory)
    if file.lower().endswith(('.jpg', '.jpeg', '.png'))
]

# Opciones de procesamiento
options = {
    'dsm': True,  # Generar modelo digital de superficie
    'orthophoto-resolution': 2,  # Resolución del ortomosaico
    'feature-process-size': 4000,  # Tamaño para el procesamiento de características
    'undistorted-image-max-size': 2000,  # Máximo tamaño de las imágenes no distorsionadas
    'ignore-gsd': True,  # Ignorar la GSD
    'orthophoto-compression': 'LZW',  # Compresión del ortomosaico
    'max-resolution': 0,  # Usar resolución máxima disponible
    'mesh-octree-depth': 12,  # Profundidad del octree para la malla
    'use-gpu': True,  # Usar GPU si está disponible
    'fast-orthophoto': False  # Desactivar la generación rápida del ortomosaico
}

# Crea una tarea con todas las imágenes del directorio y las opciones definidas
task = n.create_task(image_files, options)

# Espera a que la tarea termine
task.wait_for_completion()

# Descarga y lista los resultados
results = task.download_assets("results")
print(os.listdir(results))
