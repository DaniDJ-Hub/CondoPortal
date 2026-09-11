import { Router } from 'express'
import { listar, detalle, crear, cambiarRol, editar, desactivar, resumen } from '../controllers/admin.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

// Todo el panel de administración exige sesión con rol admin.
router.use(requireAuth, requireRole('admin'))

// GET /api/admin/resumen
router.get('/resumen', resumen)

// GET /api/admin/usuarios
router.get('/usuarios', listar)
router.post('/usuarios', crear)
router.get('/usuarios/:usuarioId', detalle)
router.put('/usuarios/:usuarioId', editar)
// PATCH /api/admin/usuarios/:usuarioId/rol
router.patch('/usuarios/:usuarioId/rol', cambiarRol)
router.delete('/usuarios/:usuarioId', desactivar)

export default router
