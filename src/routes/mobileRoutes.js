import express from 'express';
import { MobileLastPositionController } from '../controllers/MobileLastPositionController.js';
import { 
  validateUserIdMiddleware, 
  validateMultipleUsersMiddleware,
  validatePaginationMiddleware 
} from '../middleware/validationMiddleware.js';

const router = express.Router();
const controller = new MobileLastPositionController();

/**
 * Rutas para consultas de última posición móvil
 */

// GET /api/v4/mobile/last/:userId - Obtener última posición de un usuario móvil
router.get('/last/:userId', validateUserIdMiddleware, async (req, res) => {
  await controller.getLastPosition(req, res);
});

// POST /api/v4/mobile/last/multiple - Obtener últimas posiciones de múltiples usuarios móviles
router.post('/last/multiple', validateMultipleUsersMiddleware, async (req, res) => {
  await controller.getMultipleLastPositions(req, res);
});

// GET /api/v4/mobile/last - Obtener todas las últimas posiciones móviles
router.get('/last', validatePaginationMiddleware, async (req, res) => {
  await controller.getAllLastPositions(req, res);
});

// GET /api/v4/mobile/exists/:userId - Verificar si existe última posición móvil
router.get('/exists/:userId', validateUserIdMiddleware, async (req, res) => {
  await controller.checkUserExists(req, res);
});

// GET /api/v4/mobile/stats - Obtener estadísticas del servicio móvil
router.get('/stats', async (req, res) => {
  await controller.getStats(req, res);
});

export default router;