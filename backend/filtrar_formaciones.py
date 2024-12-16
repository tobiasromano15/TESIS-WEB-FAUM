import cv2
import numpy as np

from PIL import Image

from PIL import Image
import numpy as np

from PIL import Image
import numpy as np

def reemplazar_colores_cercanos(imagen_path, color_fondo):
    """
    Reemplaza colores cercanos al color de fondo en una imagen, preservando la calidad.

    El objetivo es evitar los pixeles de colores extra, que agrega el formato jpg al comprimir la foto
    
    Args:
    - imagen_path (str): Ruta de la imagen de entrada.
    - color_fondo (tuple): Color de fondo en formato RGB (R, G, B).
    """

    umbral = 30  # Define qué tan cercanos deben ser los colores

    # Cargar la imagen original
    imagen = Image.open(imagen_path).convert("RGB")
    datos = np.array(imagen)
    
    # Convertir el color de fondo a un arreglo numpy
    fondo = np.array(color_fondo)
    
    # Calcular la distancia euclidiana de cada píxel al color de fondo
    distancias = np.sqrt(np.sum((datos - fondo) ** 2, axis=-1))
    
    # Crear una máscara para los píxeles cercanos al color de fondo
    mascara_cercanos = distancias <= umbral
    
    # Reemplazar los colores cercanos por el color de fondo
    datos[mascara_cercanos] = fondo
    
    # Crear una nueva imagen con los datos modificados
    imagen_modificada = Image.fromarray(datos, "RGB")
    
    return imagen_modificada



def filtrar_formaciones_por_tamano(img_path, color_fondo, tamano_min,tamano_max):

    
    tamano_max=1000

    # Cargar la imagen
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError("No se pudo cargar la imagen. Verifica la ruta de la imagen.")
    
    # Convertir el color de fondo a BGR si está en RGB
    color_fondo_bgr = (color_fondo[2], color_fondo[1], color_fondo[0])
    
    # Crear una máscara binaria para detectar píxeles diferentes al color de fondo
    color_fondo_bgr_np = np.array(color_fondo_bgr, dtype=np.uint8)
    mask = cv2.inRange(img, color_fondo_bgr_np, color_fondo_bgr_np)
    mask_inv = cv2.bitwise_not(mask)
    
    # Etiquetado de componentes conectados
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_inv, connectivity=8)
    
    # Filtrar componentes por tamaño
    tamano_filtro = (stats[:, cv2.CC_STAT_AREA] < tamano_min) | (stats[:, cv2.CC_STAT_AREA] > tamano_max)
    tamano_filtro[0] = False  # El fondo nunca debe ser modificado
    
    # Crear una máscara para los componentes que deben cambiar
    componentes_invalidos = tamano_filtro[labels]
    
    # Aplicar el color de fondo a los componentes fuera del rango
    img[componentes_invalidos] = color_fondo_bgr
    
    return img


# Ejemplo de uso
imagen_entrada = "c:/Users/s7tan/Desktop/TESIS-WEB-FAUM/backend/a.jpg"
color_fondo = (83, 79, 76) # Color de fondo elegido por el usuario
imagen_salida = "c:/Users/s7tan/Desktop/TESIS-WEB-FAUM/backend/salida.png"

reemplazar_colores_cercanos(imagen_entrada, color_fondo).save("c:/Users/s7tan/Desktop/TESIS-WEB-FAUM/backend/salida.png", format="PNG")


img_modificada = filtrar_formaciones_por_tamano(
    "c:/Users/s7tan/Desktop/TESIS-WEB-FAUM/backend/salida.png",
    color_fondo,  # Color de fondo en RGB
    tamano_min=50,   # Tamaño mínimo de área
    tamano_max=1000  # Tamaño maximo de área
)
cv2.imwrite('imagen_resultado.png', img_modificada)
