import { GPSLastPositionService } from '../services/GPSLastPositionService.js';
import { logger } from '../utils/logger.js';

/**
 * Controlador REST para endpoints de última posición GPS
 */
export class GPSLastPositionController {
  constructor() {
    this.service = new GPSLastPositionService();
  }

  /**
   * GET /api/gps/last/:deviceId
   * Obtiene la última posición completa de un dispositivo específico
   */
  async getLastPosition(req, res) {
    try {
      const { deviceId } = req.params;
      
      logger.info(`📡 API: Solicitud de última posición completa para dispositivo: ${deviceId}`);

      // Usar formato 'full' para devolver todos los datos
      const result = await this.service.getDeviceLastPosition(deviceId, 'full');

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            deviceId: result.deviceId,
            timestamp: result.timestamp,
            format: 'full'
          }
        });
      } else {
        const statusCode = result.code === 'POSITION_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            deviceId: result.deviceId || deviceId,
            timestamp: new Date().toISOString(),
            format: 'full'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getLastPosition:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'full'
        }
      });
    }
  }

  /**
   * POST /api/gps/last/multiple
   * Obtiene las últimas posiciones completas de múltiples dispositivos
   * Body: { "deviceIds": ["device1", "device2", ...] }
   */
  async getMultipleLastPositions(req, res) {
    try {
      const { deviceIds } = req.body;

      logger.info(`📡 API: Solicitud de múltiples últimas posiciones completas para ${deviceIds?.length || 0} dispositivos`);

      // Usar formato 'full' para devolver todos los datos
      const result = await this.service.getMultipleDevicesLastPositions(deviceIds, 'full');

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          summary: result.summary,
          meta: {
            timestamp: result.timestamp,
            format: 'full'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.invalidIds || result.requested || null,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'full'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getMultipleLastPositions:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'full'
        }
      });
    }
  }

  /**
   * GET /api/gps/last
   * Obtiene todas las últimas posiciones disponibles
   * Query params: ?limit=10&offset=0
   */
  async getAllLastPositions(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;

      // Validar parámetros
      if (limit !== null && (isNaN(limit) || limit <= 0 || limit > 1000)) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro limit debe ser un número entre 1 y 1000',
          code: 'INVALID_LIMIT',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      if (isNaN(offset) || offset < 0) {
        return res.status(400).json({
          success: false,
          error: 'El parámetro offset debe ser un número mayor o igual a 0',
          code: 'INVALID_OFFSET',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      logger.info(`📡 API GPS: Solicitud de todas las posiciones GPS optimizadas (limit: ${limit}, offset: ${offset})`);

      const result = await this.service.getAllLastPositions({ limit, offset });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          summary: result.summary,
          meta: {
            timestamp: result.timestamp,
            format: 'gps'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'gps'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getAllLastPositions:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * GET /api/gps/exists/:deviceId
   * Verifica si existe una última posición para un dispositivo
   */
  async checkDeviceExists(req, res) {
    try {
      const { deviceId } = req.params;

      logger.info(`📡 API: Verificación de existencia para dispositivo: ${deviceId}`);

      const result = await this.service.checkDeviceExists(deviceId);

      if (result.success) {
        res.status(200).json({
          success: true,
          exists: result.exists,
          meta: {
            deviceId: result.deviceId,
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            deviceId: deviceId,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador checkDeviceExists:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * GET /api/gps/stats
   * Obtiene estadísticas del servicio
   */
  async getStats(req, res) {
    try {
      logger.info('📡 API: Solicitud de estadísticas del servicio');

      const result = await this.service.getServiceStats();

      if (result.success) {
        res.status(200).json({
          success: true,
          stats: result.stats,
          meta: {
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getStats:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * GET /api/gps/last/:deviceId/gps
   * Obtiene la última posición optimizada para GPS (solo id, lat, lng)
   */
  async getLastPositionForGPS(req, res) {
    try {
      const { deviceId } = req.params;
      
      logger.info(`📡 API GPS: Solicitud de última posición para dispositivo: ${deviceId}`);

      const result = await this.service.getDeviceLastPositionForGPS(deviceId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            deviceId: result.deviceId,
            timestamp: result.timestamp,
            format: 'gps'
          }
        });
      } else {
        const statusCode = result.code === 'POSITION_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            deviceId: result.deviceId || deviceId,
            timestamp: new Date().toISOString(),
            format: 'gps'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getLastPositionForGPS:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'gps'
        }
      });
    }
  }

  /**
   * POST /api/gps/last/multiple/gps
   * Obtiene múltiples posiciones optimizadas para GPS (solo id, lat, lng)
   */
  async getMultipleLastPositionsForGPS(req, res) {
    try {
      const { deviceIds } = req.body;

      logger.info(`📡 API GPS: Solicitud de múltiples posiciones para ${deviceIds?.length || 0} dispositivos`);

      const result = await this.service.getMultipleDevicesLastPositionsForGPS(deviceIds);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          summary: result.summary,
          meta: {
            timestamp: result.timestamp,
            format: 'gps'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.invalidIds || result.requested || null,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'gps'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getMultipleLastPositionsForGPS:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'gps'
        }
      });
    }
  }

  /**
   * GET /api/gps/last/:deviceId/mobile
   * Obtiene la última posición optimizada para Mobile (id, lat, lng, name)
   */
  async getLastPositionForMobile(req, res) {
    try {
      const { deviceId } = req.params;
      
      logger.info(`📱 API Mobile: Solicitud de última posición para dispositivo: ${deviceId}`);

      const result = await this.service.getDeviceLastPositionForMobile(deviceId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            deviceId: result.deviceId,
            timestamp: result.timestamp,
            format: 'mobile'
          }
        });
      } else {
        const statusCode = result.code === 'POSITION_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            deviceId: result.deviceId || deviceId,
            timestamp: new Date().toISOString(),
            format: 'mobile'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getLastPositionForMobile:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'mobile'
        }
      });
    }
  }

  /**
   * POST /api/gps/last/multiple/mobile
   * Obtiene múltiples posiciones optimizadas para Mobile (id, lat, lng, name)
   */
  async getMultipleLastPositionsForMobile(req, res) {
    try {
      const { deviceIds } = req.body;

      logger.info(`📱 API Mobile: Solicitud de múltiples posiciones para ${deviceIds?.length || 0} dispositivos`);

      const result = await this.service.getMultipleDevicesLastPositionsForMobile(deviceIds);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          summary: result.summary,
          meta: {
            timestamp: result.timestamp,
            format: 'mobile'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.invalidIds || result.requested || null,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'mobile'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getMultipleLastPositionsForMobile:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'mobile'
        }
      });
    }
  }

  /**
   * GET /api/gps/last/:deviceId/full
   * Obtiene la última posición completa de un dispositivo específico
   */
  async getLastPositionFull(req, res) {
    try {
      const { deviceId } = req.params;
      
      logger.info(`📊 API Full: Solicitud de última posición completa para dispositivo: ${deviceId}`);

      const result = await this.service.getDeviceLastPosition(deviceId, 'full');

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            deviceId: result.deviceId,
            timestamp: result.timestamp,
            format: 'full'
          }
        });
      } else {
        const statusCode = result.code === 'POSITION_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            deviceId: result.deviceId || deviceId,
            timestamp: new Date().toISOString(),
            format: 'full'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getLastPositionFull:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'full'
        }
      });
    }
  }

  /**
   * POST /api/gps/last/multiple/full
   * Obtiene múltiples posiciones completas
   */
  async getMultipleLastPositionsFull(req, res) {
    try {
      const { deviceIds } = req.body;

      logger.info(`📊 API Full: Solicitud de múltiples posiciones completas para ${deviceIds?.length || 0} dispositivos`);

      const result = await this.service.getMultipleDevicesLastPositions(deviceIds, 'full');

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          summary: result.summary,
          meta: {
            timestamp: result.timestamp,
            format: 'full'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.invalidIds || result.requested || null,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'full'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getMultipleLastPositionsFull:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          format: 'full'
        }
      });
    }
  }

  /**
   * GET /health
   * Health check del servicio
   */
  async healthCheck(req, res) {
    try {
      const result = await this.service.healthCheck();

      const statusCode = result.healthy ? 200 : 503;
      
      res.status(statusCode).json({
        healthy: result.healthy,
        services: result.services,
        stats: result.stats,
        meta: {
          timestamp: result.timestamp,
          service: 'gps-last-position-api',
          version: '1.0.0'
        }
      });

    } catch (error) {
      logger.error('❌ Error en health check:', error.message);
      res.status(503).json({
        healthy: false,
        error: error.message,
        meta: {
          timestamp: new Date().toISOString(),
          service: 'gps-last-position-api',
          version: '1.0.0'
        }
      });
    }
  }
}