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
import ethereum from './ethereum.js';

// Module identifier for logging
const MODULE_NAME = 'App';

// Authentication state
let authenticationState = {
  twitter: {
    isAuthenticated: false,
    userData: null
  },
  ethereum: {
    isConnected: false,
    address: null
  }
};

/**
 * Initialize the application
 */
async function init() {
  logger.info(MODULE_NAME, 'Initializing application');
  
  try {
    // Initialize configuration
    config.init();
    
    // Initialize authentication modules
    const twitterAuthState = auth.init();
    const ethereumState = ethereum.init();
    
    // Update authentication state
    authenticationState.twitter.isAuthenticated = twitterAuthState.isAuthenticated;
    authenticationState.ethereum.isConnected = ethereumState.isConnected;
    authenticationState.ethereum.address = ethereumState.address;
    
    // Initialize UI with event handlers
    ui.init({
      onLogin: handleLogin,
      onConnectWallet: handleConnectWallet,
      onLogout: handleLogout
    });
    
    // Check if we're on the callback page
    const path = window.location.pathname;
    const isCallbackPath = path.includes('/callback');
    
    // Handle authentication state
    if (isCallbackPath) {
      logger.info(MODULE_NAME, 'On callback page, handling OAuth response');
      await handleOAuthCallback();
    } else {
      // Check if we have existing authentication
      if (authenticationState.twitter.isAuthenticated) {
        logger.info(MODULE_NAME, 'Twitter is already authenticated');
        ui.updateLoginButtonState(true);
        
        // Load Twitter user data if not already loaded
        if (!authenticationState.twitter.userData) {
          await loadUserData();
        }
      }
      
      if (authenticationState.ethereum.isConnected) {
        logger.info(MODULE_NAME, 'Ethereum wallet is already connected');
        ui.updateWalletButtonState(true, authenticationState.ethereum.address);
      }
      
      // Show appropriate UI section based on authentication state
      updateUIState();
    }
    
    logger.info(MODULE_NAME, 'Application initialized successfully');
  } catch (error) {
    logger.error(MODULE_NAME, `Error initializing application: ${error.message}`);
    ui.showError('Failed to initialize application. Please try again later.', false);
  }
}

/**
 * Handle login button click
 * @param {Event} event - Click event
 */
async function handleLogin(event) {
  logger.info(MODULE_NAME, 'Login button clicked');
  
  try {
    ui.setLoading(true);
    
    // Generate Twitter authorization URL
    const authUrl = await auth.generateAuthorizationUrl();
    
    if (!authUrl) {
      throw new Error('Failed to generate authorization URL');
    }
    
    // Redirect to Twitter authorization page
    window.location.href = authUrl;
  } catch (error) {
    logger.error(MODULE_NAME, `Error during login: ${error.message}`);
    ui.setLoading(false);
    ui.setLoginStatus(`Login failed: ${error.message}`, 'error');
  }
}

/**
 * Handle wallet connect button click
 * @param {Event} event - Click event
 */
async function handleConnectWallet(event) {
  logger.info(MODULE_NAME, 'Connect wallet button clicked');
  
  try {
    ui.setLoading(true);
    ui.setWalletStatus('Connecting to wallet...', 'info');
    
    // Check if MetaMask is available
    if (!ethereum.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
    }
    
    // Connect to wallet
    const result = await ethereum.connect();
    
    // Update authentication state
    authenticationState.ethereum.isConnected = result.isConnected;
    authenticationState.ethereum.address = result.address;
    
    // Update UI
    ui.updateWalletButtonState(true, result.address);
    
    logger.info(MODULE_NAME, `Wallet connected successfully: ${result.address}`);
    
    // Update UI state based on both authentication methods
    updateUIState();
  } catch (error) {
    logger.error(MODULE_NAME, `Error connecting wallet: ${error.message}`);
    ui.setWalletStatus(`Connection failed: ${error.message}`, 'error');
    authenticationState.ethereum.isConnected = false;
  } finally {
    ui.setLoading(false);
  }
}

/**
 * Handle OAuth callback from Twitter
 */
async function handleOAuthCallback() {
  logger.info(MODULE_NAME, 'Handling OAuth callback');
  
  try {
    ui.setLoading(true);
    
    // Get query parameters
    const queryParams = utils.getQueryParams();
    const { code, state } = queryParams;
    
    if (!code) {
      throw new Error('No authorization code received from Twitter');
    }
    
    // Exchange code for token
    const tokenResult = await auth.handleCallback(code, state);
    
    if (!tokenResult.success) {
      throw new Error(tokenResult.error || 'Failed to exchange authorization code for token');
    }
    
    // Update authentication state
    authenticationState.twitter.isAuthenticated = true;
    
    // Update UI
    ui.updateLoginButtonState(true);
    ui.setLoginStatus('Twitter authentication successful', 'success');
    
    // Load user data
    await loadUserData();
    
    // Update UI state based on both authentication methods
    updateUIState();
    
    // Replace URL to remove query parameters
    window.history.replaceState({}, document.title, '/');
  } catch (error) {
    logger.error(MODULE_NAME, `Error handling OAuth callback: ${error.message}`);
    ui.setLoginStatus(`Authentication failed: ${error.message}`, 'error');
    authenticationState.twitter.isAuthenticated = false;
  } finally {
    ui.setLoading(false);
  }
}

/**
 * Load Twitter user data
 */
