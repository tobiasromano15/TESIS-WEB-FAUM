import imghdr
import os
import subprocess
container_id = '7362cd742238'
container_id = 'service'
print(f"Service Container ID: {container_id}")
def analizar_imagen_jpeg(mincluster, maxcluster, UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join("/app", UPLOAD_FOLDER.lstrip("/"))
    comando1 = f'/app/user_storage/jpgtopnm.sh {UPLOAD_FOLDER}/input.jpeg {UPLOAD_FOLDER}/input.pam'
    faum_command = f"faum -m {mincluster} -M {maxcluster} -o {UPLOAD_FOLDER}/salida.pnm -R {UPLOAD_FOLDER}/salida.pgm {UPLOAD_FOLDER}/input.pam"
    comando2 = f'pnmtojpeg {UPLOAD_FOLDER}/salida.pnm > {UPLOAD_FOLDER}/output.jpeg'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, faum_command)
    ejecutar_comando_en_contenedor(container_id, comando2)

def analizar_imagen_tiff(mincluster, maxcluster, UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join("/app", UPLOAD_FOLDER.lstrip("/"))
    comando1 = f'{UPLOAD_FOLDER}/crearPAMcompleta.sh {UPLOAD_FOLDER}/input'
    faum_command = f"faum -m {mincluster} -M {maxcluster} -o {UPLOAD_FOLDER}/salida.pnm -R {UPLOAD_FOLDER}/salida.pgm {UPLOAD_FOLDER}/input.pam"
    comando2 = f'pnmtotiff {UPLOAD_FOLDER}/salida.pnm > {UPLOAD_FOLDER}/output.tif'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, faum_command)
    ejecutar_comando_en_contenedor(container_id, comando2)

def aplicar_mascara_jpeg(transparencia, clases, fondo, UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join("/app", UPLOAD_FOLDER.lstrip("/"))
    comando1 = f"faum_mask -o {UPLOAD_FOLDER}/output_mascara.pnm -i {UPLOAD_FOLDER}/salida.pnm -B {fondo} -t {transparencia} -c {clases} {UPLOAD_FOLDER}/salida.pgm"
    comando2 = f'pnmtojpeg {UPLOAD_FOLDER}/output_mascara.pnm > {UPLOAD_FOLDER}/output_mask.jpeg'
    ejecutar_comando_en_contenedor(container_id, comando1)
    ejecutar_comando_en_contenedor(container_id, comando2)

def aplicar_mascara_tiff(transparencia, clases, fondo, UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join("/app", UPLOAD_FOLDER.lstrip("/"))
    comando1 = f"faum_mask -o {UPLOAD_FOLDER}/output_mascara.pnm -i {UPLOAD_FOLDER}/salida.pnm -B {fondo} -t {transparencia} -c {clases} {UPLOAD_FOLDER}/salida.pgm"
    comando2 = f'pnmtotiff {UPLOAD_FOLDER}/output_mascara.pnm > {UPLOAD_FOLDER}/output_mask.tif'
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