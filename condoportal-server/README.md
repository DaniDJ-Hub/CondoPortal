# CondoPortal — Server (Node.js + Express)

API REST del portal. Todas las rutas cuelgan de `/api`.

## Estructura

```
src/
├── config/env.js    → variables de entorno en un solo lugar
├── db/              → persistencia: PostgreSQL con respaldo en memoria
│   ├── index.js     → elige el modo y expone db()
│   ├── postgres.js  → adaptador SQL
│   ├── memoria.js   → almacén en memoria (desarrollo / pruebas)
│   ├── schema.sql   → esquema de la base real
│   ├── seed.js      → datos de ejemplo (fechas relativas a hoy)
│   └── sembrar.js   → npm run db:seed
├── models/          → acceso a datos y reglas de cada entidad
├── controllers/     → validación de entrada y forma de la respuesta
├── routes/          → definición de endpoints
├── middleware/      → auth JWT, validaciones, manejo de errores
├── services/        → sesión (emisión y revocación de tokens)
├── app.js           → arma la app de Express
└── index.js         → arranca el servidor
```

## Cómo correrlo

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev
```

Servidor en http://localhost:3000 · Pruebas con `npm test`.

Sin `DATABASE_URL` el servidor arranca con el almacén en memoria y los datos de
ejemplo, así que no hace falta instalar nada más para desarrollar.

### Usar PostgreSQL o Supabase

```bash
# 1. Aplica el esquema
psql "$DATABASE_URL" -f src/db/schema.sql     # o pégalo en el SQL Editor de Supabase

# 2. Configura DATABASE_URL en .env y carga los datos de ejemplo
npm run db:seed
```

`GET /api/health` responde con el modo activo (`memoria` o `postgres`).

## Autenticación

Salvo el login, el registro y las rutas públicas del marketplace y el mapa,
todos los endpoints esperan la cabecera:

```
Authorization: Bearer <token>
```

Cuentas de prueba (contraseña `123456` en todas):

| Correo | Rol | Unidad |
|---|---|---|
| admin@condoportal.com | admin | ADM |
| residente@condoportal.com | residente | A-101 |
| mariana@condoportal.com | residente | A-204 |
| ruben@condoportal.com | residente | B-302 (con cuotas vencidas) |
| contacto@serviciosvega.mx | proveedor | — |

## Endpoints

### Auth
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | `{ email, password }` → `{ token, usuario }` |
| POST | `/api/auth/registro` | público | Alta de residente. Un admin autenticado puede elegir el rol |
| GET | `/api/auth/me` | sesión | Usuario de la sesión activa |
| POST | `/api/auth/renovar` | sesión | Token nuevo y revoca el anterior |
| POST | `/api/auth/logout` | sesión | Revoca el token actual |

### Gastos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/gastos` | sesión | Acepta `?categoria=`, `?desde=`, `?hasta=` |
| GET | `/api/gastos/categorias` | sesión | Catálogo y totales por rubro |
| GET | `/api/gastos/:id` | sesión | Detalle |
| POST | `/api/gastos` | admin | `{ descripcion, categoria, monto, fecha?, proveedor? }` |
| PUT | `/api/gastos/:id` | admin | Edición parcial |
| DELETE | `/api/gastos/:id` | admin | Baja |

### Pagos
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/pagos/estado-cuenta` | sesión | Estado de cuenta propio |
| GET | `/api/pagos/estado-cuenta/:usuarioId` | admin | Estado de cuenta de otro usuario |
| GET | `/api/pagos/movimientos` | sesión | Historial de movimientos |
| POST | `/api/pagos/pagar` | sesión | `{ monto, cuotaId?, metodo?, concepto? }` → pago, recibo y estado de cuenta ya recalculado |
| GET | `/api/pagos/:pagoId/recibo` | sesión | Recibo del pago (propio, o cualquiera si es admin) |
| POST | `/api/pagos/cuotas` | admin | Alta de cuota |
| GET | `/api/pagos/proyecciones` | admin | Proyección financiera a N meses |

Si el pago no indica `cuotaId`, se reparte entre las cuotas con saldo de la más
antigua a la más reciente, y el excedente queda como abono a cuenta.

### Dashboard
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/dashboard` | sesión | KPIs, flujo de caja, actividad y gastos por categoría en una sola llamada |
| GET | `/api/dashboard/kpis` | sesión | Saldo, ingresos, egresos, morosidad |
| GET | `/api/dashboard/flujo-caja` | sesión | Serie mensual. Acepta `?meses=` (3 a 24) |
| GET | `/api/dashboard/actividad` | sesión | Feed de actividad. Acepta `?limite=` |

### Marketplace
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/marketplace/negocios` | público | Acepta `?categoria=`, `?busqueda=`, `?destacados=true` |
| GET | `/api/marketplace/categorias` | público | Catálogo con conteo |
| GET | `/api/marketplace/negocios/:id` | público | Perfil del proveedor con reseñas |
| POST | `/api/marketplace/negocios` | admin o proveedor | Alta |
| PUT | `/api/marketplace/negocios/:id` | dueño o admin | Edición |
| DELETE | `/api/marketplace/negocios/:id` | admin | Baja |
| POST | `/api/marketplace/negocios/:id/resenas` | sesión | `{ calificacion, comentario? }`. Una por usuario |

### Mapa
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/mapa/puntos-interes` | público | Acepta `?categoria=`, `?radio=` (metros) |
| GET | `/api/mapa/puntos-interes/:id` | público | Detalle del punto |

### Admin
| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/admin/resumen` | admin | Cifras del panel general |
| GET | `/api/admin/usuarios` | admin | Acepta `?rol=` |
| POST | `/api/admin/usuarios` | admin | Alta manual |
| GET | `/api/admin/usuarios/:usuarioId` | admin | Detalle |
| PUT | `/api/admin/usuarios/:usuarioId` | admin | Edición de datos |
| PATCH | `/api/admin/usuarios/:usuarioId/rol` | admin | `{ rol }` |
| DELETE | `/api/admin/usuarios/:usuarioId` | admin | Baja lógica |

## Pruebas

```bash
npm test
```

Las pruebas levantan la API sobre el almacén en memoria en un puerto efímero y
la ejercitan por HTTP, así que cubren rutas, middleware y modelos juntos.

## Conectar con el frontend

En `condoportal-client`, crea un `.env` con:

```
VITE_API_URL=http://localhost:3000/api
```
