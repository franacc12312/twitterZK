/**
 * Utilities module
 * Provides common utility functions used across the application
 */

import logger from './logger.js';

// Module identifier for logging
const MODULE_NAME = 'Utils';

/**
 * Generate a random string of specified length
 * Used for state parameter in OAuth flow
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
function generateRandomString(length = 32) {
  logger.debug(MODULE_NAME, `Generating random string of length ${length}`);
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Create array of random values
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  
  // Convert random values to characters
  randomValues.forEach(val => {
    result += charset[val % charset.length];
  });
  
  return result;
}

/**
 * Calculate account age in years from creation date
 * @param {string} createdAt - ISO date string of account creation
 * @returns {number} Account age in years (with decimal precision)
 */
function calculateAccountAge(createdAt) {
  logger.debug(MODULE_NAME, `Calculating account age from date: ${createdAt}`);
  
  if (!createdAt) {
    logger.warn(MODULE_NAME, 'Invalid creation date provided');
    return 0;
  }
  
  try {
    const creationDate = new Date(createdAt);
    const currentDate = new Date();
    
    const ageInMilliseconds = currentDate - creationDate;
    const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25; // Account for leap years
    
    // Calculate years with one decimal place precision
    const years = (ageInMilliseconds / millisecondsPerYear).toFixed(1);
    
    return parseFloat(years);
  } catch (error) {
    logger.error(MODULE_NAME, `Error calculating account age: ${error.message}`);
    return 0;
  }
}

/**
 * Format a number with thousands separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
  logger.debug(MODULE_NAME, `Formatting number: ${number}`);
  
  if (number === undefined || number === null) {
    return '0';
  }
  
  try {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch (error) {
    logger.error(MODULE_NAME, `Error formatting number: ${error.message}`);
    return '0';
  }
}

/**
 * Truncate Ethereum address for display
 * @param {string} address - Ethereum address to truncate
 * @param {number} frontChars - Number of characters to keep at the front
 * @param {number} endChars - Number of characters to keep at the end
 * @returns {string} Truncated address (e.g., 0x1234...5678)
 */
function truncateAddress(address, frontChars = 6, endChars = 4) {
  logger.debug(MODULE_NAME, `Truncating address: ${address}`);
  
  if (!address) {
    logger.warn(MODULE_NAME, 'No address provided to truncate');
    return '';
  }
  
  try {
    if (address.length <= frontChars + endChars) {
      return address;
    }
    
    return `${address.slice(0, frontChars)}...${address.slice(-endChars)}`;
  } catch (error) {
    logger.error(MODULE_NAME, `Error truncating address: ${error.message}`);
    return address;
  }
}

/**
 * Get URL query parameters
 * @returns {Object} Object with query parameters
 */
function getQueryParams() {
  logger.debug(MODULE_NAME, 'Getting query parameters');
  
  try {
    const queryParams = {};
    const searchParams = new URLSearchParams(window.location.search);
    
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
    
    logger.debug(MODULE_NAME, 'Query parameters', queryParams);
    return queryParams;
  } catch (error) {
    logger.error(MODULE_NAME, `Error getting query parameters: ${error.message}`);
    return {};
  }
}

/**
 * Store data in session storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 */
function storeSessionData(key, value) {
  logger.debug(MODULE_NAME, `Storing data in session storage: ${key}`);
  
  try {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    sessionStorage.setItem(key, serializedValue);
  } catch (error) {
    logger.error(MODULE_NAME, `Error storing session data: ${error.message}`);
  }
}

/**
 * Get data from session storage
 * @param {string} key - Storage key
 * @returns {*} Retrieved value (JSON parsed if possible)
 */
function getSessionData(key) {
  logger.debug(MODULE_NAME, `Getting data from session storage: ${key}`);
  
  try {
    const value = sessionStorage.getItem(key);
    
    if (!value) {
      logger.debug(MODULE_NAME, `No data found for key: ${key}`);
      return null;
    }
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error(MODULE_NAME, `Error retrieving session data: ${error.message}`);
    return null;
  }
}

/**
 * Remove data from session storage
 * @param {string} key - Storage key to remove
 */
function removeSessionData(key) {
  logger.debug(MODULE_NAME, `Removing data from session storage: ${key}`);
  
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    logger.error(MODULE_NAME, `Error removing session data: ${error.message}`);
  }
}

export default {
  generateRandomString,
  calculateAccountAge,
  formatNumber,
  truncateAddress,
  getQueryParams,
  storeSessionData,
  getSessionData,
  removeSessionData
}; 