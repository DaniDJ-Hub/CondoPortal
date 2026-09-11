// Controlador de gastos — Sprint 1 (Backend 2):
// "CRUD de gastos" y "Filtro de gastos por categoría".

import {
  listarGastos,
  obtenerGastoPorId,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  resumenPorCategoria,
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
} from '../models/gasto.model.js'
import { asyncHandler, errorNoEncontrado } from '../middleware/errorHandler.js'
import {
  requerirCampos,
  validarMonto,
  validarOpcion,
  validarFecha,
  validarId,
} from '../middleware/validar.js'
import { sumarPor } from '../utils/numeros.js'

// GET /api/gastos?categoria=&desde=&hasta=
export const obtenerGastos = asyncHandler(async (req, res) => {
  const { categoria, desde, hasta } = req.query

  if (categoria) validarOpcion(categoria, CATEGORIAS, 'La categoría')
  if (desde) validarFecha(desde, 'fecha inicial')
  if (hasta) validarFecha(hasta, 'fecha final')

  const gastos = await listarGastos({ categoria, desde, hasta })
  res.status(200).json({ gastos, total: sumarPor(gastos, 'monto'), cantidad: gastos.length })
})

// GET /api/gastos/categorias — catálogo + totales, para poblar el filtro.
export const obtenerCategorias = asyncHandler(async (_req, res) => {
  res.status(200).json({
    categorias: CATEGORIAS.map((valor) => ({ valor, etiqueta: ETIQUETAS_CATEGORIA[valor] })),
    resumen: await resumenPorCategoria(),
  })
})

// GET /api/gastos/:id
export const obtenerGasto = asyncHandler(async (req, res) => {
  const gasto = await obtenerGastoPorId(validarId(req.params.id, 'id del gasto'))
  if (!gasto) throw errorNoEncontrado('Gasto no encontrado.')
  res.status(200).json(gasto)
})

// POST /api/gastos
export const registrarGasto = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['descripcion', 'categoria', 'monto'])

  const gasto = await crearGasto({
    descripcion: req.body.descripcion,
    categoria: validarOpcion(req.body.categoria, CATEGORIAS, 'La categoría'),
    monto: validarMonto(req.body.monto),
    fecha: req.body.fecha ? validarFecha(req.body.fecha) : undefined,
    proveedor: req.body.proveedor,
    creadoPor: req.usuario?.id ?? null,
  })

  res.status(201).json(gasto)
})

// PUT /api/gastos/:id
export const editarGasto = asyncHandler(async (req, res) => {
  const id = validarId(req.params.id, 'id del gasto')
  if (!(await obtenerGastoPorId(id))) throw errorNoEncontrado('Gasto no encontrado.')

  const gasto = await actualizarGasto(id, {
    descripcion: req.body.descripcion,
    categoria: req.body.categoria ? validarOpcion(req.body.categoria, CATEGORIAS, 'La categoría') : undefined,
    monto: req.body.monto === undefined ? undefined : validarMonto(req.body.monto),
    fecha: req.body.fecha ? validarFecha(req.body.fecha) : undefined,
    proveedor: req.body.proveedor,
  })

  res.status(200).json(gasto)
})

// DELETE /api/gastos/:id
export const borrarGasto = asyncHandler(async (req, res) => {
  const id = validarId(req.params.id, 'id del gasto')
  if (!(await eliminarGasto(id))) throw errorNoEncontrado('Gasto no encontrado.')
  res.status(204).send()
})
