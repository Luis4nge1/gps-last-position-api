import { validateConfig } from './config/env.js';
import { logger } from './utils/logger.js';
import { startServer } from './app.js';

/**
 * Punto de entrada principal del microservicio GPS Last Position API
 */
async function main() {
  try {
    logger.info('🚀 Iniciando GPS Last Position API...');

    // Validar configuración
    validateConfig();
    logger.info('✅ Configuración validada exitosamente');

    // Iniciar servidor
    await startServer();

  } catch (error) {
    logger.error('❌ Error fatal al iniciar la aplicación:', error.message);
    logger.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Ejecutar aplicación
main();