import { GPSLastPositionRepository } from '../repositories/GPSLastPositionRepository.js';
import { logger } from '../utils/logger.js';

/**
 * Servicio de negocio para gestión de últimas posiciones GPS
 */
export class GPSLastPositionService {
  constructor() {
    this.repository = new GPSLastPositionRepository();
  }

  /**
   * Obtiene la última posición de un dispositivo
   * @param {string} deviceId - ID del dispositivo
   * @param {string} format - Formato de respuesta ('full', 'gps', 'mobile')
   * @returns {Object} Respuesta con la última posición
   */
  async getDeviceLastPosition(deviceId, format = 'full') {
    try {
      // Validar deviceId
      if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
        return {
          success: false,
          error: 'Device ID es requerido y debe ser una cadena válida',
          code: 'INVALID_DEVICE_ID'
        };
      }

      const cleanDeviceId = deviceId.trim();
      logger.info(`🔍 Consultando última posición para dispositivo: ${cleanDeviceId} (formato: ${format})`);

      const position = await this.repository.getLastPosition(cleanDeviceId);

      if (!position) {
        return {
          success: false,
          error: `No se encontró última posición para el dispositivo: ${cleanDeviceId}`,
          code: 'POSITION_NOT_FOUND',
          deviceId: cleanDeviceId
        };
      }

      // Formatear respuesta según el tipo solicitado
      const formattedData = this._formatPositionData(position, format);

      return {
        success: true,
        data: formattedData,
        deviceId: cleanDeviceId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error en servicio obteniendo posición para ${deviceId}:`, error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener la posición',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene las últimas posiciones de múltiples dispositivos
   * @param {string[]} deviceIds - Array de IDs de dispositivos
   * @param {string} format - Formato de respuesta ('full', 'gps', 'mobile')
   * @returns {Object} Respuesta con las últimas posiciones
   */
  async getMultipleDevicesLastPositions(deviceIds, format = 'full') {
    try {
      // Validar deviceIds
      if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
        return {
          success: false,
          error: 'Se requiere un array de Device IDs no vacío',
          code: 'INVALID_DEVICE_IDS'
        };
      }

      // Validar cada deviceId y limpiar
      const cleanDeviceIds = [];
      const invalidIds = [];

      for (const id of deviceIds) {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          invalidIds.push(id);
        } else {
          cleanDeviceIds.push(id.trim());
        }
      }

      if (invalidIds.length > 0) {
        return {
          success: false,
          error: `Device IDs inválidos encontrados: ${invalidIds.join(', ')}`,
          code: 'INVALID_DEVICE_IDS',
          invalidIds
        };
      }

      // Limitar cantidad de dispositivos por consulta
      const maxDevices = 100;
      if (cleanDeviceIds.length > maxDevices) {
        return {
          success: false,
          error: `Máximo ${maxDevices} dispositivos permitidos por consulta`,
          code: 'TOO_MANY_DEVICES',
          requested: cleanDeviceIds.length,
          maximum: maxDevices
        };
      }

      logger.info(`🔍 Consultando últimas posiciones para ${cleanDeviceIds.length} dispositivos (formato: ${format})`);

      const positions = await this.repository.getMultipleLastPositions(cleanDeviceIds);

      // Formatear cada posición según el tipo solicitado
      const formattedPositions = positions.map(position => this._formatPositionData(position, format));

      // Identificar dispositivos sin posición
      const foundDeviceIds = positions.map(p => p.deviceId);
      const notFoundDeviceIds = cleanDeviceIds.filter(id => !foundDeviceIds.includes(id));

      return {
        success: true,
        data: formattedPositions,
        summary: {
          requested: cleanDeviceIds.length,
          found: formattedPositions.length,
          notFound: notFoundDeviceIds.length,
          notFoundDeviceIds: notFoundDeviceIds
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en servicio obteniendo múltiples posiciones:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener las posiciones',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene todas las últimas posiciones disponibles con formato GPS optimizado
   * @param {Object} options - Opciones de consulta
   * @returns {Object} Respuesta con todas las últimas posiciones en formato GPS
   */
  async getAllLastPositions(options = {}) {
    try {
      const { limit = null, offset = 0 } = options;

      logger.info('🔍 Consultando todas las últimas posiciones GPS disponibles (formato optimizado)');

      const allPositions = await this.repository.getAllLastPositions();

      // Formatear todas las posiciones al formato GPS (id, lat, lng)
      const formattedPositions = allPositions.map(position => this._formatPositionData(position, 'gps'));

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
          format: 'gps'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en servicio obteniendo todas las posiciones GPS:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener todas las posiciones GPS',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Verifica si un dispositivo tiene última posición
   * @param {string} deviceId - ID del dispositivo
   * @returns {Object} Respuesta con el estado de existencia
   */
  async checkDeviceExists(deviceId) {
    try {
      if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
        return {
          success: false,
          error: 'Device ID es requerido y debe ser una cadena válida',
          code: 'INVALID_DEVICE_ID'
        };
      }

      const cleanDeviceId = deviceId.trim();
      const exists = await this.repository.hasLastPosition(cleanDeviceId);

      return {
        success: true,
        exists,
        deviceId: cleanDeviceId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error verificando existencia del dispositivo ${deviceId}:`, error.message);
      return {
        success: false,
        error: 'Error interno del servidor al verificar el dispositivo',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas del servicio
   * @returns {Object} Estadísticas del servicio
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
          service: 'gps-last-position-api',
          version: '1.0.0'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas del servicio:', error.message);
      return {
        success: false,
        error: 'Error interno del servidor al obtener estadísticas',
        code: 'INTERNAL_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Verifica la salud del servicio
   * @returns {Object} Estado de salud del servicio
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
          totalDevices: stats.totalDevices || 0
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error en health check del servicio:', error.message);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtiene la última posición optimizada para GPS (solo id, lat, lng)
   * @param {string} deviceId - ID del dispositivo
   * @returns {Object} Respuesta optimizada para GPS
   */
  async getDeviceLastPositionForGPS(deviceId) {
    return await this.getDeviceLastPosition(deviceId, 'gps');
  }

  /**
   * Obtiene múltiples posiciones optimizadas para GPS (solo id, lat, lng)
   * @param {string[]} deviceIds - Array de IDs de dispositivos
   * @returns {Object} Respuesta optimizada para GPS
   */
  async getMultipleDevicesLastPositionsForGPS(deviceIds) {
    return await this.getMultipleDevicesLastPositions(deviceIds, 'gps');
  }

  /**
   * Obtiene la última posición optimizada para Mobile (id, lat, lng, name)
   * @param {string} deviceId - ID del dispositivo
   * @returns {Object} Respuesta optimizada para Mobile
   */
  async getDeviceLastPositionForMobile(deviceId) {
    return await this.getDeviceLastPosition(deviceId, 'mobile');
  }

  /**
   * Obtiene múltiples posiciones optimizadas para Mobile (id, lat, lng, name)
   * @param {string[]} deviceIds - Array de IDs de dispositivos
   * @returns {Object} Respuesta optimizada para Mobile
   */
  async getMultipleDevicesLastPositionsForMobile(deviceIds) {
    return await this.getMultipleDevicesLastPositions(deviceIds, 'mobile');
  }

  /**
   * Formatea los datos de posición según el formato solicitado
   * @param {Object} position - Datos completos de posición
   * @param {string} format - Formato deseado ('full', 'gps', 'mobile')
   * @returns {Object} Datos formateados
   * @private
   */
  _formatPositionData(position, format) {
    switch (format) {
      case 'gps':
        return {
          id: position.deviceId,
          lat: position.lat,
          lng: position.lng
        };
      
      case 'mobile':
        return {
          id: position.deviceId,
          lat: position.lat,
          lng: position.lng,
          name: position.name || position.deviceId // Usar name si está disponible, sino deviceId
        };
      
      case 'full':
      default:
        return position;
    }
  }

  /**
   * Limpia recursos del servicio
   */
  async cleanup() {
    try {
      logger.info('🧹 Limpiando recursos del servicio GPS Last Position...');
      await this.repository.disconnect();
      logger.info('✅ Recursos limpiados exitosamente');
    } catch (error) {
      logger.error('❌ Error limpiando recursos del servicio:', error.message);
    }
  }
}