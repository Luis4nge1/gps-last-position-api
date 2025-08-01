import { config } from '../config/env.js';

/**
 * Logger simple y eficiente para el microservicio
 */
class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[config.logging.level] || this.levels.info;
  }

  /**
   * Formatea el mensaje con timestamp y nivel
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    if (args.length > 0) {
      return `[${timestamp}] ${levelUpper} ${message} ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
      ).join(' ')}`;
    }
    
    return `[${timestamp}] ${levelUpper} ${message}`;
  }

  /**
   * Log de error
   */
  error(message, ...args) {
    if (this.currentLevel >= this.levels.error) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  /**
   * Log de warning
   */
  warn(message, ...args) {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  /**
   * Log de información
   */
  info(message, ...args) {
    if (this.currentLevel >= this.levels.info) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  /**
   * Log de debug
   */
  debug(message, ...args) {
    if (this.currentLevel >= this.levels.debug) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }
}

export const logger = new Logger();