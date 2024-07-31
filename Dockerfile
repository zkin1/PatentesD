FROM node:18-alpine

WORKDIR /usr/src/app

# Instalar dependencias necesarias para la compilación
RUN apk add --no-cache python3 make g++ sqlite-dev py3-setuptools

# Copiar archivos de configuración de npm
COPY package*.json ./

# Instalar dependencias
RUN npm install --build-from-source --sqlite=/usr/src/app/node_modules/sqlite3

# Copiar la base de datos
COPY patentesD.db ./

# Copiar el código fuente
COPY server /usr/src/app/server
COPY src /usr/src/app/src

# Copiar el archivo .env si lo estás usando
COPY .env ./

# Establecer variables de entorno
ENV PORT=49160
ENV HOST=0.0.0.0

# Exponer el puerto en el que tu aplicación escucha
EXPOSE 49160
EXPOSE 80 443
# Comando para ejecutar la aplicación
CMD ["node", "server/server.js"]