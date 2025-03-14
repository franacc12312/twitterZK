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
 * Generate a Base64 URL encoded SHA-256 hash
 * @param {string} input - String to hash
 * @returns {Promise<string>} Base64 URL encoded hash
 */
async function generateCodeChallenge(input) {
  logger.debug(MODULE_NAME, 'Generating code challenge from verifier');
  
  try {
    // Convert string to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Generate SHA-256 hash
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    
    // Convert ArrayBuffer to Base64URL
    return base64UrlEncode(hash);
  } catch (error) {
    logger.error(MODULE_NAME, 'Error generating code challenge', { error: error.message });
    throw new Error('Failed to generate code challenge');
  }
}

/**
 * Encode ArrayBuffer as Base64URL string
 * @param {ArrayBuffer} buffer - ArrayBuffer to encode
 * @returns {string} Base64URL encoded string
 */
function base64UrlEncode(buffer) {
  // Convert ArrayBuffer to byte array
  const bytes = new Uint8Array(buffer);
  let base64 = '';
  
  // Convert to unpadded base64 string
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;
  
  let a, b, c, d;
  let chunk;
  
  // Main loop deals with blocks of 3 bytes
  for (let i = 0; i < mainLength; i = i + 3) {
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    a = (chunk & 16515072) >> 18;
    b = (chunk & 258048) >> 12;
    c = (chunk & 4032) >> 6;
    d = chunk & 63;
    base64 += charset[a] + charset[b] + charset[c] + charset[d];
  }
  
  // Deal with the remaining bytes
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2;
    b = (chunk & 3) << 4;
    base64 += charset[a] + charset[b];
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10;
    b = (chunk & 1008) >> 4;
    c = (chunk & 15) << 2;
    base64 += charset[a] + charset[b] + charset[c];
  }
  
  // Convert to base64url by replacing '+' with '-', '/' with '_', and removing padding '='
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate OAuth authorization URL
 * @returns {Promise<string>} Authorization URL
 */
async function generateAuthorizationUrl() {
  logger.info(MODULE_NAME, 'Generating Twitter authorization URL');
  
  const twitterConfig = config.getTwitterConfig();
  
  // Check for required configuration
  if (!twitterConfig.clientId) {
    const error = 'Twitter Client ID not configured';
    logger.error(MODULE_NAME, error);
    throw new Error(error);
  }
  
  try {
    // Generate random state and code verifier
    const state = utils.generateRandomString(32);
    const codeVerifier = utils.generateRandomString(64);
    
    // Generate code challenge from verifier
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store state and code verifier in session storage and module state
    utils.storeSessionData(STORAGE_KEYS.STATE, state);
    utils.storeSessionData(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    
    authState.state = state;
    authState.codeVerifier = codeVerifier;
    authState.codeChallenge = codeChallenge;
    
    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: twitterConfig.clientId,
      redirect_uri: twitterConfig.redirectUri,
      scope: twitterConfig.scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    // Usando x.com en lugar de twitter.com para permitir que el navegador reconozca
    // las sesiones activas en x.com y evitar solicitudes repetidas de login
    const authUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;
    authState.authorizationUrl = authUrl;
    
    logger.debug(MODULE_NAME, 'Authorization URL generated', { url: authUrl });
    
    return authUrl;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error generating authorization URL', { error: error.message });
    throw new Error(`Failed to generate authorization URL: ${error.message}`);
  }
}

/**
 * Handle OAuth callback
 * Exchanges authorization code for access token using proxy server
 * @param {string} code - Authorization code from Twitter
 * @param {string} state - State parameter from Twitter
 * @returns {Promise<Object>} Access token response
 */
async function handleCallback(code, state) {
  logger.info(MODULE_NAME, 'Handling OAuth callback');
  
  const twitterConfig = config.getTwitterConfig();
  const storedState = utils.getSessionData(STORAGE_KEYS.STATE);
  const codeVerifier = utils.getSessionData(STORAGE_KEYS.CODE_VERIFIER);
  
  // Validate state parameter to prevent CSRF attacks
  if (state !== storedState) {
    const error = 'Invalid state parameter';
    logger.error(MODULE_NAME, error, { receivedState: state, expectedState: storedState });
    throw new Error(error);
  }
  
  if (!codeVerifier) {
    const error = 'Code verifier not found';
    logger.error(MODULE_NAME, error);
    throw new Error(error);
  }
  
  try {
    // En lugar de llamar directamente a Twitter, usamos nuestro proxy para evitar CORS
    logger.debug(MODULE_NAME, 'Requesting access token via proxy server', { url: `${PROXY_URL}/api/twitter/token` });
    
    // Preparar datos para enviar al proxy
    const requestData = {
      code: code,
      codeVerifier: codeVerifier,
      redirectUri: twitterConfig.redirectUri
    };
    
    // Hacer solicitud al servidor proxy en lugar de Twitter directamente
    const response = await fetch(`${PROXY_URL}/api/twitter/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(MODULE_NAME, 'Token request failed', { 
        status: response.status, 
        error: errorData 
      });
      throw new Error(`Token request failed: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const tokenData = await response.json();
    logger.info(MODULE_NAME, 'Successfully obtained access token via proxy');
    
    // Store token in session storage and auth state
    authState.accessToken = tokenData.access_token;
    authState.isAuthenticated = true;
    utils.storeSessionData(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
    
    // Clean up state and code verifier
    utils.removeSessionData(STORAGE_KEYS.STATE);
    utils.removeSessionData(STORAGE_KEYS.CODE_VERIFIER);
    
    return tokenData;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error handling OAuth callback', { error: error.message });
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
function isAuthenticated() {
  return authState.isAuthenticated && !!authState.accessToken;
}

/**
 * Get the current access token
 * @returns {string|null} Access token or null if not authenticated
 */
function getAccessToken() {
  return authState.accessToken;
}

/**
 * Logout user by removing authentication data
 */
function logout() {
  logger.info(MODULE_NAME, 'Logging out user');
  
  authState.accessToken = null;
  authState.isAuthenticated = false;
  
  // Clean up storage
  utils.removeSessionData(STORAGE_KEYS.ACCESS_TOKEN);
  utils.removeSessionData(STORAGE_KEYS.STATE);
  utils.removeSessionData(STORAGE_KEYS.CODE_VERIFIER);
}

export default {
  init,
  generateAuthorizationUrl,
  handleCallback,
  isAuthenticated,
  getAccessToken,
  logout
}; 