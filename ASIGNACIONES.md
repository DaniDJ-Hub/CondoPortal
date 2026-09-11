# CondoPortal — Asignaciones por Rol

Basado en "Reparto de Actividades por Rol" (Teteocan Technologies).
Cada quien trabaja únicamente dentro de su(s) carpeta(s) asignada(s).

## Frontend 1 — 16 SP

- `condoportal-client/src/features/auth/components/LoginForm.jsx` — Sprint 1
- `condoportal-client/src/features/pagos/components/EstadoCuenta.jsx` — Sprint 2
- `condoportal-client/src/features/dashboard/components/KpiCards.jsx` — Sprint 3
- `condoportal-client/src/features/marketplace/components/NegocioCard.jsx` — Sprint 4
- `condoportal-client/src/shared/components/Toast.jsx` — Sprint 5

## Frontend 2 — 16 SP

- `condoportal-client/src/features/pagos/components/HistorialMovimientos.jsx` — Sprint 2
- `condoportal-client/src/features/dashboard/components/FlujoDeCajaChart.jsx` — Sprint 3
- `condoportal-client/src/features/landing/components/Hero.jsx` — Sprint 4
- `condoportal-client/src/features/landing/components/Footer.jsx` — Sprint 4
- `condoportal-client/src/features/marketplace/components/PerfilProveedor.jsx` — Sprint 4
- `condoportal-client/src/shared/components/ThemeToggle.jsx` — Sprint 5

## Backend 1 — 21 SP

- `condoportal-server/src/controllers/auth.controller.js` — Sprint 1 (endpoint de autenticación)
- `condoportal-server/src/models/gasto.model.js` *(crear)* — Sprint 1 (modelo de datos de gastos)
- `condoportal-server/src/controllers/pagos.controller.js` *(crear)* — Sprint 2 (proyecciones financieras, recibo de pago)
- `condoportal-server/src/controllers/admin.controller.js` *(crear)* — Sprint 5 (gestión de usuarios y roles)

## Backend 2 — 21 SP

- `condoportal-client/src/features/auth/hooks/useAuth.js` + lógica de sesión en `condoportal-server` — Sprint 1 (manejo de sesión token/logout)
- `condoportal-server/src/controllers/gastos.controller.js` *(crear)* — Sprint 1 (CRUD de gastos, filtro por categoría)
- `condoportal-server/src/controllers/pagos.controller.js` *(compartido con Backend 1)* — Sprint 2 (flujo de pago, actualizar estado de cuenta)

## Full-Stack / QA — 19 SP

- `condoportal-client/src/features/dashboard/components/ActividadReciente.jsx` — Sprint 3
- Pruebas de integración del dashboard (sin carpeta fija, cubre todo `features/dashboard`) — Sprint 3
- `condoportal-client/src/features/mapa/` (componente + api.js) — Sprint 4
- `condoportal-client/src/features/admin/AdminPage.jsx` — Sprint 5
- Conectar `Toast.jsx` a eventos reales de la app — Sprint 5
- `condoportal-client/src/shared/hooks/useTheme.js` — Sprint 5 (persistir preferencia de tema)

---

**Regla general:** si tu tarea necesita un archivo que no existe todavía (marcado arriba como *(crear)*), créalo dentro de la carpeta indicada siguiendo el mismo patrón que los archivos ya existentes (ver comentarios al inicio de cada archivo placeholder).

---

## Estado del tablero

Todas las tarjetas del tablero están implementadas. Dónde quedó cada una:

### Frontend 1
| Tarjeta | Sprint | Archivos |
|---|---|---|
| Pantalla de login | 1 | `client/src/features/auth/components/LoginForm.jsx`, `AuthPage.jsx` |
| Vista resumen estado de cuenta | 2 | `client/src/features/pagos/components/EstadoCuenta.jsx`, `ModalPago.jsx` |
| Dashboard con KPIs | 3 | `client/src/features/dashboard/components/KpiCards.jsx` |
| Grid de negocios marketplace | 4 | `client/src/features/marketplace/MarketplacePage.jsx`, `components/NegocioCard.jsx` |
| Componente de notificaciones toast | 5 | `client/src/shared/components/Toast.jsx` |

