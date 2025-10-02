# Discord Login Fix Guide

## Root Cause

The error `authorization_request_not_found` occurs because there's a **redirect URI mismatch** between your Discord application configuration and your actual Angular app.

**Current Issue:**

- Discord app expects callback at: `http://localhost:3000/auth/discord/callback`
- Angular app runs on: `http://localhost:4200/auth/discord/callback`

## Step-by-Step Fix

### 1. Update Discord Application Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (GamerMajlis)
3. Go to **OAuth2** → **General**
4. In **Redirects** section, **ADD** this URL: `http://localhost:4200/auth/discord/callback`
5. **IMPORTANT**: Keep the existing `localhost:3000` URL as well (in case your backend needs it)
6. Click **Save Changes**

### 2. Verify Your Discord Client ID

Check your Discord application's Client ID and update the configuration in:
`src/app/auth/config/discord.config.ts`

Replace `1289628899411464316` with your actual Client ID from Discord Developer Portal.

### 3. Test the Login Flow

1. Navigate to `http://localhost:4200/login`
2. Click the Discord login button
3. You should be redirected to Discord's authorization page
4. After approving, you should return to your app at `http://localhost:4200/auth/discord/callback`

### 4. Backend Configuration (If Needed)

If your backend also needs to handle Discord OAuth, make sure it's configured for the correct redirect URI as well.

## What I Changed in the Code

1. **Direct Discord OAuth**: The frontend now builds the Discord OAuth URL directly instead of relying on backend redirects
2. **Proper State Handling**: Added secure state parameter generation for CSRF protection
3. **Configuration Management**: Created a centralized Discord configuration file
4. **Better Error Handling**: Improved error messages and debugging

## Testing Commands

Open browser console and check for these logs:

- "Discord login button clicked"
- "Redirecting to Discord OAuth URL: [URL]"
- The URL should contain `localhost:4200` in the redirect_uri parameter

## Common Issues and Solutions

### Issue: Still getting authorization_request_not_found

**Solution**: Double-check Discord app settings - the redirect URI must match exactly

### Issue: Invalid client_id error

**Solution**: Verify the CLIENT_ID in `discord.config.ts` matches your Discord app

### Issue: Callback doesn't work

**Solution**: Make sure Angular routing is set up correctly for `/auth/discord/callback`

## Next Steps

1. Update Discord app settings as described above
2. Verify the client ID in the config file
3. Test the login flow
4. If issues persist, check browser console for errors
