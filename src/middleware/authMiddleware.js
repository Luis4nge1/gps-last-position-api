import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware de autenticación por API Key
 */
export function authMiddleware(req, res, next) {
  // Si no hay API key configurada, permitir acceso
  if (!config.api.key) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    logger.warn(`🔒 Acceso denegado: API key faltante desde ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'API key requerida',
      code: 'MISSING_API_KEY',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (apiKey !== config.api.key) {
    logger.warn(`🔒 Acceso denegado: API key inválida desde ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'API key inválida',
      code: 'INVALID_API_KEY',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  // API key válida, continuar
  next();
}

/**
 * Middleware de autenticación opcional (no bloquea si no hay API key)
 */
export function optionalAuthMiddleware(req, res, next) {
  // Si no hay API key configurada, permitir acceso
  if (!config.api.key) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  // Si no se proporciona API key, permitir acceso pero marcar como no autenticado
  if (!apiKey) {
    req.authenticated = false;
    return next();
  }

  // Si se proporciona API key, validarla
  if (apiKey === config.api.key) {
    req.authenticated = true;
  } else {
    logger.warn(`🔒 API key inválida proporcionada desde ${req.ip}`);
    req.authenticated = false;
  }

  next();
}