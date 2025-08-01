# GPS Last Position API

Microservicio REST API para consultar las últimas posiciones GPS almacenadas en Redis.

## 🚨 Problema Resuelto: WRONGTYPE Error

Este API ahora maneja correctamente diferentes tipos de datos en Redis:
- **Hash**: Campos separados (deviceId, lat, lng, timestamp, etc.) - **Recomendado**
- **String**: JSON serializado
- **List**: Último elemento como más reciente
- **Sorted Set**: Elemento con mayor score

### Formato Hash en Redis (Recomendado)
```
Key: gps:last:device-001
Fields:
  deviceId: device-001
  lat: -12.045409
  lng: -77.031494
  timestamp: 2025-07-16T17:16:36.521Z
  receivedAt: 2025-07-16T17:16:10.874Z
  updatedAt: 2025-07-16T17:16:17.330Z
  metadata: {"speed":null,"heading":null,"altitude":null,"accuracy":null}
```

## Características

- ⚡ **Alto rendimiento**: Consultas optimizadas con Redis
- 🔧 **Flexible**: Soporta múltiples tipos de datos Redis
- 🔒 **Seguro**: Autenticación por API key opcional
- 📊 **Monitoreo**: Health checks y métricas integradas
- 🛡️ **Rate limiting**: Protección contra abuso
- 🐳 **Docker ready**: Contenedorización completa
- 📝 **Logging estructurado**: Trazabilidad completa

## Instalación

### Requisitos
- Node.js >= 16.0.0
- Redis >= 6.0.0

### Configuración local

1. **Clonar repositorio**
```bash
git clone <repository-url>
cd gps-last-position-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tu configuración
```

4. **Configurar datos de prueba (opcional)**
```bash
node setup-test-data.js
```

5. **Iniciar en desarrollo**
```bash
npm run dev
```

### Variables de entorno

```env
# Servidor
PORT=3001
HOST=localhost
NODE_ENV=development
REQUEST_TIMEOUT=30000

# Redis (VM separada)
REDIS_HOST=172.17.192.184  # IP de tu VM Redis
REDIS_PORT=6379
REDIS_PASSWORD=            # Password si está configurado
REDIS_DB=0
REDIS_KEY_PREFIX=gps:last:

# API
API_KEY=
CORS_ORIGIN=*
TRUST_PROXY=false

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Seguridad
HELMET_ENABLED=true

# Monitoreo
HEALTH_CHECK_PATH=/health
METRICS_ENABLED=true
```

## ⚠️ Configuración Redis en VM Separada

Tu Redis está en una VM separada (`172.17.192.184`). Para el despliegue en Google Cloud:

### 1. Verificar Conectividad
```bash
# Desde tu VM de Google Cloud, probar conexión a Redis
telnet 172.17.192.184 6379
```

### 2. Configurar Firewall (si es necesario)
```bash
# Permitir tráfico desde Google Cloud Run a tu VM Redis
# Esto depende de tu configuración de red específica
```

### 3. Variables de Entorno en Cloud Run
```bash
gcloud run services update gps-mobile-api \
    --set-env-vars \
    REDIS_HOST=172.17.192.184,\
    REDIS_PORT=6379,\
    REDIS_PASSWORD=YOUR_PASSWORD_IF_ANY,\
    REDIS_DB=0,\
    REDIS_KEY_PREFIX=gps:last:
```

## Endpoints

### 📡 Endpoints GPS

#### 🎯 Todas las posiciones GPS (OPTIMIZADO: id, lat, lng)
```http
GET /api/v4/gps/last?limit=10&offset=0
```

#### 📊 Posición individual GPS (COMPLETO: todos los datos)
```http
GET /api/v4/gps/last/{deviceId}
```

#### 📊 Múltiples posiciones GPS (COMPLETO: todos los datos)
```http
POST /api/v4/gps/last/multiple
Content-Type: application/json

{
  "deviceIds": ["device-001", "device-002"]
}
```

### 📱 Endpoints Mobile

#### 🎯 Todas las posiciones Mobile (OPTIMIZADO: id, lat, lng, name)
```http
GET /api/v4/mobile/last?limit=10&offset=0
```

#### 📊 Posición individual Mobile (COMPLETO: todos los datos)
```http
GET /api/v4/mobile/last/{userId}
```

#### 📊 Múltiples posiciones Mobile (COMPLETO: todos los datos)
```http
POST /api/v4/mobile/last/multiple
Content-Type: application/json

{
  "userIds": ["user-001", "user-002"]
}
```

### 🔧 Endpoints Adicionales Optimizados

#### GPS específicos optimizados
```http
GET /api/v4/gps/last/{deviceId}/gps     # Solo (id, lat, lng)
POST /api/v4/gps/last/multiple/gps      # Solo (id, lat, lng)
```

#### Mobile específicos optimizados
```http
GET /api/v4/gps/last/{deviceId}/mobile  # Solo (id, lat, lng, name)
POST /api/v4/gps/last/multiple/mobile   # Solo (id, lat, lng, name)
```

