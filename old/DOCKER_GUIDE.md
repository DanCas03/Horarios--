# 🐳 Guía Completa de Docker para Guía Estudiantil

Esta guía te enseñará desde cero cómo usar Docker con este proyecto. Al final, entenderás qué es Docker, cómo funciona y cómo ejecutar aplicaciones complejas con un solo comando.

---

## 📚 ¿Qué es Docker?

**Docker** es una plataforma que te permite empaquetar una aplicación y todas sus dependencias (librerías, configuraciones, etc.) en un "contenedor". Un contenedor es como una caja aislada que contiene todo lo necesario para que tu aplicación funcione, sin importar en qué computadora la ejecutes.

### Conceptos Clave

1.  **Imagen (Image):** Es una plantilla de solo lectura que contiene el código de tu aplicación y todo lo que necesita (Python, Node.js, librerías, etc.). Es como una "receta" para crear contenedores.

2.  **Contenedor (Container):** Es una instancia en ejecución de una imagen. Es el entorno aislado donde corre tu aplicación.

3.  **Dockerfile:** Un archivo de texto con instrucciones paso a paso para construir una imagen.

4.  **Docker Compose:** Una herramienta para definir y ejecutar aplicaciones con múltiples contenedores (ej: backend + frontend + base de datos) usando un solo archivo YAML.

---

## 🛠️ Requisitos Previos

### 1. Instalar Docker Desktop

