#!/bin/bash

# Verificar si se proporcionó el nombre de la imagen como parámetro
if [ -z "$1" ]; then
  echo "Error: No se ha proporcionado el nombre de la imagen."
  echo "Uso: $0 <nombre_imagen_sin_extension>"
  exit 1
fi

NOMBRE=$1

# Verificar si el archivo TIFF original existe
if [ ! -f "${NOMBRE}.tif" ]; then
  echo "Error: ${NOMBRE}.tif no encontrado!"
  exit 1
fi

# Procesar bandas RGB (Rojo = 1, Verde = 2, Azul = 3)
for B in {1..3}; do
  if ! gdal_translate -ot Byte -b $B ${NOMBRE}.tif ${NOMBRE}_${B}.tif; then
    echo "Error: No se pudo ejecutar gdal_translate para la banda $B."
    exit 1
  fi
done

# Verificar si el archivo faum-code/createPamImage existe
if [ ! -f "/app/faum-code/createPamImage" ]; then
  echo "Error: /app/faum-code/createPamImage no encontrado!"
  exit 1
fi

# Crear archivo PAM combinando las bandas RGB
if ! /app/faum-code/createPamImage -l 1,2,3 -o ${NOMBRE}.pam \
  <(tifftopnm ${NOMBRE}_1.tif) \
  <(tifftopnm ${NOMBRE}_2.tif) \
  <(tifftopnm ${NOMBRE}_3.tif); then
  echo "Error: No se pudo crear la imagen PAM."
  exit 1
fi

# Verificar si listgeo está disponible
if ! command -v listgeo &> /dev/null; then
  echo "Error: listgeo no encontrado. Instala libgeotiff-tools."
  exit 1
fi

# Extraer metadatos del archivo TIFF
if ! listgeo ${NOMBRE}_1.tif > ${NOMBRE}_tifmetadata.txt; then
  echo "Error: No se pudieron extraer los metadatos."
  exit 1
fi

echo "Proceso completado exitosamente."
#!/bin/bashitosamente."

