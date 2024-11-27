# Usa una imagen base de Ubuntu
FROM ubuntu:22.04

# Desactivar interacciones durante la instalación
ENV DEBIAN_FRONTEND=noninteractive

# Configurar zona horaria y actualizar paquetes
RUN apt-get update && apt-get install -y \
    tzdata && \
    ln -fs /usr/share/zoneinfo/America/Buenos_Aires /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    apt-get install -y build-essential cmake git libboost-all-dev libproj-dev libopencv-dev libgdal-dev python3 python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Clonar el repositorio de ODM
RUN git clone https://github.com/OpenDroneMap/ODM.git /opt/odm

# Establecer el directorio de trabajo
WORKDIR /opt/odm

# Compilar ODM
RUN ./configure.sh install

# Definir el punto de entrada para ejecutar ODM
ENTRYPOINT ["./run.sh"]
