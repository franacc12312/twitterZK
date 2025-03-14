/**
 * Ethereum module
 * Handles MetaMask wallet connection and Ethereum interactions
 */

import logger from './logger.js';
import config from './config.js';
import utils from './utils.js';

// Module identifier for logging
const MODULE_NAME = 'Ethereum';

// Constants for storage keys
const STORAGE_KEYS = {
  ETH_ADDRESS: 'ethereum_address',
  ETH_NETWORK: 'ethereum_network'
};

// Ethereum connection state
let ethState = {
  isConnected: false,
  address: null,
  network: null
};

/**
 * Initialize the Ethereum module
 * Checks for existing connection and sets up event listeners
 */
function init() {
  logger.info(MODULE_NAME, 'Initializing Ethereum module');
  
  // Check if MetaMask is installed
  if (!isMetaMaskAvailable()) {
    logger.warn(MODULE_NAME, 'MetaMask is not available');
    return ethState;
  }
  
  // Check if we have an existing connection in session storage
  const storedAddress = utils.getSessionData(STORAGE_KEYS.ETH_ADDRESS);
  if (storedAddress) {
    logger.info(MODULE_NAME, 'Found existing Ethereum address in session storage');
    ethState.address = storedAddress;
    ethState.isConnected = true;
    
    // Set up event listeners for account changes
    setupEventListeners();
  }
  
  return ethState;
}

/**
 * Check if MetaMask is available in the browser
 * @returns {boolean} True if MetaMask is available
 */
function isMetaMaskAvailable() {
  return typeof window.ethereum !== 'undefined';
}

/**
 * Set up event listeners for MetaMask
 * Handles account and chain changes
 */
function setupEventListeners() {
  if (!isMetaMaskAvailable()) {
    return;
  }
  
  // Listen for account changes
  window.ethereum.on('accountsChanged', (accounts) => {
    logger.info(MODULE_NAME, 'MetaMask accounts changed');
    
    if (accounts.length === 0) {
      // User has disconnected
      logger.info(MODULE_NAME, 'User disconnected from MetaMask');
      disconnect();
    } else {
      // Update address
      ethState.address = accounts[0];
      utils.storeSessionData(STORAGE_KEYS.ETH_ADDRESS, accounts[0]);
      
      // Dispatch custom event to notify the application
      window.dispatchEvent(new CustomEvent('ethereum_connection_changed', { 
        detail: { isConnected: true, address: accounts[0] }
      }));
    }
  });
  
  // Listen for chain changes
  window.ethereum.on('chainChanged', (chainId) => {
    logger.info(MODULE_NAME, `MetaMask chain changed to ${chainId}`);
    
    // Check if the network is correct
    const ethConfig = config.getEthereumConfig();
    if (chainId !== ethConfig.chainId) {
      logger.warn(MODULE_NAME, `Connected to incorrect network: ${chainId}. Expected: ${ethConfig.chainId}`);
      
      // Dispatch event for incorrect network
      window.dispatchEvent(new CustomEvent('ethereum_network_changed', {
        detail: { isCorrectNetwork: false, chainId: chainId }
      }));
    }
  });
}

/**
 * Connect to MetaMask wallet
 * @returns {Promise<Object>} Connection result with address
 */
async function connect() {
  logger.info(MODULE_NAME, 'Connecting to MetaMask');
  
  if (!isMetaMaskAvailable()) {
    const error = new Error('MetaMask is not installed');
    logger.error(MODULE_NAME, error.message);
    throw error;
  }
  
  try {
    // Request accounts from MetaMask
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    // Check if we received accounts
    if (accounts.length === 0) {
      const error = new Error('No accounts returned from MetaMask');
      logger.error(MODULE_NAME, error.message);
      throw error;
    }
    
    // Check network
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });
    
    // Get Ethereum config
    const ethConfig = config.getEthereumConfig();
    
    // Validate chain ID (Mainnet should be '0x1')
    if (chainId !== ethConfig.chainId) {
      logger.warn(MODULE_NAME, `Connected to incorrect network: ${chainId}. Expected: ${ethConfig.chainId}`);
      
      // We'll connect anyway but warn the user
      ethState.network = chainId;
    } else {
      ethState.network = ethConfig.networkName;
    }
    
    // Store Ethereum state
    ethState.address = accounts[0];
    ethState.isConnected = true;
    
    // Store in session storage
    utils.storeSessionData(STORAGE_KEYS.ETH_ADDRESS, accounts[0]);
    utils.storeSessionData(STORAGE_KEYS.ETH_NETWORK, chainId);
    
    // Set up event listeners
    setupEventListeners();
    
    logger.info(MODULE_NAME, `Connected to MetaMask. Address: ${accounts[0]}`);
    
    return {
      isConnected: true,
      address: accounts[0],
      network: ethState.network
    };
  } catch (error) {
    logger.error(MODULE_NAME, `Error connecting to MetaMask: ${error.message}`);
    throw error;
  }
}

/**
 * Disconnect from MetaMask wallet
 */
function disconnect() {
  logger.info(MODULE_NAME, 'Disconnecting from MetaMask');
  
  // Clear Ethereum state
  ethState.isConnected = false;
  ethState.address = null;
  ethState.network = null;
  
  // Remove from session storage
  utils.removeSessionData(STORAGE_KEYS.ETH_ADDRESS);
  utils.removeSessionData(STORAGE_KEYS.ETH_NETWORK);
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('ethereum_connection_changed', { 
    detail: { isConnected: false }
  }));
}

/**
 * Check if connected to MetaMask
 * @returns {boolean} True if connected to MetaMask
 */
function isConnected() {
  return ethState.isConnected;
}

/**
 * Get connected Ethereum address
 * @returns {string|null} Connected Ethereum address or null if not connected
 */
function getAddress() {
  return ethState.address;
}

export default {
  init,
  connect,
  disconnect,
  isConnected,
  getAddress,
  isMetaMaskAvailable
}; 