#!/usr/bin/env node

/**
 * Script de prueba para los nuevos endpoints optimizados
 * Demuestra las diferencias entre las respuestas completas, GPS y Mobile
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY || '';

// Configurar headers
const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'X-API-Key': API_KEY })
};

/**
 * Realiza una petición HTTP
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers,
      ...options
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Prueba endpoints de todas las posiciones
 */
async function testAllPositions() {
  console.log('\n🔍 === PRUEBAS DE TODAS LAS POSICIONES ===\n');

  // Endpoint GPS optimizado (todas las posiciones)
  console.log('📡 Todas las posiciones GPS (optimizadas):');
  const allGpsResponse = await makeRequest(`${API_BASE_URL}/api/v4/gps/last?limit=5`);
  console.log(JSON.stringify(allGpsResponse.data, null, 2));

  // Endpoint Mobile optimizado (todas las posiciones)
  console.log('\n📱 Todas las posiciones MOBILE (optimizadas):');
  const allMobileResponse = await makeRequest(`${API_BASE_URL}/api/v4/mobile/last?limit=5`);
  console.log(JSON.stringify(allMobileResponse.data, null, 2));

  // Comparar tamaños de respuesta
  if (allGpsResponse.data && allMobileResponse.data) {
    const gpsSize = JSON.stringify(allGpsResponse.data).length;
    const mobileSize = JSON.stringify(allMobileResponse.data).length;

    console.log('\n📏 COMPARACIÓN DE TAMAÑOS (TODAS LAS POSICIONES):');
    console.log(`   GPS:      ${gpsSize} bytes`);
    console.log(`   Mobile:   ${mobileSize} bytes (+${Math.round((mobileSize / gpsSize - 1) * 100)}% por incluir nombres)`);
  }
}

/**
 * Prueba un endpoint individual
 */
async function testSingleDevice() {
  console.log('\n🔍 === PRUEBAS DE DISPOSITIVO INDIVIDUAL ===\n');

  const deviceId = 'device-001';

  // Endpoint completo
  console.log('📊 Respuesta COMPLETA:');
  const fullResponse = await makeRequest(`${API_BASE_URL}/api/v4/gps/last/${deviceId}/full`);
  console.log(JSON.stringify(fullResponse.data, null, 2));

  // Endpoint optimizado para GPS
  console.log('\n📡 Respuesta GPS (optimizada):');
  const gpsResponse = await makeRequest(`${API_BASE_URL}/api/v4/gps/last/${deviceId}/gps`);
  console.log(JSON.stringify(gpsResponse.data, null, 2));

  // Endpoint optimizado para Mobile (usar user ID)
  console.log('\n📱 Respuesta MOBILE (optimizada):');
  const userId = 'user-001'; // Usar ID de usuario móvil
  const mobileResponse = await makeRequest(`${API_BASE_URL}/api/v4/mobile/last/${userId}`);
  console.log(JSON.stringify(mobileResponse.data, null, 2));

  // Comparar tamaños de respuesta
  if (fullResponse.data && gpsResponse.data && mobileResponse.data) {
    const fullSize = JSON.stringify(fullResponse.data).length;
    const gpsSize = JSON.stringify(gpsResponse.data).length;
    const mobileSize = JSON.stringify(mobileResponse.data).length;

    console.log('\n📏 COMPARACIÓN DE TAMAÑOS:');
    console.log(`   Completa: ${fullSize} bytes`);
    console.log(`   GPS:      ${gpsSize} bytes (${Math.round((1 - gpsSize / fullSize) * 100)}% reducción)`);
    console.log(`   Mobile:   ${mobileSize} bytes (${Math.round((1 - mobileSize / fullSize) * 100)}% reducción)`);
  }
}

/**
 * Prueba múltiples dispositivos
 */
