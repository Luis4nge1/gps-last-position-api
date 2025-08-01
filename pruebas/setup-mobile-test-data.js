#!/usr/bin/env node

/**
 * Script para configurar datos de prueba específicos para mobile
 * Crea datos en Redis con prefijo mobile:last:{userId}
 */

import { createRedisClient } from './src/config/redis.js';

const testMobileUsers = [
  {
    userId: 'user-001',
    name: 'Juan Pérez',
    lat: -12.045409,
    lng: -77.031494,
    timestamp: '2025-07-29T10:30:00.000Z',
    metadata: {
      speed: 25.5,
      heading: 180,
      altitude: 150,
      accuracy: 5,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'user-002', 
    name: 'María García',
    lat: -12.046789,
    lng: -77.032123,
    timestamp: '2025-07-29T10:31:00.000Z',
    metadata: {
      speed: 15.2,
      heading: 90,
      altitude: 145,
      accuracy: 3,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'user-003',
    name: 'Carlos López',
    lat: -12.044123,
    lng: -77.030567,
    timestamp: '2025-07-29T10:32:00.000Z',
    metadata: {
      speed: 30.8,
      heading: 270,
      altitude: 155,
      accuracy: 8,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'user-004',
    name: 'Ana Rodríguez',
    lat: -12.047456,
    lng: -77.033789,
    timestamp: '2025-07-29T10:33:00.000Z',
    metadata: {
      speed: 10.0,
      heading: 45,
      altitude: 140,
      accuracy: 4,
      deviceType: 'mobile'
    }
  },
  {
    userId: 'user-005',
    name: 'Luis Martínez',
    lat: -12.043567,
    lng: -77.029234,
    timestamp: '2025-07-29T10:34:00.000Z',
    metadata: {
      speed: 20.5,
      heading: 315,
      altitude: 160,
      accuracy: 6,
      deviceType: 'mobile'
    }
  }
];

async function setupMobileTestData() {
  let client = null;
  
  try {
    console.log('📱 Configurando datos de prueba móviles...');
    
    // Conectar a Redis
    client = createRedisClient();
    await client.connect();
    console.log('✅ Conectado a Redis');
    
    // Limpiar datos móviles existentes
    const mobilePattern = 'mobile:last:*';
    const existingMobileKeys = await client.keys(mobilePattern);
    
    if (existingMobileKeys.length > 0) {
      console.log(`🧹 Limpiando ${existingMobileKeys.length} claves móviles existentes...`);
      await client.del(...existingMobileKeys);
    }
    
    // Insertar datos de prueba móviles
    console.log(`📝 Insertando ${testMobileUsers.length} usuarios móviles de prueba...`);
    
    for (const user of testMobileUsers) {
      const key = `mobile:last:${user.userId}`;
      
      // Usar formato Hash (recomendado)
      await client.hset(key, {
        userId: user.userId,
        name: user.name,
        lat: user.lat.toString(),
        lng: user.lng.toString(),
        timestamp: user.timestamp,
        receivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: JSON.stringify(user.metadata)
      });
      
      console.log(`   ✅ ${user.userId} (${user.name})`);
    }
    
    // Verificar datos insertados
    console.log('\n🔍 Verificando datos móviles insertados...');
    const mobileKeys = await client.keys(mobilePattern);
    console.log(`   📱 Total de usuarios móviles: ${mobileKeys.length}`);
    
    // Mostrar ejemplo de respuesta mobile
    console.log('\n📋 EJEMPLO DE RESPUESTA MOBILE:');
    
    const sampleUser = testMobileUsers[0];
    const sampleKey = `mobile:last:${sampleUser.userId}`;
    const sampleData = await client.hgetall(sampleKey);
    
    // Formato Mobile optimizado
    console.log('\n📱 Formato MOBILE (optimizado):');
    console.log(JSON.stringify({
      id: sampleData.userId,
      lat: parseFloat(sampleData.lat),
      lng: parseFloat(sampleData.lng),
      name: sampleData.name
    }, null, 2));
    
    console.log('\n✅ Datos de prueba móviles configurados exitosamente');
    console.log('\n💡 Ahora puedes probar los endpoints móviles:');
    console.log('   📱 Todas:     GET /api/mobile/last');
    console.log('   📱 Individual: GET /api/mobile/last/user-001');
    console.log('   📱 Múltiples:  POST /api/mobile/last/multiple');
    console.log('\n🧪 Ejecuta las pruebas con:');
    console.log('   npm run test:optimized');
    
  } catch (error) {
    console.error('❌ Error configurando datos de prueba móviles:', error.message);
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
  setupMobileTestData().catch(console.error);
}

export { setupMobileTestData };