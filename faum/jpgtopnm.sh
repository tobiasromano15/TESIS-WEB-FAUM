#!/bin/bash

# Comprobamos si se ha proporcionado el nombre del archivo de entrada y salida
if [ "$#" -ne 2 ]; then
    echo "Uso: $0 archivo_entrada.jpg archivo_salida.pam"
    exit 1
fi

# Variables para los nombres de archivo
input_file="$1"
output_file="$2"

# Comprobamos si el archivo de entrada existe
if [ ! -f "$input_file" ]; then
    echo "El archivo de entrada no existe: $input_file"
    exit 1
fi

# Convertimos el archivo JPG a formato PAM usando netpbm
# Primero convertimos de JPG a PAM
jpegtopnm "$input_file" > "$output_file"

# Verificamos si la conversión fue exitosa
if [ $? -eq 0 ]; then
    echo "Conversión completa: $input_file -> $output_file"
else
    echo "Error en la conversión de $input_file a $output_file"
    exit 1
fi