# Etapa de construcción
FROM node:18 AS builder

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar el resto del código fuente
COPY . .
COPY .env .env
# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias del sistema necesarias para bcrypt
RUN apt-get update && apt-get install -y python3 make g++ 
# Instalar dependencias
RUN npm ci
# Compilar bcrypt específicamente para esta plataforma
RUN npm rebuild bcrypt --build-from-source

# Etapa de producción
FROM node:18-slim

WORKDIR /usr/src/app

# Copiar los archivos construidos desde la etapa de builder
COPY --from=builder /usr/src/app .

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar SSL y base de datos
COPY ssl ./ssl
COPY ./data/patentesD.db ./data/patentesD.db

# Establecer variables de entorno
ENV NODE_ENV=production
ENV PORT=49160
ENV HOST=0.0.0.0

# Exponer puertos
EXPOSE 49160 80 443

# Cambiar al usuario node por seguridad
USER node

# Comando para ejecutar la aplicación
CMD ["node", "server/server.js"]