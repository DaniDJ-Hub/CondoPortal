// Controlador del mapa — Sprint 4 (Full-Stack/QA):
// "Mapa interactivo" y "Puntos de interés cercanos".

import { listarPuntosDeInteres, obtenerPunto, resumenCategoriasPunto, CATEGORIAS_PUNTO } from '../models/mapa.model.js'
import { asyncHandler, errorNoEncontrado } from '../middleware/errorHandler.js'
import { validarOpcion, validarId } from '../middleware/validar.js'

const VALORES = CATEGORIAS_PUNTO.map((c) => c.valor)

// GET /api/mapa/puntos-interes?categoria=&radio=
export const obtenerPuntosDeInteres = asyncHandler(async (req, res) => {
  const { categoria, radio } = req.query
  if (categoria) validarOpcion(categoria, VALORES, 'La categoría')

  const puntos = await listarPuntosDeInteres({
    categoria,
    radioM: radio === undefined ? undefined : Number(radio),
  })

  res.status(200).json({
    puntos,
    cantidad: puntos.length,
    categorias: await resumenCategoriasPunto(),
  })
})

// GET /api/mapa/puntos-interes/:id
export const obtenerPuntoDeInteres = asyncHandler(async (req, res) => {
  const punto = await obtenerPunto(validarId(req.params.id, 'id del punto'))
  if (!punto) throw errorNoEncontrado('Punto de interés no encontrado.')
  res.status(200).json(punto)
})
