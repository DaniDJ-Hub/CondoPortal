// Carga los datos semilla en PostgreSQL.
//
// Uso:  npm run db:seed     (requiere DATABASE_URL y el esquema ya aplicado)
//
// Es idempotente: vacía las tablas, reinserta la semilla y realinea las
// secuencias para que los siguientes IDs no choquen con los sembrados.

import { config } from '../config/env.js'
import { SEED } from './seed.js'

const TABLAS = [
  ['usuarios', SEED.usuarios, ['id', 'nombre', 'email', 'passwordHash', 'rol', 'unidad', 'telefono', 'activo', 'creadoEn']],
  ['gastos', SEED.gastos, ['id', 'descripcion', 'categoria', 'monto', 'fecha', 'proveedor', 'creadoPor']],
  ['cuotas', SEED.cuotas, ['id', 'usuarioId', 'periodo', 'concepto', 'monto', 'venceEn', 'estatus']],
  ['pagos', SEED.pagos, ['id', 'usuarioId', 'cuotaId', 'monto', 'concepto', 'metodo', 'referencia', 'estatus', 'fecha']],
  ['negocios', SEED.negocios, ['id', 'proveedorId', 'nombre', 'categoria', 'descripcion', 'telefono', 'email', 'sitioWeb', 'horario', 'emblema', 'destacado', 'activo', 'creadoEn']],
  ['resenas', SEED.resenas, ['id', 'negocioId', 'usuarioId', 'calificacion', 'comentario', 'fecha']],
  ['puntos_interes', SEED.puntosInteres, ['id', 'nombre', 'categoria', 'emblema', 'descripcion', 'distanciaM', 'x', 'y']],
]

const aSnake = (clave) => clave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)

async function sembrar() {
  if (!config.databaseUrl) {
    console.error('DATABASE_URL no está configurada. Define la conexión antes de sembrar.')
    process.exitCode = 1
    return
  }

  const { default: pg } = await import('pg')
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  })
  const cliente = await pool.connect()

  try {
    await cliente.query('BEGIN')

    // El orden inverso respeta las llaves foráneas.
    for (const [tabla] of [...TABLAS].reverse()) {
      await cliente.query(`DELETE FROM ${tabla}`)
    }

    for (const [tabla, filas, campos] of TABLAS) {
      const columnas = campos.map(aSnake).join(', ')
      for (const fila of filas) {
        const marcadores = campos.map((_, i) => `$${i + 1}`).join(', ')
        await cliente.query(
          `INSERT INTO ${tabla} (${columnas}) VALUES (${marcadores})`,
          campos.map((campo) => fila[campo] ?? null),
        )
      }
      await cliente.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${tabla}), 1))`,
        [tabla],
      )
      console.log(`  ${tabla}: ${filas.length} filas`)
    }

    await cliente.query('COMMIT')
    console.log('Semilla aplicada correctamente.')
  } catch (error) {
    await cliente.query('ROLLBACK')
    console.error('Error al sembrar:', error.message)
    process.exitCode = 1
  } finally {
    cliente.release()
    await pool.end()
  }
}

sembrar()