#### Datos completos específicos
```http
GET /api/v4/gps/last/{deviceId}/full    # Todos los datos
POST /api/v4/gps/last/multiple/full     # Todos los datos
```

### 🔧 Endpoints de Utilidad

#### Consultar todas las posiciones
```http
GET /api/v4/gps/last?limit=10&offset=0
```

#### Verificar existencia de dispositivo
```http
GET /api/v4/gps/exists/{deviceId}
```

#### Estadísticas del servicio
```http
GET /api/v4/gps/stats
```

#### Health check
```http
GET /health
```

## Pruebas

### Configurar datos de prueba
```bash
node setup-test-data.js
```

### Probar API
```bash
node test-api.js
```

### Debug de claves Redis
```bash
node debug-redis-keys.js
```

## Formato de datos

### 📊 Respuesta Completa (Endpoint Original)
```json
{
  "success": true,
  "data": {
    "deviceId": "device-001",
    "lat": -12.045409,
    "lng": -77.031494,
    "timestamp": "2025-07-16T17:16:36.521Z",
    "receivedAt": "2025-07-16T17:16:10.874Z",
    "updatedAt": "2025-07-16T17:16:17.330Z",
    "metadata": {
      "speed": null,
      "heading": null,
      "altitude": null,
      "accuracy": null
    },
    "retrievedAt": "2025-07-22T04:19:33.363Z"
  },
  "meta": {
    "deviceId": "device-001",
    "timestamp": "2025-07-22T04:19:33.363Z"
  }
}
```

### 📡 Respuesta Optimizada para GPS
```json
{
  "success": true,
  "data": {
    "id": "device-001",
    "lat": -12.045409,
    "lng": -77.031494
  },
  "meta": {
    "deviceId": "device-001",
    "timestamp": "2025-07-22T04:19:33.363Z",
    "format": "gps"
  }
}
```

### 📱 Respuesta Optimizada para Mobile
```json
{
  "success": true,
  "data": {
    "id": "device-001",
    "lat": -12.045409,
    "lng": -77.031494,
    "name": "device-001"
  },
  "meta": {
    "deviceId": "device-001",
    "timestamp": "2025-07-22T04:19:33.363Z",
    "format": "mobile"
  }
}
```

### 🔄 Respuesta Múltiple Optimizada para GPS
```json
{
  "success": true,
  "data": [
    {
      "id": "device-001",
      "lat": -12.045409,
      "lng": -77.031494
    },
    {
      "id": "device-002",
      "lat": -12.046789,
      "lng": -77.032123
    }
  ],
  "summary": {
    "requested": 2,
    "found": 2,
    "notFound": 0,
    "notFoundDeviceIds": []
  },
  "meta": {
    "timestamp": "2025-07-22T04:19:33.363Z",
    "format": "gps"
  }
}
```

### ❌ Estructura de respuesta de error
```json
{
  "success": false,
  "error": "No se encontró última posición para el dispositivo: device-999",
  "code": "POSITION_NOT_FOUND",
  "meta": {
    "deviceId": "device-999",
    "timestamp": "2025-07-22T04:19:33.363Z"
  }
}
```

## 🚀 Beneficios de los Endpoints Optimizados

### Reducción de Ancho de Banda
- **GPS**: ~70-80% menos datos transferidos
- **Mobile**: ~60-70% menos datos transferidos  
- **Ideal para**: Conexiones móviles limitadas, aplicaciones en tiempo real

### Casos de Uso Específicos

#### 📡 GPS Endpoints (`/api/gps/last`)
- **Datos**: `gps:last:{deviceId}` en Redis
- **Formato**: `{ id, lat, lng }`
- **Uso**: Sistemas de tracking, telemetría, monitoreo en tiempo real
- **Ventaja**: Máxima eficiencia para mostrar puntos en mapas

#### 📱 Mobile Endpoints (`/api/mobile/last`)
- **Datos**: `mobile:last:{userId}` en Redis
- **Formato**: `{ id, lat, lng, name }`
- **Uso**: Aplicaciones móviles, mapas interactivos, interfaces de usuario
- **Ventaja**: Incluye nombres legibles para mostrar en UI

#### 📊 Full Endpoints (`/api/gps/last/{id}/full`)
- **Formato**: Datos completos con metadatos
- **Uso**: Dashboards, análisis detallado, debugging, auditoría
- **Ventaja**: Información completa para análisis profundo

## 🎯 Arquitectura de Endpoints

