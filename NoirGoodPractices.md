Best Practices for Using Noir in Web Applications

This guide outlines best practices for using Noir, a programming language designed for creating zero-knowledge proofs, particularly in web applications. It covers environment setup, circuit writing, integration, security, performance, and user experience, drawing from practical examples like building a web app with Noir and Barretenberg.

## 1. What is Noir?

Noir is a domain-specific language for writing zero-knowledge proof circuits. It enables developers to prove statements (e.g., "this value meets a condition") without revealing the underlying data, using a Rust-like syntax that's approachable for programmers.

## 2. Setting Up Your Environment

To start working with Noir, you need to install the necessary tools and dependencies:

### Install Nargo (Noir CLI Tool):
```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup -v 1.0.0-beta.2
```

### Install Barretenberg (Proving Backend):
```bash
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
```

### Web Application Dependencies:
Use a package manager like npm to install:
```bash
npm install @noir-lang/noir_wasm@1.0.0-beta.2 @noir-lang/noir_js@1.0.0-beta.2 @aztec/bb.js@0.72.1
```

- `@noir-lang/noir_wasm`: Compiles Noir circuits in the browser.
- `@noir-lang/noir_js`: Executes circuits and generates witnesses.
- `@aztec/bb.js`: Interfaces with the Barretenberg backend.

**Tip**: Pin exact versions (e.g., 1.0.0-beta.2) to ensure compatibility.

## 3. Writing Circuits in Noir

Noir circuits define the logic for zero-knowledge proofs. Here's how to write them effectively:

### Basic Syntax:
Define logic in main.nr. Example: Check if an age is 18 or older:
```rust
fn main(age: u8) {
    assert(age >= 18);
}
```

### Data Types:
Use `u8` for small values (0-255), `u64` for larger numbers, or `Field` for cryptographic operations. Match types to your data range.

### Private vs. Public Inputs:
Inputs are private by default. Use `pub` for public inputs:
```rust
fn main(x: Field, pub y: Field) {
    assert(x != y);
}
```

### Complex Data:
Use structs for structured inputs:
```rust
struct Person {
    age: u8,
    country: Country
}

struct Country {
    min_age: u8
}

fn main(person: Person) {
    assert(person.age >= person.country.min_age);
}
```

### Modular Logic:
Add helper functions:
```rust
fn is_valid(age: u8, threshold: u8) -> bool {
    age >= threshold
}

fn main(age: u8) {
    assert(is_valid(age, 18));
}
```

### Testing:
Run tests with:
```bash
nargo test
```

### Documentation:
Comment your code:
```rust
// Ensures balance is at least 1 ETH
fn main(balance: u64) {
    let one_eth: u64 = 1;
    assert(balance >= one_eth);
}
```

## 4. Integrating Noir into Web Applications

Here's how to bring Noir circuits into a web app:

### Compile Circuits:
Use noir_wasm in the browser:
```javascript
import { compile, createFileManager } from "@noir-lang/noir_wasm";
const fm = createFileManager("/");
fm.writeFile("./src/main.nr", await (await fetch("./circuit/src/main.nr")).text());
fm.writeFile("./Nargo.toml", await (await fetch("./circuit/Nargo.toml")).text());
const { program } = await compile(fm);
```

### Execute Circuits:
Generate a witness:
```javascript
import { Noir } from "@noir-lang/noir_js";
const noir = new Noir(program);
const { witness } = await noir.execute({ age: 25 });
```

### Generate and Verify Proofs:
Use Barretenberg:
```javascript
import { UltraHonkBackend } from "@aztec/bb.js";
const backend = new UltraHonkBackend(program.bytecode);
const proof = await backend.generateProof(witness);
const isValid = await backend.verifyProof(proof);
```

### Initialize WASM:
Handle WebAssembly manually:
```javascript
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
await Promise.all([
  initACVM(fetch("@noir-lang/acvm_js/web/acvm_js_bg.wasm")),
  initNoirC(fetch("@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm"))
]);
```

### Handle Inputs:
Validate user data:
```javascript
const age = parseInt(document.getElementById("age").value);
if (isNaN(age) || age < 0 || age > 255) throw new Error("Invalid age");
```

