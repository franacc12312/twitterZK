/**
 * Main application module
 * Coordinates all other modules and manages application flow
 */

import logger from './logger.js';
import config from './config.js';
import auth from './auth.js';
import api from './api.js';
import ui from './ui.js';
import utils from './utils.js';

// Module identifier for logging
const MODULE_NAME = 'App';

/**
 * Initialize the application
 */
async function init() {
  logger.info(MODULE_NAME, 'Initializing application');
  
  try {
    // Initialize configuration
    config.init();
    
    // Initialize authentication
    const authState = auth.init();
    
    // Initialize UI with event handlers
    ui.init({
      onLogin: handleLogin,
      onLogout: handleLogout
    });
    
    // Check if we're on the callback page
    const path = window.location.pathname;
    const isCallbackPath = path.includes('/callback');
    
    // Handle authentication state
    if (isCallbackPath) {
      logger.info(MODULE_NAME, 'On callback page, handling OAuth response');
      await handleOAuthCallback();
    } else if (authState.isAuthenticated) {
      logger.info(MODULE_NAME, 'User is already authenticated, fetching user data');
      await loadUserData();
    } else {
      logger.info(MODULE_NAME, 'User is not authenticated, showing login section');
      ui.showLoginSection();
    }
    
    logger.info(MODULE_NAME, 'Application initialized successfully');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error initializing application', { error: error.message });
    ui.showError('Failed to initialize application: ' + error.message, false);
  }
}

/**
 * Handle login button click
 * Generates authorization URL and redirects user
 * @param {Event} event - Click event
 */
async function handleLogin(event) {
  logger.info(MODULE_NAME, 'Login button clicked');
  
  try {
    ui.setLoading(true);
    ui.setLoginStatus('Redirecting to Twitter...', 'info');
    
    // Generate authorization URL
    const authUrl = await auth.generateAuthorizationUrl();
    
    // Redirect to Twitter authorization page
    logger.info(MODULE_NAME, 'Redirecting to Twitter authorization page');
    window.location.href = authUrl;
  } catch (error) {
    logger.error(MODULE_NAME, 'Error during login', { error: error.message });
    ui.setLoading(false);
    ui.showError('Login failed: ' + error.message, false);
  }
}

/**
 * Handle OAuth callback
 * Exchanges code for token and loads user data
 */
async function handleOAuthCallback() {
  logger.info(MODULE_NAME, 'Handling OAuth callback');
  
  try {
    ui.setLoading(true);
    ui.setLoginStatus('Completing authentication...', 'info');
    
    // Get query parameters
    const params = utils.getQueryParams();
    
    // Check for error parameter
    if (params.error) {
      throw new Error(`Authentication error: ${params.error}`);
    }
    
    // Check for code and state parameters
    if (!params.code || !params.state) {
      throw new Error('Missing required parameters (code or state)');
    }
    
    // Exchange code for token
    await auth.handleCallback(params.code, params.state);
    
    // Load user data
    await loadUserData();
    
    // Replace current URL to remove query parameters
    window.history.replaceState({}, document.title, '/');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error handling OAuth callback', { error: error.message });
    ui.setLoading(false);
    ui.showError('Authentication failed: ' + error.message, false);
    ui.showLoginSection();
  }
}

/**
 * Load and display user data
 */
async function loadUserData() {
  logger.info(MODULE_NAME, 'Loading user data');
  
  try {
    ui.setLoading(true);
    
    // Check authentication
    if (!auth.isAuthenticated()) {
      logger.warn(MODULE_NAME, 'Attempted to load user data without authentication');
      ui.showLoginSection();
      return;
    }
    
    // Fetch user data from API
    const userData = await api.getUserData();
    
    // Update UI with user data
    ui.updateUserInfo(userData);
    ui.showUserInfoSection();
    
    logger.info(MODULE_NAME, 'User data loaded successfully');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error loading user data', { error: error.message });
    ui.showError('Failed to load user data: ' + error.message, true);
  } finally {
    ui.setLoading(false);
  }
}

/**
 * Handle logout button click
 * Clears authentication data and returns to login screen
 * @param {Event} event - Click event
 */
function handleLogout(event) {
  logger.info(MODULE_NAME, 'Logout button clicked');
  
  try {
    // Clear authentication data
    auth.logout();
    
    // Show login section
    ui.showLoginSection();
    ui.setLoginStatus('You have been logged out', 'success');
    
    logger.info(MODULE_NAME, 'User logged out successfully');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error during logout', { error: error.message });
    ui.showError('Logout failed: ' + error.message, false);
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export for testing purposes
export default {
  init,
  handleLogin,
  handleOAuthCallback,
  loadUserData,
  handleLogout
}; 