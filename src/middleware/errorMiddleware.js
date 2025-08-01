import { logger } from '../utils/logger.js';

/**
 * Middleware global de manejo de errores
 */
export function errorMiddleware(err, req, res, next) {
  logger.error('❌ Error no manejado en la aplicación:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido en el cuerpo de la petición',
      code: 'INVALID_JSON',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error de timeout
  if (err.code === 'TIMEOUT' || err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: 'Timeout en la petición',
      code: 'REQUEST_TIMEOUT',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error de conexión a Redis
  if (err.message.includes('Redis') || err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      success: false,
      error: 'Servicio temporalmente no disponible',
      code: 'SERVICE_UNAVAILABLE',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Middleware para manejar rutas no encontradas
 */
export function notFoundMiddleware(req, res) {
  logger.warn(`🔍 Ruta no encontrada: ${req.method} ${req.url} desde ${req.ip}`);
  
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.url}`,
    code: 'ROUTE_NOT_FOUND',
    meta: {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Middleware para timeout de peticiones
 */
export function timeoutMiddleware(timeout = 30000) {
  return (req, res, next) => {
    // Configurar timeout para la respuesta
    res.setTimeout(timeout, () => {
      logger.warn(`⏰ Timeout en petición: ${req.method} ${req.url} desde ${req.ip}`);
      
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Timeout en la petición',
          code: 'REQUEST_TIMEOUT',
          meta: {
            timeout: timeout,
            timestamp: new Date().toISOString()
          }
        });
      }
    });

    next();
  };
}