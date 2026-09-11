// Controlador del marketplace — Sprint 4 (Full-Stack/QA):
// "Desarrollo del Backend/API del marketplace para negocios y proveedores".

import {
  listarNegocios,
  obtenerNegocio,
  crearNegocio,
  actualizarNegocio,
  eliminarNegocio,
  opinarSobreNegocio,
  resumenCategorias,
  CATEGORIAS_NEGOCIO,
} from '../models/negocio.model.js'
import { asyncHandler, errorNoEncontrado, errorPeticion } from '../middleware/errorHandler.js'
import { requerirCampos, validarOpcion, validarId } from '../middleware/validar.js'

const VALORES_CATEGORIA = CATEGORIAS_NEGOCIO.map((c) => c.valor)

// GET /api/marketplace/negocios?categoria=&busqueda=&destacados=
export const obtenerNegocios = asyncHandler(async (req, res) => {
  const { categoria, busqueda } = req.query
  if (categoria) validarOpcion(categoria, VALORES_CATEGORIA, 'La categoría')

  const negocios = await listarNegocios({
    categoria,
    busqueda,
    destacados: req.query.destacados === 'true',
  })

  res.status(200).json({ negocios, cantidad: negocios.length })
})

// GET /api/marketplace/categorias
export const obtenerCategorias = asyncHandler(async (_req, res) => {
  res.status(200).json({ categorias: CATEGORIAS_NEGOCIO, resumen: await resumenCategorias() })
})

// GET /api/marketplace/negocios/:id
export const obtenerPerfil = asyncHandler(async (req, res) => {
  const negocio = await obtenerNegocio(validarId(req.params.id, 'id del negocio'))
  if (!negocio) throw errorNoEncontrado('Negocio no encontrado.')
  res.status(200).json(negocio)
})

// POST /api/marketplace/negocios — alta por parte de un proveedor o del admin.
export const registrarNegocio = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['nombre', 'categoria'])

  const negocio = await crearNegocio({
    nombre: req.body.nombre,
    categoria: validarOpcion(req.body.categoria, VALORES_CATEGORIA, 'La categoría'),
    descripcion: req.body.descripcion ?? '',
    telefono: req.body.telefono ?? null,
    email: req.body.email ?? null,
    sitioWeb: req.body.sitioWeb ?? null,
    horario: req.body.horario ?? null,
    emblema: req.body.emblema || '🏪',
    proveedorId: req.usuario.rol === 'proveedor' ? req.usuario.id : req.body.proveedorId ?? null,
  })

  res.status(201).json(negocio)
})

// PUT /api/marketplace/negocios/:id — el dueño o un admin.
export const editarNegocio = asyncHandler(async (req, res) => {
  const id = validarId(req.params.id, 'id del negocio')
  const negocio = await obtenerNegocio(id)
  if (!negocio) throw errorNoEncontrado('Negocio no encontrado.')

  if (req.usuario.rol !== 'admin' && Number(negocio.proveedorId) !== Number(req.usuario.id)) {
    throw errorPeticion('Sólo el proveedor dueño del negocio o la administración pueden editarlo.')
  }

  const actualizado = await actualizarNegocio(id, {
    nombre: req.body.nombre?.trim(),
    categoria: req.body.categoria ? validarOpcion(req.body.categoria, VALORES_CATEGORIA, 'La categoría') : undefined,
    descripcion: req.body.descripcion?.trim(),
    telefono: req.body.telefono,
    email: req.body.email,
    sitioWeb: req.body.sitioWeb,
    horario: req.body.horario,
    emblema: req.body.emblema,
    // Destacar un negocio es decisión de la administración.
    destacado: req.usuario.rol === 'admin' ? req.body.destacado : undefined,
    activo: req.body.activo,
  })

  res.status(200).json(actualizado)
})

// DELETE /api/marketplace/negocios/:id
export const borrarNegocio = asyncHandler(async (req, res) => {
  const id = validarId(req.params.id, 'id del negocio')
  if (!(await eliminarNegocio(id))) throw errorNoEncontrado('Negocio no encontrado.')
  res.status(204).send()
})

// POST /api/marketplace/negocios/:id/resenas
export const publicarResena = asyncHandler(async (req, res) => {
  const id = validarId(req.params.id, 'id del negocio')
  if (!(await obtenerNegocio(id))) throw errorNoEncontrado('Negocio no encontrado.')

  requerirCampos(req.body, ['calificacion'])
  const calificacion = Number(req.body.calificacion)
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    throw errorPeticion('La calificación debe ser un número entero del 1 al 5.')
  }

  await opinarSobreNegocio(id, {
    usuarioId: req.usuario.id,
    calificacion,
    comentario: req.body.comentario ?? '',
  })

  res.status(201).json(await obtenerNegocio(id))
})
