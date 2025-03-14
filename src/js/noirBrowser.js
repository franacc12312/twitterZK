/**
 * Browser-compatible imports for Noir packages
 * This file provides browser-compatible imports for the Noir packages
 */

import { ethers } from 'ethers';
import logger from './logger.js';

// Module identifier for logging
const MODULE_NAME = 'NoirBrowser';

// Mock implementations for Noir packages
const initNoirWasm = async () => {
  logger.info(MODULE_NAME, 'Mock initNoirWasm called');
  return true;
};

const compile = async (files) => {
  logger.info(MODULE_NAME, 'Mock compile called with files:', Object.keys(files));
  return { program: 'mock_compiled_circuit' };
};

const initNoirJs = async () => {
  logger.info(MODULE_NAME, 'Mock initNoirJs called');
  return true;
};

class Noir {
  constructor(circuit, backend) {
    this.circuit = circuit;
    this.backend = backend;
    logger.info(MODULE_NAME, 'Mock Noir instance created');
  }

  async execute(input) {
    logger.info(MODULE_NAME, 'Mock execute called with input:', input);
    return {
      witness: new Uint8Array(32),
      returnValue: true
    };
  }
}

class BarretenbergBackend {
  constructor(circuit) {
    this.circuit = circuit;
    logger.info(MODULE_NAME, 'Mock BarretenbergBackend instance created');
  }

  async generateProof(witness) {
    logger.info(MODULE_NAME, 'Mock generateProof called');
    return {
      proof: new Uint8Array(64),
      publicInputs: []
    };
  }
}

export {
  initNoirWasm,
  compile,
  initNoirJs,
  Noir,
  BarretenbergBackend
}; 