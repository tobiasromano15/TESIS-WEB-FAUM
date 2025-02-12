import cv2
from PIL import Image
import numpy as np

def process_filter_formations(input_path, color_fondo="#000000"):
    """
    Reemplaza colores cercanos al color de fondo en una imagen, preservando la calidad.

    Args:
    - input_path (str): Ruta de la imagen de entrada.
    - color_fondo (str): Color de fondo en formato hexadecimal (ej. "#RRGGBB").

    Returns:
    - tuple: (imagen_procesada, metadatos)
    """

    umbral = 30  # Define qué tan cercanos deben ser los colores

    # Convertir el color de fondo de hexadecimal a RGB
    color_fondo_rgb = tuple(int(color_fondo.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))

    # Cargar la imagen original
    imagen = Image.open(input_path).convert("RGB")
    datos = np.array(imagen)
    
    # Convertir el color de fondo a un arreglo numpy
    fondo = np.array(color_fondo_rgb)
    
    # Calcular la distancia euclidiana de cada píxel al color de fondo
    distancias = np.sqrt(np.sum((datos - fondo) ** 2, axis=-1))
    
    # Crear una máscara para los píxeles cercanos al color de fondo
    mascara_cercanos = distancias <= umbral
    
    # Reemplazar los colores cercanos por el color de fondo
    datos[mascara_cercanos] = fondo
    
    # Crear una nueva imagen con los datos modificados
    imagen_modificada = Image.fromarray(datos, "RGB")
    
    # Convertir la imagen de PIL a formato OpenCV
    imagen_cv = cv2.cvtColor(np.array(imagen_modificada), cv2.COLOR_RGB2BGR)

    # Calcular el porcentaje de píxeles modificados
    pixeles_modificados = np.sum(mascara_cercanos)
    total_pixeles = datos.shape[0] * datos.shape[1]
    porcentaje_modificado = (pixeles_modificados / total_pixeles) * 100

    metadatos = {
        "porcentaje_modificado": round(porcentaje_modificado, 2),
        "color_fondo_original": color_fondo,
        "umbral_utilizado": umbral
    }

    return imagen_cv, metadatos


def filtrar_formaciones_por_tamano(img_path, color_fondo, tamano_min):
    """
    Filtra las formaciones en una imagen eliminando aquellas que tienen un tamaño menor a tamano_min píxeles cuadrados.
    
    :param img_path: Ruta al archivo de imagen a procesar.
    :param color_fondo: Color del fondo en formato RGB.
    :param tamano_min: Tamaño mínimo permitido en píxeles cuadrados.
    :return: Imagen procesada con las formaciones menores al tamaño mínimo eliminadas.
    """
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
    
    # Filtrar componentes por tamaño mínimo
    tamano_filtro = stats[:, cv2.CC_STAT_AREA] < tamano_min
    tamano_filtro[0] = False  # El fondo nunca debe ser modificado
    
    # Crear una máscara para los componentes que deben cambiar
    componentes_invalidos = tamano_filtro[labels]
    
    # Aplicar el color de fondo a los componentes fuera del rango
    img[componentes_invalidos] = color_fondo_bgr
    
    return img
def convertir_cm2_a_pixeles2(area_cm2, gsd):
    if gsd <= 0:
        raise ValueError("El GSD debe ser un valor positivo.")
    return area_cm2 / (gsd ** 2)

"""
# Ejemplo de uso
imagen_entrada = "./a.jpg"
color_fondo = (255,255,255) # Color de fondo elegido por el usuario
imagen_salida = "./salida.png"

reemplazar_colores_cercanos(imagen_entrada, color_fondo).save("./salida.png", format="PNG")


img_modificada = filtrar_formaciones_por_tamano(
    "./salida.png",
    color_fondo,  # Color de fondo en RGB
    tamano_min=500,   # Tamaño mínimo de área
)
cv2.imwrite('imagen_resultado.png', img_modificada)
"""