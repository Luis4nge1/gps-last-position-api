import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: parseInt(process.env.REDIS_DB) || 0
});

async function debugRedisKeys() {
  try {
    console.log('🔍 Analizando estructura de claves Redis...\n');
    
    const keyPrefix = process.env.REDIS_KEY_PREFIX || 'gps:last:';
    const pattern = `${keyPrefix}*`;
    
    console.log(`Buscando claves con patrón: ${pattern}`);
    const keys = await redis.keys(pattern);
    
    console.log(`\n📊 Encontradas ${keys.length} claves:\n`);
    
    for (const key of keys.slice(0, 5)) { // Solo primeras 5 para no saturar
      console.log(`🔑 Clave: ${key}`);
      
      // Verificar tipo de dato
      const type = await redis.type(key);
      console.log(`   Tipo: ${type}`);
      
      // Obtener TTL
      const ttl = await redis.ttl(key);
      console.log(`   TTL: ${ttl === -1 ? 'Sin expiración' : `${ttl}s`}`);
      
      // Mostrar contenido según el tipo
      try {
        switch (type) {
          case 'string':
            const stringValue = await redis.get(key);
            console.log(`   Valor: ${stringValue.substring(0, 200)}${stringValue.length > 200 ? '...' : ''}`);
            break;
            
          case 'list':
            const listLength = await redis.llen(key);
            console.log(`   Longitud de lista: ${listLength}`);
            if (listLength > 0) {
              const listSample = await redis.lrange(key, 0, 2);
              console.log(`   Muestra: ${JSON.stringify(listSample)}`);
            }
            break;
            
          case 'hash':
            const hashKeys = await redis.hkeys(key);
            console.log(`   Campos hash: ${hashKeys.slice(0, 5).join(', ')}${hashKeys.length > 5 ? '...' : ''}`);
            if (hashKeys.length > 0) {
              const hashSample = await redis.hgetall(key);
              console.log(`   Muestra: ${JSON.stringify(hashSample).substring(0, 200)}...`);
            }
            break;
            
          case 'set':
            const setSize = await redis.scard(key);
            console.log(`   Tamaño del set: ${setSize}`);
            if (setSize > 0) {
              const setSample = await redis.smembers(key);
              console.log(`   Muestra: ${JSON.stringify(setSample.slice(0, 3))}`);
            }
            break;
            
          case 'zset':
            const zsetSize = await redis.zcard(key);
            console.log(`   Tamaño del sorted set: ${zsetSize}`);
            if (zsetSize > 0) {
              const zsetSample = await redis.zrange(key, 0, 2, 'WITHSCORES');
              console.log(`   Muestra: ${JSON.stringify(zsetSample)}`);
            }
            break;
            
          default:
            console.log(`   Tipo desconocido: ${type}`);
        }
      } catch (error) {
        console.log(`   ❌ Error leyendo contenido: ${error.message}`);
      }
      
      console.log('');
    }
    
    if (keys.length > 5) {
      console.log(`... y ${keys.length - 5} claves más\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await redis.quit();
  }
}

debugRedisKeys();