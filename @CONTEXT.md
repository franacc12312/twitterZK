# Twitter OAuth 2.0 Authentication Application

## Application Overview
This application enables users to authenticate with their Twitter account using OAuth 2.0 and displays basic account information such as Twitter ID, account creation date (for calculating account age), and follower count.

## Project Structure
- `src/index.html`: Main HTML interface with login button and user info display
- `src/js/config.js`: Configuration module for managing application settings
- `src/js/auth.js`: OAuth authentication module for handling Twitter authentication flow
- `src/js/api.js`: Twitter API interactions module
- `src/js/ui.js`: UI management module for handling user interface updates
- `src/js/utils.js`: Utility functions for common operations
- `src/js/logger.js`: Logging module for application monitoring
- `src/js/app.js`: Main application entry point that coordinates all modules
- `src/css/styles.css`: Basic styling for the application

## Module Responsibilities
1. **Config Module**: Centralizes configuration values and environment variables
2. **Auth Module**: Handles OAuth 2.0 flow (authorization URL generation, code exchange, token management)
3. **API Module**: Makes requests to Twitter API endpoints to fetch user data
4. **UI Module**: Updates the interface based on application state and handles user interactions
5. **Utils Module**: Provides shared utility functions (data formatting, calculations)
6. **Logger Module**: Manages consistent logging throughout the application
7. **App Module**: Orchestrates the application flow and module interactions

## Authentication Flow
1. User clicks "Login with Twitter" button
2. Application generates OAuth authorization URL and redirects user
3. User authenticates on Twitter and grants permissions
4. Twitter redirects back to application with an authorization code
5. Application exchanges code for access token
6. Application uses token to fetch user data from Twitter API
7. User information is displayed in the UI

## Data Security
- Access tokens are only stored in memory during the current session
- Sensitive credentials are kept in environment variables
- No persistent storage of Twitter API tokens or user data 