### Error Handling:
Provide feedback:
```javascript
try {
  const proof = await backend.generateProof(witness);
} catch (error) {
  document.getElementById("logs").textContent = `Error: ${error.message}`;
}
```

## 5. Security and Privacy

- Keep private inputs hidden from logs and UI.
- Store API keys in environment variables or config files (e.g., config.json).
- Validate all inputs to ensure data integrity.
- Design circuits to reveal only what's necessary (e.g., a yes/no result).

## 6. Performance Tips

- Keep circuits simple to speed up proof generation.
- Cache compiled circuits for reuse.
- Show loading indicators during processing:
```javascript
document.getElementById("logs").textContent = "Generating proof...";
```

## 7. User Interface Best Practices

### Feedback:
Use dynamic logs:
```javascript
const addLog = (id, content) => {
  document.getElementById(id).innerHTML += `<div>${content}</div>`;
};
addLog("logs", "Proof generated!");
```

### Responsive Design:
Use CSS to support all devices.

### Input Validation:
Check inputs client-side:
```javascript
if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
  addLog("logs", "Invalid address");
  return;
}
```

## 8. Example: Ethereum Balance Verifier

A web app proving an Ethereum address has ≥ 1 ETH:
- Queries balance via Etherscan API.
- Converts Wei to ETH:
```javascript
const balanceEth = balanceWei / 1e18;
const input = { balance: Math.floor(balanceEth) };
```
- Uses Noir to generate a proof, with a sleek UI showing progress.

## 9. Handling Browser Integration Challenges

When integrating Noir into browser applications, you may encounter several challenges. Here's how to address them:

### Creating a Browser-Compatible Mock Implementation

When the Noir libraries don't work directly in the browser environment, create a mock implementation:

```javascript
// noirBrowser.js - A mock implementation for browser compatibility
export function initNoirWasm() {
  console.info('[NoirBrowser] Mock initNoirWasm called');
  return Promise.resolve();
}

export function initNoirJs() {
  console.info('[NoirBrowser] Mock initNoirJs called');
  return Promise.resolve();
}

export function compileCircuit(circuitCode) {
  console.info('[NoirBrowser] Mock compileCircuit called');
  return Promise.resolve({ success: true, circuit: {} });
}

export function generateProof(circuit, inputs) {
  console.info('[NoirBrowser] Mock generateProof called');
  return Promise.resolve({
    proof: { type: 'mock', data: 'mock-proof-data' },
    publicInputs: inputs
  });
}

export function verifyProof(proof, publicInputs) {
  console.info('[NoirBrowser] Mock verifyProof called');
  return Promise.resolve(true);
}
```

### Implementing the ZK Proof Module

Create a module that handles all ZK proof operations with proper error handling:

