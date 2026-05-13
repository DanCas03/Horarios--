# 1. Usamos una imagen base oficial de Python ligera (slim)
FROM python:3.11-slim

# 2. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos el archivo de dependencias primero (para aprovechar la caché de Docker)
COPY requirements.txt .

# 4. Instalamos las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiamos el resto del código de la aplicación
COPY . .

# 6. Exponemos el puerto donde correrá FastAPI
EXPOSE 8000

# 7. Comando para ejecutar la aplicación cuando arranque el contenedor
# --host 0.0.0.0 es CRUCIAL en Docker para que sea accesible desde fuera del contenedor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
