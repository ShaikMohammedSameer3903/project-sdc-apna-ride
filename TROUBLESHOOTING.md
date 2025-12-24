# ApnaRide - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### 1. **Login Error: 401 Unauthorized**

**Problem**: Cannot log in, getting "Invalid email or password" error.

**Solutions**:
- ✅ **First time user?** Click "Sign Up" to create a new account
- ✅ **Check credentials**: Ensure email and password are correct
- ✅ **Select correct role**: Choose "Driver" for driver dashboard, "Customer" for customer dashboard
- ✅ **Backend running?**: Ensure Spring Boot backend is running on `http://localhost:9031`
- ✅ **Database setup?**: Check if database is properly configured and has user records

**How to Sign Up**:
1. Go to login page
2. Click "Sign Up" link at the bottom
3. Choose your role (Customer or Driver)
4. Fill in all required details
5. Submit the form
6. Return to login and use your credentials

---

### 2. **Geolocation Permission Blocked**

**Problem**: Browser shows "Geolocation permission has been blocked"

**Solutions**:
- ✅ **Reset permissions**: Click the tune/lock icon next to the URL in your browser
- ✅ **Allow location**: Select "Allow" for location permissions
- ✅ **Refresh page**: Reload the page after changing permissions
- ✅ **Use HTTPS**: Some browsers require HTTPS for geolocation (use `localhost` for development)

**Step-by-step for Chrome**:
1. Click the lock/tune icon in the address bar
2. Click "Site settings"
3. Find "Location" permission
4. Change to "Allow"
5. Refresh the page

---

### 3. **User ID is Null / 403 Forbidden Errors**

**Problem**: Console shows errors like `GET http://localhost:9031/api/rides/rider/null 403`

**Root Cause**: You're not logged in or session expired

**Solutions**:
- ✅ **Log in first**: Go to `/login` and sign in with valid credentials
- ✅ **Check localStorage**: Open DevTools → Application → Local Storage → Check if 'user' exists
- ✅ **Clear and re-login**: Clear localStorage and log in again
- ✅ **Correct role**: Ensure you're logging in with a "rider" role for driver dashboard

**To clear localStorage**:
```javascript
// Open browser console and run:
localStorage.clear();
// Then log in again
```

---

### 4. **WebSocket Connection Issues**

**Problem**: Real-time updates not working, WebSocket errors in console

**Solutions**:
- ✅ **Backend WebSocket enabled**: Ensure backend has WebSocket support configured
- ✅ **Port correct**: Check WebSocket connects to `http://localhost:9031/ws`
- ✅ **User ID valid**: WebSocket subscribes to `/queue/ride-requests/{userId}` - ensure userId is not null
- ✅ **STOMP configured**: Backend should have STOMP over WebSocket enabled

---

### 5. **Left Sidebar Not Showing Rides**

**Problem**: Left sidebar is empty, no rides displayed

**Possible Causes**:
- ✅ **Not online**: Toggle "Go Online" button in the right panel
- ✅ **No rides available**: No customers have requested rides yet
- ✅ **Filters active**: Check if ride preferences are filtering out all rides
- ✅ **Backend issue**: Check backend logs for errors

**How to test**:
1. Ensure you're logged in as a driver
2. Click "Go Online" button
3. Open another browser/incognito window
4. Log in as a customer
5. Request a ride
6. Check driver dashboard - ride should appear in left sidebar

---

### 6. **Accept Ride Fails**

**Problem**: Clicking "Accept Ride" shows error message

**Common Errors and Solutions**:

**"Driver is not available"**
- You're already on a trip or marked as unavailable
- Go offline and back online

**"Ride already accepted or completed"**
- Another driver accepted it first
- Ride status changed before you clicked

**"Driver not found"**
- Your driver profile is not created in database
- Sign up again or check database

**"Network error"**
- Backend is not running
- Check `http://localhost:9031` is accessible

---

### 7. **Animations Not Working**

**Problem**: No animations, components look static

**Solutions**:
- ✅ **Check framer-motion**: Ensure `framer-motion` package is installed
- ✅ **Install dependencies**: Run `npm install` in frontend directory
- ✅ **Check imports**: Verify `motion` is imported from 'framer-motion'
- ✅ **Browser support**: Use modern browser (Chrome, Firefox, Edge)

```bash
# Install missing dependencies
cd apnaride-frontend
npm install framer-motion
```

---

### 8. **Backend Connection Errors**

**Problem**: Cannot connect to backend, CORS errors

**Solutions**:
- ✅ **Backend running**: Start Spring Boot application
- ✅ **Port correct**: Backend should run on port 9031
- ✅ **CORS enabled**: Backend should have `@CrossOrigin(origins = "*")` on controllers
- ✅ **Firewall**: Check if firewall is blocking port 9031

**Start backend**:
```bash
cd "Back End"
mvn spring-boot:run
# OR
./mvnw spring-boot:run
```

---

## 🔍 Debugging Tips

### Check Console Logs

Open browser DevTools (F12) and check:
- **Console tab**: Look for errors and warnings
- **Network tab**: Check API calls and responses
- **Application tab**: Verify localStorage has user data

### Useful Console Commands

```javascript
// Check if user is logged in
console.log(JSON.parse(localStorage.getItem('user')));

// Check current user ID
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user?.id);

// Clear all data and start fresh
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Backend Logs

Check Spring Boot console for:
- Database connection errors
- Authentication failures
- API endpoint errors
- WebSocket connection logs

---

## 📋 Pre-flight Checklist

Before using the application, ensure:

- [ ] Backend is running on `http://localhost:9031`
- [ ] Database is connected and has schema
- [ ] You have created a user account (via Sign Up)
- [ ] You're logged in with correct role
- [ ] Location permissions are enabled
- [ ] Browser is modern (Chrome/Firefox/Edge)
- [ ] No firewall blocking ports 9031 or 5173

---

## 🆘 Still Having Issues?

### Check These Files:

1. **Backend Configuration**:
   - `application.properties` - Database and port settings
   - `WebSocketConfig.java` - WebSocket configuration
   - `SecurityConfig.java` - CORS and authentication

2. **Frontend Configuration**:
   - `package.json` - Dependencies installed
   - API_BASE constant in components - Should be `http://localhost:9031/api`

### Common Quick Fixes:

```bash
# Frontend
cd apnaride-frontend
npm install
npm run dev

# Backend
cd "Back End"
mvn clean install
mvn spring-boot:run
```

### Database Reset (if needed):

```sql
-- Drop and recreate tables
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS users;

-- Then restart backend to recreate schema
```

---

## 📞 Error Messages Guide

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| 401 Unauthorized | Invalid credentials | Check email/password or sign up |
| 403 Forbidden | No permission | Log in with correct role |
| 404 Not Found | Resource doesn't exist | Check if ride/user exists in DB |
| 500 Server Error | Backend issue | Check backend logs |
| ERR_CONNECTION_REFUSED | Backend not running | Start Spring Boot app |
| CORS Error | Cross-origin blocked | Enable CORS in backend |

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Login successful, redirected to dashboard
- ✅ Map loads with your location marker
- ✅ "Go Online" button works
- ✅ Left sidebar shows "Available Rides" with count
- ✅ WebSocket shows "connected" in console
- ✅ No red errors in browser console
- ✅ Earnings display shows ₹0 (or your actual earnings)

---

**Last Updated**: 2025-10-10  
**Version**: 2.0
