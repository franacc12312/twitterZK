/**
 * API module
 * Handles interactions with the Twitter API
 */

import logger from './logger.js';
import auth from './auth.js';

// Module identifier for logging
const MODULE_NAME = 'API';

// Twitter API base URLs
const API_URLS = {
  V2: 'https://api.twitter.com/2'
};

// Proxy server URL para evitar problemas de CORS
const PROXY_URL = 'http://localhost:3000';

/**
 * Fetch user data from Twitter API
 * @returns {Promise<Object>} User data object
 */
async function fetchUserData() {
  logger.info(MODULE_NAME, 'Fetching user data from Twitter API');
  
  if (!auth.isAuthenticated()) {
    const error = 'User not authenticated';
    logger.error(MODULE_NAME, error);
    throw new Error(error);
  }
  
  try {
    const accessToken = auth.getAccessToken();
    
    // En lugar de llamar directamente a Twitter, usamos el proxy server
    // para evitar problemas de CORS
    const url = `${PROXY_URL}/api/twitter/user`;
    
    logger.debug(MODULE_NAME, 'Making API request via proxy', { url });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(MODULE_NAME, 'API request failed', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(`API request failed: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const userData = await response.json();
    logger.info(MODULE_NAME, 'Successfully fetched user data');
    logger.debug(MODULE_NAME, 'User data', { userData });
    
    return userData;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error fetching user data', { error: error.message });
    throw new Error(`Failed to fetch user data: ${error.message}`);
  }
}

/**
 * Process user data into a simplified format
 * @param {Object} rawData - Raw API response data
 * @returns {Object} Processed user data
 */
function processUserData(rawData) {
  logger.info(MODULE_NAME, 'Processing user data');
  
  try {
    if (!rawData || !rawData.data) {
      throw new Error('Invalid user data format');
    }
    
    const { id, created_at, public_metrics } = rawData.data;
    
    // Extract required fields
    const processedData = {
      id,
      createdAt: created_at,
      followerCount: public_metrics?.followers_count || 0
    };
    
    logger.debug(MODULE_NAME, 'Processed user data', { processedData });
    
    return processedData;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error processing user data', { error: error.message });
    throw new Error(`Failed to process user data: ${error.message}`);
  }
}

/**
 * Fetch and process user data
 * @returns {Promise<Object>} Processed user data
 */
async function getUserData() {
  logger.info(MODULE_NAME, 'Getting user data');
  
  try {
    const rawData = await fetchUserData();
    const processedData = processUserData(rawData);
    return processedData;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error getting user data', { error: error.message });
    throw error;
  }
}

export default {
  getUserData
}; 