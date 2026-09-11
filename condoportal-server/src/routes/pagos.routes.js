import { Router } from 'express'
import {
  estadoCuenta,
  pagarCuota,
  generarRecibo,
  movimientos,
  proyeccionesFinancieras,
  registrarCuota,
} from '../controllers/pagos.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

// Las proyecciones son información financiera del condominio: sólo admin.
router.get('/proyecciones', requireRole('admin'), proyeccionesFinancieras)

router.get('/movimientos', movimientos)
router.get('/estado-cuenta', estadoCuenta)
router.get('/estado-cuenta/:usuarioId', estadoCuenta)

router.post('/pagar', pagarCuota)
router.post('/cuotas', requireRole('admin'), registrarCuota)

router.get('/:pagoId/recibo', generarRecibo)

export default router
