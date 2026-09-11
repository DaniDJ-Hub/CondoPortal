# CondoPortal — Client (React + Vite)

Portal de residentes: estado de cuenta, pagos, gastos, dashboard, marketplace y
mapa del condominio.

## Estructura

```
src/
├── features/             → un módulo por dominio (vista + api + componentes)
│   ├── auth/             → login, registro y sesión
│   ├── dashboard/        → KPIs, flujo de caja, actividad reciente
│   ├── pagos/            → estado de cuenta e historial de movimientos
│   ├── gastos/           → CRUD y filtros de gastos
│   ├── marketplace/      → directorio de negocios y perfil de proveedor
│   ├── mapa/             → plano interactivo y puntos de interés
│   ├── landing/          → página pública
│   └── admin/            → panel de administración
├── shared/
│   ├── services/apiClient.js  → fetch centralizado, token y errores
│   ├── hooks/            → useApi, useTheme, useToast
│   ├── components/       → Layout, Toast, ThemeToggle, Estados
│   └── utils/formato.js  → moneda, fechas y tiempos relativos
├── routes/AppRouter.jsx  → rutas públicas y protegidas por rol
└── styles/               → tokens, componentes y estilos por vista
```

## Cómo correrlo

```bash
npm install
npm run dev
```

Queda en http://localhost:5173 y necesita el backend arriba en el puerto 3000
(ver `condoportal-server/README.md`).

Si el backend corre en otra dirección, crea un `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

Cuentas de prueba (contraseña `123456` en todas): `admin@condoportal.com` y
`residente@condoportal.com`. La pantalla de login trae botones para llenarlas
sin teclear.

## Convenciones

- **Un módulo por dominio.** Cada carpeta de `features/` tiene su `api.js` con
  las llamadas de ese dominio y sus componentes; nada hace `fetch` directo.
- **Carga de datos con `useApi`.** Devuelve `{ datos, cargando, error, recargar }`
  y cancela la petición si el componente se desmonta. La vista pinta los tres
  estados con `<Contenido>` de `shared/components/Estados`.
- **Avisos con `useToast`.** `toast.exito(...)`, `toast.error(...)` o
  `toast.desdeError(error)` en los `catch`, para que el mensaje del servidor
  llegue tal cual a la persona.
- **Estilos por capas.** `tokens.css` define la paleta (clara y oscura),
  `componentes.css` las primitivas compartidas (botones, campos, tablas,
  badges) y `vistas.css` lo propio de cada pantalla. Antes de escribir CSS
  nuevo, revisa si la primitiva ya existe.
- **Accesibilidad.** Toda tabla lleva `<caption class="sr-only">` y cada celda
  su `data-label` para la vista de tarjetas en móvil; los gráficos SVG traen
  su alternativa en tabla; el foco siempre es visible.

## Comprobaciones

```bash
npm run lint
npm run build
```
