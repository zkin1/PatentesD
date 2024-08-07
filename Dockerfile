# Etapa de construcción
FROM node:18 AS builder

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar el resto del código fuente
COPY . .
COPY .env .env
# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias del sistema necesarias para bcrypt y Python
RUN apt-get update && apt-get install -y python3 python3-venv python3-pip make g++

# Crear un entorno virtual y activar
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Instalar sqlite-web en el entorno virtual
RUN /opt/venv/bin/pip install sqlite-web

# Instalar dependencias de npm
RUN npm ci
# Compilar bcrypt específicamente para esta plataforma
RUN npm rebuild bcrypt --build-from-source

# Etapa de producción
FROM node:18-slim

WORKDIR /usr/src/app

# Instalar SQLite3 y Python3 en la etapa de producción
RUN apt-get update && apt-get install -y sqlite3 python3 && rm -rf /var/lib/apt/lists/*

# Copiar los archivos construidos desde la etapa de builder
COPY --from=builder /usr/src/app .
COPY --from=builder /opt/venv /opt/venv

# Instalar solo las dependencias de producción de npm
RUN npm ci --only=production

# Copiar SSL y base de datos
COPY ssl ./ssl
COPY ./data/patentesD.db ./data/patentesD.db

# Establecer variables de entorno
ENV NODE_ENV=production
ENV PORT=49160
ENV HOST=0.0.0.0
ENV PATH="/opt/venv/bin:$PATH"

# Exponer puertos
EXPOSE 49160 80 443 8080

# Cambiar al usuario node por seguridad
USER node 

# Comando para ejecutar la aplicación
CMD ["node", "server/server.js"]
