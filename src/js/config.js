/**
 * Configuration module for application settings
 * Centralizes configuration and environment variables
 */

import logger from './logger.js';

// Module identifier for logging
const MODULE_NAME = 'Config';

// Load configuration from @config.json (this would normally come from a build process)
const CONFIG = {
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    scopes: ['tweet.read', 'users.read'],
    redirectUri: 'http://localhost:1234/callback'
  },
  ethereum: {
    required: true, // Both Twitter and Ethereum auth are required
    networkName: 'Ethereum Mainnet',
    chainId: '0x1' // Hex string for Ethereum Mainnet
  },
  application: {
    name: 'Twitter & Ethereum Login App',
    version: '1.0.0',
    logLevel: 'info'
  }
};

/**
 * Initialize configuration
 * Sets up configuration based on environment and config file
 */
function init() {
  logger.info(MODULE_NAME, 'Initializing configuration');
  
  // Validate critical configuration
  validateConfig();
  
  // Configure logger based on settings
  logger.configure({
    level: CONFIG.application.logLevel
  });
  
  logger.debug(MODULE_NAME, 'Configuration initialized', CONFIG);
  
  return CONFIG;
}

/**
 * Validate critical configuration values
 * Logs warnings for missing or invalid configuration
 */
function validateConfig() {
  // Check for Twitter client ID
  if (!CONFIG.twitter.clientId) {
    logger.warn(MODULE_NAME, 'Twitter Client ID not set. Authentication will not work.');
  }
  
  // Check redirect URI
  if (!CONFIG.twitter.redirectUri) {
    logger.warn(MODULE_NAME, 'Twitter redirect URI not set. Using default: http://localhost:1234/callback');
    CONFIG.twitter.redirectUri = 'http://localhost:1234/callback';
  }
  
  // Check scopes
  if (!CONFIG.twitter.scopes || CONFIG.twitter.scopes.length === 0) {
    logger.warn(MODULE_NAME, 'Twitter scopes not set. Using defaults: tweet.read, users.read');
    CONFIG.twitter.scopes = ['tweet.read', 'users.read'];
  }
}

/**
 * Get the full configuration object
 * @returns {Object} The configuration object
 */
function getConfig() {
  return CONFIG;
}

/**
 * Get Twitter configuration
 * @returns {Object} Twitter-specific configuration
 */
function getTwitterConfig() {
  return CONFIG.twitter;
}

/**
 * Get Ethereum configuration
 * @returns {Object} Ethereum-specific configuration
 */
function getEthereumConfig() {
  return CONFIG.ethereum;
}

/**
 * Get application configuration
 * @returns {Object} Application-specific configuration
 */
function getAppConfig() {
  return CONFIG.application;
}

export default {
  init,
  getConfig,
  getTwitterConfig,
  getEthereumConfig,
  getAppConfig
}; 