import cv2
import numpy as np


def hay_surcos(imagen_array):
    """
    Detecta si hay surcos con plantas en un campo a partir de una imagen.

    Args:
        imagen_array (numpy.ndarray): Array de la imagen.

    Returns:
        bool: True si se detectan surcos con plantas, False en caso contrario.
    """
    # Convertir la imagen a espacio de color HSV
    hsv = cv2.cvtColor(imagen_array, cv2.COLOR_BGR2HSV)

    # Definir el rango de color verde en HSV
    verde_bajo = np.array([35, 40, 40])
    verde_alto = np.array([85, 255, 255])

    # Crear una máscara para áreas verdes
    mascara_verde = cv2.inRange(hsv, verde_bajo, verde_alto)

    # Aplicar la máscara sobre la imagen original
    imagen_verde = cv2.bitwise_and(imagen_array, imagen_array, mask=mascara_verde)

    # Convertir la imagen filtrada a escala de grises
    gris = cv2.cvtColor(imagen_verde, cv2.COLOR_BGR2GRAY)

    # Mejorar el contraste
    gris_ecualizado = cv2.equalizeHist(gris)

    # Aplicar filtro para reducir ruido
    gris_suave = cv2.GaussianBlur(gris_ecualizado, (5, 5), 0)

    # Detectar bordes usando el algoritmo de Canny
    bordes = cv2.Canny(gris_suave, 30, 100)

    # Detectar líneas usando la transformada de Hough
    lineas = cv2.HoughLinesP(
        bordes, rho=1, theta=np.pi/180, threshold=50, minLineLength=50, maxLineGap=100
    )

    lineas_con_plantas = 0
    if lineas is not None:
        for linea in lineas:
            x1, y1, x2, y2 = linea[0]
            longitud = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if longitud > 300 and mascara_verde[y1, x1] > 0 and mascara_verde[y2, x2] > 0:
                lineas_con_plantas += 1

    hay_surcos_con_plantas = lineas_con_plantas > 5

    return hay_surcos_con_plantas