```
📡 GPS (gps:last:{deviceId})
├── GET  /api/v4/gps/last                 → 🎯 TODAS optimizadas (id, lat, lng)
├── GET  /api/v4/gps/last/{deviceId}      → 📊 INDIVIDUAL completa (todos los datos)
├── POST /api/v4/gps/last/multiple        → 📊 MÚLTIPLES completas (todos los datos)
├── GET  /api/v4/gps/last/{id}/gps        → 🎯 Individual optimizada (id, lat, lng)
├── POST /api/v4/gps/last/multiple/gps    → 🎯 Múltiples optimizadas (id, lat, lng)
├── GET  /api/v4/gps/last/{id}/mobile     → 🎯 Individual mobile (id, lat, lng, name)
├── POST /api/v4/gps/last/multiple/mobile → 🎯 Múltiples mobile (id, lat, lng, name)
├── GET  /api/v4/gps/last/{id}/full       → 📊 Individual completa (todos los datos)
└── POST /api/v4/gps/last/multiple/full   → 📊 Múltiples completas (todos los datos)

📱 Mobile (mobile:last:{userId})
├── GET  /api/v4/mobile/last              → 🎯 TODAS optimizadas (id, lat, lng, name)
├── GET  /api/v4/mobile/last/{userId}     → 📊 INDIVIDUAL completa (todos los datos)
└── POST /api/v4/mobile/last/multiple     → 📊 MÚLTIPLES completas (todos los datos)
```

### 🔑 Leyenda:
- **🎯 OPTIMIZADO**: Solo campos esenciales para mapas
- **📊 COMPLETO**: Todos los datos disponibles (timestamps, metadata, etc.)

## Tipos de datos Redis soportados

### 1. Hash (Recomendado)
```redis
HSET gps:last:device-001 deviceId device-001 lat -12.045409 lng -77.031494
```

### 2. String (JSON)
```redis
SET gps:last:device-001 '{"deviceId":"device-001","lat":-12.045409,"lng":-77.031494}'
```

### 3. List (Último elemento)
```redis
LPUSH gps:last:device-001 '{"deviceId":"device-001","lat":-12.045409,"lng":-77.031494}'
```

### 4. Sorted Set (Mayor score)
```redis
ZADD gps:last:device-001 1642351036 '{"deviceId":"device-001","lat":-12.045409,"lng":-77.031494}'
```

## Docker y Despliegue

### Desarrollo local
```bash
docker build -t gps-mobile-api:latest .
docker run -p 3001:3001 --env-file .env gps-mobile-api:latest
```

### Desplegar en Google Cloud
```bash
# Opción 1: Script automático
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh YOUR_PROJECT_ID

# Opción 2: Comandos manuales
gcloud config set project YOUR_PROJECT_ID
docker build -t gcr.io/YOUR_PROJECT_ID/gps-mobile-api:latest .
gcloud auth configure-docker
docker push gcr.io/YOUR_PROJECT_ID/gps-mobile-api:latest
gcloud run deploy gps-mobile-api \
    --image gcr.io/YOUR_PROJECT_ID/gps-mobile-api:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 3001

# Configurar Redis después del despliegue (Redis en VM separada)
gcloud run services update gps-mobile-api \
    --set-env-vars REDIS_HOST=YOUR_VM_REDIS_IP,REDIS_PORT=6379,REDIS_PASSWORD=YOUR_PASSWORD
```

## Estructura del proyecto

```
src/
├── app.js                 # Configuración Express
├── index.js              # Punto de entrada
├── config/
│   ├── env.js            # Variables de entorno
│   └── redis.js          # Configuración Redis
├── controllers/
│   └── GPSLastPositionController.js
├── services/
│   └── GPSLastPositionService.js
├── repositories/
│   └── GPSLastPositionRepository.js  # ✅ Actualizado para manejar hashes
├── routes/
│   └── gpsRoutes.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
└── utils/
    └── logger.js
```

## Comandos útiles

```bash
# Desarrollo
npm run dev              # Servidor con nodemon
npm run dev:watch        # Servidor con --watch nativo

# Producción
npm start               # Servidor producción
npm run start:production # Con NODE_ENV=production

# Utilidades
npm run health          # Health check
npm run validate-config # Validar configuración

# Configuración de datos de prueba
node setup-test-data.js          # Datos GPS básicos (gps:last:*)
node setup-optimized-test-data.js # Datos GPS con nombres (gps:last:*)
node setup-mobile-test-data.js   # Datos móviles específicos (mobile:last:*)

# Pruebas y debug
node test-api.js                 # Probar endpoints originales
node test-optimized-endpoints.js # Probar endpoints optimizados
node debug-redis-keys.js         # Analizar claves Redis

# Docker
npm run docker:build    # Construir imagen
npm run docker:dev      # Desarrollo con compose
npm run docker:stop     # Detener contenedores
npm run docker:logs     # Ver logs
```

## Monitoreo y logging

### Health check
```bash
curl http://localhost:3001/health
```

### Logs estructurados
- Nivel configurable (debug, info, warn, error)
- Formato JSON en producción
- Rotación automática
- Métricas de rendimiento

### Métricas disponibles
- Total de dispositivos
- Uso de memoria Redis
- Estadísticas de conexión
- Tiempos de respuesta

## Seguridad

- **Helmet.js**: Headers de seguridad
- **CORS**: Configuración flexible
- **Rate limiting**: Protección DDoS
- **API Key**: Autenticación opcional
- **Validación**: Sanitización de entrada
- **Timeouts**: Prevención de ataques lentos

## Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.