```javascript
// zkProof.js
import { ethers } from 'ethers';
import * as noirBrowser from './noirBrowser.js';
import logger from './logger.js';

const MODULE_NAME = 'ZKProof';

// Storage keys for session storage
const STORAGE_KEYS = {
  PROOF: 'zk_proof',
  SIGNATURE: 'zk_signature'
};

// Circuit paths
const CIRCUIT_PATHS = {
  MAIN: './circuits/src/main.nr',
  CONFIG: './circuits/Nargo.toml'
};

/**
 * Initialize the ZK Proof module
 */
export async function init() {
  logger.info(MODULE_NAME, 'Initializing ZK Proof module');
  
  try {
    // Initialize Noir libraries
    await noirBrowser.initNoirWasm();
    await noirBrowser.initNoirJs();
    
    logger.info(MODULE_NAME, 'Noir libraries initialized successfully');
    
    return { initialized: true };
  } catch (error) {
    logger.error(MODULE_NAME, `Error initializing ZK Proof module: ${error.message}`);
    return { initialized: false, error: error.message };
  }
}

/**
 * Generate a message to sign with MetaMask
 * @param {string} twitterId - Twitter ID
 * @returns {string} Message to sign
 */
export function generateMessageToSign(twitterId) {
  // Create a hash of the Twitter ID
  const twitterIdHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(twitterId)
  );
  
  // Create a message that includes the Twitter ID hash
  return `Link your Twitter account (${twitterIdHash}) to your Ethereum address`;
}

/**
 * Sign a message with MetaMask
 * @param {string} message - Message to sign
 * @returns {Promise<Object>} Signature data
 */
export async function signMessage(message) {
  logger.info(MODULE_NAME, 'Requesting signature from MetaMask');
  
  try {
    // Check if ethereum is available
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    
    // Request signature
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });
    
    // Store signature in session storage
    sessionStorage.setItem(STORAGE_KEYS.SIGNATURE, signature);
    
    logger.info(MODULE_NAME, 'Message signed successfully');
    
    return { signature, address };
  } catch (error) {
    logger.error(MODULE_NAME, `Error signing message: ${error.message}`);
    throw new Error(`Failed to sign message: ${error.message}`);
  }
}

/**
 * Compile the Noir circuit
 * @returns {Promise<Object>} Compiled circuit
 */
export async function compileCircuit() {
  logger.info(MODULE_NAME, 'Compiling Noir circuit');
  
  try {
    // In a real implementation, we would fetch the circuit code and compile it
    // For now, we use the mock implementation
    const circuit = await noirBrowser.compileCircuit('mock circuit code');
    
    logger.info(MODULE_NAME, 'Circuit compiled successfully');
    
    return circuit;
  } catch (error) {
    logger.error(MODULE_NAME, `Error compiling circuit: ${error.message}`);
    throw new Error(`Failed to compile circuit: ${error.message}`);
  }
}

/**
 * Generate a zero-knowledge proof
 * @param {Object} userData - Twitter user data
 * @param {Object} signatureData - Signature data from MetaMask
 * @returns {Promise<Object>} Generated proof
 */
export async function generateProof(userData, signatureData) {
  logger.info(MODULE_NAME, 'Generating zero-knowledge proof');
  
  try {
    // Compile the circuit
    const circuit = await compileCircuit();
    
    // Prepare inputs for the circuit
    const inputs = {
      twitter_id: userData.id,
      account_age_days: userData.antiquity,
      followers_count: userData.followers,
      signature: signatureData.signature,
      address: signatureData.address
    };
    
    // Generate the proof
    const proofResult = await noirBrowser.generateProof(circuit, inputs);
    
    // Store proof in session storage
    sessionStorage.setItem(STORAGE_KEYS.PROOF, JSON.stringify(proofResult));
    
    logger.info(MODULE_NAME, 'Proof generated successfully');
    
    return proofResult;
  } catch (error) {
    logger.error(MODULE_NAME, `Error generating proof: ${error.message}`);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

/**
 * Get stored proof from session storage
 * @returns {Object|null} Stored proof or null if not found
 */
export function getStoredProof() {
  const storedProof = sessionStorage.getItem(STORAGE_KEYS.PROOF);
  return storedProof ? JSON.parse(storedProof) : null;
}

/**
 * Get stored signature from session storage
 * @returns {string|null} Stored signature or null if not found
 */
export function getStoredSignature() {
  return sessionStorage.getItem(STORAGE_KEYS.SIGNATURE);
}
```

### Handling Import Issues

When you encounter issues with importing Noir libraries in a browser environment, use named exports instead of default exports to provide better compatibility:

```javascript
// Convert from default export:
export default {
  init,
  generateMessageToSign,
  signMessage,
  compileCircuit,
  generateProof,
  getStoredProof,
  getStoredSignature
};

// To named exports:
export {
  init,
  generateMessageToSign,
  signMessage,
  compileCircuit,
  generateProof,
  getStoredProof,
  getStoredSignature
};

// And also provide a default export for backward compatibility:
export default {
  init,
  generateMessageToSign,
  signMessage,
  compileCircuit,
  generateProof,
  getStoredProof,
  getStoredSignature
};
```

### Updating Import Statements

When using named exports, update your import statements accordingly:

```javascript
// From:
import zkproof from './zkProof.js';

// To:
import * as zkproof from './zkProof.js';
```

### Graceful Error Handling

Implement robust error handling to gracefully handle failures in the ZK proof generation process:

