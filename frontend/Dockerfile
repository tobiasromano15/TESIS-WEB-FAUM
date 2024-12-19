# Usa la imagen base específica para Node.js 20.17.0
FROM node:20.17.0

# Define el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias primero (para aprovechar el cache de Docker)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto 3000 para el servidor Next.js
EXPOSE 3001

# Comando para ejecutar el servidor de desarrollo de Next.js
CMD ["npx", "next", "dev", "-p", "3001"]
