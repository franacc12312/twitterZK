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
  walletButton: 'wallet-button',
  logoutButton: 'logout-button',
  loginSection: 'login-section',
  loginStatus: 'login-status',
  walletStatus: 'wallet-status',
  authStatus: 'auth-status',
  userInfoSection: 'user-info-section',
  twitterId: 'twitter-id',
  accountAge: 'account-age',
  followersCount: 'followers-count',
  ethAddress: 'eth-address'
};

// UI element references
let elements = {};

/**
 * Initialize UI elements and event listeners
 * @param {Object} eventHandlers - Event handler functions
 * @param {Function} eventHandlers.onLogin - Login button click handler
 * @param {Function} eventHandlers.onConnectWallet - Wallet button click handler
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
    
    if (elements.walletButton && eventHandlers.onConnectWallet) {
      elements.walletButton.addEventListener('click', eventHandlers.onConnectWallet);
      logger.debug(MODULE_NAME, 'Wallet button event listener attached');
    }
    
    if (elements.logoutButton && eventHandlers.onLogout) {
      elements.logoutButton.addEventListener('click', eventHandlers.onLogout);
      logger.debug(MODULE_NAME, 'Logout button event listener attached');
    }
    
    logger.info(MODULE_NAME, 'UI initialized successfully');
  } catch (error) {
    logger.error(MODULE_NAME, `Error initializing UI: ${error.message}`);
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
 * @param {string} message - Status message
 * @param {string} type - Message type ('info', 'error', 'success')
 */
function setLoginStatus(message, type = 'info') {
  logger.debug(MODULE_NAME, `Setting login status: ${message} (${type})`);
  
  if (elements.loginStatus) {
    elements.loginStatus.textContent = message;
    
    // Clear existing classes
    elements.loginStatus.classList.remove('status-info', 'status-error', 'status-success');
    
    // Add appropriate class
    elements.loginStatus.classList.add(`status-${type}`);
  }
}

/**
 * Set wallet status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('info', 'error', 'success')
 */
function setWalletStatus(message, type = 'info') {
  logger.debug(MODULE_NAME, `Setting wallet status: ${message} (${type})`);
  
  if (elements.walletStatus) {
    elements.walletStatus.textContent = message;
    
    // Clear existing classes
    elements.walletStatus.classList.remove('status-info', 'status-error', 'status-success');
    
    // Add appropriate class
    elements.walletStatus.classList.add(`status-${type}`);
  }
}

/**
 * Set overall authentication status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('info', 'error', 'success')
 */
function setAuthStatus(message, type = 'info') {
  logger.debug(MODULE_NAME, `Setting auth status: ${message} (${type})`);
  
  if (elements.authStatus) {
    elements.authStatus.textContent = message;
    
    // Clear existing classes
    elements.authStatus.classList.remove('status-info', 'status-error', 'status-success');
    
    // Add appropriate class
    elements.authStatus.classList.add(`status-${type}`);
  }
}

/**
 * Update user info display with Twitter and Ethereum data
 * @param {Object} userData - User data
 * @param {string} userData.id - Twitter ID
 * @param {number} userData.accountAge - Account age in years
 * @param {number} userData.followersCount - Followers count
 * @param {string} [userData.ethAddress] - Ethereum address
 */
