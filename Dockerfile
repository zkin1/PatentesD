FROM node:18-alpine

WORKDIR /usr/src/app

COPY patentesD.db ./

# Instalar dependencias necesarias para la compilación
RUN apk add --no-cache python3 make g++ sqlite-dev py3-setuptools

COPY package*.json ./

COPY patentesD.db /usr/src/app/patentesD.db

# Instalar dependencias
RUN npm install --build-from-source --sqlite=/usr/src/app/node_modules/sqlite3

COPY . .

EXPOSE 3456

CMD ["node", "server/server.js"]