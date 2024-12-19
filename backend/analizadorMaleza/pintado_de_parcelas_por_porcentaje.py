from PIL import Image
import math

def pintado_de_parcelas_por_porcentaje(imagen_ruta, color, porcentaje_minimo, cantidad_subimagenes):
    """
    Divide una imagen en una cantidad específica de subimágenes y calcula el porcentaje de píxeles diferentes.
    Si el porcentaje de píxeles distintos en una subimagen es menor al porcentaje mínimo, la pinta de un solo color.

    :param imagen_ruta: Ruta de la imagen.
    :param color: Tupla RGB del color a comparar.
    :param porcentaje_minimo: Porcentaje mínimo de cobertura para mantener la subimagen original.
    :param cantidad_subimagenes: Número total de subimágenes.
    :return: Lista de porcentajes de píxeles distintos para cada subimagen.
    """
    # Abrir la imagen
    imagen = Image.open(imagen_ruta)
    imagen = imagen.convert('RGB')

    # Calcular el tamaño de la cuadrícula
    columnas = filas = int(math.sqrt(cantidad_subimagenes))
    
    # Si no es cuadrado exacto, ajustamos filas y columnas
    if columnas * filas < cantidad_subimagenes:
        columnas += 1
    if columnas * filas < cantidad_subimagenes:
        filas += 1

    # Tamaño de cada subimagen
    ancho, alto = imagen.size
    ancho_subimagen = ancho // columnas
    alto_subimagen = alto // filas

    porcentajes = []

    for i in range(columnas):
        for j in range(filas):
            if len(porcentajes) >= cantidad_subimagenes:
                break

            # Coordenadas de la subimagen
            izquierda = i * ancho_subimagen
            superior = j * alto_subimagen
            derecha = min((i + 1) * ancho_subimagen, ancho)
            inferior = min((j + 1) * alto_subimagen, alto)

            subimagen = imagen.crop((izquierda, superior, derecha, inferior))
            
            # Calcular píxeles diferentes
            pixeles = list(subimagen.getdata())
            total_pixeles = len(pixeles)
            pixeles_diferentes = sum(1 for pixel in pixeles if pixel != color)

            porcentaje = (pixeles_diferentes / total_pixeles) * 100
            porcentajes.append(porcentaje)

            # Modificar subimagen si el porcentaje es menor al mínimo
            if porcentaje < porcentaje_minimo:
                subimagen = Image.new('RGB', subimagen.size, color)

            # Pegar subimagen modificada
            imagen.paste(subimagen, (izquierda, superior))

    print(f"Porcentajes de píxeles distintos en cada subimagen: {porcentajes}")

    return imagen

# Ejemplo de uso
ruta_imagen = "c:/Users/s7tan/Desktop/TESIS-WEB-FAUM/imagen_resultado.png"  
color_referencia = (83, 79, 76)
porcentaje_minimo_cobertura = 10
cantidad_subimagenes = 36  # Número total de subimágenes

pintado_de_parcelas_por_porcentaje(ruta_imagen, color_referencia, porcentaje_minimo_cobertura, cantidad_subimagenes).save("imagen_modificada.jpg")
