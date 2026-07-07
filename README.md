# Guía Estudiantil

Herramienta de planificación académica para estudiantes universitarios en Venezuela (UCAB y UNIMET). Permite hacer seguimiento del pensum, armar horarios por período y consultar reseñas anónimas de materias y profesores.

## El problema

Cada semestre, los estudiantes pasan horas tratando de averiguar qué materias pueden inscribir, cuáles son prelación de cuáles, si hay conflictos de horario entre secciones, y qué profesores valen la pena. Esa información existe dispersa entre PDFs de mallas curriculares, grupos de WhatsApp y rumores de pasillo.

Guía Estudiantil centraliza todo eso en una sola app: el pensum con sus prelaciones, las secciones disponibles por período, y reseñas verificadas de la comunidad.

## Qué hace

### Seguimiento de pensum

Carga la malla curricular de tu carrera, marca las materias que ya aprobaste y el sistema calcula automáticamente cuáles puedes inscribir el próximo semestre según las prelaciones. Muestra tu progreso en créditos aprobados vs. totales.

### Planificación de horarios

Selecciona un período académico y arma tu horario eligiendo secciones de las materias disponibles. Ve los bloques de horario en una grilla visual (día/hora), detecta choques entre secciones y guarda borradores para comparar opciones.

### Reseñas anónimas

Califica materias y profesores con ratings por categoría (dificultad, carga de trabajo, calidad del profesor), deja comentarios, tips de estudio y estrategias. Todo anónimo, con filtro de profanidad.

### Panel de administración

Los usuarios con rol `admin` pueden gestionar la data académica: universidades, unidades académicas, programas, planes de estudio, materias y sus asignaciones a semestres con prelaciones y correquisitos.

### Encuesta de onboarding

Al registrarse, los estudiantes completan una encuesta donde seleccionan su universidad, carrera, y materias ya aprobadas. Esto alimenta el tracking de pensum desde el día uno.

## Stack técnico

El proyecto es un monorepo manejado con Turborepo y Bun como package manager.

### App (`apps/web`)

Next.js con App Router, React 19, TailwindCSS v4. Usa typed routes y React Compiler. El output es `standalone` para facilitar el deploy con Docker. La autenticación se maneja con Better Auth (email/password + Google OAuth) a través de cookies, no tokens en headers.

### Paquetes compartidos (`packages/`)

El monorepo separa concerns en paquetes internos para que la app web no mezcle todo en un solo lugar:

- **`db`**: Prisma con MongoDB. El schema está dividido en archivos por dominio (`domain.prisma`, `auth.prisma`, `user_profile.prisma`) en vez de un solo `schema.prisma` monolítico.
- **`auth`**: Configuración de Better Auth con el adapter de Prisma. Incluye el plugin de admin para roles.
- **`ui`**: Componentes compartidos de shadcn/ui (botones, inputs, etc.) con su propio `globals.css`.
- **`env`**: Validación de variables de entorno con `@t3-oss/env-core` y Zod. Falla en build si falta algo.
- **`config`**: `tsconfig.base.json` compartido.

### API

Las rutas de API viven dentro de Next.js en `apps/web/src/app/api/`. Hay 12 grupos de endpoints: `auth`, `universities`, `academic-programs`, `academic-units`, `periods`, `subjects`, `sections`, `teachers`, `reviews`, `schedules`, `study-plans` y `study-plan-subjects`.

### PWA

La app se puede instalar como Progressive Web App. El manifest y los íconos se sirven desde `public/favicon/`.

## Modelo de datos

El dominio gira alrededor de estas entidades principales:

- **University** → tiene muchas **AcademicUnit** (facultades/escuelas)
- **AcademicUnit** → tiene muchos **AcademicProgram** (carreras)
- **AcademicProgram** → tiene **StudyPlan** → con **StudyPlanSubject** (materias asignadas a semestres, con prelaciones y correquisitos)
- **Subject** → tiene **Section** por período (con bloques de horario, profesores, aula)
- **Period** → semestre o trimestre activo
- **Review** → vinculada a materia, con ratings por categoría y texto libre
- **Schedule** → colección de secciones elegidas por un usuario para un período
- **UserProfile** → materias aprobadas, créditos, universidad y carrera del estudiante

Todas las relaciones en MongoDB se manejan con IDs referenciados (no `@relation`), excepto User↔UserProfile y User↔Session que sí tienen relación explícita.

## Requisitos previos

- [Bun](https://bun.sh/) v1.3.14+
- MongoDB (Atlas o local)
- Credenciales de Google OAuth (para login con Google)

## Setup

1. Clona el repo e instala dependencias:

```bash
git clone <repo-url>
cd horaios
bun install
```

2. Copia el archivo de ejemplo y completa las variables:

```bash
cp apps/web/.env.example apps/web/.env
```

Las variables requeridas:

| Variable | Qué es |
| --- | --- |
| `DATABASE_URL` | Connection string de MongoDB |
| `BETTER_AUTH_SECRET` | String de al menos 32 caracteres para firmar tokens de sesión |
| `BETTER_AUTH_URL` | URL base de la app (en dev: `http://localhost:3000`) |
| `CORS_ORIGIN` | Mismo valor que `BETTER_AUTH_URL` |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client secret de Google OAuth |

3. Empuja el schema a la base de datos:

```bash
bun run db:push
```

4. Arranca el servidor de desarrollo:

```bash
bun run dev
```

La app estará en `http://localhost:3000`.

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `bun run dev` | Arranca todos los paquetes en modo desarrollo |
| `bun run dev:web` | Arranca solo la app web |
| `bun run build` | Build de producción |
| `bun run check-types` | Verifica tipos TypeScript en todo el monorepo |
| `bun run check` | Linting y formato con Biome |
| `bun run db:push` | Aplica el schema de Prisma a MongoDB |
| `bun run db:generate` | Regenera el Prisma Client |
| `bun run db:studio` | Abre Prisma Studio para explorar la base de datos |
| `bun run db:migrate` | Ejecuta migraciones |

## Docker

El proyecto incluye un `docker-compose.yaml` que construye la app web como imagen standalone:

```bash
docker compose up --build
```

La imagen usa multi-stage build (prepare → builder → runner) y corre como usuario no-root en producción. Necesita las variables de entorno en un `.env` en la raíz del proyecto.

## Componentes UI personalizados

Además de los primitivos de shadcn/ui, la app tiene componentes de UI propios con animaciones avanzadas (Framer Motion):

- **ContainerScroll**: animación de scroll 3D en el hero de la landing
- **GlowingEffect**: borde con efecto de brillo que sigue el cursor
- **ScrollExpandMedia**: hero de reseñas con expansión al hacer scroll
- **SpotlightEffect**: iluminación que sigue el mouse
- **FloatingActionMenu**: menú flotante de navegación tipo dock
- **SmoothAccordion**: acordeón con animación suave de altura

## Limitaciones actuales

- Solo soporta UCAB y UNIMET. Agregar otra universidad requiere cargar su data académica manualmente vía el panel de admin.
- No hay generación automática de horarios óptimos; el estudiante arma el horario manualmente eligiendo secciones.
- La funcionalidad de "Análisis Inteligente" (sugerencias basadas en progreso) está marcada como "Coming Soon".
- Las reseñas no tienen sistema de moderación más allá del filtro de profanidad.