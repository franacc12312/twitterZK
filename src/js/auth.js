/**
 * Auth module
 * Handles OAuth 2.0 authentication flow with Twitter
 */

import logger from './logger.js';
import config from './config.js';
import utils from './utils.js';

// Module identifier for logging
const MODULE_NAME = 'Auth';

// Constants for storage keys
const STORAGE_KEYS = {
  STATE: 'twitter_oauth_state',
  CODE_VERIFIER: 'twitter_oauth_code_verifier',
  ACCESS_TOKEN: 'twitter_access_token'
};

// Proxy server URL (para resolver el problema de CORS)
const PROXY_URL = 'http://localhost:3000';

// Authentication state
let authState = {
  isAuthenticated: false,
  accessToken: null,
  authorizationUrl: null,
  state: null,
  codeVerifier: null,
  codeChallenge: null
};

/**
 * Initialize the authentication module
 */
function init() {
  logger.info(MODULE_NAME, 'Initializing authentication module');
  
  // Check if we have an existing token in session storage
  const storedToken = utils.getSessionData(STORAGE_KEYS.ACCESS_TOKEN);
  if (storedToken) {
    logger.info(MODULE_NAME, 'Found existing access token in session storage');
    authState.accessToken = storedToken;
    authState.isAuthenticated = true;
  }
  
  return authState;
}

/**
 * Generate PKCE code challenge from verifier
 * @param {string} codeVerifier - PKCE code verifier
 * @returns {Promise<string>} Code challenge
 */
async function generateCodeChallenge(codeVerifier) {
  logger.debug(MODULE_NAME, 'Generating code challenge with PKCE');
  
  try {
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    // Hash the verifier with SHA-256
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert hash to base64-url encoding
    return base64UrlEncode(hash);
  } catch (error) {
    logger.error(MODULE_NAME, `Error generating code challenge: ${error.message}`);
    throw new Error(`Failed to generate code challenge: ${error.message}`);
  }
}

/**
 * Base64-URL encode a byte array
 * @param {ArrayBuffer} buffer - Byte array to encode
 * @returns {string} Base64-URL encoded string
 */
function base64UrlEncode(buffer) {
  // Convert ArrayBuffer to string using base64 encoding
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  
  // Convert to base64-url format
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate OAuth 2.0 authorization URL with PKCE
 * @returns {Promise<string>} Authorization URL
 */
async function generateAuthorizationUrl() {
  logger.info(MODULE_NAME, 'Generating authorization URL');
  
  try {
    // Get Twitter configuration
    const twitterConfig = config.getTwitterConfig();
    
    if (!twitterConfig.clientId) {
      throw new Error('Twitter client ID is not configured');
    }
    
    // Generate state parameter for CSRF protection
    const state = utils.generateRandomString(32);
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = utils.generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store state and code verifier in session storage
    utils.storeSessionData(STORAGE_KEYS.STATE, state);
    utils.storeSessionData(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    
    // Update auth state
    authState.state = state;
    authState.codeVerifier = codeVerifier;
    authState.codeChallenge = codeChallenge;
    
    // Generate authorization URL
    const authUrl = new URL('https://x.com/i/oauth2/authorize');
    
    // Add query parameters
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', twitterConfig.clientId);
    authUrl.searchParams.append('redirect_uri', twitterConfig.redirectUri);
    authUrl.searchParams.append('scope', twitterConfig.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    // Store authorization URL
    authState.authorizationUrl = authUrl.toString();
    
    logger.debug(MODULE_NAME, `Authorization URL generated: ${authState.authorizationUrl}`);
    
    return authState.authorizationUrl;
  } catch (error) {
    logger.error(MODULE_NAME, `Error generating authorization URL: ${error.message}`);
    throw new Error(`Failed to generate authorization URL: ${error.message}`);
  }
}

/**
 * Handle authorization callback
 * @param {string} code - Authorization code from Twitter
 * @param {string} state - State parameter from callback
 * @returns {Promise<Object>} Result of the token exchange
 */
async function handleCallback(code, state) {
  logger.info(MODULE_NAME, 'Handling authorization callback');
  
  try {
    // Verify state parameter
    const storedState = utils.getSessionData(STORAGE_KEYS.STATE);
    
    if (!storedState || state !== storedState) {
      logger.error(MODULE_NAME, 'State mismatch - possible CSRF attack');
      return { success: false, error: 'Invalid state parameter' };
    }
    
    // Get code verifier
    const codeVerifier = utils.getSessionData(STORAGE_KEYS.CODE_VERIFIER);
    
    if (!codeVerifier) {
      logger.error(MODULE_NAME, 'Code verifier not found in session storage');
      return { success: false, error: 'Code verifier not found' };
    }
    
    // Exchange code for token via proxy server
    const response = await fetch(`${PROXY_URL}/api/twitter/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, codeVerifier })
    });
    
    // Check for error response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    // Parse token response
    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }
    
    // Store access token
    authState.accessToken = tokenData.access_token;
    authState.isAuthenticated = true;
    
    // Save to session storage
    utils.storeSessionData(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
    
    // Clean up state and code verifier
    utils.removeSessionData(STORAGE_KEYS.STATE);
    utils.removeSessionData(STORAGE_KEYS.CODE_VERIFIER);
    
    logger.info(MODULE_NAME, 'Authorization code successfully exchanged for token');
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE_NAME, `Error handling callback: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
function isAuthenticated() {
  return authState.isAuthenticated;
}

/**
 * Get access token for API requests
 * @returns {string|null} Access token or null if not authenticated
 */
function getAccessToken() {
  return authState.accessToken;
}

/**
 * Log out user by clearing authentication data
 */
function logout() {
  logger.info(MODULE_NAME, 'Logging out user');
  
  // Clear authentication state
  authState.isAuthenticated = false;
  authState.accessToken = null;
  
  // Remove from session storage
  utils.removeSessionData(STORAGE_KEYS.ACCESS_TOKEN);
  
  logger.debug(MODULE_NAME, 'User logged out successfully');
}

export default {
  init,
  generateAuthorizationUrl,
  handleCallback,
  isAuthenticated,
  getAccessToken,
  logout
}; 