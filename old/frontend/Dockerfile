# --- Etapa 1: Construcción (Build) ---
FROM node:18-alpine as build

# Establecemos directorio de trabajo
WORKDIR /app

# Copiamos package.json y package-lock.json primero
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el código fuente
COPY . .

# Construimos la aplicación para producción (crea la carpeta dist/)
RUN npm run build

# --- Etapa 2: Servidor Web (Nginx) ---
FROM nginx:alpine

# Copiamos la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos construidos desde la etapa anterior a la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Nginx corre en primer plano por defecto
CMD ["nginx", "-g", "daemon off;"]