function updateUserInfo(userData) {
  logger.debug(MODULE_NAME, 'Updating user info display', userData);
  
  try {
    if (!userData) {
      logger.warn(MODULE_NAME, 'No user data provided to updateUserInfo');
      return;
    }
    
    // Update Twitter data
    if (elements.twitterId) {
      elements.twitterId.textContent = userData.id || '-';
      logger.debug(MODULE_NAME, `Set Twitter ID to: ${userData.id}`);
    } else {
      logger.warn(MODULE_NAME, 'Twitter ID element not found');
    }
    
    if (elements.accountAge) {
      const formattedAge = userData.accountAge ? `${userData.accountAge} years` : '-';
      elements.accountAge.textContent = formattedAge;
      logger.debug(MODULE_NAME, `Set account age to: ${formattedAge}`);
    } else {
      logger.warn(MODULE_NAME, 'Account age element not found');
    }
    
    if (elements.followersCount) {
      const formattedFollowers = userData.followersCount !== undefined ? 
        utils.formatNumber(userData.followersCount) : '-';
      elements.followersCount.textContent = formattedFollowers;
      logger.debug(MODULE_NAME, `Set followers count to: ${formattedFollowers}`);
    } else {
      logger.warn(MODULE_NAME, 'Followers count element not found');
    }
    
    // Update Ethereum address if available
    if (elements.ethAddress) {
      elements.ethAddress.textContent = userData.ethAddress || '-';
      logger.debug(MODULE_NAME, `Set Ethereum address to: ${userData.ethAddress || '-'}`);
    } else {
      logger.warn(MODULE_NAME, 'Ethereum address element not found');
    }
    
    logger.info(MODULE_NAME, 'User info updated successfully');
  } catch (error) {
    logger.error(MODULE_NAME, `Error updating user info: ${error.message}`);
  }
}

/**
 * Set UI elements loading state
 * @param {boolean} isLoading - Whether UI is in loading state
 */
function setLoading(isLoading) {
  logger.debug(MODULE_NAME, `Setting loading state: ${isLoading}`);
  
  try {
    // Set loading class on sections
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
    
    if (elements.walletButton) {
      elements.walletButton.disabled = isLoading;
    }
    
    if (elements.logoutButton) {
      elements.logoutButton.disabled = isLoading;
    }
    
    logger.debug(MODULE_NAME, 'Loading state updated');
  } catch (error) {
    logger.error(MODULE_NAME, `Error setting loading state: ${error.message}`);
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 * @param {boolean} isAuthenticated - Whether user is authenticated
 */
function showError(message, isAuthenticated) {
  logger.debug(MODULE_NAME, `Showing error: ${message} (authenticated: ${isAuthenticated})`);
  
  // Show appropriate section based on authentication status
  if (isAuthenticated) {
    showUserInfoSection();
  } else {
    showLoginSection();
    setAuthStatus(message, 'error');
  }
}

/**
 * Update wallet connection button state
 * @param {boolean} isConnected - Whether wallet is connected
 * @param {string} address - Ethereum address (if connected)
 */
function updateWalletButtonState(isConnected, address = null) {
  logger.debug(MODULE_NAME, `Updating wallet button state: ${isConnected ? 'connected' : 'disconnected'}`);
  
  if (elements.walletButton) {
    if (isConnected) {
      elements.walletButton.textContent = 'Wallet Connected';
      elements.walletButton.classList.add('connected');
      elements.walletButton.disabled = true;
      
      if (address) {
        setWalletStatus(`Connected: ${utils.truncateAddress(address)}`, 'success');
      } else {
        setWalletStatus('Wallet connected', 'success');
      }
    } else {
      elements.walletButton.textContent = 'Connect Wallet';
      elements.walletButton.classList.remove('connected');
      elements.walletButton.disabled = false;
      setWalletStatus('');
    }
  }
}

/**
 * Update login button state
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
function updateLoginButtonState(isLoggedIn) {
  logger.debug(MODULE_NAME, `Updating login button state: ${isLoggedIn ? 'logged in' : 'logged out'}`);
  
  if (elements.loginButton) {
    if (isLoggedIn) {
      elements.loginButton.textContent = 'Twitter Connected';
      elements.loginButton.classList.add('connected');
      elements.loginButton.disabled = true;
      setLoginStatus('Twitter account connected', 'success');
    } else {
      elements.loginButton.textContent = 'Login with Twitter';
      elements.loginButton.classList.remove('connected');
      elements.loginButton.disabled = false;
      setLoginStatus('');
    }
  }
}

export default {
  init,
  showLoginSection,
  showUserInfoSection,
  setLoginStatus,
  setWalletStatus,
  setAuthStatus,
  updateUserInfo,
  setLoading,
  showError,
  updateWalletButtonState,
  updateLoginButtonState
}; 