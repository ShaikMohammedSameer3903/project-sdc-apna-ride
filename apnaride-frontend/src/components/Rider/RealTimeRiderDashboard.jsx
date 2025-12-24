import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { getCurrentLocation } from '../../services/geocodingService';
import { getRoute } from '../../services/routingService';
import '../../App.css';
import '../../modern-design-system.css';
import RealTimeChat from '../Common/RealTimeChat';
import webSocketService from '../../services/webSocketService';
import { useToast } from '../../context/ToastContext';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

// Custom icons for different markers
const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to update map center
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 13);
        }
    }, [center, map]);
    return null;
}

export default function RealTimeRiderDashboard() {
    const navigate = useNavigate();
    const toast = useToast?.();
    const [user, setUser] = useState(null);
    const [driver, setDriver] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [onTrip, setOnTrip] = useState(false);
    const [availableRides, setAvailableRides] = useState([]);
    const [currentTrip, setCurrentTrip] = useState(null);
    const [earnings, setEarnings] = useState({ today: 0, week: 0, total: 0 });
    const [currentLocation, setCurrentLocation] = useState([28.6139, 77.2090]);
    const [isLoading, setIsLoading] = useState(false);
    // Selected ride for preview/path guidance
    const [selectedRidePreview, setSelectedRidePreview] = useState(null);
    const [previewRouteCoords, setPreviewRouteCoords] = useState([]);
    const [_tripRouteCoords, _setTripRouteCoords] = useState([]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            loadDriverData(parsedUser.id);
            loadEarnings(parsedUser.id);
            
            // Get current location
            getCurrentLocation()
                .then(coords => {
                    setCurrentLocation([coords.lat, coords.lng]);
                    updateDriverLocation(parsedUser.id, coords.lat, coords.lng);
                    // Ensure WS connection
                    if (!webSocketService.isConnected()) {
                        webSocketService.connect(() => {}, () => {});
                    }
                })
                .catch(() => console.log('Location access denied'));
        }
    }, [navigate]);

    // Poll for available rides when online
    useEffect(() => {
        if (isOnline && !onTrip) {
            const interval = setInterval(() => {
                fetchAvailableRides();
            }, 5000); // Poll every 5 seconds

            return () => clearInterval(interval);
        }
    }, [isOnline, onTrip]);

    // Cleanup old rides every 1 minute (remove rides older than 5 minutes)
    useEffect(() => {
        const cleanup = () => {
            setAvailableRides(prev => {
                const now = Date.now();
                return (prev || []).filter(r => {
                    if (!r.requestedAt) return true;
                    const ts = new Date(r.requestedAt).getTime();
                    return now - ts <= 5 * 60 * 1000; // keep within 5 minutes
                });
            });
        };
        const id = setInterval(cleanup, 60 * 1000);
        return () => clearInterval(id);
    }, []);

    const loadDriverData = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/drivers/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setDriver(data);
                setIsOnline(data.isOnline || false);
            }
        } catch (err) {
            console.error('Error loading driver data:', err);
        }
    };

    const loadEarnings = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/rides/rider/${userId}`);
            if (response.ok) {
                const rides = await response.json();
                const completedRides = rides.filter(r => r.status === 'COMPLETED');
                
                const total = completedRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
                
                // Calculate today's earnings
                const today = new Date().toDateString();
                const todayRides = completedRides.filter(r => 
                    new Date(r.requestedAt).toDateString() === today
                );
                const todayTotal = todayRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
                
                // Calculate week's earnings (last 7 days)
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                const weekRides = completedRides.filter(r => 
                    new Date(r.requestedAt) >= weekAgo
                );
                const weekTotal = weekRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
                
                setEarnings({
                    today: todayTotal.toFixed(2),
                    week: weekTotal.toFixed(2),
                    total: total.toFixed(2)
                });
            }
        } catch (err) {
            console.error('Error loading earnings:', err);
        }
    };

    const updateDriverLocation = async (userId, lat, lng) => {
        try {
            await fetch(`${API_BASE}/drivers/${userId}/status?isOnline=${isOnline}&lat=${lat}&lng=${lng}`, {
                method: 'PUT'
            });
        } catch (err) {
            console.error('Error updating location:', err);
        }
    };

    const fetchAvailableRides = async () => {
        try {
            const response = await fetch(`${API_BASE}/rides/available`);
            if (response.ok) {
                const rides = await response.json();
                // Merge new rides with existing ones, dedupe by bookingId
                setAvailableRides(prev => {
                    // create map of existing
                    const map = new Map();
                    for (const r of (prev || [])) map.set(r.bookingId, r);
                    for (const r of (rides || [])) map.set(r.bookingId, r);
                    const merged = Array.from(map.values());
                    // sort by requestedAt if available (newest first)
                    merged.sort((a, b) => {
                        const ta = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
                        const tb = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
                        return tb - ta;
                    });
                    // debug log
                    console.debug('Available rides merged:', merged.map(r => r.bookingId));
                    return merged;
                });
            }
        } catch (err) {
            console.error('Error fetching rides:', err);
        }
    };

    const handleSignOut = () => {
        if (isOnline) {
            toggleOnlineStatus(); // Go offline before signing out
        }
        localStorage.removeItem('user');
        navigate('/login');
    };

    const toggleOnlineStatus = async () => {
        if (!user || !driver) return;

        setIsLoading(true);
        try {
            const newStatus = !isOnline;
            const response = await fetch(
                `${API_BASE}/drivers/${user.id}/status?isOnline=${newStatus}&lat=${currentLocation[0]}&lng=${currentLocation[1]}`,
                { method: 'PUT' }
            );

            if (response.ok) {
                setIsOnline(newStatus);
                if (newStatus) {
                    fetchAvailableRides(); // Fetch rides immediately when going online
                } else {
                    setAvailableRides([]); // Clear rides when going offline
                }
            }
        } catch (err) {
            console.error('Error toggling status:', err);
        }
        setIsLoading(false);
    };

    const acceptRide = async (ride) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/rides/${ride.bookingId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: user.id })
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                const message = payload?.error || 'Failed to accept ride';
                alert(message);
                setAvailableRides(prev => (prev || []).filter(r => r.bookingId !== ride.bookingId));
                setIsLoading(false);
                return;
            }

            if (payload && payload.success === false) {
                const message = payload.error || 'Ride already accepted or completed';
                alert(message);
                setAvailableRides(prev => (prev || []).filter(r => r.bookingId !== ride.bookingId));
                setIsLoading(false);
                return;
            }

            const acceptedRide = payload.ride || payload;
            setCurrentTrip(acceptedRide);
            setOnTrip(true);
            setAvailableRides([]);
            setSelectedRidePreview(null);

            // compute routes: driver/current -> pickup and pickup -> drop
            try {
                const pickupLat = acceptedRide.pickupLat ?? acceptedRide.pickupLatitude ?? acceptedRide.pickup?.lat;
                const pickupLng = acceptedRide.pickupLng ?? acceptedRide.pickupLongitude ?? acceptedRide.pickup?.lng;
                if (pickupLat != null && pickupLng != null) {
                    const route1 = await getRoute(currentLocation, [pickupLat, pickupLng]);
                    if (route1 && route1.coordinates) setPreviewRouteCoords(route1.coordinates);

                    const dropLat = acceptedRide.dropLat ?? acceptedRide.dropLatitude ?? acceptedRide.drop?.lat;
                    const dropLng = acceptedRide.dropLng ?? acceptedRide.dropLongitude ?? acceptedRide.drop?.lng;
                    if (dropLat != null && dropLng != null) {
                        const route2 = await getRoute([pickupLat, pickupLng], [dropLat, dropLng]);
                        if (route2 && route2.coordinates) _setTripRouteCoords(route2.coordinates);
                    }
                }
            } catch (routeErr) {
                console.warn('Could not compute routes after accept:', routeErr);
            }
        } catch (err) {
            console.error('Error accepting ride:', err);
            alert('Network error. Please try again.');
        }
        setIsLoading(false);
    };

    // Complete trip helper used by the UI button. Calls backend to mark trip complete.
    const completeTrip = async () => {
        if (!currentTrip) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/rides/${currentTrip.bookingId}/complete`, {
                method: 'POST'
            });
            if (res.ok) {
                // mark trip finished locally
                setOnTrip(false);
                setCurrentTrip(null);
                if (toast) toast.success('Trip completed successfully');
            } else {
                const payload = await res.json().catch(() => null);
                if (toast) toast.error(payload?.error || 'Could not complete trip');
            }
        } catch (e) {
            console.error('Error completing trip', e);
            if (toast) toast.error('Network error completing trip');
        }
        setIsLoading(false);
    };

    // Preview route when a ride is selected (but not accepted)
    useEffect(() => {
        let mounted = true;
        if (!selectedRidePreview) {
            setPreviewRouteCoords([]);
            return;
        }
        const { pickupLat, pickupLng } = selectedRidePreview;
        if (pickupLat == null || pickupLng == null) return;
        (async () => {
            try {
                const route = await getRoute(currentLocation, [pickupLat, pickupLng]);
                if (!mounted) return;
                if (route && route.coordinates) setPreviewRouteCoords(route.coordinates);
            } catch (e) {
                console.error('Preview route error (rider):', e);
            }
        })();
        return () => { mounted = false; };
    }, [selectedRidePreview, currentLocation]);

    // Periodically send live location via WebSocket
    useEffect(() => {
        if (!user) return;
        const id = setInterval(async () => {
            try {
                const coords = await getCurrentLocation();
                if (!coords) return;
                setCurrentLocation([coords.lat, coords.lng]);
                webSocketService.sendLocationUpdate(user.id, { lat: coords.lat, lng: coords.lng });
            } catch {}
        }, 5000);
        return () => clearInterval(id);
    }, [user]);

    if (!user) return null;

    return (
        <div className="w-full">
            <header className="header">
                <nav className="navbar container">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div className="logo-text">ApnaRide - Rider</div>
                    </div>
                    <div>
                        <span className="nav-user-info">Welcome, {user.name}!</span>
                        <button onClick={handleSignOut} className="btn-yellow">Sign Out</button>
                    </div>
                </nav>
            </header>

            <main className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map Section */}
                    <div className="lg:col-span-2">
                        <div className="card" style={{height: '500px', padding: '0', overflow: 'hidden'}}>
                            <MapContainer 
                                center={currentLocation} 
                                zoom={13} 
                                style={{height: '100%', width: '100%'}}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />
                                <MapUpdater center={currentLocation} />
                                <Marker position={currentLocation} icon={driverIcon}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                                {/* Preview route to selected ride pickup */}
                                {previewRouteCoords && previewRouteCoords.length > 1 && (
                                    <>
                                        <Polyline positions={previewRouteCoords} color="#ff6b6b" weight={4} opacity={0.85} />
                                        {/* show pickup marker at the end of route */}
                                        <Marker position={previewRouteCoords.at(-1)} icon={pickupIcon}>
                                            <Popup>Pickup Preview</Popup>
                                        </Marker>
                                    </>
                                )}
                            </MapContainer>
                        </div>

                        {/* Earnings Card */}
                        <div className="card mt-6 animate-slide-up">
                            <h3 className="text-xl font-bold mb-4">💰 Earnings Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg hover-lift">
                                    <p className="text-sm text-gray-600">Today</p>
                                    <p className="text-2xl font-bold text-green-600">₹{earnings.today}</p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg hover-lift">
                                    <p className="text-sm text-gray-600">This Week</p>
                                    <p className="text-2xl font-bold text-blue-600">₹{earnings.week}</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg hover-lift">
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-purple-600">₹{earnings.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status & Requests Section */}
                    <div>
                        {/* Online/Offline Toggle */}
                        <div className="card mb-6 animate-slide-right">
                            <h3 className="text-xl font-bold mb-4">Status</h3>
                            <button 
                                onClick={toggleOnlineStatus}
                                disabled={isLoading || onTrip}
                                className={`btn w-full ${isOnline ? 'btn-danger' : 'btn-success'}`}
                            >
                                <i className={`fa-solid ${isOnline ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2`}></i>
                                {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                            <p className="text-center mt-3 text-sm text-gray-600">
                                {isOnline ? '🟢 You are online and accepting rides' : '🔴 You are offline'}
                            </p>
                        </div>

                        {/* Current Trip */}
                        {onTrip && currentTrip && (
                            <div className="card animate-bounce-in">
                                <h3 className="text-xl font-bold text-blue-600 mb-4">
                                    <i className="fa-solid fa-route mr-2"></i>On Trip
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Booking ID:</strong> {currentTrip.bookingId}</p>
                                    <p><strong>Pickup:</strong> {currentTrip.pickupLocation}</p>
                                    <p><strong>Drop:</strong> {currentTrip.dropLocation}</p>
                                    <p><strong>Vehicle:</strong> {currentTrip.vehicleType}</p>
                                    <p className="text-lg"><strong>Your Earning:</strong> 
                                        <span className="text-green-600 font-bold"> ₹{(currentTrip.fare * 0.8).toFixed(2)}</span>
                                    </p>
                                </div>
                                <button 
                                    onClick={completeTrip} 
                                    disabled={isLoading}
                                    className="btn btn-success w-full mt-4"
                                >
                                    {isLoading ? <i className="fa-solid fa-spinner spinner"></i> : (
                                        <>
                                            <i className="fa-solid fa-flag-checkered mr-2"></i>Complete Trip
                                        </>
                                    )}
                                </button>
                                {/* Inline Chat with Customer */}
                                <div className="mt-4" style={{ height: 300 }}>
                                    <RealTimeChat 
                                        rideId={currentTrip.bookingId}
                                        userId={user.id}
                                        userName={user.name}
                                        userType="rider"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Available Rides */}
                        {!onTrip && isOnline && availableRides.length > 0 && (
                            <div className="space-y-4">
                                {availableRides.map(ride => (
                                    <div key={ride.bookingId} className="card animate-slide-left">
                                        <h3 className="text-lg font-bold text-green-600 mb-3">
                                            <i className="fa-solid fa-bell mr-2 animate-float"></i>New Ride Request!
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>ID:</strong> {ride.bookingId}</p>
                                            <p><strong>From:</strong> {ride.pickupLocation}</p>
                                            <p><strong>To:</strong> {ride.dropLocation}</p>
                                            <p><strong>Vehicle:</strong> {ride.vehicleType}</p>
                                            <p className="text-lg"><strong>Your Earning:</strong> 
                                                <span className="text-green-600 font-bold"> ₹{(ride.fare * 0.8).toFixed(2)}</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => acceptRide(ride)}
                                            disabled={isLoading}
                                            className="btn btn-success w-full mt-4"
                                        >
                                            {isLoading ? <i className="fa-solid fa-spinner spinner"></i> : (
                                                <>
                                                    <i className="fa-solid fa-check mr-2"></i>Accept Ride
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setSelectedRidePreview(ride)}
                                            disabled={isLoading}
                                            className="btn btn-ghost w-full mt-2"
                                            style={{ marginTop: 8 }}
                                        >Preview Path to Pickup</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Waiting State */}
                        {!onTrip && isOnline && availableRides.length === 0 && (
                            <div className="card text-center animate-slide-up">
                                <div className="loading-dots mb-4">
                                    <div className="loading-dot"></div>
                                    <div className="loading-dot"></div>
                                    <div className="loading-dot"></div>
                                </div>
                                <i className="fa-solid fa-clock text-4xl text-yellow-500 mb-3"></i>
                                <p className="text-lg font-semibold">Waiting for ride requests...</p>
                                <p className="text-sm text-gray-600 mt-2">Stay online to receive requests</p>
                            </div>
                        )}

                        {/* Offline State */}
                        {!isOnline && !onTrip && (
                            <div className="card text-center animate-fade-in">
                                <i className="fa-solid fa-moon text-4xl text-gray-400 mb-3"></i>
                                <p className="text-lg font-semibold">You are offline</p>
                                <p className="text-sm text-gray-600 mt-2">Go online to start accepting rides</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