async function loadUserData() {
  logger.info(MODULE_NAME, 'Loading Twitter user data');
  
  try {
    ui.setLoading(true);
    
    // Get user data from API
    const userData = await api.getUserData();
    
    // Log the full user data to see what we're getting back
    logger.info(MODULE_NAME, 'Received user data from API', userData);
    
    if (!userData || !userData.data) {
      throw new Error('Failed to load user data: Missing data in response');
    }
    
    logger.info(MODULE_NAME, 'Processing Twitter data', userData.data);
    
    // Ensure we have required fields
    if (!userData.data.id) {
      logger.warn(MODULE_NAME, 'Twitter ID missing in response');
    }
    
    if (!userData.data.created_at) {
      logger.warn(MODULE_NAME, 'Created date missing in response');
    }
    
    if (!userData.data.public_metrics || userData.data.public_metrics.followers_count === undefined) {
      logger.warn(MODULE_NAME, 'Followers count missing in response');
    }
    
    // Calculate account age
    const accountAge = utils.calculateAccountAge(userData.data.created_at);
    
    // Store user data with safe fallbacks for missing data
    authenticationState.twitter.userData = {
      id: userData.data.id || 'Not available',
      accountAge: accountAge || 0,
      followersCount: userData.data.public_metrics?.followers_count || 0
    };
    
    // Log the processed data we're storing
    logger.info(MODULE_NAME, 'Processed Twitter user data', authenticationState.twitter.userData);
    
    // Store in session
    utils.storeSessionData('twitter_user_data', authenticationState.twitter.userData);
    
    logger.info(MODULE_NAME, 'User data loaded successfully');
    
    // Update UI based on both authentication methods
    updateUIState();
  } catch (error) {
    logger.error(MODULE_NAME, `Error loading user data: ${error.message}`);
    ui.setAuthStatus(`Failed to load user data: ${error.message}`, 'error');
    
    // If the error is due to an invalid token, log out
    if (error.message.includes('token') || error.message.includes('unauthorized')) {
      logger.warn(MODULE_NAME, 'Invalid token detected, logging out');
      handleLogout();
    }
  } finally {
    ui.setLoading(false);
  }
}

/**
 * Handle logout button click
 */
function handleLogout() {
  logger.info(MODULE_NAME, 'Logout button clicked');
  
  try {
    // Log out of Twitter
    auth.logout();
    
    // Disconnect Ethereum wallet
    ethereum.disconnect();
    
    // Reset authentication state
    authenticationState = {
      twitter: {
        isAuthenticated: false,
        userData: null
      },
      ethereum: {
        isConnected: false,
        address: null
      }
    };
    
    // Update UI
    ui.updateLoginButtonState(false);
    ui.updateWalletButtonState(false);
    ui.showLoginSection();
    
    logger.info(MODULE_NAME, 'Logged out successfully');
  } catch (error) {
    logger.error(MODULE_NAME, `Error during logout: ${error.message}`);
    ui.setAuthStatus(`Logout failed: ${error.message}`, 'error');
  }
}

/**
 * Update UI state based on authentication state
 */
function updateUIState() {
  logger.debug(MODULE_NAME, 'Updating UI state', authenticationState);
  
  const twitterAuthenticated = authenticationState.twitter.isAuthenticated;
  const ethereumConnected = authenticationState.ethereum.isConnected;
  
  // Get configuration to check if both are required
  const ethConfig = config.getEthereumConfig();
  const bothRequired = ethConfig.required;
  
  // Log current authentication state for debugging
  logger.info(MODULE_NAME, `Authentication state - Twitter: ${twitterAuthenticated}, Ethereum: ${ethereumConnected}, Both required: ${bothRequired}`);
  
  // Additional check for Twitter data
  if (twitterAuthenticated && !authenticationState.twitter.userData) {
    logger.warn(MODULE_NAME, 'Twitter authenticated but no user data available');
    // Try to load from session storage
    const storedTwitterData = utils.getSessionData('twitter_user_data');
    if (storedTwitterData) {
      logger.info(MODULE_NAME, 'Loaded Twitter data from session storage', storedTwitterData);
      authenticationState.twitter.userData = storedTwitterData;
    }
  }
  
  // Update authentication status message
  if (bothRequired) {
    if (twitterAuthenticated && ethereumConnected) {
      logger.info(MODULE_NAME, 'Both Twitter and Ethereum authenticated, showing user info');
      ui.setAuthStatus('Both Twitter and Ethereum wallet connected!', 'success');
      
      // Show user info with combined data
      const combinedData = {
        ...authenticationState.twitter.userData,
        ethAddress: authenticationState.ethereum.address
      };
      
      logger.debug(MODULE_NAME, 'Combined user data for display', combinedData);
      ui.updateUserInfo(combinedData);
      ui.showUserInfoSection();
    } else if (twitterAuthenticated) {
      ui.setAuthStatus('Twitter connected! Please connect your Ethereum wallet.', 'info');
      ui.showLoginSection();
    } else if (ethereumConnected) {
      ui.setAuthStatus('Ethereum wallet connected! Please login with Twitter.', 'info');
      ui.showLoginSection();
    } else {
      ui.setAuthStatus('Please login with Twitter and connect your Ethereum wallet.', 'info');
      ui.showLoginSection();
    }
  } else {
    // If both are not required, show user info with whatever is available
    if (twitterAuthenticated) {
      const userData = {
        ...authenticationState.twitter.userData
      };
      
      if (ethereumConnected) {
        userData.ethAddress = authenticationState.ethereum.address;
      }
      
      ui.updateUserInfo(userData);
      ui.showUserInfoSection();
    } else {
      ui.showLoginSection();
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

export default {
  init
}; 