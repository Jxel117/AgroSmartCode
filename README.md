# AgroSmart — Microservicio de Auditoría

Sistema de auditoría independiente para el proyecto AgroSmart.  
Funciona como un **microservicio separado** que recibe eventos vía RabbitMQ, los almacena en su propia base de datos PostgreSQL y los visualiza en un dashboard React.

---

## Arquitectura

```
┌─────────────────────┐         ┌──────────┐         ┌─────────────────────┐
│   AgroSmart         │         │          │         │  Microservicio      │
│   (sistema actual)  │ ──────▸ │ RabbitMQ │ ──────▸ │  de Auditoría       │
│                     │ publish │          │ consume │                     │
│  audit.emitter.js   │         │  cola    │         │  consumer ──▸ DB    │
│  (único cambio)     │         │  durable │         │  API REST           │
└─────────────────────┘         └──────────┘         │  Dashboard React    │
                                                     └─────────────────────┘
```

**Principio de diseño:** AgroSmart solo *emite* eventos JSON a una cola. Si el microservicio cae, AgroSmart sigue funcionando sin degradación. Si la cola no está disponible, el emisor falla silenciosamente.

---

## Requisitos previos

- **Docker** y **Docker Compose** instalados
- **Node.js 20+** (solo para desarrollo local sin Docker)
- El `JWT_SECRET` debe ser **idéntico** al de AgroSmart

---

## Inicio rápido (Docker)

### 1. Clonar y configurar

```bash
cd audit-service
cp .env.example .env
```

Editar `.env` y poner el mismo `JWT_SECRET` que usa AgroSmart.

### 2. Levantar todo

```bash
docker-compose up --build
```

Esto levanta 4 contenedores:

| Servicio          | Puerto | Descripción                          |
|-------------------|--------|--------------------------------------|
| `audit-rabbitmq`  | 5672   | Broker de mensajes (AMQP)            |
| `audit-rabbitmq`  | 15672  | Panel de gestión RabbitMQ            |
| `audit-db`        | 5434   | PostgreSQL de auditoría              |
| `audit-backend`   | 4001   | API REST del microservicio           |
| `audit-dashboard` | 8081   | Dashboard React (panel de auditoría) |

### 3. Verificar

```bash
# Health check del backend
curl http://localhost:4001/api/health

# Abrir el dashboard en el navegador
open http://localhost:8081

# Panel de gestión de RabbitMQ
open http://localhost:15672
# Usuario: audit_user / Contraseña: audit_pass
```

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env  # editar con datos locales

# Necesitas PostgreSQL y RabbitMQ corriendo localmente
# o solo los servicios de infraestructura con Docker:
docker-compose up -d rabbitmq audit-db

npm run dev
```

### Dashboard

```bash
cd dashboard
npm install

# Crear .env con la URL del backend
echo "VITE_API_URL=http://localhost:4001/api" > .env

npm run dev
# Abre en http://localhost:5174
```

---

## Cómo acceder al Dashboard

El dashboard requiere un **token JWT de administrador de AgroSmart**. Hay dos formas de acceder:

### Opción A: Enlace desde AgroSmart (recomendado)
Añadir en el frontend de AgroSmart un enlace que pase el token como query param:
```
http://localhost:8081?token=<JWT_DEL_ADMIN>
```

### Opción B: Ingreso manual
Abrir `http://localhost:8081`, pegar el token JWT en el campo de texto y presionar "Acceder".

---

## Endpoints de la API

Todos los endpoints requieren header `Authorization: Bearer <JWT_ADMIN>`.

