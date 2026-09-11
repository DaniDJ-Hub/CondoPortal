// Almacén PostgreSQL / Supabase: implementación de la interfaz `Tabla`.
//
// Traduce los filtros en objeto ({ usuarioId: 3, estatus: ['pendiente'] })
// a SQL parametrizado, y convierte los nombres de columna snake_case de la
// base a las claves camelCase que usa el resto del servidor.

import { config } from '../config/env.js'

const aSnake = (clave) => clave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)
const aCamel = (columna) => columna.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())

function filaACamel(fila) {
  if (!fila) return null
  return Object.fromEntries(Object.entries(fila).map(([col, valor]) => [aCamel(col), valor]))
}

// Construye "WHERE a = $1 AND b = ANY($2)" a partir de un filtro plano.
function construirWhere(filtro, desde = 0) {
  const condiciones = []
  const valores = []
  for (const [campo, valor] of Object.entries(filtro)) {
    if (valor === undefined) continue
    valores.push(valor)
    const marcador = `$${desde + valores.length}`
    condiciones.push(
      Array.isArray(valor)
        ? `${aSnake(campo)} = ANY(${marcador})`
        : `${aSnake(campo)} = ${marcador}`,
    )
  }
  return {
    clausula: condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '',
    valores,
  }
}

class TablaPostgres {
  constructor(pool, nombre) {
    this.pool = pool
    this.nombre = nombre
  }

  async todos(filtro = {}, { orden, direccion = 'asc' } = {}) {
    const { clausula, valores } = construirWhere(filtro)
    const orderBy = orden ? ` ORDER BY ${aSnake(orden)} ${direccion === 'desc' ? 'DESC' : 'ASC'}` : ''
    const { rows } = await this.pool.query(`SELECT * FROM ${this.nombre}${clausula}${orderBy}`, valores)
    return rows.map(filaACamel)
  }

  async uno(filtro) {
    const { clausula, valores } = construirWhere(filtro)
    const { rows } = await this.pool.query(`SELECT * FROM ${this.nombre}${clausula} LIMIT 1`, valores)
    return filaACamel(rows[0]) ?? null
  }

  async porId(id) {
    return this.uno({ id: Number(id) })
  }

  async insertar(datos) {
    const entradas = Object.entries(datos).filter(([, valor]) => valor !== undefined)
    const columnas = entradas.map(([campo]) => aSnake(campo)).join(', ')
    const marcadores = entradas.map((_, i) => `$${i + 1}`).join(', ')
    const { rows } = await this.pool.query(
      `INSERT INTO ${this.nombre} (${columnas}) VALUES (${marcadores}) RETURNING *`,
      entradas.map(([, valor]) => valor),
    )
    return filaACamel(rows[0])
  }

  async actualizar(id, cambios) {
    const entradas = Object.entries(cambios).filter(([, valor]) => valor !== undefined)
    if (entradas.length === 0) return this.porId(id)
    const asignaciones = entradas.map(([campo], i) => `${aSnake(campo)} = $${i + 1}`).join(', ')
    const { rows } = await this.pool.query(
      `UPDATE ${this.nombre} SET ${asignaciones} WHERE id = $${entradas.length + 1} RETURNING *`,
      [...entradas.map(([, valor]) => valor), Number(id)],
    )
    return filaACamel(rows[0]) ?? null
  }

  async eliminar(id) {
    const { rowCount } = await this.pool.query(`DELETE FROM ${this.nombre} WHERE id = $1`, [Number(id)])
    return rowCount > 0
  }
}

export async function crearAlmacenPostgres() {
  // `pg` es una dependencia opcional: si no está instalada, el llamador
  // cae al almacén en memoria en vez de tumbar el arranque.
  const { default: pg } = await import('pg')

  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
  })

  const tabla = (nombre) => new TablaPostgres(pool, nombre)

  return {
    modo: 'postgres',
    pool,
    tablas: {
      usuarios: tabla('usuarios'),
      gastos: tabla('gastos'),
      cuotas: tabla('cuotas'),
      pagos: tabla('pagos'),
      negocios: tabla('negocios'),
      resenas: tabla('resenas'),
      puntosInteres: tabla('puntos_interes'),
    },
    async verificar() {
      await pool.query('SELECT 1')
      return true
    },
    async cerrar() {
      await pool.end()
    },
  }
}
