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
    
    // Calculate difference in milliseconds
    const diffTime = currentDate - creationDate;
    
    // Convert to years (milliseconds to years)
    const ageInYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    
    // Round to 1 decimal place
    return Math.round(ageInYears * 10) / 10;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error calculating account age', { error: error.message });
    return 0;
  }
}

/**
 * Format number with thousands separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(number) {
  if (typeof number !== 'number') {
    logger.warn(MODULE_NAME, `Invalid number provided for formatting: ${number}`);
    return '0';
  }
  
  try {
    return number.toLocaleString();
  } catch (error) {
    logger.error(MODULE_NAME, 'Error formatting number', { error: error.message });
    return number.toString();
  }
}

/**
 * Get URL query parameters as an object
 * @returns {Object} Object containing URL query parameters
 */
function getQueryParams() {
  logger.debug(MODULE_NAME, 'Extracting URL query parameters');
  
  const params = {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  
  // Convert URLSearchParams to plain object
  for (const [key, value] of urlSearchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Store data in session storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 */
function storeSessionData(key, value) {
  logger.debug(MODULE_NAME, `Storing data in session storage: ${key}`);
  
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error(MODULE_NAME, 'Error storing session data', { key, error: error.message });
  }
}

/**
 * Retrieve data from session storage
 * @param {string} key - Storage key
 * @returns {*} Retrieved value (JSON parsed) or null if not found
 */
function getSessionData(key) {
  logger.debug(MODULE_NAME, `Retrieving data from session storage: ${key}`);
  
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error retrieving session data', { key, error: error.message });
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
    logger.error(MODULE_NAME, 'Error removing session data', { key, error: error.message });
  }
}

export default {
  generateRandomString,
  calculateAccountAge,
  formatNumber,
  getQueryParams,
  storeSessionData,
  getSessionData,
  removeSessionData
}; 