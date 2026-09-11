// Modelo del marketplace — Sprint 4:
// "Desarrollo del Backend/API del marketplace para negocios y proveedores".

import { db } from '../db/index.js'
import { aNumero, aInstanteISO } from '../utils/numeros.js'

export const CATEGORIAS_NEGOCIO = [
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento y hogar' },
  { valor: 'alimentos', etiqueta: 'Alimentos y bebidas' },
  { valor: 'hogar', etiqueta: 'Servicios del hogar' },
  { valor: 'deporte', etiqueta: 'Deporte y bienestar' },
  { valor: 'mascotas', etiqueta: 'Mascotas' },
  { valor: 'educacion', etiqueta: 'Educación' },
  { valor: 'otros', etiqueta: 'Otros' },
]

const etiquetaDe = (valor) =>
  CATEGORIAS_NEGOCIO.find((c) => c.valor === valor)?.etiqueta ?? 'Otros'

function agregarCalificacion(negocio, resenas) {
  const propias = resenas.filter((r) => r.negocioId === negocio.id)
  const suma = propias.reduce((total, r) => total + aNumero(r.calificacion), 0)
  return {
    ...negocio,
    activo: negocio.activo !== false,
    destacado: negocio.destacado === true,
    creadoEn: aInstanteISO(negocio.creadoEn),
    etiquetaCategoria: etiquetaDe(negocio.categoria),
    calificacion: propias.length ? Math.round((suma / propias.length) * 10) / 10 : null,
    totalResenas: propias.length,
  }
}

export async function listarNegocios({ categoria, busqueda, destacados, incluirInactivos = false } = {}) {
  const [negocios, resenas] = await Promise.all([
    db().negocios.todos({ categoria }, { orden: 'nombre' }),
    db().resenas.todos(),
  ])

  const termino = busqueda?.trim().toLowerCase()

  return negocios
    .filter((n) => incluirInactivos || n.activo !== false)
    .filter((n) => !destacados || n.destacado === true)
    .map((n) => agregarCalificacion(n, resenas))
    .filter((n) => {
      if (!termino) return true
      return `${n.nombre} ${n.descripcion} ${n.etiquetaCategoria}`.toLowerCase().includes(termino)
    })
}

export async function obtenerNegocio(id) {
  const negocio = await db().negocios.porId(id)
  if (!negocio) return null

  const [resenas, usuarios] = await Promise.all([
    db().resenas.todos({ negocioId: Number(id) }, { orden: 'fecha', direccion: 'desc' }),
    db().usuarios.todos(),
  ])

  const porId = new Map(usuarios.map((u) => [u.id, u]))

  return {
    ...agregarCalificacion(negocio, resenas),
    resenas: resenas.map((r) => ({
      ...r,
      fecha: aInstanteISO(r.fecha),
      calificacion: aNumero(r.calificacion),
      autor: porId.get(r.usuarioId)?.nombre ?? 'Residente',
    })),
  }
}

export async function crearNegocio({ nombre, categoria, descripcion = '', telefono = null, email = null, sitioWeb = null, horario = null, emblema = '🏪', proveedorId = null }) {
  const negocio = await db().negocios.insertar({
    proveedorId,
    nombre: nombre.trim(),
    categoria,
    descripcion: descripcion.trim(),
    telefono,
    email,
    sitioWeb,
    horario,
    emblema,
    destacado: false,
    activo: true,
    creadoEn: new Date().toISOString(),
  })
  return agregarCalificacion(negocio, [])
}

export async function actualizarNegocio(id, cambios) {
  const negocio = await db().negocios.actualizar(id, cambios)
  if (!negocio) return null
  const resenas = await db().resenas.todos({ negocioId: Number(id) })
  return agregarCalificacion(negocio, resenas)
}

export async function eliminarNegocio(id) {
  return db().negocios.eliminar(id)
}

// Un residente sólo puede dejar una reseña por negocio: si ya existe, se
// actualiza en vez de duplicarla (la base tiene un UNIQUE que lo respalda).
export async function opinarSobreNegocio(negocioId, { usuarioId, calificacion, comentario = '' }) {
  const existente = await db().resenas.uno({ negocioId: Number(negocioId), usuarioId: Number(usuarioId) })

  if (existente) {
    return db().resenas.actualizar(existente.id, {
      calificacion: Number(calificacion),
      comentario: comentario.trim(),
      fecha: new Date().toISOString(),
    })
  }

  return db().resenas.insertar({
    negocioId: Number(negocioId),
    usuarioId: Number(usuarioId),
    calificacion: Number(calificacion),
    comentario: comentario.trim(),
    fecha: new Date().toISOString(),
  })
}

export async function resumenCategorias() {
  const negocios = await listarNegocios()
  return CATEGORIAS_NEGOCIO.map((categoria) => ({
    ...categoria,
    cantidad: negocios.filter((n) => n.categoria === categoria.valor).length,
  })).filter((c) => c.cantidad > 0)
}
