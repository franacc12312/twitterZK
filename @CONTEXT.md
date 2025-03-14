# Twitter OAuth 2.0 & Ethereum Authentication Application

## Application Overview
This application enables users to authenticate with their Twitter account using OAuth 2.0 and connect their Ethereum wallet using MetaMask. It displays basic account information such as Twitter ID, account creation date (for calculating account age), follower count, and Ethereum wallet address. Both authentication methods are mandatory for displaying user information.

## Project Structure
- `src/index.html`: Main HTML interface with login buttons and user info display
- `src/js/config.js`: Configuration module for managing application settings
- `src/js/auth.js`: OAuth authentication module for handling Twitter authentication flow
- `src/js/ethereum.js`: Ethereum module for handling MetaMask wallet connection
- `src/js/api.js`: Twitter API interactions module
- `src/js/ui.js`: UI management module for handling user interface updates
- `src/js/utils.js`: Utility functions for common operations
- `src/js/logger.js`: Logging module for application monitoring
- `src/js/app.js`: Main application entry point that coordinates all modules
- `src/css/styles.css`: Basic styling for the application
- `circuits/src/main.nr`: Main Noir circuit for zero-knowledge proofs
- `circuits/dep/ecrecover/src/main.nr`: ECDSA signature recovery implementation for Noir

## Module Responsibilities
1. **Config Module**: Centralizes configuration values and environment variables for both Twitter and Ethereum
2. **Auth Module**: Handles OAuth 2.0 flow (authorization URL generation, code exchange, token management)
3. **Ethereum Module**: Manages MetaMask wallet connection, address retrieval, and network verification
4. **API Module**: Makes requests to Twitter API endpoints to fetch user data
5. **UI Module**: Updates the interface based on application state and handles user interactions
6. **Utils Module**: Provides shared utility functions (data formatting, calculations, address truncation)
7. **Logger Module**: Manages consistent logging throughout the application
8. **App Module**: Orchestrates the application flow and module interactions, coordinating dual authentication
9. **Noir Circuit**: Implements zero-knowledge proofs for Twitter account verification with ECDSA signature verification

## Authentication Flow
1. User can click either "Login with Twitter" or "Connect Wallet" in any order
2. Twitter Authentication:
   - Application generates OAuth authorization URL and redirects user
   - User authenticates on Twitter and grants permissions
   - Twitter redirects back to application with an authorization code
   - Application exchanges code for access token
   - Application uses token to fetch user data from Twitter API
3. Ethereum Authentication:
   - Application requests wallet connection via MetaMask
   - User approves connection in MetaMask popup
   - Application receives and stores the public Ethereum address
4. After both authentications are completed:
   - Application displays Twitter ID, account age, followers, and Ethereum address
5. Zero-Knowledge Proof Generation:
   - User signs a message with their Ethereum wallet
   - Application generates a ZK proof that verifies:
     - The Twitter account and Ethereum wallet are linked (via ECDSA signature)
     - The Twitter account is older than 150 days
     - The Twitter account has more than 150 followers

## Data Security
- Access tokens and wallet addresses are only stored in memory during the current session (using sessionStorage)
- Sensitive credentials are kept in environment variables
- No persistent storage of Twitter API tokens or user data
- No private keys or transaction signing capabilities are requested from MetaMask
- Only public address information is accessed from the Ethereum wallet
- Zero-knowledge proofs ensure that sensitive information is not revealed

## Zero-Knowledge Proof Implementation
- The Noir circuit verifies three conditions:
  1. The Twitter account is older than 150 days
  2. The Twitter account has more than 150 followers
  3. The Twitter account is linked to the Ethereum wallet (via ECDSA signature)
- The ECDSA signature verification is implemented using the ecrecover function
- The ecrecover function recovers the public key from the signature and message hash
- The recovered public key is compared with the provided public key to verify the signature 