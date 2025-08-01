import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB) || 0
});

async function debugDevice001() {
  try {
    console.log('🔍 Debugeando device-001...\n');
    
    const keyPrefix = process.env.REDIS_KEY_PREFIX || 'gps:last:';
    const deviceId = 'device-001';
    const key = `${keyPrefix}${deviceId}`;
    
    console.log(`Prefijo configurado: "${keyPrefix}"`);
    console.log(`Device ID: "${deviceId}"`);
    console.log(`Clave completa: "${key}"\n`);
    
    // 1. Verificar si la clave existe
    const exists = await redis.exists(key);
    console.log(`1️⃣ EXISTS ${key}: ${exists}`);
    
    if (!exists) {
      console.log('\n❌ La clave no existe. Verificando claves similares...');
      
      // Buscar claves similares
      const allKeys = await redis.keys('*device-001*');
      console.log(`Claves que contienen 'device-001': ${JSON.stringify(allKeys)}`);
      
      const prefixKeys = await redis.keys(`${keyPrefix}*`);
      console.log(`Claves con prefijo '${keyPrefix}': ${JSON.stringify(prefixKeys.slice(0, 5))}${prefixKeys.length > 5 ? '...' : ''}`);
      
      return;
    }
    
    // 2. Obtener tipo de dato
    const dataType = await redis.type(key);
    console.log(`2️⃣ TYPE ${key}: ${dataType}`);
    
    // 3. Obtener TTL
    const ttl = await redis.ttl(key);
    console.log(`3️⃣ TTL ${key}: ${ttl === -1 ? 'Sin expiración' : `${ttl}s`}`);
    
    // 4. Obtener contenido según el tipo
    console.log(`\n4️⃣ Contenido de la clave:`);
    
    switch (dataType) {
      case 'hash':
        const hashData = await redis.hgetall(key);
        console.log('Hash completo:', JSON.stringify(hashData, null, 2));
        
        const hashKeys = await redis.hkeys(key);
        console.log(`Campos del hash: ${hashKeys.join(', ')}`);
        
        // Verificar campos específicos
        const deviceIdField = await redis.hget(key, 'deviceId');
        const latField = await redis.hget(key, 'lat');
        const lngField = await redis.hget(key, 'lng');
        
        console.log(`deviceId field: "${deviceIdField}"`);
        console.log(`lat field: "${latField}"`);
        console.log(`lng field: "${lngField}"`);
        break;
        
      case 'string':
        const stringValue = await redis.get(key);
        console.log(`String value: ${stringValue}`);
        break;
        
      case 'list':
        const listLength = await redis.llen(key);
        console.log(`List length: ${listLength}`);
        if (listLength > 0) {
          const listSample = await redis.lrange(key, 0, 2);
          console.log(`List sample: ${JSON.stringify(listSample)}`);
        }
        break;
        
      case 'zset':
        const zsetSize = await redis.zcard(key);
        console.log(`Sorted set size: ${zsetSize}`);
        if (zsetSize > 0) {
          const zsetSample = await redis.zrange(key, 0, 2, 'WITHSCORES');
          console.log(`Sorted set sample: ${JSON.stringify(zsetSample)}`);
        }
        break;
        
      default:
        console.log(`Tipo desconocido: ${dataType}`);
    }
    
    // 5. Probar la API directamente
    console.log(`\n5️⃣ Probando API exists endpoint...`);
    
    try {
      const response = await fetch(`http://localhost:3001/api/gps/exists/${deviceId}`);
      const data = await response.json();
      console.log(`API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (apiError) {
      console.log(`Error llamando API: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await redis.quit();
  }
}

debugDevice001();