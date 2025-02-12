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
                cv.line(img, center1, center2, (255, 0, 0), 2)  # Dibujar línea azul

    return img

def dilatacion(img):
    """
    Elimina píxeles verdes adyacentes a las líneas azules mediante dilatación iterativa.

    :param img: Imagen original en BGR con las líneas azules dibujadas.
    :return: Imagen con píxeles verdes eliminados.
    """
    print("DILATACIÓN")

    # Convertir la imagen de BGR a HSV
    imagen_hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)

    # Definir el rango de color para los verdes (en HSV)
    lower_green = np.array([35, 25, 25])  # Ajustado para incluir verdes más oscuros
    upper_green = np.array([85, 255, 255])

    # Crear la máscara para los píxeles verdes
    mascara_verde = cv.inRange(imagen_hsv, lower_green, upper_green)

    # Definir el rango de color para las líneas azules (en BGR)
    lower_blue = np.array([255, 0, 0])  # Azul puro
    upper_blue = np.array([255, 0, 0])  # Azul puro

    # Crear la máscara para las líneas azules
    mascara_azul = cv.inRange(img, lower_blue, upper_blue)

    # Expandir la máscara azul para incluir áreas adyacentes
    kernel = np.ones((3, 3), np.uint8)
    mascara_azul_dilatada = cv.dilate(mascara_azul, kernel, iterations=2)

    # Encontrar los píxeles verdes adyacentes a las líneas azules dilatadas
    mascara_interseccion_verde = cv.bitwise_and(mascara_verde, mascara_azul_dilatada)

    # Inicializar la máscara final de píxeles que deben eliminarse (verdes adyacentes a las líneas azules)
    mascara_final_eliminar = mascara_interseccion_verde.copy()

    # Eliminación en cadena con límite de iteraciones
    max_iteraciones = 5000
    iteraciones = 0
    cambio = True

    while cambio and iteraciones < max_iteraciones:
        iteraciones += 1
        # Encontrar los píxeles verdes adyacentes a los ya eliminados
        mascara_dilatada = cv.dilate(mascara_final_eliminar, kernel, iterations=1)
        nuevos_puntos_a_eliminar = cv.bitwise_and(mascara_verde, mascara_dilatada)

        # Verificar si hay nuevos píxeles para eliminar
        if cv.countNonZero(nuevos_puntos_a_eliminar) == 0:
            cambio = False
        else:
            # Agregar los nuevos puntos a la máscara final de eliminación
            mascara_final_eliminar = cv.bitwise_or(mascara_final_eliminar, nuevos_puntos_a_eliminar)

    # Invertir la máscara final para borrar los píxeles verdes adyacentes a las líneas azules
    mascara_invertida = cv.bitwise_not(mascara_final_eliminar)

    # Aplicar la máscara invertida a la imagen original para eliminar los píxeles verdes adyacentes
    imagen_sin_verdes_adyacentes = cv.bitwise_and(img, img, mask=mascara_invertida)

    return imagen_sin_verdes_adyacentes


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