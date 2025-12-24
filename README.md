# 🚗 ApnaRide - Professional Ride Sharing Platform

A complete, production-ready ride-sharing application with advanced animations, real-time tracking, and comprehensive admin features.

> Note: See the sections "Nominatim CORS error and fix" and "Docker build/push/deploy" below for deployment-related guidance.

## ✨ Highlights

- **🎨 Advanced Animations**: Framer Motion + Three.js 3D backgrounds with stars, fog, and dynamic lighting
- **⚡ Real-time Updates**: WebSocket integration for live ride matching and tracking
- **🗺️ Interactive Maps**: Leaflet/OpenStreetMap with geocoding (no API keys required)
- **📱 Responsive Design**: Mobile-first UI with dark mode support
- **🌐 Multi-language**: Support for 5 languages (i18next)
- **♿ Accessible**: Reduced-motion support for better accessibility

## 🎯 Platform Overview
ApnaRide is a full-featured ride-sharing platform with three portals:
- **Customer Portal** - Book rides with real-time tracking
- **Rider Portal** - Accept nearby rides and earn
- **Admin Portal** - Complete platform management

---

## ✨ Core Features

### 🔐 Security
- Separate admin login portal
- Role-based access control
- Secure authentication

### ⚡ Real-Time
- Live ride matching
- Automatic status updates
- Real geocoding with OpenStreetMap
- GPS location tracking

### 🗺️ Maps
- Interactive maps (Leaflet)
- Real address geocoding
- Route visualization
- Current location detection

### 🎨 Professional UI
- Rapido/Uber inspired design
- Smooth animations
- Responsive mobile design
- Multi-language support (5 languages)

---

## 🎛️ Admin Features

### 1. 📊 Dashboard
- Real-time metrics (users, drivers, rides, revenue)
- Analytics charts
- Live statistics
- Quick actions

### 2. 👥 User & Driver Management
- Driver approval system
- User verification
- Block/suspend accounts
- Activity monitoring

### 3. 🚗 Trip Management
- Monitor ongoing rides
- Ride history
- Cancellation management
- Driver allocation

### 4. 💰 Fare & Pricing
- Configure fare structures
- Dynamic pricing
- Commission settings
- Promo code management

### 5. 📈 Reporting & Analytics
- Earnings reports
- Driver performance
- Ride analytics
- User behavior tracking

### 6. ⚙️ System Configuration
- Vehicle type management
- Service area settings
- Global configuration
- Multi-language support

