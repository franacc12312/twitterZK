/**
 * UI module
 * Manages user interface elements and interactions
 */

import logger from './logger.js';
import utils from './utils.js';

// Module identifier for logging
const MODULE_NAME = 'UI';

// UI Element IDs
const UI_ELEMENTS = {
  loginButton: 'login-button',
  logoutButton: 'logout-button',
  loginSection: 'login-section',
  loginStatus: 'login-status',
  userInfoSection: 'user-info-section',
  twitterId: 'twitter-id',
  accountAge: 'account-age',
  followersCount: 'followers-count'
};

// UI element references
let elements = {};

/**
 * Initialize UI elements and event listeners
 * @param {Object} eventHandlers - Event handler functions
 * @param {Function} eventHandlers.onLogin - Login button click handler
 * @param {Function} eventHandlers.onLogout - Logout button click handler
 */
function init(eventHandlers = {}) {
  logger.info(MODULE_NAME, 'Initializing UI');
  
  try {
    // Get references to UI elements
    elements = {};
    for (const [key, id] of Object.entries(UI_ELEMENTS)) {
      elements[key] = document.getElementById(id);
      if (!elements[key]) {
        logger.warn(MODULE_NAME, `Element not found: ${id}`);
      }
    }
    
    // Set up event listeners
    if (elements.loginButton && eventHandlers.onLogin) {
      elements.loginButton.addEventListener('click', eventHandlers.onLogin);
      logger.debug(MODULE_NAME, 'Login button event listener attached');
    }
    
    if (elements.logoutButton && eventHandlers.onLogout) {
      elements.logoutButton.addEventListener('click', eventHandlers.onLogout);
      logger.debug(MODULE_NAME, 'Logout button event listener attached');
    }
    
    logger.info(MODULE_NAME, 'UI initialized successfully');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error initializing UI', { error: error.message });
    throw new Error(`Failed to initialize UI: ${error.message}`);
  }
}

/**
 * Show login section and hide user info section
 */
function showLoginSection() {
  logger.debug(MODULE_NAME, 'Showing login section');
  
  if (elements.loginSection) {
    elements.loginSection.classList.remove('hidden');
  }
  
  if (elements.userInfoSection) {
    elements.userInfoSection.classList.add('hidden');
  }
}

/**
 * Show user info section and hide login section
 */
function showUserInfoSection() {
  logger.debug(MODULE_NAME, 'Showing user info section');
  
  if (elements.loginSection) {
    elements.loginSection.classList.add('hidden');
  }
  
  if (elements.userInfoSection) {
    elements.userInfoSection.classList.remove('hidden');
  }
}

/**
 * Set login status message
 * @param {string} message - Status message to display
 * @param {string} [type='info'] - Message type (info, error, success)
 */
function setLoginStatus(message, type = 'info') {
  logger.debug(MODULE_NAME, `Setting login status: ${message} (${type})`);
  
  if (elements.loginStatus) {
    elements.loginStatus.textContent = message;
    
    // Reset classes
    elements.loginStatus.classList.remove('status-info', 'status-error', 'status-success');
    
    // Add appropriate class for styling
    elements.loginStatus.classList.add(`status-${type}`);
  }
}

/**
 * Update user information in the UI
 * @param {Object} userData - User data to display
 * @param {string} userData.id - Twitter ID
 * @param {string} userData.createdAt - Account creation date
 * @param {number} userData.followerCount - Follower count
 */
function updateUserInfo(userData) {
  logger.info(MODULE_NAME, 'Updating user info in UI');
  
  try {
    if (!userData) {
      throw new Error('No user data provided');
    }
    
    // Calculate account age from creation date
    const accountAge = utils.calculateAccountAge(userData.createdAt);
    
    // Format follower count with thousands separators
    const formattedFollowers = utils.formatNumber(userData.followerCount);
    
    // Update UI elements with data
    if (elements.twitterId) {
      elements.twitterId.textContent = userData.id || '-';
    }
    
    if (elements.accountAge) {
      elements.accountAge.textContent = `${accountAge} years`;
    }
    
    if (elements.followersCount) {
      elements.followersCount.textContent = formattedFollowers;
    }
    
    logger.debug(MODULE_NAME, 'User info updated successfully');
  } catch (error) {
    logger.error(MODULE_NAME, 'Error updating user info', { error: error.message });
    throw new Error(`Failed to update user info: ${error.message}`);
  }
}

/**
 * Show loading state in UI
 * @param {boolean} isLoading - Whether the app is in a loading state
 */
function setLoading(isLoading) {
  logger.debug(MODULE_NAME, `Setting loading state: ${isLoading}`);
  
  // Add/remove loading class to main sections
  if (elements.loginSection) {
    if (isLoading) {
      elements.loginSection.classList.add('loading');
    } else {
      elements.loginSection.classList.remove('loading');
    }
  }
  
  if (elements.userInfoSection) {
    if (isLoading) {
      elements.userInfoSection.classList.add('loading');
    } else {
      elements.userInfoSection.classList.remove('loading');
    }
  }
  
  // Disable/enable buttons during loading
  if (elements.loginButton) {
    elements.loginButton.disabled = isLoading;
  }
  
  if (elements.logoutButton) {
    elements.logoutButton.disabled = isLoading;
  }
}

/**
 * Show error message in the appropriate UI section
 * @param {string} message - Error message to display
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
function showError(message, isAuthenticated) {
  logger.error(MODULE_NAME, `Showing error: ${message}`);
  
  if (isAuthenticated) {
    // Show error in user info section
    if (elements.userInfoSection) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = message;
      
      // Remove any existing error messages
      const existingError = elements.userInfoSection.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      elements.userInfoSection.appendChild(errorElement);
    }
  } else {
    // Show error in login status
    setLoginStatus(message, 'error');
  }
}

export default {
  init,
  showLoginSection,
  showUserInfoSection,
  setLoginStatus,
  updateUserInfo,
  setLoading,
  showError
}; 