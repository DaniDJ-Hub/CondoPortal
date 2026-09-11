import { Router } from 'express'
import {
  obtenerGastos,
  obtenerGasto,
  obtenerCategorias,
  registrarGasto,
  editarGasto,
  borrarGasto,
} from '../controllers/gastos.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Consultar gastos: cualquier usuario autenticado del condominio.
router.use(requireAuth)

// GET /api/gastos?categoria=mantenimiento&desde=2026-01-01&hasta=2026-12-31
router.get('/', obtenerGastos)
// GET /api/gastos/categorias — antes de '/:id' para que no lo capture.
router.get('/categorias', obtenerCategorias)
router.get('/:id', obtenerGasto)

// Alta, edición y baja: sólo administración.
router.post('/', requireRole('admin'), registrarGasto)
router.put('/:id', requireRole('admin'), editarGasto)
router.delete('/:id', requireRole('admin'), borrarGasto)

export default router
