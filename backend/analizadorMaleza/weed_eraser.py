import os

import cv2
import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np
import json
class Line:
    def __init__(self, x1, y1, x2, y2):
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2

    def to_tuple(self):
        return (self.x1, self.y1, self.x2, self.y2)

    def draw(self, img, color=(255, 0, 0), thickness=2):
        cv.line(img, (self.x1, self.y1), (self.x2, self.y2), color, thickness)

class PlantObject:
    def __init__(self, contour, color=(0, 255, 0)):
        self.contour = contour
        self.area = float(cv.contourArea(contour))
        self.x, self.y, self.w, self.h = cv.boundingRect(contour)
        self.aspect_ratio = float(self.h) / self.w
        self.color = color

    def draw(self, img):
        cv.drawContours(img, [self.contour], -1, self.color, 2)

    def save_location(self):
        return (int(self.x), int(self.y), int(self.w), int(self.h))

    def get_area(self):
        return self.area

    def get_aspect_ratio(self):
        return self.aspect_ratio

    def get_center(self):
        return (self.x + self.w // 2, self.y + self.h // 2)

    def to_dict(self):
        return {
            "location": self.save_location(),
            "area": self.get_area(),
            "aspect_ratio": self.get_aspect_ratio(),
            "contour": self.contour.tolist()
        }

    def is_line_touching(self, line):
        # Verificar si alguno de los extremos de la línea está tocando el contorno
        dist1 = cv.pointPolygonTest(self.contour, (line.x1, line.y1), True)
        dist2 = cv.pointPolygonTest(self.contour, (line.x2, line.y2), True)
        return dist1 >= 0 or dist2 >= 0  # La línea está tocando si alguno de los extremos toca el contorno


def connect_plants_by_stripe_and_y_distance(img, plant_objects, stripe_width, max_y_distance):
    """
    Conecta las plantas que están dentro de la misma franja vertical y cumplen con la distancia en Y.

    :param img: Imagen original donde se dibujarán las líneas.
    :param plant_objects: Lista de objetos PlantObject detectados.
    :param stripe_width: Ancho de cada franja vertical.
    :param max_y_distance: Distancia máxima en Y para conectar las plantas.
    :return: Imagen con las plantas conectadas.
    """
    # Obtener las dimensiones de la imagen
    img_height, img_width, _ = img.shape

    # Crear franjas verticales
    stripes = [[] for _ in range((img_width + stripe_width - 1) // stripe_width)]

    # Clasificar plantas en franjas según su posición horizontal
    for plant in plant_objects:
        center_x, _ = plant.get_center()
        stripe_index = center_x // stripe_width
        stripes[stripe_index].append(plant)

    # Dibujar líneas dentro de cada franja
    for stripe in stripes:
        # Ordenar plantas por su posición vertical
        stripe.sort(key=lambda p: p.get_center()[1])  # Ordenar por Y (posición vertical)

        # Conectar plantas dentro de la misma franja basadas en la distancia en Y
        for i in range(len(stripe) - 1):
            center1 = stripe[i].get_center()
            center2 = stripe[i + 1].get_center()

            # Calcular distancia en Y
            y_distance = abs(center2[1] - center1[1])

            # Conectar si están dentro del rango de distancia en Y
            if y_distance <= max_y_distance:
                cv.line(img, center1, center2, (0, 0, 0), 2)  # Dibujar línea azul

    return img
def obtener_rango_tierra_drone(img, lower_green=np.array([35, 25, 25]), upper_green=np.array([85, 255, 255]),
                               lower_percentile=5, upper_percentile=95):
    """
    Determina un rango aproximado de marrones (tierra) en una imagen de plantaciones tomadas con drone.
    
    Se asume que la vegetación es de color verde, por lo que se filtran dichos píxeles. Sobre el resto,
    se calculan los percentiles (por defecto 5 y 95) de cada canal HSV para aproximar el rango de tonos de tierra.
    
    :param img: Imagen en BGR.
    :param lower_green: Límite inferior para detectar vegetación en HSV.
    :param upper_green: Límite superior para detectar vegetación en HSV.
    :param lower_percentile: Percentil inferior para el cálculo.
    :param upper_percentile: Percentil superior para el cálculo.
    :return: Tuple (lower_brown, upper_brown) en formato HSV, o (None, None) si no se encuentran píxeles.
    """
    # Convertir la imagen a espacio HSV
    hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)
    
    # Crear una máscara para la vegetación (verde)
    mascara_vegetacion = cv.inRange(hsv, lower_green, upper_green)
    
    # Invertir la máscara para obtener los píxeles que NO son vegetación (posible tierra y otros elementos)
    mascara_no_vegetacion = cv.bitwise_not(mascara_vegetacion)
    
    # Obtener los índices de los píxeles fuera de la vegetación
    indices = np.where(mascara_no_vegetacion > 0)
    
    # Verificar que se encontraron píxeles; de lo contrario, se retorna None
    if len(indices[0]) == 0:
        print("No se encontraron píxeles fuera de la vegetación.")
        return None, None
    
    # Extraer los valores de cada canal para los píxeles no vegetados
    h_vals = hsv[:, :, 0][indices]
    s_vals = hsv[:, :, 1][indices]
    v_vals = hsv[:, :, 2][indices]
    
    # Calcular los percentiles para cada canal
    lower_h = np.percentile(h_vals, lower_percentile)
    lower_s = np.percentile(s_vals, lower_percentile)
    lower_v = np.percentile(v_vals, lower_percentile)
    
    upper_h = np.percentile(h_vals, upper_percentile)
    upper_s = np.percentile(s_vals, upper_percentile)
    upper_v = np.percentile(v_vals, upper_percentile)
    
    lower_brown = np.array([lower_h, lower_s, lower_v], dtype=np.uint8)
    upper_brown = np.array([upper_h, upper_s, upper_v], dtype=np.uint8)
    
    print("Rango de marrones detectado (no vegetación):", lower_brown, upper_brown)
    return lower_brown, upper_brown

def dilatacion_con_marrones_random(img, lower_brown, upper_brown):
    """
    Reemplaza los píxeles verdes adyacentes a las líneas azules por valores aleatorios 
    dentro del rango marrón definido (en HSV).

    :param img: Imagen original en BGR.
    :param lower_brown: Valor inferior en HSV para la gama de marrones (numpy array).
    :param upper_brown: Valor superior en HSV para la gama de marrones (numpy array).
    :return: Imagen resultante con los píxeles modificados.
    """
    print("DILATACIÓN CON MARRONES RANDOM")
    
    # Convertir la imagen de BGR a HSV
    imagen_hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)
    lower_brown, upper_brown = obtener_rango_tierra_drone(img)
    # Definir el rango para detectar píxeles verdes (ajustable según necesidad)
    lower_green = np.array([35, 25, 25])
    upper_green = np.array([85, 255, 255])
    
    # Crear la máscara para los píxeles verdes
    mascara_verde = cv.inRange(imagen_hsv, lower_green, upper_green)
    
    # Asumir que las líneas azules son de un color fijo (en este ejemplo, se asume azul puro representado como [0,0,0])
    lower_blue = np.array([0, 0, 0])  # Azul puro
    upper_blue = np.array([0, 0, 0])  # Azul puro
    mascara_azul = cv.inRange(img, lower_blue, upper_blue)
    
    # Expandir la máscara azul para incluir áreas adyacentes
    kernel = np.ones((3, 3), np.uint8)
    mascara_azul_dilatada = cv.dilate(mascara_azul, kernel, iterations=2)
    
    # Encontrar los píxeles verdes adyacentes a las líneas azules dilatadas
    mascara_interseccion_verde = cv.bitwise_and(mascara_verde, mascara_azul_dilatada)
    
    # Inicializar la máscara final de píxeles a modificar (verdes adyacentes a las líneas azules)
    mascara_final_modificar = mascara_interseccion_verde.copy()
    
    # Dilatación iterativa para propagar la zona a modificar
    max_iteraciones = 5000
    iteraciones = 0
    cambio = True

    while cambio and iteraciones < max_iteraciones:
        iteraciones += 1
        mascara_dilatada = cv.dilate(mascara_final_modificar, kernel, iterations=1)
        nuevos_puntos = cv.bitwise_and(mascara_verde, mascara_dilatada)
        
        if cv.countNonZero(nuevos_puntos) == 0:
            cambio = False
        else:
            mascara_final_modificar = cv.bitwise_or(mascara_final_modificar, nuevos_puntos)
    
    # Crear una imagen de valores aleatorios en HSV dentro del rango marrón
    alto, ancho = img.shape[:2]
    # Generar aleatoriamente cada canal de forma independiente dentro de su rango
    h_random = np.random.randint(lower_brown[0], upper_brown[0] + 1, size=(alto, ancho), dtype=np.uint8)
    s_random = np.random.randint(lower_brown[1], upper_brown[1] + 1, size=(alto, ancho), dtype=np.uint8)
    v_random = np.random.randint(lower_brown[2], upper_brown[2] + 1, size=(alto, ancho), dtype=np.uint8)
    rand_hsv = cv.merge([h_random, s_random, v_random])
    
    # Convertir la imagen aleatoria de HSV a BGR
    rand_bgr = cv.cvtColor(rand_hsv, cv.COLOR_HSV2BGR)
    
    # Crear una copia de la imagen original y reemplazar los píxeles indicados en la máscara 
    # por los valores aleatorios en marrón
    resultado = img.copy()
    resultado[mascara_final_modificar > 0] = rand_bgr[mascara_final_modificar > 0]
    
    return resultado


def process_weed_eraser(input):
    # Cargar la imagen y convertir a HSV
    img = input
    hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)

    # Detectar el rango de verdes (plantas)
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])

    mask = cv.inRange(hsv, lower_green, upper_green)
    result = cv.bitwise_and(img, img, mask=mask)
    edges = cv.Canny(mask, 50, 200)

    # Detectar contornos
    contours, _ = cv.findContours(mask, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

    # Filtrar objetos según área y relación de aspecto
    min_area = 0.01
    max_area = 500000
    min_aspect_ratio = 0.5
    max_aspect_ratio = 100.0

    plant_objects = []
    lines = []  # Lista para almacenar objetos Line

    for cnt in contours:
        area = cv.contourArea(cnt)
        if min_area < area < max_area:
            x, y, w, h = cv.boundingRect(cnt)
            aspect_ratio = float(h) / w

            if min_aspect_ratio < aspect_ratio < max_aspect_ratio:
                plant_obj = PlantObject(cnt)
                plant_objects.append(plant_obj)
                plant_obj.draw(img)

    # Trazar líneas basadas en franjas y distancia en Y
    stripe_width = 70  # Ancho de cada franja vertical
    max_y_distance = 400  # Distancia máxima en Y para conectar plantas
    img_with_lines = connect_plants_by_stripe_and_y_distance(img, plant_objects, stripe_width, max_y_distance)

    # Mapear las líneas azules como objetos Line
    for stripe in range((img.shape[1] + stripe_width - 1) // stripe_width):
        for i in range(len(plant_objects) - 1):
            center1 = plant_objects[i].get_center()
            center2 = plant_objects[i + 1].get_center()
            if abs(center1[0] - center2[0]) < stripe_width and abs(center1[1] - center2[1]) <= max_y_distance:
                line_obj = Line(center1[0], center1[1], center2[0], center2[1])
                lines.append(line_obj)

    final_img = dilatacion(img_with_lines)

    # Calcular el porcentaje de malezas
    total_pixels = img.shape[0] * img.shape[1]
    weed_pixels = np.sum(mask > 0)
    weed_percentage = (weed_pixels / total_pixels) * 100

    # Identificar áreas críticas (por ejemplo, las 5 áreas más grandes)
    critical_areas = []
    sorted_contours = sorted(contours, key=cv.contourArea, reverse=True)
    for i in range(min(5, len(sorted_contours))):
        x, y, w, h = cv.boundingRect(sorted_contours[i])
        critical_areas.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h)
        })

    # Devolver el resultado en el formato esperado por el endpoint
    return {
        "image": final_img,
        "weed_percentage": round(weed_percentage, 2),
        "critical_areas": critical_areas
    }