FROM debian:bullseye-slim

# Configurar tiempos de espera y forzar IPv4
RUN echo 'Acquire::http::Timeout "120";' > /etc/apt/apt.conf.d/99timeout && \
    apt-get -o Acquire::ForceIPv4=true update && apt-get install -y --fix-missing \
    git build-essential bash pkg-config libglib2.0-dev netpbm libnetpbm10-dev automake autoconf m4 perl imagemagick

# Configurar FAUM
WORKDIR /app
RUN git clone https://git.code.sf.net/p/faum/code faum-code
WORKDIR /app/faum-code
RUN ./configure && make && make install
WORKDIR /app/temp
COPY . .

# Dar permisos de ejecución a los scripts copiados
RUN chmod +x *.sh

# Definir un volumen para las fotos
VOLUME ["/app/user_storage"]

CMD ["bash", "-c", "cp -r /app/temp/* /app/user_storage && tail -f /dev/null"]