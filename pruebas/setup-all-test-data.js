#!/usr/bin/env node

/**
 * Script para configurar todos los datos de prueba
 * Configura tanto datos GPS como Mobile
 */

import { setupOptimizedTestData } from './setup-optimized-test-data.js';
import { setupMobileTestData } from './setup-mobile-test-data.js';

async function setupAllTestData() {
  try {
    console.log('🚀 === CONFIGURANDO TODOS LOS DATOS DE PRUEBA ===\n');
    
    // Configurar datos GPS
    console.log('📡 Configurando datos GPS...');
    await setupOptimizedTestData();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Configurar datos Mobile
    console.log('📱 Configurando datos Mobile...');
    await setupMobileTestData();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ === CONFIGURACIÓN COMPLETA ===');
    console.log('\n🎯 DATOS CONFIGURADOS:');
    console.log('   📡 GPS:    gps:last:device-001, device-002, etc.');
    console.log('   📱 Mobile: mobile:last:user-001, user-002, etc.');
    console.log('\n🧪 PRUEBAS DISPONIBLES:');
    console.log('   📡 GPS:    GET /api/gps/last');
    console.log('   📱 Mobile: GET /api/mobile/last');
    console.log('\n🚀 Ejecutar pruebas:');
    console.log('   npm run test:optimized');
    
  } catch (error) {
    console.error('❌ Error configurando datos de prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAllTestData().catch(console.error);
}

export { setupAllTestData };