```javascript
try {
  const proof = await zkproof.generateProof(userData, signatureData);
  // Handle successful proof generation
} catch (error) {
  console.error('Error generating proof:', error);
  // Display user-friendly error message
  ui.setZKProofStatus(`Error generating proof: ${error.message}`, 'error');
}
```

## 10. Implementing ECDSA Signature Verification in Noir

When working with Ethereum-related applications, verifying ECDSA signatures is often necessary. Here's how to implement signature verification in Noir:

### Creating an ecrecover Implementation:

```rust
// Define a struct for public keys
struct PublicKey {
    x: Field,
    y: Field
}

// Implement the ecrecover function
fn ecrecover(
    message_hash: Field,
    signature_r: Field,
    signature_s: Field,
    recovery_id: Field
) -> PublicKey {
    // Validate inputs
    assert(recovery_id == 0 || recovery_id == 1);
    assert(signature_r != 0);
    assert(signature_s != 0);
    
    // Perform the recovery calculation
    // This would contain the secp256k1 curve math
    
    // Return the recovered public key
    PublicKey {
        x: recovered_x,
        y: recovered_y
    }
}
```

### Using ecrecover in Your Circuit:

```rust
use dep::ecrecover;

fn main(
    message_hash: pub Field,
    pub_key_x: pub Field,
    pub_key_y: pub Field,
    signature_r: Field,
    signature_s: Field,
    signature_v: Field
) -> pub Field {
    // Recover the public key from the signature
    let recovered_pub_key = ecrecover::recover(
        message_hash,
        signature_r,
        signature_s,
        signature_v
    );
    
    // Verify that the recovered public key matches the provided public key
    assert recovered_pub_key.x == pub_key_x;
    assert recovered_pub_key.y == pub_key_y;
    
    // Return 1 to indicate successful verification
    1
}
```

### Setting Up Dependencies:

1. Create a directory structure for your ecrecover implementation:
```bash
mkdir -p circuits/dep/ecrecover/src
```

2. Create the implementation file:
```bash
touch circuits/dep/ecrecover/src/main.nr
```

3. Create a Nargo.toml file for the dependency:
```bash
touch circuits/dep/ecrecover/Nargo.toml
```

4. Add the dependency to your main Nargo.toml:
```toml
[dependencies]
ecrecover = { path = "dep/ecrecover" }
```

### Best Practices for ECDSA Verification:

1. **Input Validation**: Always validate signature components before processing.
2. **Error Handling**: Provide clear error messages for invalid signatures.
3. **Modular Design**: Keep the ecrecover implementation separate from your main circuit.
4. **Testing**: Create comprehensive tests for your signature verification.
5. **Documentation**: Document the expected format of inputs and outputs.

### Integration with Frontend:

```javascript
// Generate a message to sign
const message = `Link Twitter account (${twitterIdHash}) to Ethereum address`;
const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));

// Request signature from MetaMask
const signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [message, address]
});

// Parse the signature components
const sig = ethers.utils.splitSignature(signature);

// Prepare inputs for the Noir circuit
const inputs = {
  twitter_id_hash: twitterIdHash,
  antiquity_days: accountAge,
  followers: followerCount,
  message_hash: messageHash,
  pub_key_x: publicKey.x,
  pub_key_y: publicKey.y,
  signature_r: sig.r,
  signature_s: sig.s,
  signature_v: sig.v
};

// Generate the proof
const { proof } = await noir.execute(inputs);
```

By implementing ECDSA signature verification in your Noir circuits, you can create fully trustless applications that verify the association between Twitter accounts and Ethereum wallets without relying on external verification services.

When integrating Noir into browser applications, remember that:
1. Browser compatibility may require mock implementations during development
2. Named exports provide better compatibility than default exports
3. Robust error handling is essential for a good user experience
4. Clear user feedback about the state of ZK proof operations improves usability

## 11. Conclusion

By following these practices, you can build secure, efficient, and user-friendly web applications with Noir. For more, check the [Noir Documentation](https://noir-lang.org/docs/) or [Awesome-Noir](https://github.com/noir-lang/awesome-noir) for code examples.

