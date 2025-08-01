import express from 'express';
import { GPSLastPositionController } from '../controllers/GPSLastPositionController.js';
import { 
  validateDeviceIdMiddleware, 
  validateMultipleDevicesMiddleware,
  validatePaginationMiddleware 
} from '../middleware/validationMiddleware.js';

const router = express.Router();
const controller = new GPSLastPositionController();

/**
 * Rutas para consultas de última posición GPS
 */

// GET /api/v4/gps/last/:deviceId - Obtener última posición de un dispositivo
router.get('/last/:deviceId', validateDeviceIdMiddleware, async (req, res) => {
  await controller.getLastPosition(req, res);
});

// POST /api/v4/gps/last/multiple - Obtener últimas posiciones de múltiples dispositivos
router.post('/last/multiple', validateMultipleDevicesMiddleware, async (req, res) => {
  await controller.getMultipleLastPositions(req, res);
});

// GET /api/v4/gps/last - Obtener todas las últimas posiciones
router.get('/last', validatePaginationMiddleware, async (req, res) => {
  await controller.getAllLastPositions(req, res);
});

// GET /api/v4/gps/exists/:deviceId - Verificar si existe última posición
router.get('/exists/:deviceId', validateDeviceIdMiddleware, async (req, res) => {
  await controller.checkDeviceExists(req, res);
});

// GET /api/v4/gps/stats - Obtener estadísticas del servicio
router.get('/stats', async (req, res) => {
  await controller.getStats(req, res);
});

// ========== ENDPOINTS OPTIMIZADOS ==========

// GET /api/v4/gps/last/:deviceId/gps - Obtener última posición optimizada para GPS (id, lat, lng)
router.get('/last/:deviceId/gps', validateDeviceIdMiddleware, async (req, res) => {
  await controller.getLastPositionForGPS(req, res);
});

// POST /api/v4/gps/last/multiple/gps - Obtener múltiples posiciones optimizadas para GPS
router.post('/last/multiple/gps', validateMultipleDevicesMiddleware, async (req, res) => {
  await controller.getMultipleLastPositionsForGPS(req, res);
});

// GET /api/v4/gps/last/:deviceId/mobile - Obtener última posición optimizada para Mobile (id, lat, lng, name)
router.get('/last/:deviceId/mobile', validateDeviceIdMiddleware, async (req, res) => {
  await controller.getLastPositionForMobile(req, res);
});

// POST /api/v4/gps/last/multiple/mobile - Obtener múltiples posiciones optimizadas para Mobile
router.post('/last/multiple/mobile', validateMultipleDevicesMiddleware, async (req, res) => {
  await controller.getMultipleLastPositionsForMobile(req, res);
});

// GET /api/v4/gps/last/:deviceId/full - Obtener última posición completa
router.get('/last/:deviceId/full', validateDeviceIdMiddleware, async (req, res) => {
  await controller.getLastPositionFull(req, res);
});

// POST /api/v4/gps/last/multiple/full - Obtener múltiples posiciones completas
router.post('/last/multiple/full', validateMultipleDevicesMiddleware, async (req, res) => {
  await controller.getMultipleLastPositionsFull(req, res);
});

export default router;