### 7. 🛡️ Safety & Support
- Support ticket system
- Safety alerts
- Live driver tracking (God's View)
- Incident management

### 8. 📞 Manual Booking
- Call center booking
- Customer search
- Driver assignment
- Booking management

---

## Features

### 🚗 Customer Portal
- **Interactive Map**: OpenStreetMap integration with Leaflet (no API keys required)
- **Ride Booking**: Search for rides with pickup and drop locations
- **Vehicle Selection**: Choose from Share, Bike, Auto, or Car
- **Real-time Tracking**: Track driver location and ETA
- **Ride History**: View past and current rides

### 🏍️ Rider Portal
- **Driver Dashboard**: Manage online/offline status
- **Ride Requests**: Accept or decline incoming ride requests
- **Earnings Tracker**: View daily, weekly, and total earnings
- **Trip Management**: Start and complete trips
- **Live Map**: See current location and navigate to pickup/drop points

### 👨‍💼 Admin Portal
- **Dashboard Overview**: Total rides, active riders, customers, and revenue
- **Rider Management**: View, approve, and manage riders
- **Customer Management**: Monitor customer activity
- **Ride History**: Track all rides with detailed information
- **Analytics**: Real-time statistics and insights

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite 7
- **Framer Motion 12** - Advanced animations with page transitions
- **Three.js + React Three Fiber** - 3D backgrounds and effects
- **React Router 6** - Client-side routing
- **Leaflet & React-Leaflet** - Interactive maps (OpenStreetMap)
- **TailwindCSS 4** - Utility-first styling
- **i18next** - Internationalization
- **STOMP/WebSocket** - Real-time communication

### Backend
- **Spring Boot 3.2.5**
- **Spring Data JPA** - Database ORM
- **H2 Database** (development) / **MySQL** (production)
- **WebSocket** - Real-time updates
- **RESTful APIs**

## Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Java 17** or higher
- **Maven** (for backend)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd "Back End"
```

2. Build the project:
```bash
mvnw clean install
```

3. Run the Spring Boot application:
```bash
mvnw spring-boot:run
```

The backend will start on `http://localhost:9031`

**H2 Console**: Access at `http://localhost:9031/h2-console`
- JDBC URL: `jdbc:h2:mem:apnaride`
- Username: `sa`
- Password: (leave empty)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd apnaride-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Default User Accounts

Create accounts using the signup form with these roles:

### Customer Account
- Role: `customer`
- Create via signup form

### Rider Account
- Role: `rider`
- Create via signup form

### Admin Account
- Role: `admin`
- Create via signup form

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user

### Rides
- `POST /api/rides/request` - Request a new ride
- `GET /api/rides/customer/{customerId}` - Get customer rides
- `GET /api/rides/rider/{riderId}` - Get rider rides
- `PUT /api/rides/{bookingId}/accept/{riderId}` - Accept a ride
- `PUT /api/rides/{bookingId}/complete` - Complete a ride
- `GET /api/rides/available` - Get available rides

### Drivers
- `POST /api/drivers/register` - Register as driver
- `GET /api/drivers/{userId}` - Get driver details
- `PUT /api/drivers/{userId}/status` - Update driver status
- `GET /api/drivers/available` - Get available drivers
- `GET /api/drivers/all` - Get all drivers (admin)

## Project Structure

```
apnaride/
├── apnaride-frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Login/Signup
│   │   │   ├── Customer/      # Customer portal
│   │   │   ├── Rider/         # Rider portal
│   │   │   └── Admin/         # Admin portal
│   │   ├── App.jsx            # Main app with routing
│   │   ├── App.css            # Styles
│   │   └── main.jsx           # Entry point
│   └── package.json
│
└── Back End/                   # Spring Boot backend
    ├── src/main/java/com/apnaride/
    │   ├── controller/        # REST controllers
    │   ├── model/             # JPA entities
    │   ├── repository/        # Data repositories
    │   ├── dto/               # Data transfer objects
    │   └── ApnarideBackendApplication.java
    ├── src/main/resources/
    │   └── application.properties
    └── pom.xml
```

## Features Inspired by Rapido & Uber

✅ **Multi-role System**: Customer, Rider, and Admin portals
✅ **Real-time Ride Matching**: Automatic driver assignment
✅ **Interactive Maps**: OpenStreetMap integration (no API keys needed)
✅ **Fare Calculation**: Distance-based pricing
✅ **Multiple Vehicle Types**: Share, Bike, Auto, Car
✅ **Rider Earnings**: Track daily, weekly, and total earnings
✅ **Admin Dashboard**: Comprehensive management tools
✅ **Responsive Design**: Mobile-friendly UI
✅ **Modern UI/UX**: Clean, intuitive interface

## Database Configuration

### Development (H2 - Default)
The application uses H2 in-memory database by default. No setup required!

### Production (MySQL)
To switch to MySQL, update `application.properties`:

```properties
# Comment out H2 configuration
# Uncomment MySQL configuration
spring.datasource.url=jdbc:mysql://localhost:3306/apnaride
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

## Future Enhancements

- [ ] Real-time WebSocket notifications
- [ ] Payment gateway integration
- [ ] SMS/Email notifications
- [ ] Ride sharing (multiple passengers)
- [ ] Rating and review system
- [ ] Promo codes and discounts
- [ ] Driver verification system
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## 🎯 Quick Start

### Start Backend:
```bash
cd "Back End"
mvnw spring-boot:run
```

### Start Frontend:
```bash
cd apnaride-frontend
npm run dev
```

### Access Application:
- **Landing Page:** http://localhost:5173/
- **Sign Up:** http://localhost:5173/signup
- **Sign In:** http://localhost:5173/login

---

## 🧪 Testing Workflow

### 1. Register Driver:
- Go to signup → Click "Drive"
- Fill vehicle details
- Login → Go Online → Click map to set location

### 2. Register Customer:
- Go to signup → Click "Ride"
- Login → Click map twice (pickup & destination)
- Search rides → Book ride

### 3. Complete Trip:
- Driver accepts → Starts → Completes
- Earnings updated

---

## 📁 Key Files

### Frontend:
- `UberStyleCustomerDashboard.jsx` - Customer dashboard with map
- `UberStyleRiderDashboard.jsx` - Rider dashboard with map
- `CustomerProfile.jsx` - Customer profile with tabs
- `RiderProfile.jsx` - Rider profile with earnings
- `EditProfileModal.jsx` - Edit profile functionality
- `profile-styles.css` - Modern profile styling

### Backend:
- `RideController.java` - Ride booking & management
- `WebSocketController.java` - Real-time updates
- `PromoCodeController.java` - Promo code system
- `EmergencyController.java` - SOS features

---

## ✅ Animation Features

### **🎨 Advanced Animations:**
- ✅ **Page Transitions**: Smooth fade/slide animations between routes with AnimatePresence
- ✅ **3D Backgrounds**: Three.js scenes with animated spheres, particles, stars, fog, and dynamic lighting
- ✅ **Scroll Animations**: Viewport-triggered reveals with stagger effects
- ✅ **Micro-interactions**: Button hover/tap animations, card lifts, modal entrances
- ✅ **Framer Motion Variants**: Centralized animation configuration system
- ✅ **Reduced Motion**: Full accessibility support for users who prefer reduced motion
- ✅ **60fps Performance**: Optimized with adaptive DPR and power-efficient rendering

### **🚗 Core Features:**
- ✅ Real-time ride matching with WebSocket
- ✅ Interactive map-based location selection
- ✅ Live driver tracking with 10-second updates
- ✅ Animated ride request cards for drivers
- ✅ Distance-based fare calculation
- ✅ Multi-vehicle type support (Bike, Auto, Car, Share)
- ✅ Driver earnings dashboard
- ✅ Profile management with edit modal
- ✅ Dark mode toggle with theme persistence
- ✅ Multi-language support (English, Hindi, Tamil, Telugu, Kannada)

---

## 🐛 Troubleshooting
- Ensure driver is online (green toggle)
- Driver must click map to set location
- Check 10km radius

**Nearby rides not showing:**
- Driver must be online
- Customer must book a ride
- Check WebSocket connection

**Location not updating:**
- Grant browser location permissions
- Check console for errors

### Nominatim CORS error and fix
- **Symptom:** Browser console shows CORS/403 when calling `https://nominatim.openstreetmap.org/...` from `http://localhost` or your domain.
- **Cause:** Nominatim blocks cross-origin browser requests without proper headers and rate limits. Browsers also enforce CORS, so the response is blocked.
- **Fix (implemented):** Frontend Nginx now exposes a same-origin proxy at `/nominatim` that forwards to `https://nominatim.openstreetmap.org`. This avoids browser CORS.
- **How to use in frontend code:**
  - Replace direct calls to the external URL with the same-origin path:

    ```js
    // before (blocked by CORS)
    // fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=..&lon=..')

    // after (proxied via Nginx, same-origin)
    fetch(`/nominatim/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
      .then(r => r.json())
    ```

  - The proxy sets headers like `Host`, `Referer`, `User-Agent` and enables TLS SNI.
  - Continue to respect Nominatim usage policy (rate limit requests, add delays/backoff if needed).

---

## 📞 Support

For issues, check browser console (F12) and backend logs.

**Built with ❤️ for the Indian ride-sharing market**

---

## 🐳 Docker build/push/deploy

### Local validation
```bash
docker compose up -d --build
# Frontend: http://localhost
# Backend:  http://localhost:9031/actuator/health
```

### Build and push images (examples)
```bash
export USER=<dockerhub-username>
export TAG=v1

# Backend
docker build -t $USER/apnaride-backend:$TAG "Back End"
docker push $USER/apnaride-backend:$TAG

# Frontend (build with relative endpoints)
docker build \
  --build-arg VITE_API_BASE=/api \
  --build-arg VITE_WS_BASE=/ws \
  -t $USER/apnaride-frontend:$TAG apnaride-frontend
docker push $USER/apnaride-frontend:$TAG
```

### EC2 deployment (production compose)
1. Create `.env` next to `docker-compose.prod.yml`:
   ```env
   DB_PASSWORD=<strong-pass>
   DB_NAME=apnaride
   DB_USERNAME=root
   DOCKER_REGISTRY=docker.io
   BACKEND_IMAGE=<dockerhub-username>/apnaride-backend
   FRONTEND_IMAGE=<dockerhub-username>/apnaride-frontend
   IMAGE_TAG=v1
   CORS_ORIGINS=http://your-domain.com
   ```
2. Prepare data dir (first time only): `sudo mkdir -p /opt/apnaride/mysql && sudo chown 999:999 /opt/apnaride/mysql`
3. Start stack:
   ```bash
   docker compose -f docker-compose.prod.yml pull
   docker compose -f docker-compose.prod.yml up -d
   ```
4. Verify:
   ```bash
   docker ps
   curl -f http://localhost:9031/actuator/health
   ```
