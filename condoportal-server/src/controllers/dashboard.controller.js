// Controlador del dashboard — Sprint 3.
//
// Alimenta "Dashboard con KPIs" (Frontend 1), "Gráfico de flujo de caja"
// (Frontend 2) y "Feed de actividad reciente" (Full-Stack/QA).

import { indicadores, flujoDeCaja, actividadReciente } from '../models/dashboard.model.js'
import { resumenPorCategoria } from '../models/gasto.model.js'
import { asyncHandler } from '../middleware/errorHandler.js'

function enteroEnRango(valor, porDefecto, minimo, maximo) {
  const numero = Number(valor)
  if (!Number.isInteger(numero)) return porDefecto
  return Math.min(Math.max(numero, minimo), maximo)
}

// GET /api/dashboard/kpis
export const obtenerKpis = asyncHandler(async (_req, res) => {
  res.status(200).json(await indicadores())
})

// GET /api/dashboard/flujo-caja?meses=6
export const obtenerFlujoDeCaja = asyncHandler(async (req, res) => {
  const meses = enteroEnRango(req.query.meses, 6, 3, 24)
  res.status(200).json(await flujoDeCaja({ meses }))
})

// GET /api/dashboard/actividad?limite=12
export const obtenerActividad = asyncHandler(async (req, res) => {
  const limite = enteroEnRango(req.query.limite, 12, 1, 50)
  res.status(200).json({ actividad: await actividadReciente({ limite }) })
})

// GET /api/dashboard — todo el tablero en una sola petición, para que la
// vista no encadene cuatro llamadas al montarse.
export const obtenerResumen = asyncHandler(async (req, res) => {
  const meses = enteroEnRango(req.query.meses, 6, 3, 24)
  const [kpis, flujo, actividad, gastosPorCategoria] = await Promise.all([
    indicadores(),
    flujoDeCaja({ meses }),
    actividadReciente({ limite: 8 }),
    resumenPorCategoria(),
  ])
  res.status(200).json({ kpis, flujo, actividad, gastosPorCategoria })
})
