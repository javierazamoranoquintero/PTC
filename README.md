# PTC - Pichilemu Tennis Club

Aplicación web monolítica para la gestión del Pichilemu Tennis Club: reservas de
canchas, escalerilla de tenis, noticias y zona privada de socios/administración.

**Estado actual:** en desarrollo activo. El servidor base (Módulo 0) ya funciona;
la mayoría de los módulos funcionales todavía están en construcción.

## Stack técnico

- Node.js + Express.js (módulos ES6)
- EJS como motor de vistas (SSR)
- PostgreSQL + Sequelize (ORM)
- Sesiones persistidas en PostgreSQL (`express-session` + `connect-pg-simple`)
- Tailwind CSS (vía CDN, temporalmente)
- Docker + docker-compose
- Gestor de paquetes: pnpm

## Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose instalados (forma recomendada de correr el proyecto).
- Alternativa sin Docker: Node.js 22+, pnpm y una instancia de PostgreSQL accesible.

## Cómo levantar el proyecto (con Docker, recomendado)

1. Copia el archivo de variables de entorno de ejemplo y complétalo:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus propios valores. Si vas a correr todo con
   `docker-compose`, usa `DB_HOST=db` y `DB_PORT=5432` (revisa los
   comentarios dentro de `.env.example` para más detalle).

2. Levanta los contenedores (app + base de datos):
   ```bash
   docker-compose up --build
   ```

3. La app quedará disponible en [http://localhost:3000](http://localhost:3000).

## Cómo levantar el proyecto sin Docker

1. Instala dependencias:
   ```bash
   pnpm install
   ```
2. Copia `.env.example` a `.env` y complétalo apuntando a tu PostgreSQL local
   (usa `DB_HOST=localhost` y `DB_PORT=5433` si tu Postgres corre en el
   contenedor de docker-compose expuesto en ese puerto).
3. Corre el servidor en modo desarrollo (con recarga automática vía nodemon):
   ```bash
   pnpm run dev
   ```
   O en modo producción:
   ```bash
   pnpm start
   ```

## Variables de entorno

Ver `.env.example` para la lista completa y explicada de variables requeridas
(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`, `PORT`).
El servidor valida al arrancar que todas las variables obligatorias existan y
se detiene con un error claro si falta alguna (ver `config/config.js`).

## Estructura del proyecto

```
app.js                  # Punto de entrada del servidor Express
config/                 # Configuración (variables de entorno, conexión Sequelize)
helpers/                # Utilidades (ej: logger de actividad)
routes/                 # Rutas de Express, separadas por dominio
views/                  # Vistas EJS (páginas + partials reutilizables)
public/                 # Archivos estáticos (imágenes, CSS)
logs/                   # Logs de actividad generados en tiempo de ejecución (no se sube a git)
```

## Scripts disponibles

| Comando         | Descripción                                      |
|-----------------|---------------------------------------------------|
| `pnpm run dev`  | Levanta el servidor con nodemon (recarga automática) |
| `pnpm start`    | Levanta el servidor en modo normal (producción)   |

## Próximos pasos

Este proyecto se está desarrollando de forma incremental, por fases. El detalle
del plan de trabajo y el estado de avance se documentan por fuera de este README.