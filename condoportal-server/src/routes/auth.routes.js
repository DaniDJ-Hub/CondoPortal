import { Router } from 'express'
import { login, registro, logout, sesionActual, renovarSesion } from '../controllers/auth.controller.js'
import { requireAuth, authOpcional } from '../middleware/auth.middleware.js'

const router = Router()

// POST /api/auth/login
router.post('/login', login)
// POST /api/auth/registro — público; con token de admin permite elegir rol.
router.post('/registro', authOpcional, registro)

// Sprint 1 — Backend 2: manejo de sesión.
router.get('/me', requireAuth, sesionActual)
router.post('/renovar', requireAuth, renovarSesion)
router.post('/logout', requireAuth, logout)

export default router
