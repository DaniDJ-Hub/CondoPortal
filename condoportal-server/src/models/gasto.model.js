// Modelo de gastos — Sprint 1: "Modelo de datos de gastos" (Backend 1)
// y soporte del "CRUD de gastos" / "Filtro de gastos por categoría" (Backend 2).

import { db } from '../db/index.js'
import { aNumero, aPesos, aFechaISO, claveDeMes, sumarPor } from '../utils/numeros.js'

export const CATEGORIAS = ['mantenimiento', 'servicios', 'seguridad', 'administracion', 'otros']

export const ETIQUETAS_CATEGORIA = {
  mantenimiento: 'Mantenimiento',
  servicios: 'Servicios',
  seguridad: 'Seguridad',
  administracion: 'Administración',
  otros: 'Otros',
}

function normalizar(gasto) {
  if (!gasto) return null
  return { ...gasto, monto: aPesos(gasto.monto), fecha: aFechaISO(gasto.fecha) }
}

export async function listarGastos({ categoria, desde, hasta } = {}) {
  const gastos = await db().gastos.todos({ categoria }, { orden: 'fecha', direccion: 'desc' })
  return gastos
    .map(normalizar)
    .filter((g) => (!desde || g.fecha >= desde) && (!hasta || g.fecha <= hasta))
}

export async function obtenerGastoPorId(id) {
  return normalizar(await db().gastos.porId(id))
}

export async function crearGasto({ descripcion, categoria, monto, fecha, proveedor = null, creadoPor = null }) {
  const gasto = await db().gastos.insertar({
    descripcion: descripcion.trim(),
    categoria,
    monto: aPesos(monto),
    fecha: fecha || new Date().toISOString().slice(0, 10),
    proveedor: proveedor?.trim() || null,
    creadoPor,
  })
  return normalizar(gasto)
}

export async function actualizarGasto(id, { descripcion, categoria, monto, fecha, proveedor }) {
  const gasto = await db().gastos.actualizar(id, {
    descripcion: descripcion?.trim(),
    categoria,
    monto: monto === undefined ? undefined : aPesos(monto),
    fecha,
    proveedor: proveedor === undefined ? undefined : proveedor?.trim() || null,
  })
  return normalizar(gasto)
}

export async function eliminarGasto(id) {
  return db().gastos.eliminar(id)
}

// Totales por categoría, para el filtro del cliente y los KPIs del dashboard.
export async function resumenPorCategoria() {
  const gastos = await listarGastos()
  const total = sumarPor(gastos, 'monto')

  return CATEGORIAS.map((categoria) => {
    const delGrupo = gastos.filter((g) => g.categoria === categoria)
    const subtotal = sumarPor(delGrupo, 'monto')
    return {
      categoria,
      etiqueta: ETIQUETAS_CATEGORIA[categoria],
      cantidad: delGrupo.length,
      total: subtotal,
      porcentaje: total === 0 ? 0 : Math.round((subtotal / total) * 1000) / 10,
    }
  }).filter((fila) => fila.cantidad > 0)
}

export async function totalesPorMes() {
  const gastos = await listarGastos()
  const porMes = {}
  for (const gasto of gastos) {
    const mes = claveDeMes(gasto.fecha)
    porMes[mes] = aPesos((porMes[mes] ?? 0) + aNumero(gasto.monto))
  }
  return porMes
}