| Método | Ruta                  | Descripción                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/health`         | Health check (sin auth)            |
| GET    | `/api/audit/eventos`  | Listar eventos con filtros         |
| GET    | `/api/audit/stats`    | Estadísticas para el dashboard     |
| GET    | `/api/audit/export`   | Exportar eventos (CSV o JSON)      |

### Filtros disponibles en `/api/audit/eventos`

| Parámetro    | Tipo    | Ejemplo                          |
|--------------|---------|----------------------------------|
| `categoria`  | string  | `AUTENTICACION`                  |
| `resultado`  | string  | `EXITO`, `FALLO`                 |
| `correo`     | string  | `admin@agro.com` (búsqueda ILIKE)|
| `fechaDesde` | ISO8601 | `2026-06-01T00:00:00.000Z`       |
| `fechaHasta` | ISO8601 | `2026-06-30T23:59:59.999Z`       |
| `cursor`     | ISO8601 | timestamp del último evento      |
| `limite`     | number  | `30` (máx 100)                   |

---

## Integración con AgroSmart

La carpeta `integracion-agrosmart/` contiene:

1. **`audit.emitter.js`** — El único archivo que se debe añadir al backend de AgroSmart. Publica eventos JSON a la cola `auditoria.eventos` de RabbitMQ.

2. **`EJEMPLOS_INTEGRACION.js`** — Referencia de cómo llamar a `emitir()` en cada servicio de AgroSmart (auth, usuarios, parcelas, nodos, riego, MQTT).

### Pasos para integrar:

1. Copiar `audit.emitter.js` a `AgroSmartCode/backend/src/audit/`
2. Instalar dependencia: `cd backend && npm install amqplib`
3. Añadir variables a `.env` de AgroSmart:
   ```env
   AUDIT_ENABLED=true
   AUDIT_RABBITMQ_URL=amqp://audit_user:audit_pass@rabbitmq:5672
   ```
4. Actualizar `config/env.js` con la nueva sección `audit`
5. Llamar `conectarAuditoria()` en el arranque (`index.js`)
6. Añadir llamadas a `emitir()` en los servicios (ver ejemplos)

---

## Esquema de eventos

Cada evento publicado a RabbitMQ sigue esta estructura:

```json
{
  "evento_id": "uuid-v4",
  "timestamp": "2026-06-20T15:30:00.000Z",
  "categoria": "AUTENTICACION",
  "accion": "LOGIN_EXITOSO",
  "resultado": "EXITO",
  "actor": {
    "usuario_id": "uuid",
    "correo": "admin@agrosmart.ec",
    "rol": "ADMINISTRADOR",
    "empresa_id": "empresa-abc"
  },
  "recurso": {
    "entidad_tipo": "sesion",
    "entidad_id": "uuid-sesion",
    "entidad_nombre": "Sesión de admin"
  },
  "contexto": {
    "ip": "192.168.1.10",
    "user_agent": "Mozilla/5.0...",
    "ruta": "POST /api/auth/login"
  },
  "metadatos": {}
}
```

### Categorías disponibles
- `AUTENTICACION` — login, logout, bloqueo, cambio de contraseña
- `GESTION_USUARIO` — CRUD de usuarios, cambio de estado
- `GESTION_PARCELA` — CRUD de parcelas, asignación de agricultores
- `GESTION_NODO` — CRUD de nodos, credenciales
- `CONFIGURACION_RIEGO` — configuración manual, perfiles
- `OPERACION_AFD` — transiciones del autómata de riego
- `SISTEMA_IOT` — conexiones MQTT, alertas, lecturas inválidas
- `REPORTE` — consultas de reportes y exportaciones

---

## Estructura del proyecto

```
audit-service/
├── docker-compose.yml             ← Orquestación de todos los servicios
├── .env.example                   ← Variables de entorno
├── README.md                      ← Este archivo
├── backend/                       ← Microservicio Node.js/Express
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js               ← Punto de entrada
│       ├── app.js                 ← Configuración Express
│       ├── config/env.js          ← Variables de entorno
│       ├── db/
│       │   ├── pool.js            ← Pool de PostgreSQL
│       │   ├── migrate.js         ← Runner de migraciones
│       │   └── migrations/
│       │       └── 001_init.sql   ← Esquema de auditoría
│       ├── queue/
│       │   ├── consumer.js        ← Consumer RabbitMQ
│       │   └── batchWriter.js     ← Escritura en batch
│       ├── modules/eventos/
│       │   ├── evento.repository.js  ← Queries SQL
│       │   ├── evento.service.js     ← Lógica de negocio
│       │   ├── evento.controller.js  ← Handlers HTTP
│       │   ├── evento.routes.js      ← Definición de rutas
│       │   └── evento.schemas.js     ← Validación Zod
│       ├── middlewares/
│       │   ├── auth.middleware.js     ← Validación JWT
│       │   └── error.middleware.js    ← Manejo de errores
│       ├── jobs/
│       │   └── retention.job.js      ← Purga de datos viejos
│       └── utils/
│           ├── AppError.js
│           └── asyncHandler.js
├── dashboard/                     ← Frontend React/Vite
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                ← Auth gate + routing
│       ├── index.css              ← Estilos globales
│       ├── api/auditApi.js        ← Cliente HTTP
│       ├── hooks/useAuth.js       ← Hook de autenticación
│       ├── pages/Dashboard.jsx    ← Página principal
│       └── components/
│           ├── LogEventos.jsx     ← Tabla de eventos
│           ├── StatsPanel.jsx     ← Gráficas y métricas
│           └── ExportPanel.jsx    ← Descarga CSV/JSON
└── integracion-agrosmart/         ← Archivos para AgroSmart
    ├── audit.emitter.js           ← SDK emisor de eventos
    └── EJEMPLOS_INTEGRACION.js    ← Referencia de uso
```

---

## Retención de datos

El job de retención se ejecuta diariamente a las 3:00 AM y:
- **Elimina** particiones de `log_evento` más antiguas que 12 meses (configurable con `RETENTION_MONTHS`)
- **Crea** particiones para los próximos 3 meses automáticamente

---

## Próximos pasos (después de levantar el microservicio)

1. Integrar `audit.emitter.js` en AgroSmart
2. Conectar AgroSmart al mismo RabbitMQ (red Docker compartida)
3. Añadir enlace de navegación en el frontend de AgroSmart
4. (Opcional) Añadir Grafana como servicio adicional en docker-compose