Descarga e instala Docker Desktop para Windows:
👉 [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Una vez instalado:
1.  Abre Docker Desktop.
2.  Espera a que el ícono de Docker en la barra de tareas muestre "Docker Desktop is running".

### 2. Verificar la Instalación

Abre PowerShell y ejecuta:

```powershell
docker --version
docker-compose --version
```

Deberías ver las versiones instaladas (ej: `Docker version 24.x.x`).

---

## 📂 Archivos de Configuración Docker

### 1. `backend/Dockerfile`

Este archivo define cómo construir la imagen del **backend** (FastAPI).

```dockerfile
# 1. Imagen base: Python 3.11 (versión ligera)
FROM python:3.11-slim

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar solo requirements.txt primero (optimización de caché)
COPY requirements.txt .

# 4. Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto del código
COPY . .

# 6. Exponer el puerto 8000
EXPOSE 8000

# 7. Comando para iniciar FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**¿Por qué copiamos `requirements.txt` primero?**  
Docker usa un sistema de "capas" (layers). Si solo cambias el código (no las dependencias), Docker reutiliza la capa de instalación de paquetes, haciendo que las reconstrucciones sean mucho más rápidas.

**¿Qué significa `--host 0.0.0.0`?**  
Por defecto, FastAPI escucha en `127.0.0.1` (localhost), que solo es accesible desde dentro del contenedor. `0.0.0.0` hace que escuche en todas las interfaces de red, permitiendo que otros contenedores (como el frontend) se conecten.

---

### 2. `frontend/Dockerfile`

Este archivo usa una técnica llamada **multi-stage build** (construcción en múltiples etapas).

```dockerfile
# --- ETAPA 1: Construcción ---
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Genera la carpeta dist/ con archivos HTML/CSS/JS optimizados

# --- ETAPA 2: Servidor Web ---
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**¿Por qué dos etapas?**  
- **Etapa 1:** Necesitamos Node.js para compilar React (convertir JSX/TypeScript a JavaScript optimizado).
- **Etapa 2:** Una vez compilado, no necesitamos Node.js. Solo necesitamos un servidor web ligero (Nginx) para servir los archivos estáticos. Esto hace que la imagen final sea mucho más pequeña (de ~1GB a ~50MB).

---

### 3. `frontend/nginx.conf`

Configuración de Nginx para que funcione correctamente con React Router y redirija las peticiones de API al backend.

```nginx
server {
    listen 80;
    
    # Archivos estáticos de React
    root /usr/share/nginx/html;
    index index.html;

    # React Router: si no encuentra un archivo, devuelve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy reverso: redirige /api al backend
    location /api {
        proxy_pass http://backend:8000;
        # ... headers de proxy ...
    }
}
```

**¿Qué es un proxy reverso?**  
Cuando el navegador hace una petición a `http://localhost:3000/api/subjects`, Nginx intercepta esa petición y la redirige internamente al contenedor del backend (`http://backend:8000/api/subjects`). Esto evita problemas de CORS.

---

### 4. `docker-compose.yml`

Este es el archivo maestro que orquesta todos los servicios.

```yaml
version: '3.8'

services:
  # Backend (FastAPI)
  backend:
    build: ./backend          # Usa el Dockerfile en la carpeta backend
    container_name: guia_estudiantil_backend
    ports:
      - "8000:8000"           # Mapea puerto 8000 de tu PC al 8000 del contenedor
    env_file:
      - ./backend/.env        # Carga variables de entorno desde .env
    restart: always

  # Frontend (React + Nginx)
  frontend:
    build: ./frontend
    container_name: guia_estudiantil_frontend
    ports:
      - "3000:80"             # Puerto 3000 de tu PC → puerto 80 del contenedor
    depends_on:
      - backend               # Espera a que el backend esté listo
    restart: always
```

**¿Qué significa `depends_on`?**  
Le dice a Docker que inicie el backend antes que el frontend. Sin embargo, no espera a que el backend esté "listo" (solo a que el contenedor arranque). Para apps complejas, se usan herramientas como `wait-for-it.sh`.

**¿Qué es el mapeo de puertos `3000:80`?**  
El formato es `PUERTO_TU_PC:PUERTO_CONTENEDOR`. Nginx dentro del contenedor escucha en el puerto 80, pero tú accedes desde tu navegador usando `localhost:3000`.

---

## 🚀 Paso a Paso: Ejecutar el Proyecto

### Paso 1: Configurar Variables de Entorno

Asegúrate de tener el archivo `.env` en `backend/` con tu conexión a MongoDB Atlas:

```bash
cd backend
copy .env.example .env
```

Edita `backend/.env` y coloca tu URI de MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
DATABASE_NAME=guia_estudiantil
SECRET_KEY=tu-clave-secreta-super-segura-cambiala
```

### Paso 2: Inicializar la Base de Datos

**IMPORTANTE:** Ejecuta este script UNA VEZ antes de levantar Docker para crear las colecciones e insertar datos iniciales:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python init_database.py
deactivate
cd ..
```

Verás un output como este:

```
======================================================================
  INICIALIZANDO BASE DE DATOS - Guía Estudiantil
======================================================================

[1/6] Conectando a MongoDB Atlas...
      ✓ Conexión exitosa a la base de datos 'guia_estudiantil'

[2/6] Limpiando colecciones existentes...
      ✓ Colecciones limpiadas

[3/6] Insertando universidades...
      ✓ UCAB insertada (ID: ...)
      ✓ UNIMET insertada (ID: ...)

...

  ✓ INICIALIZACIÓN COMPLETADA
```

### Paso 3: Construir y Levantar los Contenedores

Desde la raíz del proyecto (`Horarios-`), ejecuta:

```powershell
docker-compose up --build
```

**¿Qué hace este comando?**
1.  Lee `docker-compose.yml`.
2.  Construye las imágenes del backend y frontend usando sus respectivos `Dockerfile`.
3.  Crea y arranca los contenedores.
4.  Conecta los servicios entre sí (el frontend puede hablar con el backend usando el nombre `backend`).

**Primera ejecución:** Tomará varios minutos mientras descarga las imágenes base (Python, Node, Nginx) y compila el frontend.

**Ejecuciones posteriores:** Serán mucho más rápidas gracias al sistema de caché de Docker.

### Paso 4: Acceder a la Aplicación

Una vez que veas en los logs algo como:

```
guia_estudiantil_backend  | INFO:     Application startup complete.
guia_estudiantil_frontend | /docker-entrypoint.sh: Configuration complete; ready for start up
```

Abre tu navegador:

*   **Aplicación (Frontend):** [http://localhost:3000](http://localhost:3000)
*   **API Docs (Backend):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Paso 5: Detener la Aplicación

En la terminal donde corre Docker Compose, presiona:

```
Ctrl + C
```

Para eliminar los contenedores (libera recursos):

```powershell
docker-compose down
```

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real

```powershell
docker-compose logs -f
```

Para ver solo los logs del backend:

```powershell
docker-compose logs -f backend
```

### Ejecutar en segundo plano (modo "detached")

```powershell
docker-compose up -d
```

Ahora los contenedores corren en segundo plano. Para ver los logs:

```powershell
docker-compose logs -f
```

### Reconstruir solo un servicio

Si cambiaste código del backend:

```powershell
docker-compose up --build backend
```

### Reiniciar un servicio

```powershell
docker-compose restart backend
```

### Ver contenedores en ejecución

```powershell
docker ps
```

### Entrar a un contenedor (para debugging)

```powershell
docker exec -it guia_estudiantil_backend /bin/bash
```

Esto abre una terminal dentro del contenedor. Útil para inspeccionar archivos o ejecutar comandos.

### Limpiar todo (imágenes, contenedores, volúmenes)

```powershell
docker-compose down -v
docker system prune -a
```

**⚠️ CUIDADO:** Esto borra todas las imágenes y contenedores de Docker, no solo de este proyecto.

---

## 🗂️ Archivos `.dockerignore`

Similar a `.gitignore`, estos archivos le dicen a Docker qué NO copiar al construir la imagen.

**`backend/.dockerignore`:**
```
__pycache__
venv
.env
.git
*.pyc
```

**`frontend/.dockerignore`:**
```
node_modules
dist
.env
.git
```

**¿Por qué?**  
Si copiáramos `node_modules` (que puede pesar cientos de MB), la construcción sería lentísima. En su lugar, Docker ejecuta `npm install` dentro del contenedor con las dependencias correctas.

---

## 🔍 Entendiendo el Flujo

### Cuando ejecutas `docker-compose up --build`:

1.  **Backend:**
    *   Docker lee `backend/Dockerfile`.
    *   Descarga la imagen base `python:3.11-slim` (si no la tiene).
    *   Copia `requirements.txt` e instala las dependencias.
    *   Copia el código de la app.
    *   Ejecuta `uvicorn` para iniciar FastAPI en el puerto 8000.

2.  **Frontend:**
    *   Docker lee `frontend/Dockerfile`.
    *   **Etapa 1:** Descarga `node:18-alpine`, instala dependencias, ejecuta `npm run build` (genera carpeta `dist/`).
    *   **Etapa 2:** Descarga `nginx:alpine`, copia los archivos de `dist/` y la configuración `nginx.conf`, inicia Nginx en el puerto 80.

3.  **Networking:**
    *   Docker crea una red interna donde los contenedores pueden comunicarse usando sus nombres (`backend`, `frontend`).
    *   Mapea los puertos: tu PC puede acceder al backend en `localhost:8000` y al frontend en `localhost:3000`.

### Cuando haces una petición desde el navegador:

1.  Abres `http://localhost:3000` → Nginx sirve `index.html` (React).
2.  React hace una petición a `/api/subjects` → Nginx intercepta y redirige a `http://backend:8000/api/subjects`.
3.  FastAPI procesa la petición, consulta MongoDB Atlas (en la nube), y devuelve la respuesta.
4.  React recibe los datos y actualiza la interfaz.

---

## 🗄️ Base de Datos: MongoDB Atlas vs Local

### Opción 1: MongoDB Atlas (Actual)

El proyecto está configurado para usar tu cluster de **MongoDB Atlas** (en la nube). Ventajas:
- No necesitas instalar MongoDB localmente.
- Accesible desde cualquier lugar.
- Backups automáticos.

**Configuración:** Solo necesitas tu URI en `backend/.env`.

### Opción 2: MongoDB Local con Docker (Opcional)

Si quieres aprender a usar una base de datos local con Docker, descomenta estas líneas en `docker-compose.yml`:

```yaml
services:
  # ... backend y frontend ...

  mongodb:
    image: mongo:latest
    container_name: guia_estudiantil_db
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Y cambia la URI en `backend/.env`:

```env
MONGODB_URI=mongodb://mongodb:27017/guia_estudiantil
```

**¿Qué son los volúmenes?**  
Los contenedores son efímeros (al eliminarlos, pierdes los datos). Los volúmenes son carpetas persistentes que Docker guarda en tu disco duro, sobreviviendo a reinicios y eliminaciones de contenedores.

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to the Docker daemon"

**Causa:** Docker Desktop no está corriendo.  
**Solución:** Abre Docker Desktop y espera a que inicie completamente.

### Error: "port is already allocated"

**Causa:** Ya hay algo corriendo en el puerto 3000 o 8000.  
**Solución:**
1.  Detén el proceso que usa ese puerto.
2.  O cambia el puerto en `docker-compose.yml` (ej: `"3001:80"` en lugar de `"3000:80"`).

### Error: "No module named 'app'"

**Causa:** El `WORKDIR` en el Dockerfile no está configurado correctamente.  
**Solución:** Ya está configurado correctamente en este proyecto. Si lo modificaste, asegúrate de que `WORKDIR /app` esté presente.

### El frontend no se conecta al backend

**Causa:** El proxy de Nginx no está configurado correctamente.  
**Solución:** Verifica que `nginx.conf` tenga la línea `proxy_pass http://backend:8000;` (usa el nombre del servicio, no `localhost`).

### Error al inicializar la base de datos

**Causa:** Tu IP no está en la whitelist de MongoDB Atlas.  
**Solución:**
1.  Ve a MongoDB Atlas → Network Access.
2.  Añade tu IP actual o `0.0.0.0/0` (permite todas las IPs - solo para desarrollo).

---

## 📋 Flujo de Trabajo Recomendado

### Desarrollo Diario

1.  **Iniciar la aplicación:**
    ```powershell
    docker-compose up
    ```

2.  **Hacer cambios en el código:**
    *   Edita archivos en `backend/` o `frontend/`.
    *   Para ver los cambios, necesitas reconstruir:
        ```powershell
        docker-compose up --build
        ```

3.  **Ver logs:**
    ```powershell
    docker-compose logs -f
    ```

4.  **Detener:**
    ```powershell
    Ctrl + C
    docker-compose down
    ```

### Desarrollo con Hot Reload (Avanzado)

Para no tener que reconstruir cada vez que cambias código, puedes usar **volúmenes de montaje**. Esto sincroniza tu carpeta local con el contenedor.

Modifica `docker-compose.yml`:

```yaml
services:
  backend:
    # ... configuración existente ...
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Ahora, cada vez que guardes un archivo, FastAPI se recargará automáticamente (como con `--reload` en local).

---

## 🎓 Conceptos Avanzados

### ¿Qué es una red de Docker?

Cuando ejecutas `docker-compose up`, Docker crea automáticamente una red virtual donde todos los servicios pueden comunicarse usando sus nombres como hostnames.

En `nginx.conf`, usamos `proxy_pass http://backend:8000`. Docker resuelve `backend` a la IP interna del contenedor del backend.

### ¿Qué son las capas (layers)?

Cada instrucción en un Dockerfile (`FROM`, `RUN`, `COPY`) crea una capa. Docker cachea estas capas. Si no cambias una capa, Docker la reutiliza en lugar de reconstruirla.

**Ejemplo:**
```dockerfile
COPY requirements.txt .    # Capa 1
RUN pip install ...        # Capa 2 (solo se reconstruye si cambió requirements.txt)
COPY . .                   # Capa 3 (se reconstruye cada vez que cambias código)
```

### ¿Qué es Alpine?

`alpine` es una distribución de Linux ultra ligera (5MB vs 100MB+). Las imágenes `python:3.11-alpine` o `nginx:alpine` son mucho más pequeñas que las versiones completas.

---

## 📊 Comparación: Docker vs Manual

| Aspecto | Ejecución Manual | Docker |
|---------|------------------|--------|
| **Instalación** | Python, Node.js, dependencias | Solo Docker |
| **Portabilidad** | "Funciona en mi máquina" | Funciona igual en todas partes |
| **Configuración** | Múltiples comandos | Un solo comando |
| **Aislamiento** | Dependencias globales | Entorno aislado por contenedor |
| **Limpieza** | Desinstalar todo manualmente | `docker-compose down` |

---

## 🎯 Resumen de Comandos

```powershell
# Inicializar base de datos (UNA VEZ)
cd backend
python init_database.py

# Levantar aplicación
docker-compose up --build

# Detener aplicación
Ctrl + C
docker-compose down

# Ver logs
docker-compose logs -f

# Reconstruir solo backend
docker-compose up --build backend

# Entrar a un contenedor
docker exec -it guia_estudiantil_backend /bin/bash

# Limpiar todo
docker-compose down -v
docker system prune -a
```

---

## ✅ Checklist de Verificación

Antes de ejecutar `docker-compose up`:

- [ ] Docker Desktop está abierto y corriendo
- [ ] Existe `backend/.env` con la URI de MongoDB Atlas
- [ ] Ejecutaste `python init_database.py` exitosamente
- [ ] No hay nada corriendo en los puertos 3000 y 8000

---

## 🎉 ¡Listo!

Ahora tienes una aplicación completamente "dockerizada". Esto significa que:
- Puedes compartir el proyecto con un compañero y funcionará igual en su máquina.
- Puedes desplegarlo en un servidor (AWS, Azure, DigitalOcean) con los mismos comandos.
- Tienes un entorno de desarrollo consistente y reproducible.

**Próximos pasos para aprender más:**
- Experimenta modificando los `Dockerfile`.
- Prueba añadir un contenedor de MongoDB local.
- Investiga sobre Docker volumes para persistir datos.
- Aprende sobre Docker networks para comunicación entre contenedores.

¡Bienvenido al mundo de Docker! 🐳
