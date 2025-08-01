import { createRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * Repositorio para consultas de última posición GPS desde Redis
 */
export class GPSLastPositionRepository {
  constructor() {
    this.client = null;
    this.isConnected = false;
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
        logger.info('✅ Conectado a Redis para consultas GPS');
      }

      return this.client;
    } catch (error) {
      if (error.message.includes('already connecting') || error.message.includes('already connected')) {
        logger.debug('🔗 Redis ya está conectado, reutilizando conexión');
        this.isConnected = true;
        return this.client;
      }
      
      logger.error('❌ Error conectando a Redis:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene datos de una clave según su tipo
   * @param {string} key - Clave de Redis
   * @param {string} deviceId - ID del dispositivo
   * @returns {Object|null} Datos procesados o null
   */
  async getDataByType(key, deviceId) {
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
          deviceId: hashData.deviceId || deviceId,
          lat: hashData.lat ? parseFloat(hashData.lat) : null,
          lng: hashData.lng ? parseFloat(hashData.lng) : null,
          timestamp: hashData.timestamp || null,
          receivedAt: hashData.receivedAt || null,
          updatedAt: hashData.updatedAt || null,
          metadata: hashData.metadata ? JSON.parse(hashData.metadata) : null,
          name: hashData.name || hashData.deviceName || null // Soporte para nombres de dispositivos
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
        logger.warn(`⚠️ Tipo de dato no soportado para ${deviceId}: ${dataType}`);
        return null;
    }
  }

  /**
   * Obtiene la última posición de un dispositivo específico
   * @param {string} deviceId - ID del dispositivo
   * @returns {Object|null} Última posición GPS o null si no existe
   */
  async getLastPosition(deviceId) {
    try {
      await this.connect();
      
      const key = `${config.redis.keyPrefix}${deviceId}`;
      
      // Verificar si la clave existe
      const exists = await this.client.exists(key);
      if (!exists) {
        logger.debug(`📍 No se encontró última posición para dispositivo: ${deviceId}`);
        return null;
      }

      // Obtener datos según el tipo
      const position = await this.getDataByType(key, deviceId);
      
      if (!position) {
        logger.debug(`📍 No se encontró última posición para dispositivo: ${deviceId}`);
        return null;
      }

      logger.debug(`📍 Última posición obtenida para dispositivo: ${deviceId}`);
      
      return {
        ...position,
        retrievedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`❌ Error obteniendo última posición para ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene las últimas posiciones de múltiples dispositivos
   * @param {string[]} deviceIds - Array de IDs de dispositivos
   * @returns {Object[]} Array de últimas posiciones
   */
  async getMultipleLastPositions(deviceIds) {
    try {
      await this.connect();
      
      const positions = [];

      // Procesar cada dispositivo individualmente para manejar diferentes tipos
      for (const deviceId of deviceIds) {
        try {
          const position = await this.getLastPosition(deviceId);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          logger.warn(`⚠️ Error obteniendo posición para ${deviceId}:`, error.message);
        }
      }

      logger.info(`📍 Obtenidas ${positions.length}/${deviceIds.length} últimas posiciones`);
      return positions;

    } catch (error) {
      logger.error('❌ Error obteniendo múltiples últimas posiciones:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene todas las últimas posiciones disponibles
   * @returns {Object[]} Array de todas las últimas posiciones
   */
  async getAllLastPositions() {
    try {
      await this.connect();
      
      const pattern = `${config.redis.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) {
        logger.info('📍 No se encontraron últimas posiciones');
        return [];
      }

      const positions = [];

      // Procesar cada clave individualmente para manejar diferentes tipos
      for (const key of keys) {
        const deviceId = key.replace(config.redis.keyPrefix, '');
        
        try {
          const position = await this.getLastPosition(deviceId);
          if (position) {
            positions.push(position);
          }
        } catch (error) {
          logger.warn(`⚠️ Error obteniendo posición para ${deviceId}:`, error.message);
        }
      }

      logger.info(`📍 Obtenidas ${positions.length} últimas posiciones totales`);
      return positions;

    } catch (error) {
      logger.error('❌ Error obteniendo todas las últimas posiciones:', error.message);
      throw error;
    }
  }

  /**
   * Verifica si existe una última posición para un dispositivo
   * @param {string} deviceId - ID del dispositivo
   * @returns {boolean} True si existe, false si no
   */
  async hasLastPosition(deviceId) {
    try {
      await this.connect();
      
      const key = `${config.redis.keyPrefix}${deviceId}`;
      logger.debug(`🔍 Verificando existencia de clave: ${key}`);
      
      const exists = await this.client.exists(key);
      logger.debug(`📍 Clave ${key} existe: ${exists === 1}`);
      
      // Verificación adicional: si existe, intentar obtener el tipo
      if (exists === 1) {
        try {
          const dataType = await this.client.type(key);
          logger.debug(`📍 Tipo de dato para ${key}: ${dataType}`);
          
          // Verificar que el tipo sea válido y tenga contenido
          switch (dataType) {
            case 'hash':
              const hashKeys = await this.client.hkeys(key);
              const hasContent = hashKeys.length > 0;
              logger.debug(`📍 Hash ${key} tiene ${hashKeys.length} campos`);
              return hasContent;
            case 'string':
              const stringValue = await this.client.get(key);
              const hasStringContent = stringValue !== null && stringValue !== '';
              logger.debug(`📍 String ${key} tiene contenido: ${hasStringContent}`);
              return hasStringContent;
            case 'list':
              const listLength = await this.client.llen(key);
              const hasListContent = listLength > 0;
              logger.debug(`📍 Lista ${key} tiene ${listLength} elementos`);
              return hasListContent;
            case 'zset':
              const zsetSize = await this.client.zcard(key);
              const hasZsetContent = zsetSize > 0;
              logger.debug(`📍 Sorted set ${key} tiene ${zsetSize} elementos`);
              return hasZsetContent;
            default:
              logger.warn(`⚠️ Tipo de dato desconocido para ${key}: ${dataType}`);
              return false;
          }
        } catch (typeError) {
          logger.warn(`⚠️ Error verificando tipo de ${key}:`, typeError.message);
          return exists === 1; // Fallback a verificación básica
        }
      }
      
      return false;

    } catch (error) {
      logger.error(`❌ Error verificando existencia de posición para ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de las últimas posiciones
   * @returns {Object} Estadísticas
   */
  async getStats() {
    try {
      await this.connect();
      
      const pattern = `${config.redis.keyPrefix}*`;
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
        totalDevices: keys.length,
        keyPattern: pattern,
        memoryUsage: totalMemoryUsage,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas:', error.message);
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
      logger.error('❌ Error en ping a Redis:', error.message);
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
        logger.info('✅ Desconectado de Redis');
      }
    } catch (error) {
      if (!error.message.includes('Connection is closed')) {
        logger.error('❌ Error desconectando de Redis:', error.message);
      }
    }
  }
}