# 🚀 ApnaRide - Quick Start Guide

## ⚡ Start Application (2 Steps)

### 1. Start Backend:
```bash
cd "Back End"
mvnw spring-boot:run
```
✅ Wait for: "Started ApnaRideApplication"

### 2. Start Frontend:
```bash
cd apnaride-frontend
npm run dev
```
✅ Access: http://localhost:5173

---

## 🧪 Test Complete Workflow

### Browser 1 - Driver:
1. **Signup:** http://localhost:5173/signup → Click "Drive"
2. Fill: Name, Email, Password, Vehicle Type, Vehicle Number, License
3. **Login:** Select "Driver" role
4. **Go Online:** Toggle switch (top-left)
5. **Set Location:** Click anywhere on map
6. ✅ Wait for ride requests

### Browser 2 - Customer:
1. **Signup:** http://localhost:5173/signup → Click "Ride"
2. **Login:** Select "Customer" role
3. **Set Pickup:** Click map once
4. **Set Destination:** Click map again
5. **Search Rides:** Click button
6. ✅ Should see: "1 driver(s) available"
7. **Book Ride:** Select vehicle → Book
8. ✅ Driver receives request

### Complete Trip:
- Driver clicks "Accept"
- Driver clicks "Start Ride"
- Driver clicks "Complete Ride"
- ✅ Earnings updated

---

## 🐛 Common Issues

**"No drivers available":**
- Driver must be online (green toggle)
- Driver must click map to set location

**"Nearby rides not showing":**
- Driver must be online first
- Customer must book a ride

**"Vehicle fields not showing":**
- Click "Drive" button (not "Ride")

---

## ✅ Features Working

✅ Map click to select locations  
✅ Real-time driver tracking  
✅ Color-coded notifications  
✅ Cancel ride/trip  
✅ Edit profile  
✅ Driver registration  
✅ Nearby matching (10km radius)  
✅ WebSocket updates  
✅ Profile tabs  
✅ Modern UI  

---

**Everything is ready to use!** 🎉