### Frontend 2
| Tarjeta | Sprint | Archivos |
|---|---|---|
| Vista historial de movimientos | 2 | `client/src/features/pagos/components/HistorialMovimientos.jsx` + `components/historial/` |
| Gráfico de flujo de caja | 3 | `client/src/features/dashboard/components/FlujoDeCajaChart.jsx` |
| Landing page (hero/amenidades) | 4 | `client/src/features/landing/components/Hero.jsx` |
| Footer institucional | 4 | `client/src/features/landing/components/Footer.jsx` |
| Perfil de proveedor | 4 | `client/src/features/marketplace/components/PerfilProveedor.jsx` |
| Toggle de tema claro/oscuro | 5 | `client/src/shared/components/ThemeToggle.jsx` |

### Backend 1
| Tarjeta | Sprint | Archivos |
|---|---|---|
| Endpoint de autenticación | 1 | `server/src/controllers/auth.controller.js` |
| Modelo de datos de gastos | 1 | `server/src/models/gasto.model.js` |
| Proyecciones financieras | 2 | `server/src/models/dashboard.model.js` (`proyecciones`) |
| Generar recibo de pago | 2 | `server/src/models/pago.model.js` (`generarRecibo`) |
| Registro de nuevos usuarios | 4 | `server/src/controllers/auth.controller.js` (`registro`) |
| Gestión de usuarios y roles | 5 | `server/src/controllers/admin.controller.js` |

### Backend 2
| Tarjeta | Sprint | Archivos |
|---|---|---|
| Manejo de sesión (token/logout) | 1 | `server/src/services/sesion.service.js`, `client/src/features/auth/AuthProvider.jsx` |
| CRUD de gastos | 1 | `server/src/controllers/gastos.controller.js` |
| Filtro de gastos por categoría | 1 | `server/src/models/gasto.model.js` (`listarGastos`) |
| Flujo de pago de cuota | 2 | `server/src/models/pago.model.js` (`registrarPago`) |
| Actualizar estado de cuenta tras pago | 2 | `server/src/models/pago.model.js` (`obtenerEstadoCuenta`) |
| Middleware de autenticación JWT | 2 | `server/src/middleware/auth.middleware.js` |

### Full-Stack / QA
| Tarjeta | Sprint | Archivos |
|---|---|---|
| Feed de actividad reciente | 3 | `client/src/features/dashboard/components/ActividadReciente.jsx` |
| Pruebas de integración del dashboard | 3 | `server/tests/dashboard.test.js` |
| Base de datos real PostgreSQL/Supabase | 3 | `server/src/db/` (`schema.sql`, `postgres.js`, `sembrar.js`) |
| Mapa interactivo | 4 | `client/src/features/mapa/components/MapaInteractivo.jsx` |
| Puntos de interés cercanos | 4 | `server/src/models/mapa.model.js`, `client/src/features/mapa/MapaPage.jsx` |
| Backend/API del marketplace | 4 | `server/src/controllers/marketplace.controller.js`, `models/negocio.model.js` |
| Panel de administración general | 5 | `client/src/features/admin/AdminPage.jsx` |
| Conectar toasts a eventos reales | 5 | `client/src/shared/components/ToastProvider.jsx` |
| Persistir preferencia de tema | 5 | `client/src/shared/hooks/useTheme.js` |

### Notas para quien siga

- El historial de movimientos ya no usa datos de ejemplo: se alimenta de
  `GET /api/pagos/movimientos`, que devuelve cargos y abonos con saldo corrido.
- El almacén en memoria es sólo para desarrollo. El esquema real está en
  `server/src/db/schema.sql` y se carga con `npm run db:seed`.
- La lista de tokens revocados del logout vive en memoria del proceso: con
  varias instancias hay que moverla a Redis o a una tabla (ver el TODO en
  `sesion.service.js`).
