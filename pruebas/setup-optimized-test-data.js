#!/usr/bin/env node

/**
 * Script para configurar datos de prueba optimizados
 * Incluye nombres de dispositivos para demostrar los endpoints mobile
 */

import { createRedisClient } from './src/config/redis.js';
import { config } from './src/config/env.js';

const testDevices = [
  {
    deviceId: 'device-001',
    name: 'Vehículo Principal',
    lat: -12.045409,
    lng: -77.031494,
    timestamp: '2025-07-29T10:30:00.000Z',
    metadata: {
      speed: 45.5,
      heading: 180,
      altitude: 150,
      accuracy: 5
    }
  },
  {
    deviceId: 'device-002', 
    name: 'Camión de Reparto',
    lat: -12.046789,
    lng: -77.032123,
    timestamp: '2025-07-29T10:31:00.000Z',
    metadata: {
      speed: 30.2,
      heading: 90,
      altitude: 145,
      accuracy: 3
    }
  },
  {
    deviceId: 'device-003',
    name: 'Motocicleta Express',
    lat: -12.044123,
    lng: -77.030567,
    timestamp: '2025-07-29T10:32:00.000Z',
    metadata: {
      speed: 60.8,
      heading: 270,
      altitude: 155,
      accuracy: 8
    }
  },
  {
    deviceId: 'device-004',
    name: 'Taxi Urbano',
    lat: -12.047456,
    lng: -77.033789,
    timestamp: '2025-07-29T10:33:00.000Z',
    metadata: {
      speed: 25.0,
      heading: 45,
      altitude: 140,
      accuracy: 4
    }
  },
  {
    deviceId: 'device-005',
    name: 'Bus Interprovincial',
    lat: -12.043567,
    lng: -77.029234,
    timestamp: '2025-07-29T10:34:00.000Z',
    metadata: {
      speed: 80.5,
      heading: 315,
      altitude: 160,
      accuracy: 6
    }
  }
];

async function setupOptimizedTestData() {
  let client = null;
  
  try {
    console.log('🚀 Configurando datos de prueba optimizados...');
    
    // Conectar a Redis
    client = createRedisClient();
    await client.connect();
    console.log('✅ Conectado a Redis');
    
    // Limpiar datos existentes
    const pattern = `${config.redis.keyPrefix}*`;
    const existingKeys = await client.keys(pattern);
    
    if (existingKeys.length > 0) {
      console.log(`🧹 Limpiando ${existingKeys.length} claves existentes...`);
      await client.del(...existingKeys);
    }
    
    // Insertar datos de prueba
    console.log(`📝 Insertando ${testDevices.length} dispositivos de prueba...`);
    
    for (const device of testDevices) {
      const key = `${config.redis.keyPrefix}${device.deviceId}`;
      
      // Usar formato Hash (recomendado)
      await client.hset(key, {
        deviceId: device.deviceId,
        name: device.name, // ✨ Incluir nombre para endpoints mobile
        lat: device.lat.toString(),
        lng: device.lng.toString(),
        timestamp: device.timestamp,
        receivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(device.metadata)
      });
      
      console.log(`   ✅ ${device.deviceId} (${device.name})`);
    }
    
    // Verificar datos insertados
    console.log('\n🔍 Verificando datos insertados...');
    const keys = await client.keys(pattern);
    console.log(`   📊 Total de dispositivos: ${keys.length}`);
    
    // Mostrar ejemplo de cada formato
    console.log('\n📋 EJEMPLOS DE RESPUESTA:');
    
    const sampleDevice = testDevices[0];
    const sampleKey = `${config.redis.keyPrefix}${sampleDevice.deviceId}`;
    const sampleData = await client.hgetall(sampleKey);
    
    // Formato completo
    console.log('\n📊 Formato COMPLETO:');
    console.log(JSON.stringify({
      deviceId: sampleData.deviceId,
      lat: parseFloat(sampleData.lat),
      lng: parseFloat(sampleData.lng),
      name: sampleData.name,
      timestamp: sampleData.timestamp,
      receivedAt: sampleData.receivedAt,
      updatedAt: sampleData.updatedAt,
      metadata: JSON.parse(sampleData.metadata)
    }, null, 2));
    
    // Formato GPS
    console.log('\n📡 Formato GPS (optimizado):');
    console.log(JSON.stringify({
      id: sampleData.deviceId,
      lat: parseFloat(sampleData.lat),
      lng: parseFloat(sampleData.lng)
    }, null, 2));
    
    // Formato Mobile
    console.log('\n📱 Formato MOBILE (optimizado):');
    console.log(JSON.stringify({
      id: sampleData.deviceId,
      lat: parseFloat(sampleData.lat),
      lng: parseFloat(sampleData.lng),
      name: sampleData.name
    }, null, 2));
    
    console.log('\n✅ Datos de prueba configurados exitosamente');
    console.log('\n💡 Ahora puedes probar los endpoints optimizados:');
    console.log('   📡 GPS:    GET /api/gps/last/device-001/gps');
    console.log('   📱 Mobile: GET /api/gps/last/device-001/mobile');
    console.log('   🔄 Múltiple: POST /api/gps/last/multiple/gps');
    console.log('\n🧪 Ejecuta las pruebas con:');
    console.log('   npm run test:optimized');
    
  } catch (error) {
    console.error('❌ Error configurando datos de prueba:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
      console.log('🔌 Desconectado de Redis');
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupOptimizedTestData().catch(console.error);
}

export { setupOptimizedTestData };