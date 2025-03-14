/**
 * ZK Proof module
 * Handles zero-knowledge proof generation using Noir
 */

import { ethers } from 'ethers';
import { initNoirWasm, compile, initNoirJs, Noir, BarretenbergBackend } from './noirBrowser.js';
import logger from './logger.js';
import utils from './utils.js';

// Module identifier for logging
const MODULE_NAME = 'ZKProof';

// Constants for storage keys
const STORAGE_KEYS = {
  ZK_PROOF: 'zk_proof',
  SIGNATURE: 'twitter_eth_signature'
};

// Noir circuit paths
const CIRCUIT_PATHS = {
  MAIN: '/circuits/src/main.nr',
  CONFIG: '/circuits/Nargo.toml'
};

/**
 * Initialize the ZK Proof module
 */
async function init() {
  logger.info(MODULE_NAME, 'Initializing ZK Proof module');
  
  try {
    // Initialize Noir WASM and Noir JS
    await initNoirWasm();
    await initNoirJs();
    
    logger.info(MODULE_NAME, 'Noir libraries initialized successfully');
    return {};
  } catch (error) {
    logger.error(MODULE_NAME, `Error initializing Noir libraries: ${error.message}`);
    return {};
  }
}

/**
 * Generate a message to sign that links Twitter ID with Ethereum address
 * @param {string} twitterId - Twitter ID
 * @returns {string} Message to sign
 */
function generateMessageToSign(twitterId) {
  logger.debug(MODULE_NAME, `Generating message to sign for Twitter ID: ${twitterId}`);
  
  // Create a hash of the Twitter ID
  const twitterIdHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(twitterId));
  
  // Create a message that includes the hash
  const message = `I am linking my Twitter account (ID hash: ${twitterIdHash}) with my Ethereum address. Timestamp: ${Date.now()}`;
  
  logger.debug(MODULE_NAME, `Generated message: ${message}`);
  
  return message;
}

/**
 * Sign a message using MetaMask
 * @param {string} message - Message to sign
 * @returns {Promise<Object>} Signature details
 */
async function signMessage(message) {
  logger.info(MODULE_NAME, 'Requesting signature from MetaMask');
  
  try {
    // Check if MetaMask is available
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    // Get provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Sign the message
    const signature = await signer.signMessage(message);
    
    // Get the message hash (the signed message)
    const messageHash = ethers.utils.hashMessage(message);
    
    // Split signature into components
    const sig = ethers.utils.splitSignature(signature);
    
    // Recover public key from signature
    const publicKey = ethers.utils.recoverPublicKey(messageHash, signature);
    
    // Extract X and Y coordinates from public key
    // Public key format is: 0x04 + x + y
    // Remove the 0x04 prefix and split into x and y coordinates
    const pubKeyBytes = ethers.utils.arrayify(publicKey);
    const pubKeyX = ethers.BigNumber.from(pubKeyBytes.slice(1, 33)).toString();
    const pubKeyY = ethers.BigNumber.from(pubKeyBytes.slice(33, 65)).toString();
    
    // Store signature in session storage
    const signatureData = {
      signature,
      messageHash,
      r: sig.r,
      s: sig.s,
      v: sig.v,
      publicKey,
      pubKeyX,
      pubKeyY
    };
    
    utils.storeSessionData(STORAGE_KEYS.SIGNATURE, JSON.stringify(signatureData));
    
    logger.info(MODULE_NAME, 'Message signed successfully');
    
    return signatureData;
  } catch (error) {
    logger.error(MODULE_NAME, `Error signing message: ${error.message}`);
    throw error;
  }
}

/**
 * Compile the Noir circuit
 * @returns {Promise<Object>} Compiled circuit
 */
async function compileCircuit() {
  logger.info(MODULE_NAME, 'Compiling Noir circuit');
  
  try {
    // Fetch the circuit files
    const mainResponse = await fetch(CIRCUIT_PATHS.MAIN);
    const configResponse = await fetch(CIRCUIT_PATHS.CONFIG);
    
    if (!mainResponse.ok || !configResponse.ok) {
      throw new Error('Failed to fetch circuit files');
    }
    
    const mainText = await mainResponse.text();
    const configText = await configResponse.text();
    
    // Create a file system with the circuit files
    const files = {
      './src/main.nr': mainText,
      './Nargo.toml': configText
    };
    
    // Compile the circuit
    const compiledCircuit = await compile(files);
    
    logger.info(MODULE_NAME, 'Circuit compiled successfully');
    
    return compiledCircuit;
  } catch (error) {
    logger.error(MODULE_NAME, `Error compiling circuit: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a zero-knowledge proof
 * @param {Object} twitterData - Twitter user data
 * @param {Object} signatureData - Signature data
 * @returns {Promise<Object>} Generated proof
 */
async function generateProof(twitterData, signatureData) {
  logger.info(MODULE_NAME, 'Generating zero-knowledge proof');
  
  try {
    // Compile the circuit
    const compiledCircuit = await compileCircuit();
    
    // Create a backend
    const backend = new BarretenbergBackend(compiledCircuit);
    
    // Create a Noir instance
    const noir = new Noir(compiledCircuit, backend);
    
    // Prepare the input for the circuit
    const input = {
      twitter_id_hash: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(twitterData.id)),
      antiquity_days: parseInt(twitterData.antiquity),
      followers: parseInt(twitterData.followers),
      message_hash: signatureData.messageHash,
      pub_key_x: signatureData.pubKeyX,
      pub_key_y: signatureData.pubKeyY,
      signature_r: signatureData.r,
      signature_s: signatureData.s,
      signature_v: signatureData.v
    };
    
    logger.debug(MODULE_NAME, 'Circuit input:', input);
    
    // Generate the proof
    const { witness, returnValue } = await noir.execute(input);
    const proof = await backend.generateProof(witness);
    
    // Store the proof in session storage
    utils.storeSessionData(STORAGE_KEYS.ZK_PROOF, JSON.stringify(proof));
    
    logger.info(MODULE_NAME, 'Proof generated successfully');
    
    return proof;
  } catch (error) {
    logger.error(MODULE_NAME, `Error generating proof: ${error.message}`);
    throw error;
  }
}

/**
 * Get stored proof from session storage
 * @returns {Object|null} Stored proof or null if not found
 */
function getStoredProof() {
  const proofData = utils.getSessionData(STORAGE_KEYS.ZK_PROOF);
  return proofData ? JSON.parse(proofData) : null;
}

/**
 * Get stored signature from session storage
 * @returns {Object|null} Stored signature or null if not found
 */
function getStoredSignature() {
  const signatureData = utils.getSessionData(STORAGE_KEYS.SIGNATURE);
  return signatureData ? JSON.parse(signatureData) : null;
}

export default {
  init,
  generateMessageToSign,
  signMessage,
  generateProof,
  getStoredProof,
  getStoredSignature
}; 