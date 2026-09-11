// Configuración central del servidor.
//
// Un único lugar donde se leen las variables de entorno, para que ningún
// módulo tenga que acordarse de los valores por defecto ni de los nombres.

import 'dotenv/config'

const esProduccion = process.env.NODE_ENV === 'production'

// En producción exigimos un secreto propio; en desarrollo generamos uno
// efímero para que `npm run dev` funcione sin configurar nada.
function resolverJwtSecret() {
  const secreto = process.env.JWT_SECRET
  if (secreto && secreto !== 'cambia-esto-por-un-secreto-largo-y-aleatorio') return secreto

  if (esProduccion) {
    throw new Error(
      'JWT_SECRET no está configurado. Define un secreto largo y aleatorio antes de arrancar en producción.',
    )
  }

  console.warn(
    '[config] JWT_SECRET sin configurar: se usará un secreto temporal de desarrollo.\n' +
      '         Las sesiones se invalidan en cada reinicio. Copia .env.example a .env para fijarlo.',
  )
  return `dev-${Math.random().toString(36).slice(2)}${Date.now()}`
}

export const config = {
  esProduccion,
  puerto: Number(process.env.PORT) || 3000,
  jwtSecret: resolverJwtSecret(),
  jwtExpiracion: process.env.JWT_EXPIRACION || '8h',
  // Si no hay DATABASE_URL el servidor arranca con el almacén en memoria.
  databaseUrl: process.env.DATABASE_URL || '',
  // Supabase y la mayoría de proveedores administrados exigen TLS.
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  origenesCors: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}
