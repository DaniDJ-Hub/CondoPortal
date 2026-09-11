// Construcción de la aplicación Express.
//
// Se separa de `index.js` para que las pruebas de integración puedan montar
// la app sin abrir un puerto.

import express from 'express'
import cors from 'cors'
import { config } from './config/env.js'
import { modoBaseDeDatos } from './db/index.js'
import authRoutes from './routes/auth.routes.js'
import gastosRoutes from './routes/gastos.routes.js'
import pagosRoutes from './routes/pagos.routes.js'
import adminRoutes from './routes/admin.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import marketplaceRoutes from './routes/marketplace.routes.js'
import mapaRoutes from './routes/mapa.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function crearApp() {
  const app = express()

  app.use(
    cors({
      // '*' permite probar desde otros puertos en desarrollo; en producción
      // se restringe a los orígenes de CORS_ORIGINS.
      origin: config.esProduccion ? config.origenesCors : true,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', baseDeDatos: modoBaseDeDatos(), entorno: config.esProduccion ? 'produccion' : 'desarrollo' }),
  )

  app.use('/api/auth', authRoutes)
  app.use('/api/gastos', gastosRoutes)
  app.use('/api/pagos', pagosRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/marketplace', marketplaceRoutes)
  app.use('/api/mapa', mapaRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
