# OAuth Setup Guide

This guide will help you set up Google, Facebook, and X (Twitter) OAuth login for your application.

## Installation

First, install the required dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables (use `.env.example` as a template):

```
MONGODB_KEY=your_mongodb_connection_string
PORT=3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/users/auth/google/callback` (for development)
     - `https://yourdomain.com/users/auth/google/callback` (for production)
5. Copy the Client ID and Client Secret to your `.env` file

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Navigate to Settings → Basic to find your App ID and App Secret
4. Add Facebook Login product to your app
5. Configure OAuth Redirect URIs:
   - `http://localhost:3000/users/auth/facebook/callback` (for development)
   - `https://yourdomain.com/users/auth/facebook/callback` (for production)
6. Copy the App ID and App Secret to your `.env` file

## X (Twitter) OAuth Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new application or use existing one
3. Navigate to the "Keys and tokens" section
4. Copy your API Key (Consumer Key) and API Secret Key (Consumer Secret)
5. Configure OAuth Callback URLs:
   - `http://localhost:3000/users/auth/twitter/callback` (for development)
   - `https://yourdomain.com/users/auth/twitter/callback` (for production)
6. Copy the Consumer Key and Consumer Secret to your `.env` file

## How It Works

### User Model Updates

The `Users.js` model now includes optional OAuth provider IDs:
- `googleId`: Stores the user's Google ID
- `facebookId`: Stores the user's Facebook ID
- `twitterId`: Stores the user's X (Twitter) ID

Users can register and login in two ways:
1. Traditional email/password
2. OAuth providers (Google, Facebook, X)

### OAuth Routes

The following routes handle OAuth authentication:

- **Google:**
  - `/users/auth/google` - Initiates Google login
  - `/users/auth/google/callback` - Handles Google callback

- **Facebook:**
  - `/users/auth/facebook` - Initiates Facebook login
  - `/users/auth/facebook/callback` - Handles Facebook callback

- **X (Twitter):**
  - `/users/auth/twitter` - Initiates X login
  - `/users/auth/twitter/callback` - Handles X callback

### Login Flow

1. User clicks on the OAuth provider button on the login page
2. They are redirected to the provider's login page
3. After successful authentication, they are redirected back to your app
4. The app checks if the user exists:
   - If they exist with the same OAuth ID, they are logged in
   - If they exist with the same email, their account is linked
   - If they're new, a new user account is created
5. User is redirected to the dashboard

## Frontend

The login page (`views/login.ejs`) has been updated with OAuth buttons:
- Google button (red outline)
- Facebook button (blue outline)
- X/Twitter button (cyan outline)

Users can click these buttons to authenticate with their preferred provider.

## Linking Accounts

If a user already has an account with their email and then logs in with OAuth:
- Their existing account will be linked to the OAuth provider
- They can then use either method to login

## Troubleshooting

### OAuth buttons not working
- Ensure all environment variables are correctly set in `.env`
- Check that callback URLs in OAuth provider settings match exactly with your application

### User not created/logged in
- Check MongoDB connection
- Verify that the OAuth provider is returning user email
- Check application logs for detailed error messages

### Passport not authenticating
- Ensure `npm install` was run to install all dependencies
- Check that passport middleware is initialized in `app.js`
- Verify user serialization/deserialization in `config/passport.js`

## Next Steps

1. Update your MongoDB schema if needed
2. Test each OAuth provider with your credentials
3. Deploy to production with correct callback URLs
4. Monitor user creation and authentication
