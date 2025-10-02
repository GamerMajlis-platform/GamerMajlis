# Discord Login Fix - Testing Checklist

## Testing Steps

### 1. Basic Setup Verification

- [ ] App builds without errors (`ng build`)
- [ ] App runs without errors (`ng serve`)
- [ ] Navigate to `/login` page loads correctly
- [ ] Discord login button is visible and properly styled

### 2. Discord Login Flow Testing

- [ ] Click Discord login button
- [ ] Check browser console for debug logs
- [ ] Verify state parameter is generated and stored in localStorage
- [ ] Confirm redirect to Discord OAuth page occurs
- [ ] Complete Discord OAuth flow in browser

### 3. Discord Callback Testing

- [ ] After Discord approval, verify callback URL is called
- [ ] Check that authorization code is received
- [ ] Verify state parameter validation works
- [ ] Confirm API call to backend `/auth/discord/callback`
- [ ] Check that authentication token is stored in localStorage
- [ ] Verify redirect to home page or intended route

### 4. Error Handling Testing

- [ ] Test with invalid authorization code
- [ ] Test with state parameter mismatch
- [ ] Test with backend API errors
- [ ] Test with network connectivity issues
- [ ] Verify appropriate error messages are shown

### 5. Security Testing

- [ ] Verify CSRF protection with state parameter
- [ ] Check that sensitive data is not logged in production
- [ ] Confirm localStorage cleanup on errors
- [ ] Test multiple login attempts

## Common Issues and Solutions

### Issue: "No authorization code received"

**Solution**: Check that Discord app is properly configured with correct redirect URI

### Issue: "State parameter mismatch"

**Solution**: Clear localStorage and try again, check browser console for state values

### Issue: "Backend API error"

**Solution**: Verify backend Discord OAuth implementation and API endpoints

### Issue: "Infinite redirect loop"

**Solution**: Check route guards and authentication state management

## Debug Commands

Open browser console and run:

- `DiscordDebugUtil.enableDebug()` - Enable debug logging
- `DiscordDebugUtil.disableDebug()` - Disable debug logging
- `DiscordDebugUtil.clearStoredData()` - Clear OAuth data
- `localStorage.clear()` - Clear all stored data

## Expected Console Logs

When debug is enabled, you should see:

1. "Generated OAuth URL" with state parameter
2. "OAuth Callback Parameters" with received data
3. "State Validation" with comparison results
4. "API Call" when contacting backend
5. "API Success" or "API Error" for backend response
6. "Navigation" when redirecting to final destination
