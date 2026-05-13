# Guia Estudiantil - UCAB & UNIMET

Aplicacion web para la planificacion academica de estudiantes de la UCAB y UNIMET. Permite el seguimiento del pensum, planificacion de horarios y un sistema de resenas anonimo.

## Stack Tecnologico

- **Backend:** Python / FastAPI
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Base de Datos:** MongoDB (Atlas)
- **Scraping:** BeautifulSoup + httpx
- **DevOps:** Docker & Docker Compose

## Requisitos

- Python 3.11+
- Node.js 18+
- MongoDB Atlas cluster activo
- Docker Desktop (Opcional, para ejecución en contenedores)

## Ejecución Rápida con Docker

Si tienes Docker instalado, puedes levantar todo el proyecto con un solo comando:

```bash
docker-compose up --build
```

Consulta la [Guía de Docker](DOCKER_GUIDE.md) para más detalles.

## Configuracion Manual (Sin Docker)

### 1. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tu URI de MongoDB Atlas y secret key
```

### 2. Frontend

```bash
cd frontend
npm install
```

### 3. Seed de datos iniciales

```bash
cd backend
python -m app.scrapers.seed_data
```

## Ejecutar Manualmente

### Backend (puerto 8000)

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

Acceder a: http://localhost:5173

## API Docs

Con el backend corriendo: http://localhost:8000/docs

## Estructura del Proyecto

```
Horarios-/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Settings
│   │   ├── database.py      # MongoDB connection
│   │   ├── models/          # Pydantic models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Auth, business logic
│   │   └── scrapers/        # Web scraping + seed data
│   ├── requirements.txt
│   ├── Dockerfile           # Docker config backend
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── context/         # React Context (Auth)
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile           # Docker config frontend
│   └── nginx.conf           # Nginx config
├── docker-compose.yml       # Docker orchestration
├── DOCKER_GUIDE.md          # Guía de uso de Docker
└── README.md
```

## Universidades Soportadas

| Universidad | Siglas | Sistema |
|---|---|---|
| Universidad Catolica Andres Bello | UCAB | Semestral |
| Universidad Metropolitana | UNIMET | Trimestral |
