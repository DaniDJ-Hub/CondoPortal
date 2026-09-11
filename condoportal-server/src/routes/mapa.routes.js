import { Router } from 'express'
import { obtenerPuntosDeInteres, obtenerPuntoDeInteres } from '../controllers/mapa.controller.js'
import { authOpcional } from '../middleware/auth.middleware.js'

const router = Router()

// Los puntos de interés también se muestran en la landing pública.
router.get('/puntos-interes', authOpcional, obtenerPuntosDeInteres)
router.get('/puntos-interes/:id', authOpcional, obtenerPuntoDeInteres)

export default router
