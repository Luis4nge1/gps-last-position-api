import { createRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Repositorio para consultas de última posición móvil desde Redis
 * Usa el prefijo mobile:last: en lugar de gps:last:
 */
export class MobileLastPositionRepository {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.keyPrefix = 'mobile:last:'; // Prefijo específico para datos móviles
  }

  /**
   * Conecta a Redis
   */
  async connect() {
    try {
      if (!this.client) {
        this.client = createRedisClient();
      }

      if (this.client.status === 'ready') {
        this.isConnected = true;
        return this.client;
      }

      if (!this.isConnected && this.client.status !== 'connecting') {
        await this.client.connect();
        this.isConnected = true;
        logger.info('✅ Conectado a Redis para consultas móviles');
      }

      return this.client;
    } catch (error) {
      if (error.message.includes('already connecting') || error.message.includes('already connected')) {
        logger.debug('🔗 Redis ya está conectado, reutilizando conexión');
        this.isConnected = true;
        return this.client;
      }
      
      logger.error('❌ Error conectando a Redis para móviles:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene datos de una clave según su tipo
   * @param {string} key - Clave de Redis
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Datos procesados o null
   */
  async getDataByType(key, userId) {
    const dataType = await this.client.type(key);
    
    switch (dataType) {
      case 'string':
        const stringData = await this.client.get(key);
        if (!stringData) return null;
        return JSON.parse(stringData);
        
      case 'hash':
        const hashData = await this.client.hgetall(key);
        if (!hashData || Object.keys(hashData).length === 0) return null;
        
        return {
          userId: hashData.userId || hashData.deviceId || userId,
          lat: hashData.lat ? parseFloat(hashData.lat) : null,
          lng: hashData.lng ? parseFloat(hashData.lng) : null,
          timestamp: hashData.timestamp || null,
          receivedAt: hashData.receivedAt || null,
          updatedAt: hashData.updatedAt || null,
          metadata: hashData.metadata ? JSON.parse(hashData.metadata) : null,
          name: hashData.name || hashData.deviceName || null
        };
        
      case 'list':
        const listData = await this.client.lindex(key, -1);
        if (!listData) return null;
        return JSON.parse(listData);
        
      case 'zset':
        const zsetData = await this.client.zrevrange(key, 0, 0);
        if (!zsetData || zsetData.length === 0) return null;
        return JSON.parse(zsetData[0]);
        
      default:
        logger.warn(`⚠️ Tipo de dato no soportado para usuario móvil ${userId}: ${dataType}`);
        return null;
    }
  }

  /**
   * Obtiene la última posición de un usuario móvil específico
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Última posición móvil o null si no existe
   */
  async getLastPosition(userId) {
    try {
      await this.connect();
      
      const key = `${this.keyPrefix}${userId}`;
      
      // Verificar si la clave existe
      const exists = await this.client.exists(key);
      if (!exists) {
        logger.debug(`📱 No se encontró última posición móvil para usuario: ${userId}`);
        return null;
      }

      // Obtener datos según el tipo
      const position = await this.getDataByType(key, userId);
      
      if (!position) {
        logger.debug(`📱 No se encontró última posición móvil para usuario: ${userId}`);
        return null;
      }

      logger.debug(`📱 Última posición móvil obtenida para usuario: ${userId}`);
      
      return {
        ...position,
        userId: position.userId || userId, // Asegurar que userId esté presente
        retrievedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error obteniendo última posición móvil para ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene las últimas posiciones de múltiples usuarios móviles
   * @param {string[]} userIds - Array de IDs de usuarios
   * @returns {Object[]} Array de últimas posiciones móviles
   */
  async getMultipleLastPositions(userIds) {
    try {
      await this.connect();
      
      const positions = [];

      // Procesar cada usuario individualmente para manejar diferentes tipos
      for (const userId of userIds) {
        try {
          const position = await this.getLastPosition(userId);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          logger.warn(`⚠️ Error obteniendo posición móvil para ${userId}:`, error.message);
        }
      }

      logger.info(`📱 Obtenidas ${positions.length}/${userIds.length} últimas posiciones móviles`);
      return positions;

    } catch (error) {
      logger.error('❌ Error obteniendo múltiples últimas posiciones móviles:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene todas las últimas posiciones móviles disponibles
   * @returns {Object[]} Array de todas las últimas posiciones móviles
   */
  async getAllLastPositions() {
    try {
      await this.connect();
      
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) {
        logger.info('📱 No se encontraron últimas posiciones móviles');
        return [];
      }

      const positions = [];

      // Procesar cada clave individualmente para manejar diferentes tipos
      for (const key of keys) {
        const userId = key.replace(this.keyPrefix, '');
        
        try {
          const position = await this.getLastPosition(userId);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          logger.warn(`⚠️ Error obteniendo posición móvil para ${userId}:`, error.message);
        }
      }

      logger.info(`📱 Obtenidas ${positions.length} últimas posiciones móviles totales`);
      return positions;

    } catch (error) {
      logger.error('❌ Error obteniendo todas las últimas posiciones móviles:', error.message);
      throw error;
    }
  }

  /**
   * Verifica si existe una última posición para un usuario móvil
   * @param {string} userId - ID del usuario
   * @returns {boolean} True si existe, false si no
   */
  async hasLastPosition(userId) {
    try {
      await this.connect();
      
      const key = `${this.keyPrefix}${userId}`;
      logger.debug(`🔍 Verificando existencia de clave móvil: ${key}`);
      
      const exists = await this.client.exists(key);
      logger.debug(`📱 Clave móvil ${key} existe: ${exists === 1}`);
      
      // Verificación adicional: si existe, intentar obtener el tipo
      if (exists === 1) {
        try {
          const dataType = await this.client.type(key);
          logger.debug(`📱 Tipo de dato móvil para ${key}: ${dataType}`);
          
          // Verificar que el tipo sea válido y tenga contenido
          switch (dataType) {
            case 'hash':
              const hashKeys = await this.client.hkeys(key);
              const hasContent = hashKeys.length > 0;
              logger.debug(`📱 Hash móvil ${key} tiene ${hashKeys.length} campos`);
              return hasContent;
            case 'string':
              const stringValue = await this.client.get(key);
              const hasStringContent = stringValue !== null && stringValue !== '';
              logger.debug(`📱 String móvil ${key} tiene contenido: ${hasStringContent}`);
              return hasStringContent;
            case 'list':
              const listLength = await this.client.llen(key);
              const hasListContent = listLength > 0;
              logger.debug(`📱 Lista móvil ${key} tiene ${listLength} elementos`);
              return hasListContent;
            case 'zset':
              const zsetSize = await this.client.zcard(key);
              const hasZsetContent = zsetSize > 0;
              logger.debug(`📱 Sorted set móvil ${key} tiene ${zsetSize} elementos`);
              return hasZsetContent;
            default:
              logger.warn(`⚠️ Tipo de dato desconocido para móvil ${key}: ${dataType}`);
              return false;
          }
        } catch (typeError) {
          logger.warn(`⚠️ Error verificando tipo móvil de ${key}:`, typeError.message);
          return exists === 1; // Fallback a verificación básica
        }
      }
      
      return false;

    } catch (error) {
      logger.error(`❌ Error verificando existencia de posición móvil para ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de las últimas posiciones móviles
   * @returns {Object} Estadísticas
   */
  async getStats() {
    try {
      await this.connect();
      
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      let totalMemoryUsage = 0;
      for (const key of keys) {
        try {
          const usage = await this.client.memory('usage', key);
          totalMemoryUsage += usage || 0;
        } catch (error) {
          // Ignorar errores de memoria individual
        }
      }

      return {
        totalUsers: keys.length,
        keyPattern: pattern,
        memoryUsage: totalMemoryUsage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas móviles:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la conexión a Redis
   */
  async ping() {
    try {
      await this.connect();
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('❌ Error en ping a Redis móvil:', error.message);
      return false;
    }
  }

  /**
   * Desconecta de Redis
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        if (this.client.status === 'ready') {
          await this.client.quit();
        }
        this.isConnected = false;
        logger.info('✅ Desconectado de Redis móvil');
      }
    } catch (error) {
      if (!error.message.includes('Connection is closed')) {
        logger.error('❌ Error desconectando de Redis móvil:', error.message);
      }
    }
  }
}