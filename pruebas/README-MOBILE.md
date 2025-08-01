# Mobile Last Position API

API REST para consultar últimas posiciones de usuarios móviles almacenadas en Redis con el patrón `mobile:last:{userId}`.

## 📱 Características Móviles

- **Datos específicos móviles**: Información de dispositivo, versión de app, batería, tipo de red
- **Soporte multiplataforma**: iOS y Android
- **Metadatos enriquecidos**: Información adicional del contexto móvil
- **Misma arquitectura robusta**: Basada en la API GPS con todas sus características

## 🚀 Endpoints Móviles

### Base URL: `/api/mobile`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/last/:userId` | Última posición de un usuario |
| POST | `/last/multiple` | Múltiples posiciones de usuarios |
| GET | `/last` | Todas las posiciones móviles |
| GET | `/exists/:userId` | Verificar si existe usuario |
| GET | `/stats` | Estadísticas del servicio móvil |
| GET | `/health/mobile` | Health check móvil |

## 📋 Ejemplos de Uso

### 1. Obtener última posición de un usuario
```bash
curl http://localhost:3001/api/mobile/last/user-001
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "lat": -12.045409,
    "lng": -77.031494,
    "timestamp": "2025-07-22T10:15:30.521Z",
    "receivedAt": "2025-07-22T10:15:10.874Z",
    "updatedAt": "2025-07-22T10:15:31.330Z",
    "metadata": {
      "speed": 15.5,
      "heading": 45,
      "altitude": 150,
      "accuracy": 5
    },
    "deviceInfo": {
      "platform": "iOS",
      "model": "iPhone 14",
      "osVersion": "17.2",
      "appName": "MiApp"
    },
    "appVersion": "2.1.0",
    "batteryLevel": 85.5,
    "networkType": "5G",
    "retrievedAt": "2025-07-22T10:30:00.000Z"
  },
  "meta": {
    "userId": "user-001",
    "timestamp": "2025-07-22T10:30:00.000Z"
  }
}
```

### 2. Obtener múltiples posiciones
```bash
curl -X POST http://localhost:3001/api/mobile/last/multiple \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-001", "user-002", "user-003"]}'
```

### 3. Obtener todas las posiciones móviles
```bash
curl "http://localhost:3001/api/mobile/last?limit=10&offset=0"
```

### 4. Verificar existencia de usuario
```bash
curl http://localhost:3001/api/mobile/exists/user-001
```

### 5. Estadísticas del servicio móvil
```bash
curl http://localhost:3001/api/mobile/stats
```

### 6. Health check móvil
```bash
curl http://localhost:3001/health/mobile
```

## 🗂️ Estructura de Datos Móviles

### Campos Básicos (GPS)
- `userId`: ID del usuario móvil
- `lat`: Latitud
- `lng`: Longitud  
- `timestamp`: Momento de la posición
- `receivedAt`: Momento de recepción
- `updatedAt`: Momento de actualización

### Campos Específicos Móviles
- `deviceInfo`: Información del dispositivo
  - `platform`: iOS/Android
  - `model`: Modelo del dispositivo
  - `osVersion`: Versión del SO
  - `appName`: Nombre de la aplicación
- `appVersion`: Versión de la aplicación
- `batteryLevel`: Nivel de batería (0-100)
- `networkType`: Tipo de red (WiFi, 4G, 5G, etc.)

### Metadatos GPS
- `speed`: Velocidad en m/s
- `heading`: Dirección en grados
- `altitude`: Altitud en metros
- `accuracy`: Precisión en metros

## 🔧 Configuración

### Datos de Prueba
```bash
# Configurar datos de prueba móviles
node setup-mobile-test-data.js

# Probar todos los endpoints
node test-mobile-api.js
```

### Estructura en Redis
```
Key: mobile:last:user-001
Fields:
  userId: user-001
  lat: -12.045409
  lng: -77.031494
  timestamp: 2025-07-22T10:15:30.521Z
  receivedAt: 2025-07-22T10:15:10.874Z
  updatedAt: 2025-07-22T10:15:31.330Z
  metadata: {"speed":15.5,"heading":45,"altitude":150,"accuracy":5}
  deviceInfo: {"platform":"iOS","model":"iPhone 14","osVersion":"17.2","appName":"MiApp"}
  appVersion: 2.1.0
  batteryLevel: 85.5
  networkType: 5G
```

## 🚦 Códigos de Error Móviles

| Código | Descripción |
|--------|-------------|
| `INVALID_USER_ID` | User ID inválido o faltante |
| `POSITION_NOT_FOUND` | No se encontró posición para el usuario |
| `INVALID_USER_IDS` | Array de User IDs inválido |
| `TOO_MANY_USERS` | Demasiados usuarios en una consulta (máx. 100) |
| `MISSING_API_KEY` | API key requerida pero no proporcionada |
| `INVALID_API_KEY` | API key inválida |
| `RATE_LIMIT_EXCEEDED` | Límite de peticiones excedido |
| `INTERNAL_ERROR` | Error interno del servidor |

## 🧪 Comandos de Prueba

```bash
# Configurar datos de prueba
node setup-mobile-test-data.js

# Probar API completa
node test-mobile-api.js

# Probar endpoint específico con curl
curl -X POST http://localhost:3001/api/mobile/last/multiple \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-001", "user-002"]}'

# Probar con PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/mobile/last/user-001" -Method GET
```

## 🔄 Comparación GPS vs Mobile

| Aspecto | GPS API | Mobile API |
|---------|---------|------------|
| **Prefijo Redis** | `gps:last:` | `mobile:last:` |
| **ID Parameter** | `deviceId` | `userId` |
| **Base URL** | `/api/gps` | `/api/mobile` |
| **Health Check** | `/health` | `/health/mobile` |
| **Datos Extra** | Básicos GPS | + Dispositivo, App, Batería, Red |
| **Casos de Uso** | Dispositivos IoT/GPS | Aplicaciones móviles |

## 📊 Monitoreo

### Métricas Disponibles
- Total de usuarios móviles con posición
- Uso de memoria Redis para datos móviles
- Distribución por plataforma (iOS/Android)
- Estadísticas de versiones de app
- Tipos de red más utilizados

### Logs Específicos
- Emoji 📱 para identificar logs móviles
- Separación clara de logs GPS vs Mobile
- Métricas específicas de dispositivos móviles

## 🔐 Seguridad

- Mismas características de seguridad que GPS API
- Validación específica para User IDs
- Rate limiting independiente
- Autenticación opcional por API key compartida

## 🚀 Despliegue

La API móvil se despliega junto con la API GPS en el mismo servicio, compartiendo:
- Configuración Redis
- Middlewares de seguridad
- Sistema de logging
- Health checks

Ambas APIs funcionan de manera independiente pero complementaria.