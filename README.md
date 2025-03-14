# Twitter OAuth Authentication App

A simple web application that allows users to authenticate with their Twitter account using OAuth 2.0 and connect their Ethereum wallet using MetaMask to view basic account information including:
- Twitter ID
- Account age (in years)
- Number of followers
- Ethereum wallet address

## Features

- Secure OAuth 2.0 authentication flow with Twitter
- PKCE (Proof Key for Code Exchange) for enhanced security
- Ethereum wallet integration with MetaMask (mandatory login alongside Twitter)
- Responsive user interface
- Session-based storage (no persistent data)
- Comprehensive error handling
- Modular code structure for maintainability
- Server proxy to handle CORS issues with Twitter API

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Twitter Developer Account with OAuth 2.0 app credentials
- MetaMask extension installed in your browser

## Setup

1. Clone the repository
   ```
   git clone <repository-url>
   cd twitter-login-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the project root with your Twitter API credentials:
   ```
   TWITTER_CLIENT_ID=your_client_id_here
   TWITTER_CLIENT_SECRET=your_client_secret_here
   PROXY_PORT=3000
   ```

4. Configure your Twitter Developer App:
   - Log in to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Navigate to your project and app settings
   - In the "User authentication settings" section:
     - Enable OAuth 2.0
     - Set the callback URL to: `http://localhost:1234/callback`
     - Request the permissions: `tweet.read` and `users.read`
   - In the "Keys and tokens" section:
     - Make sure you have both the "OAuth 2.0 Client ID" and "Client Secret"
     - Use these values in your `.env` file

## Running the App

### Option 1: Start frontend and proxy server separately

1. Start the proxy server:
   ```
   npm run server
   ```

2. In a separate terminal, start the frontend:
   ```
   npm start
   ```

### Option 2: Start both services with one command

1. Use the dev script to start both the frontend and proxy server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:1234
   ```

4. Both "Login with Twitter" and "Connect Wallet" are required to proceed:
   - Click "Login with Twitter" to authenticate with your Twitter/X account
   - Click "Connect Wallet" to link your MetaMask wallet (Ethereum Mainnet)
   - Once both are completed, your Twitter ID, account age, followers, and Ethereum address will be displayed

## About the Proxy Server

This application uses a proxy server to handle interactions with Twitter's API. This resolves CORS issues that occur when trying to make requests directly from the browser to Twitter's API.

The proxy server:
- Runs on `http://localhost:3000` by default (configurable in .env)
- Provides two main endpoints:
  - `/api/twitter/token`: Handles the authorization code exchange with Twitter
  - `/api/twitter/user`: Fetches user data from Twitter API using the access token
- Keeps sensitive operations on the server side
- Returns only the necessary token information to the frontend
- Uses Basic Authentication with your Client ID and Client Secret for secure token exchange
- Acts as a middleware to avoid exposing API details to the client

## Project Structure

- `src/index.html`: Main HTML interface
- `src/css/styles.css`: CSS styles
- `src/js/app.js`: Main application entry point
- `src/js/auth.js`: OAuth authentication module for Twitter
- `src/js/ethereum.js`: Ethereum wallet connection module
- `src/js/api.js`: Twitter API interaction module
- `src/js/ui.js`: User interface management module
- `src/js/config.js`: Configuration module
- `src/js/utils.js`: Utility functions
- `src/js/logger.js`: Logging module
- `server.js`: Proxy server for handling Twitter API requests

## Authentication Flow

1. The user has two authentication options (both required):
   - Twitter OAuth 2.0 authentication
   - MetaMask wallet connection

2. Twitter OAuth Flow:
   - User clicks "Login with Twitter" button
   - Application generates OAuth authorization URL with PKCE and redirects user
   - User authenticates on Twitter and grants permissions
   - Twitter redirects back to application with an authorization code
   - Application exchanges code for access token via proxy server
   - Application uses token to fetch user data from Twitter API

3. MetaMask Wallet Connection:
   - User clicks "Connect Wallet" button
   - Application requests wallet connection through MetaMask
   - MetaMask prompts user to connect and select accounts
   - User approves connection in MetaMask popup
   - Application receives and displays the public Ethereum address

4. Combined Authentication:
   - Only when both Twitter and MetaMask are connected, the complete user information is displayed
   - All credentials are stored only in memory (sessionStorage) during the current session

## Security Considerations

- The application does not store Twitter credentials or tokens beyond the current browser session
- OAuth state parameter is used to prevent CSRF attacks
- PKCE is implemented for enhanced security in OAuth flow
- Sensitive API calls are handled by the proxy server
- No sensitive data is exposed in the client-side code
- Client Secret is kept secure on the server side
- All API interactions with Twitter are performed through the proxy server
- Uses `x.com` domain for authorization to recognize existing user sessions while maintaining the `api.twitter.com` endpoints for API requests
- Ethereum connection only accesses public address information and does not request transaction signing capabilities

## Ethereum Wallet Integration

- MetaMask is required for Ethereum wallet connection
- The application connects to Ethereum Mainnet (chainId: 0x1)
- If using a different network, the application will display a warning
- Only the public Ethereum address is accessed - no private keys or signing capabilities are requested
- The wallet connection is managed entirely on the frontend (no proxy involved)
- Address is displayed in a truncated format for better UI experience

## Building for Production

To build the app for production:

```
npm run build
```

The build output will be in the `dist` directory.

**Note:** When deploying to production, make sure to configure the proxy server and update the frontend configuration to point to the correct proxy URL.

## Troubleshooting

If you encounter authentication errors:
1. Verify that both `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correct in your `.env` file
2. Ensure that the redirect URI (`http://localhost:1234/callback`) matches exactly what's registered in your Twitter Developer App
3. Check the server logs for detailed error information
4. Verify that the proxy server is running before making requests from the frontend
5. Make sure the Twitter API permissions include `tweet.read` and `users.read`
6. If MetaMask connection fails, ensure you have the MetaMask extension installed and are logged in
7. For Ethereum-related issues, check if you're on the Mainnet network in MetaMask (or at least aware that a warning will display if on a test network)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 