async function testMultipleDevices() {
  console.log('\n🔍 === PRUEBAS DE MÚLTIPLES DISPOSITIVOS ===\n');

  const deviceIds = ['device-001', 'device-002', 'device-003'];
  const userIds = ['user-001', 'user-002', 'user-003'];
  const requestBody = { deviceIds };
  const mobileRequestBody = { userIds };

  // Endpoint completo
  console.log('📊 Respuesta COMPLETA:');
  const fullResponse = await makeRequest(`${API_BASE_URL}/api/v4/gps/last/multiple/full`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
  console.log(JSON.stringify(fullResponse.data, null, 2));

  // Endpoint optimizado para GPS
  console.log('\n📡 Respuesta GPS (optimizada):');
  const gpsResponse = await makeRequest(`${API_BASE_URL}/api/v4/gps/last/multiple/gps`, {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
  console.log(JSON.stringify(gpsResponse.data, null, 2));

  // Endpoint optimizado para Mobile
  console.log('\n📱 Respuesta MOBILE (optimizada):');
  const mobileResponse = await makeRequest(`${API_BASE_URL}/api/v4/mobile/last/multiple`, {
    method: 'POST',
    body: JSON.stringify(mobileRequestBody)
  });
  console.log(JSON.stringify(mobileResponse.data, null, 2));

  // Comparar tamaños de respuesta
  if (fullResponse.data && gpsResponse.data && mobileResponse.data) {
    const fullSize = JSON.stringify(fullResponse.data).length;
    const gpsSize = JSON.stringify(gpsResponse.data).length;
    const mobileSize = JSON.stringify(mobileResponse.data).length;

    console.log('\n📏 COMPARACIÓN DE TAMAÑOS:');
    console.log(`   Completa: ${fullSize} bytes`);
    console.log(`   GPS:      ${gpsSize} bytes (${Math.round((1 - gpsSize / fullSize) * 100)}% reducción)`);
    console.log(`   Mobile:   ${mobileSize} bytes (${Math.round((1 - mobileSize / fullSize) * 100)}% reducción)`);
  }
}

/**
 * Muestra ejemplos de uso
 */
function showUsageExamples() {
  console.log('\n📖 === EJEMPLOS DE USO ===\n');

  console.log('🔗 ENDPOINTS DISPONIBLES:');
  console.log('');
  console.log('�  GPS OPTIMIZADO (id, lat, lng):');
  console.log(`   GET  ${API_BASE_URL}/api/v4/gps/last                    # Todas las posiciones GPS`);
  console.log(`   GET  ${API_BASE_URL}/api/v4/gps/last/{deviceId}/gps     # Individual GPS`);
  console.log(`   POST ${API_BASE_URL}/api/v4/gps/last/multiple/gps       # Múltiples GPS`);
  console.log('');
  console.log('📱 MOBILE OPTIMIZADO (id, lat, lng, name):');
  console.log(`   GET  ${API_BASE_URL}/api/v4/mobile/last                 # Todas las posiciones Mobile`);
  console.log(`   GET  ${API_BASE_URL}/api/v4/mobile/last/{userId}        # Individual Mobile`);
  console.log(`   POST ${API_BASE_URL}/api/v4/mobile/last/multiple        # Múltiples Mobile`);
  console.log('');
  console.log('📊 COMPLETOS (datos originales):');
  console.log(`   GET  ${API_BASE_URL}/api/v4/gps/last/{deviceId}/full    # Individual completo`);
  console.log(`   POST ${API_BASE_URL}/api/v4/gps/last/multiple/full      # Múltiples completos`);
  console.log('');

  console.log('💡 CASOS DE USO:');
  console.log('   📡 GPS: Para sistemas de tracking que solo necesitan coordenadas');
  console.log('   📱 Mobile: Para apps móviles que muestran mapas con nombres');
  console.log('   📊 Completo: Para dashboards que necesitan todos los metadatos');
  console.log('');

  console.log('🚀 BENEFICIOS:');
  console.log('   ⚡ Menor uso de ancho de banda');
  console.log('   🔋 Menor consumo de batería en móviles');
  console.log('   📈 Mayor velocidad de respuesta');
  console.log('   💾 Menor uso de memoria');
}

/**
 * Función principal
 */
async function main() {
  console.log('🧪 PRUEBAS DE ENDPOINTS OPTIMIZADOS');
  console.log('=====================================');

  showUsageExamples();

  // Verificar conectividad
  console.log('\n🔍 Verificando conectividad...');
  const healthCheck = await makeRequest(`${API_BASE_URL}/health`);

  if (healthCheck.error || !healthCheck.data?.healthy) {
    console.error('❌ Error: No se puede conectar al API');
    console.error('   Asegúrate de que el servidor esté ejecutándose en:', API_BASE_URL);
    process.exit(1);
  }

  console.log('✅ Conectividad OK');

  // Ejecutar pruebas
  await testAllPositions();
  await testSingleDevice();
  await testMultipleDevices();

  console.log('\n✅ === PRUEBAS COMPLETADAS ===');
  console.log('\n💡 Los endpoints optimizados reducen significativamente el tamaño de las respuestas');
  console.log('   manteniendo solo los datos necesarios para cada caso de uso específico.');
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as testOptimizedEndpoints };