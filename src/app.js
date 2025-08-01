import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { GPSLastPositionController } from './controllers/GPSLastPositionController.js';
import { MobileLastPositionController } from './controllers/MobileLastPositionController.js';
import gpsRoutes from './routes/gpsRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/authMiddleware.js';
import { errorMiddleware, notFoundMiddleware, timeoutMiddleware } from './middleware/errorMiddleware.js';
import { validateJsonMiddleware } from './middleware/validationMiddleware.js';

/**
 * Configuración y creación de la aplicación Express
 */
export function createApp() {
  const app = express();
  const gpsController = new GPSLastPositionController();
  const mobileController = new MobileLastPositionController();

  // Configurar trust proxy si está habilitado
  if (config.api.trustProxy) {
    app.set('trust proxy', true);
  }

  // Middleware de seguridad
  if (config.security.helmetEnabled) {
    app.use(helmet({
      contentSecurityPolicy: false, // Deshabilitado para APIs
      crossOriginEmbedderPolicy: false
    }));
  }

  // Configurar CORS
  app.use(cors({
    origin: config.api.corsOrigin === '*' ? true : config.api.corsOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: false
  }));

  // Rate limiting
  if (config.rateLimit.enabled) {
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        error: 'Demasiadas peticiones, intenta de nuevo más tarde',
        code: 'RATE_LIMIT_EXCEEDED',
        meta: {
          windowMs: config.rateLimit.windowMs,
          maxRequests: config.rateLimit.max,
          timestamp: new Date().toISOString()
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Saltar rate limiting para health check
        return req.path === config.monitoring.healthCheckPath;
      }
    });

    app.use(limiter);
  }

  // Middleware de timeout
  app.use(timeoutMiddleware(config.server.requestTimeout));

  // Parseo de JSON
  app.use(express.json({
    limit: '1mb',
    strict: true
  }));

  // Parseo de URL encoded
  app.use(express.urlencoded({
    extended: true,
    limit: '1mb'
  }));

  // Middleware de validación JSON
  app.use(validateJsonMiddleware);

  // Logging de peticiones
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

      logger[logLevel](`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    });

    next();
  });

  // Health check (sin autenticación)
  app.get('/api/v4/health/gps', async (req, res) => {
    await gpsController.healthCheck(req, res);
  });

  // Health check móvil (sin autenticación)
  app.get('/api/v4/health/mobile', async (req, res) => {
    await mobileController.healthCheck(req, res);
  });

  // Ruta de información básica
  app.get('/api/v4', (req, res) => {
    res.json({
      service: 'GPS & Mobile Last Position API',
      version: '1.0.0',
      description: 'Microservicio para consultar últimas posiciones GPS y móviles desde Redis',
      endpoints: {
        health: {
          gps: config.monitoring.healthCheckPath,
          mobile: '/api/v4/health/mobile'
        },
        api: {
          gps: '/api/v4/gps',
          mobile: '/api/v4/mobile'
        },
        docs: 'Ver README.md para documentación completa'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  });

  // Rutas de la API con autenticación opcional para stats
  app.use('/api/v4/gps', optionalAuthMiddleware, gpsRoutes);
  app.use('/api/v4/mobile', optionalAuthMiddleware, mobileRoutes);

  // Rutas protegidas que requieren autenticación
  // if (config.api.key) {
  //   app.use('/api/v4/gps/stats', authMiddleware);
  //   app.use('/api/v4/mobile/stats', authMiddleware);
  // }

  // Middleware para rutas no encontradas
  app.use(notFoundMiddleware);

  // Middleware global de manejo de errores
  app.use(errorMiddleware);

  return app;
}

/**
 * Inicia el servidor
 */
export async function startServer() {
  try {
    const app = createApp();

    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 GPS Last Position API iniciado exitosamente`);
      logger.info(`📡 Servidor escuchando en http://${config.server.host}:${config.server.port}`);
      logger.info(`🏥 Health check disponible en ${config.monitoring.healthCheckPath}`);
      logger.info(`🔧 Ambiente: ${config.server.environment}`);

      if (config.api.key) {
        logger.info('🔒 Autenticación por API key habilitada');
      } else {
        logger.warn('⚠️ API ejecutándose sin autenticación');
      }

      if (config.rateLimit.enabled) {
        logger.info(`🛡️ Rate limiting: ${config.rateLimit.max} peticiones por ${config.rateLimit.windowMs}ms`);
      }
    });

    // Configurar timeout del servidor
    server.timeout = config.server.requestTimeout;

    // Manejo graceful de cierre
    const gracefulShutdown = async (signal) => {
      logger.info(`📡 Señal ${signal} recibida, cerrando servidor...`);

      server.close(async () => {
        logger.info('✅ Servidor HTTP cerrado');

        // Limpiar recursos si es necesario
        try {
          // Aquí se pueden agregar limpiezas adicionales
          logger.info('✅ Recursos limpiados exitosamente');
        } catch (error) {
          logger.error('❌ Error limpiando recursos:', error.message);
        }

        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('❌ Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    // Configurar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('❌ Excepción no capturada:', error.message);
      logger.error('Stack:', error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Promesa rechazada no manejada:', reason);
      logger.error('Promise:', promise);
      process.exit(1);
    });

    return server;

  } catch (error) {
    logger.error('❌ Error iniciando el servidor:', error.message);
    throw error;
  }
}