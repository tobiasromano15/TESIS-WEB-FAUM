import imghdr
import os
import subprocess
container_id = '7362cd742238'
container_id = os.getenv("SERVICE_CONTAINER_ID")
print(f"Service Container ID: {container_id}")


def analizar_imagen_jpeg(mincluster,maxcluster):
    comando1 = '/app/fotos/jpgtopnm.sh /app/fotos/tmp/input.jpeg /app/fotos/tmp/input.pam'
    faum_command = f"faum -m {mincluster} -M {maxcluster} -o /app/fotos/tmp/salida.pnm -R /app/fotos/tmp/salida.pgm /app/fotos/tmp/input.pam"
    comando2 = 'pnmtojpeg /app/fotos/tmp/salida.pnm > /app/fotos/tmp/output.jpeg'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, faum_command)
    ejecutar_comando_en_contenedor(container_id, comando2)

def analizar_imagen_tiff(mincluster,maxcluster):
    comando1 = '/app/fotos/tmp/crearPAMcompleta.sh /app/fotos/tmp/input'
    faum_command = f"faum -m {mincluster} -M {maxcluster} -o /app/fotos/tmp/salida.pnm -R /app/fotos/tmp/salida.pgm /app/fotos/tmp/input.pam"
    comando2 = 'pnmtotiff /app/fotos/tmp/salida.pnm > /app/fotos/tmp/output.tif'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, faum_command)
    ejecutar_comando_en_contenedor(container_id, comando2)

def aplicar_mascara_jpeg(transparencia, clases, fondo):
    comando1 = f"faum_mask -o /app/fotos/tmp/output_mascara.pnm -i /app/fotos/tmp/salida.pnm -B {fondo} -t {transparencia} -c {clases} /app/fotos/tmp/salida.pgm"
    comando2 = 'pnmtojpeg /app/fotos/tmp/output_mascara.pnm > /app/fotos/tmp/output_mask.jpeg'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, comando2)
def aplicar_mascara_tiff(transparencia, clases, fondo):
    comando1 = f"faum_mask -o /app/fotos/tmp/output_mascara.pnm -i /app/fotos/tmp/salida.pnm -B {fondo} -t {transparencia} -c {clases} /app/fotos/tmp/salida.pgm"
    comando2 = 'pnmtotiff /app/fotos/tmp/output_mascara.pnm > /app/fotos/tmp/output_mask.tif'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, comando2)


def ejecutar_comando_en_contenedor(container_id, comando):
    try:
        # Ejecutar el comando dentro del contenedor usando docker exec
        result = subprocess.run(
            ["docker", "exec", container_id, "bash", "-c", comando],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        # Capturar y mostrar la salida
        print("Salida:", result.stdout.decode("utf-8"))
        print("Errores:", result.stderr.decode("utf-8"))
    except subprocess.CalledProcessError as e:
        print("Error al ejecutar el comando:", e.stderr.decode("utf-8"))