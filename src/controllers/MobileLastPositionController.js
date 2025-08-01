import { MobileLastPositionService } from '../services/MobileLastPositionService.js';
import { logger } from '../utils/logger.js';

/**
 * Controlador REST para endpoints de última posición móvil
 */
export class MobileLastPositionController {
  constructor() {
    this.service = new MobileLastPositionService();
  }

  /**
   * GET /api/mobile/last/:userId
   * Obtiene la última posición completa de un usuario móvil específico
   */
  async getLastPosition(req, res) {
    try {
      const { userId } = req.params;
      
      logger.info(`📱 API: Solicitud de última posición móvil completa para usuario: ${userId}`);

      const result = await this.service.getUserLastPosition(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          meta: {
            userId: result.userId,
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
            userId: result.userId || userId,
            timestamp: new Date().toISOString(),
            format: 'full'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getLastPosition móvil:', error.message);
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
   * POST /api/mobile/last/multiple
   * Obtiene las últimas posiciones completas de múltiples usuarios móviles
   * Body: { "userIds": ["user1", "user2", ...] }
   */
  async getMultipleLastPositions(req, res) {
    try {
      const { userIds } = req.body;

      logger.info(`📱 API: Solicitud de múltiples últimas posiciones móviles completas para ${userIds?.length || 0} usuarios`);

      const result = await this.service.getMultipleUsersLastPositions(userIds);

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
      logger.error('❌ Error en controlador getMultipleLastPositions móvil:', error.message);
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
   * GET /api/mobile/last
   * Obtiene todas las últimas posiciones móviles disponibles
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

      logger.info(`📱 API Mobile: Solicitud de todas las posiciones móviles optimizadas (limit: ${limit}, offset: ${offset})`);

      const result = await this.service.getAllLastPositions({ limit, offset });

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
        res.status(500).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            timestamp: new Date().toISOString(),
            format: 'mobile'
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador getAllLastPositions móvil:', error.message);
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
   * GET /api/mobile/exists/:userId
   * Verifica si existe una última posición para un usuario móvil
   */
  async checkUserExists(req, res) {
    try {
      const { userId } = req.params;

      logger.info(`📱 API: Verificación de existencia móvil para usuario: ${userId}`);

      const result = await this.service.checkUserExists(userId);

      if (result.success) {
        res.status(200).json({
          success: true,
          exists: result.exists,
          meta: {
            userId: result.userId,
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          meta: {
            userId: userId,
            timestamp: new Date().toISOString()
          }
        });
      }

    } catch (error) {
      logger.error('❌ Error en controlador checkUserExists móvil:', error.message);
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
   * GET /api/mobile/stats
   * Obtiene estadísticas del servicio móvil
   */
  async getStats(req, res) {
    try {
      logger.info('📱 API: Solicitud de estadísticas del servicio móvil');

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
      logger.error('❌ Error en controlador getStats móvil:', error.message);
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
   * GET /health/mobile
   * Health check del servicio móvil
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
          service: 'mobile-last-position-api',
          version: '1.0.0'
        }
      });

    } catch (error) {
      logger.error('❌ Error en health check móvil:', error.message);
      res.status(503).json({
        healthy: false,
        error: error.message,
        meta: {
          timestamp: new Date().toISOString(),
          service: 'mobile-last-position-api',
          version: '1.0.0'
        }
      });
    }
  }
}