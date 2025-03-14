/**
 * Logger module for application-wide logging
 * Provides consistent logging with severity levels and component identification
 */

// Log levels enum
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Default configuration
const DEFAULT_CONFIG = {
  level: LOG_LEVELS.INFO,
  enableConsoleOutput: true,
  timestampFormat: 'toISOString' // or 'toLocaleString'
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

/**
 * Configure the logger
 * @param {Object} options - Configuration options
 * @param {string} options.level - Minimum log level to output
 * @param {boolean} options.enableConsoleOutput - Whether to output to console
 * @param {string} options.timestampFormat - Format for timestamps
 */
function configure(options = {}) {
  config = { ...config, ...options };
  
  // Convert string level to enum if needed
  if (typeof config.level === 'string') {
    const levelName = config.level.toUpperCase();
    config.level = LOG_LEVELS[levelName] !== undefined 
      ? LOG_LEVELS[levelName] 
      : DEFAULT_CONFIG.level;
  }
  
  debug('Logger', 'Logger configured', config);
}

/**
 * Format log message with timestamp and component
 * @param {string} level - Log level
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, component, message, data) {
  const timestamp = new Date()[config.timestampFormat]();
  const formattedData = data ? `: ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] [${component}] ${message}${formattedData}`;
}

/**
 * Log an error message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
function error(component, message, data) {
  if (config.level >= LOG_LEVELS.ERROR && config.enableConsoleOutput) {
    console.error(formatLogMessage('ERROR', component, message, data));
  }
}

/**
 * Log a warning message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
function warn(component, message, data) {
  if (config.level >= LOG_LEVELS.WARN && config.enableConsoleOutput) {
    console.warn(formatLogMessage('WARN', component, message, data));
  }
}

/**
 * Log an info message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
function info(component, message, data) {
  if (config.level >= LOG_LEVELS.INFO && config.enableConsoleOutput) {
    console.info(formatLogMessage('INFO', component, message, data));
  }
}

/**
 * Log a debug message
 * @param {string} component - Component name
 * @param {string} message - Log message
 * @param {Object} [data] - Optional data to log
 */
function debug(component, message, data) {
  if (config.level >= LOG_LEVELS.DEBUG && config.enableConsoleOutput) {
    console.debug(formatLogMessage('DEBUG', component, message, data));
  }
}

export default {
  LOG_LEVELS,
  configure,
  error,
  warn,
  info,
  debug
}; 