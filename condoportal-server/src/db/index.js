// Punto único de acceso a datos.
//
// Sprint 3 — "Implementación de base de datos real con PostgreSQL/Supabase".
// Si hay DATABASE_URL se usa PostgreSQL; si no (o si la conexión falla en
// desarrollo) se cae al almacén en memoria para no bloquear al equipo.

import { config } from '../config/env.js'
import { crearAlmacenMemoria } from './memoria.js'
import { crearAlmacenPostgres } from './postgres.js'

let almacen = null

export async function iniciarBaseDeDatos() {
  if (almacen) return almacen

  if (!config.databaseUrl) {
    console.warn('[db] Sin DATABASE_URL: usando almacén en memoria con datos de ejemplo.')
    almacen = crearAlmacenMemoria()
    return almacen
  }

  try {
    const postgres = await crearAlmacenPostgres()
    await postgres.verificar()
    console.log('[db] Conectado a PostgreSQL.')
    almacen = postgres
    return almacen
  } catch (error) {
    // En producción no queremos arrancar silenciosamente con datos falsos.
    if (config.esProduccion) throw error
    console.warn(`[db] No se pudo conectar a PostgreSQL (${error.message}). Usando almacén en memoria.`)
    almacen = crearAlmacenMemoria()
    return almacen
  }
}

// Acceso síncrono para los modelos, que siempre corren después del arranque.
export function db() {
  if (!almacen) throw new Error('La base de datos no está iniciada. Llama a iniciarBaseDeDatos() primero.')
  return almacen.tablas
}

export function modoBaseDeDatos() {
  return almacen?.modo ?? 'sin-iniciar'
}

export async function cerrarBaseDeDatos() {
  if (!almacen) return
  await almacen.cerrar()
  almacen = null
}

// Sólo para pruebas: reinicia el almacén en memoria a su estado semilla.
export async function reiniciarBaseDeDatosEnMemoria() {
  await cerrarBaseDeDatos()
  almacen = crearAlmacenMemoria()
  return almacen
}
