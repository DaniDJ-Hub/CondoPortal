// Manejo central de errores.
//
// Los controladores lanzan `ErrorHttp` para las fallas esperadas (400, 404,
// 409…) y cualquier otra excepción se reporta como 500 sin filtrar detalles
// internos al cliente.

import { config } from '../config/env.js'

export class ErrorHttp extends Error {
  constructor(estado, mensaje, detalles = null) {
    super(mensaje)
    this.name = 'ErrorHttp'
    this.estado = estado
    this.detalles = detalles
  }
}

export const errorPeticion = (mensaje, detalles) => new ErrorHttp(400, mensaje, detalles)
export const errorNoEncontrado = (mensaje) => new ErrorHttp(404, mensaje)
export const errorConflicto = (mensaje) => new ErrorHttp(409, mensaje)

// Envuelve controladores asíncronos para que un `await` rechazado llegue aquí
// en vez de quedarse como promesa no capturada.
export function asyncHandler(controlador) {
  return (req, res, next) => Promise.resolve(controlador(req, res, next)).catch(next)
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars -- Express identifica el manejador de errores por sus 4 parámetros
export function errorHandler(err, req, res, next) {
  if (err instanceof ErrorHttp) {
    return res.status(err.estado).json({ error: err.message, ...(err.detalles && { detalles: err.detalles }) })
  }

  // Violación de restricción única en PostgreSQL.
  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe.' })
  }

  console.error('[error]', err)
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(config.esProduccion ? {} : { detalle: err.message }),
  })
}
