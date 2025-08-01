import { MobileLastPositionRepository } from '../repositories/MobileLastPositionRepository.js';
import { logger } from '../utils/logger.js';

/**
 * Servicio de negocio para gestión de últimas posiciones móviles
 * Usa datos específicos de mobile:last:{userId} con formato optimizado
 */
export class MobileLastPositionService {
  constructor() {
    this.repository = new MobileLastPositionRepository();
  }

  /**
   * Obtiene la última posición de un usuario móvil
   * @param {string} userId - ID del usuario
   * @returns {Object} Respuesta con la última posición móvil
   */
  async getUserLastPosition(userId) {
    try {
      // Validar userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return {
          success: false,
          error: 'User ID es requerido y debe ser una cadena válida',
          code: 'INVALID_USER_ID'
        };
      }

      const cleanUserId = userId.trim();
      logger.info(`🔍 Consultando última posición móvil para usuario: ${cleanUserId}`);

      const position = await this.repository.getLastPosition(cleanUserId);

      if (!position) {
        return {
          success: false,
          error: `No se encontró última posición móvil para el usuario: ${cleanUserId}`,
          code: 'POSITION_NOT_FOUND',
          userId: cleanUserId
        };
      }

      // Devolver datos completos para consulta individual
      return {
        success: true,
        data: position, // Datos completos sin formatear
        userId: cleanUserId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error en servicio obteniendo posición móvil para ${userId}:`, error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener la posición móvil',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene las últimas posiciones de múltiples usuarios móviles
   * @param {string[]} userIds - Array de IDs de usuarios
   * @returns {Object} Respuesta con las últimas posiciones móviles
   */
  async getMultipleUsersLastPositions(userIds) {
    try {
      // Validar userIds
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return {
          success: false,
          error: 'Se requiere un array de User IDs no vacío',
          code: 'INVALID_USER_IDS'
        };
      }

      // Validar cada userId y limpiar
      const cleanUserIds = [];
      const invalidIds = [];

      for (const id of userIds) {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          invalidIds.push(id);
        } else {
          cleanUserIds.push(id.trim());
        }
      }

      if (invalidIds.length > 0) {
        return {
          success: false,
          error: `User IDs inválidos encontrados: ${invalidIds.join(', ')}`,
          code: 'INVALID_USER_IDS',
          invalidIds
        };
      }

      // Limitar cantidad de usuarios por consulta
      const maxUsers = 100;
      if (cleanUserIds.length > maxUsers) {
        return {
          success: false,
          error: `Máximo ${maxUsers} usuarios permitidos por consulta`,
          code: 'TOO_MANY_USERS',
          requested: cleanUserIds.length,
          maximum: maxUsers
        };
      }

      logger.info(`🔍 Consultando últimas posiciones móviles para ${cleanUserIds.length} usuarios`);

      const positions = await this.repository.getMultipleLastPositions(cleanUserIds);

      // Devolver datos completos para consulta múltiple
      // Identificar usuarios sin posición
      const foundUserIds = positions.map(p => p.userId);
      const notFoundUserIds = cleanUserIds.filter(id => !foundUserIds.includes(id));

      return {
        success: true,
        data: positions, // Datos completos sin formatear
        summary: {
          requested: cleanUserIds.length,
          found: positions.length,
          notFound: notFoundUserIds.length,
          notFoundUserIds: notFoundUserIds,
          format: 'full'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en servicio obteniendo múltiples posiciones móviles:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener las posiciones móviles',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene todas las últimas posiciones móviles disponibles con formato optimizado
   * @param {Object} options - Opciones de consulta
   * @returns {Object} Respuesta con todas las últimas posiciones en formato mobile
   */
  async getAllLastPositions(options = {}) {
    try {
      const { limit = null, offset = 0 } = options;

      logger.info('🔍 Consultando todas las últimas posiciones móviles disponibles (formato optimizado)');

      const allPositions = await this.repository.getAllLastPositions();

      // Formatear todas las posiciones al formato Mobile (id, lat, lng, name)
      const formattedPositions = allPositions.map(position => this._formatPositionDataForMobile(position));

      // Aplicar paginación si se especifica
      let positions = formattedPositions;
      if (limit && limit > 0) {
        const start = Math.max(0, offset);
        const end = start + limit;
        positions = formattedPositions.slice(start, end);
      }

      return {
        success: true,
        data: positions,
        summary: {
          total: formattedPositions.length,
          returned: positions.length,
          offset: offset,
          limit: limit,
          format: 'mobile'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en servicio obteniendo todas las posiciones móviles:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener todas las posiciones móviles',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Verifica si un usuario tiene última posición móvil
   * @param {string} userId - ID del usuario
   * @returns {Object} Respuesta con el estado de existencia
   */
  async checkUserExists(userId) {
    try {
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return {
          success: false,
          error: 'User ID es requerido y debe ser una cadena válida',
          code: 'INVALID_USER_ID'
        };
      }

      const cleanUserId = userId.trim();
      const exists = await this.repository.hasLastPosition(cleanUserId);

      return {
        success: true,
        exists,
        userId: cleanUserId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error verificando existencia del usuario móvil ${userId}:`, error.message);
      return {
        success: false,
        error: 'Error interno del servidor al verificar el usuario móvil',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas del servicio móvil
   * @returns {Object} Estadísticas del servicio móvil
   */
  async getServiceStats() {
    try {
      const stats = await this.repository.getStats();
      const healthCheck = await this.repository.ping();

      return {
        success: true,
        stats: {
          ...stats,
          redisConnection: healthCheck ? 'healthy' : 'unhealthy',
          service: 'mobile-last-position-api',
          version: '1.0.0'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas del servicio móvil:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener estadísticas móviles',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Verifica la salud del servicio móvil
   * @returns {Object} Estado de salud del servicio móvil
   */
  async healthCheck() {
    try {
      const redisHealth = await this.repository.ping();
      const stats = await this.repository.getStats();

      return {
        healthy: redisHealth,
        services: {
          redis: redisHealth ? 'healthy' : 'unhealthy',
          api: 'healthy'
        },
        stats: {
          totalUsers: stats.totalUsers || 0
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en health check del servicio móvil:', error.message);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Formatea los datos de posición para formato mobile (id, lat, lng, name)
   * @param {Object} position - Datos completos de posición móvil
   * @returns {Object} Datos formateados para mobile
   * @private
   */
  _formatPositionDataForMobile(position) {
    return {
      id: position.userId,
      lat: position.lat,
      lng: position.lng,
      name: position.name || position.userId // Usar name si está disponible, sino userId
    };
  }

  /**
   * Limpia recursos del servicio móvil
   */
  async cleanup() {
    try {
      logger.info('🧹 Limpiando recursos del servicio Mobile Last Position...');
      await this.repository.disconnect();
      logger.info('✅ Recursos móviles limpiados exitosamente');
    } catch (error) {
      logger.error('❌ Error limpiando recursos del servicio móvil:', error.message);
    }
  }
}