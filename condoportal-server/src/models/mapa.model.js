// Modelo del mapa — Sprint 4: "Mapa interactivo" y "Puntos de interés cercanos".

import { db } from '../db/index.js'
import { aNumero } from '../utils/numeros.js'

export const CATEGORIAS_PUNTO = [
  { valor: 'condominio', etiqueta: 'Condominio', emblema: '🏠' },
  { valor: 'amenidad', etiqueta: 'Amenidades', emblema: '🏊' },
  { valor: 'comercio', etiqueta: 'Comercios', emblema: '🛒' },
  { valor: 'salud', etiqueta: 'Salud', emblema: '⚕️' },
  { valor: 'educacion', etiqueta: 'Educación', emblema: '🎓' },
  { valor: 'recreacion', etiqueta: 'Recreación', emblema: '🌳' },
]

function normalizar(punto) {
  const categoria = CATEGORIAS_PUNTO.find((c) => c.valor === punto.categoria)
  return {
    ...punto,
    x: aNumero(punto.x),
    y: aNumero(punto.y),
    distanciaM: aNumero(punto.distanciaM),
    etiquetaCategoria: categoria?.etiqueta ?? 'Otros',
    // Cada punto puede traer su propio icono; si no, hereda el de su categoría.
    emblema: punto.emblema || categoria?.emblema || '📍',
  }
}

export async function listarPuntosDeInteres({ categoria, radioM } = {}) {
  const puntos = await db().puntosInteres.todos({ categoria }, { orden: 'distanciaM' })
  return puntos
    .map(normalizar)
    .filter((p) => radioM === undefined || p.distanciaM <= radioM)
}

export async function obtenerPunto(id) {
  const punto = await db().puntosInteres.porId(id)
  return punto ? normalizar(punto) : null
}

export async function resumenCategoriasPunto() {
  const puntos = await listarPuntosDeInteres()
  return CATEGORIAS_PUNTO.map((categoria) => ({
    ...categoria,
    cantidad: puntos.filter((p) => p.categoria === categoria.valor).length,
  })).filter((c) => c.cantidad > 0)
}
