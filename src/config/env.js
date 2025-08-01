import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración centralizada del microservicio GPS Last Position API
 */
export const config = {
  // Configuración del servidor
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000
  },

  // Configuración de Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'gps:last',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },

  // Configuración de la API
  api: {
    key: process.env.API_KEY || null,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Configuración de Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Configuración de seguridad
  security: {
    helmetEnabled: process.env.HELMET_ENABLED !== 'false'
  },

  // Configuración de monitoreo
  monitoring: {
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',
    metricsEnabled: process.env.METRICS_ENABLED !== 'false'
  }
};

/**
 * Valida la configuración requerida
 */
export function validateConfig() {
  const required = [
    'REDIS_HOST'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }

  // Validaciones adicionales
  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error('PORT debe estar entre 1 y 65535');
  }

  if (config.redis.port < 1 || config.redis.port > 65535) {
    throw new Error('REDIS_PORT debe estar entre 1 y 65535');
  }
}

/**
 * Obtiene configuración específica por ambiente
 */
export function getEnvironmentConfig() {
  const env = config.server.environment;
  
  const envConfigs = {
    development: {
      logging: { level: 'debug' },
      rateLimit: { max: 1000 }
    },
    production: {
      logging: { level: 'info' },
      rateLimit: { max: 100 }
    },
    test: {
      logging: { level: 'error' },
      rateLimit: { enabled: false }
    }
  };

  return envConfigs[env] || {};
}