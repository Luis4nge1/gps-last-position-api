import { logger } from '../utils/logger.js';

/**
 * Middleware para validar el cuerpo de peticiones JSON
 */
export function validateJsonMiddleware(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    
    if (contentType && contentType.includes('application/json')) {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cuerpo JSON requerido para esta petición',
          code: 'MISSING_JSON_BODY',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }
  
  next();
}

/**
 * Middleware para validar parámetros de deviceId
 */
export function validateDeviceIdMiddleware(req, res, next) {
  const { deviceId } = req.params;
  
  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'Device ID es requerido',
      code: 'MISSING_DEVICE_ID',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (typeof deviceId !== 'string' || deviceId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Device ID debe ser una cadena válida no vacía',
      code: 'INVALID_DEVICE_ID',
      meta: {
        providedDeviceId: deviceId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar longitud del deviceId
  if (deviceId.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Device ID no puede exceder 100 caracteres',
      code: 'DEVICE_ID_TOO_LONG',
      meta: {
        providedLength: deviceId.length,
        maxLength: 100,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar caracteres permitidos (alfanuméricos, guiones, puntos, guiones bajos)
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(deviceId)) {
    return res.status(400).json({
      success: false,
      error: 'Device ID contiene caracteres no válidos. Solo se permiten letras, números, puntos, guiones y guiones bajos',
      code: 'INVALID_DEVICE_ID_CHARACTERS',
      meta: {
        providedDeviceId: deviceId,
        allowedPattern: 'a-zA-Z0-9._-',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
}

/**
 * Middleware para validar el cuerpo de peticiones múltiples
 */
export function validateMultipleDevicesMiddleware(req, res, next) {
  const { deviceIds } = req.body;

  if (!deviceIds) {
    return res.status(400).json({
      success: false,
      error: 'Campo deviceIds es requerido',
      code: 'MISSING_DEVICE_IDS',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (!Array.isArray(deviceIds)) {
    return res.status(400).json({
      success: false,
      error: 'deviceIds debe ser un array',
      code: 'INVALID_DEVICE_IDS_TYPE',
      meta: {
        providedType: typeof deviceIds,
        expectedType: 'array',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (deviceIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'deviceIds no puede estar vacío',
      code: 'EMPTY_DEVICE_IDS',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (deviceIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Máximo 100 dispositivos permitidos por petición',
      code: 'TOO_MANY_DEVICE_IDS',
      meta: {
        provided: deviceIds.length,
        maximum: 100,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar cada deviceId
  const invalidDevices = [];
  const validPattern = /^[a-zA-Z0-9._-]+$/;

  for (let i = 0; i < deviceIds.length; i++) {
    const deviceId = deviceIds[i];
    
    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      invalidDevices.push({
        index: i,
        value: deviceId,
        error: 'Device ID debe ser una cadena válida no vacía'
      });
    } else if (deviceId.length > 100) {
      invalidDevices.push({
        index: i,
        value: deviceId,
        error: 'Device ID no puede exceder 100 caracteres'
      });
    } else if (!validPattern.test(deviceId)) {
      invalidDevices.push({
        index: i,
        value: deviceId,
        error: 'Device ID contiene caracteres no válidos'
      });
    }
  }

  if (invalidDevices.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Algunos Device IDs son inválidos',
      code: 'INVALID_DEVICE_IDS',
      details: invalidDevices,
      meta: {
        totalProvided: deviceIds.length,
        invalidCount: invalidDevices.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
}

/**
 * Middleware para validar parámetros de paginación
 */
export function validatePaginationMiddleware(req, res, next) {
  const { limit, offset } = req.query;

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro limit debe ser un número entre 1 y 1000',
        code: 'INVALID_LIMIT',
        meta: {
          providedLimit: limit,
          validRange: '1-1000',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro offset debe ser un número mayor o igual a 0',
        code: 'INVALID_OFFSET',
        meta: {
          providedOffset: offset,
          minimum: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  next();
}

/**
 * Middleware para validar parámetros de userId (móvil)
 */
export function validateUserIdMiddleware(req, res, next) {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID es requerido',
      code: 'MISSING_USER_ID',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'User ID debe ser una cadena válida no vacía',
      code: 'INVALID_USER_ID',
      meta: {
        providedUserId: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar longitud del userId
  if (userId.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'User ID no puede exceder 100 caracteres',
      code: 'USER_ID_TOO_LONG',
      meta: {
        providedLength: userId.length,
        maxLength: 100,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar caracteres permitidos (alfanuméricos, guiones, puntos, guiones bajos)
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(userId)) {
    return res.status(400).json({
      success: false,
      error: 'User ID contiene caracteres no válidos. Solo se permiten letras, números, puntos, guiones y guiones bajos',
      code: 'INVALID_USER_ID_CHARACTERS',
      meta: {
        providedUserId: userId,
        allowedPattern: 'a-zA-Z0-9._-',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
}

/**
 * Middleware para validar el cuerpo de peticiones múltiples de usuarios móviles
 */
export function validateMultipleUsersMiddleware(req, res, next) {
  const { userIds } = req.body;

  if (!userIds) {
    return res.status(400).json({
      success: false,
      error: 'Campo userIds es requerido',
      code: 'MISSING_USER_IDS',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (!Array.isArray(userIds)) {
    return res.status(400).json({
      success: false,
      error: 'userIds debe ser un array',
      code: 'INVALID_USER_IDS_TYPE',
      meta: {
        providedType: typeof userIds,
        expectedType: 'array',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (userIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'userIds no puede estar vacío',
      code: 'EMPTY_USER_IDS',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }

  if (userIds.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Máximo 100 usuarios permitidos por petición',
      code: 'TOO_MANY_USER_IDS',
      meta: {
        provided: userIds.length,
        maximum: 100,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Validar cada userId
  const invalidUsers = [];
  const validPattern = /^[a-zA-Z0-9._-]+$/;

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      invalidUsers.push({
        index: i,
        value: userId,
        error: 'User ID debe ser una cadena válida no vacía'
      });
    } else if (userId.length > 100) {
      invalidUsers.push({
        index: i,
        value: userId,
        error: 'User ID no puede exceder 100 caracteres'
      });
    } else if (!validPattern.test(userId)) {
      invalidUsers.push({
        index: i,
        value: userId,
        error: 'User ID contiene caracteres no válidos'
      });
    }
  }

  if (invalidUsers.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Algunos User IDs son inválidos',
      code: 'INVALID_USER_IDS',
      details: invalidUsers,
      meta: {
        totalProvided: userIds.length,
        invalidCount: invalidUsers.length,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
}