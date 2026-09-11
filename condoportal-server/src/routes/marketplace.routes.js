import { Router } from 'express'
import {
  obtenerNegocios,
  obtenerCategorias,
  obtenerPerfil,
  registrarNegocio,
  editarNegocio,
  borrarNegocio,
  publicarResena,
} from '../controllers/marketplace.controller.js'
import { requireAuth, requireRole, authOpcional } from '../middleware/auth.middleware.js'

const router = Router()

// El directorio es público: la landing lo muestra sin sesión iniciada.
router.get('/negocios', authOpcional, obtenerNegocios)
router.get('/categorias', obtenerCategorias)
router.get('/negocios/:id', authOpcional, obtenerPerfil)

// Publicar y editar sí requiere sesión.
router.post('/negocios', requireAuth, requireRole('admin', 'proveedor'), registrarNegocio)
router.put('/negocios/:id', requireAuth, requireRole('admin', 'proveedor'), editarNegocio)
router.delete('/negocios/:id', requireAuth, requireRole('admin'), borrarNegocio)
router.post('/negocios/:id/resenas', requireAuth, publicarResena)

export default router
