import { Router } from 'express'
import {
  obtenerResumen,
  obtenerKpis,
  obtenerFlujoDeCaja,
  obtenerActividad,
} from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

// GET /api/dashboard — kpis + flujo + actividad en una sola llamada.
router.get('/', obtenerResumen)
router.get('/kpis', obtenerKpis)
router.get('/flujo-caja', obtenerFlujoDeCaja)
router.get('/actividad', obtenerActividad)

export default router
