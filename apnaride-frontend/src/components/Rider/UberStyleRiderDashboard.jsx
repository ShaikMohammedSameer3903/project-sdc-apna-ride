import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../uber-style.css';
import '../../modern-animations.css';
import { getCurrentLocation } from '../../services/geocodingService';
import webSocketService from '../../services/webSocketService';
import { getRoute } from '../../services/routingService';
import RiderPreferences from './RiderPreferences';
import RideRequestCard3D from './RideRequestCard3D';
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import RealTimeChat from '../Common/RealTimeChat';
import AdvancedToast from '../Animations/AdvancedToast';
import LoadingSpinner from '../Animations/LoadingSpinner';
import SuccessAnimation from '../Animations/SuccessAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import OtpModal from '../Common/OtpModal';
import EmergencyPhoneModal from '../Common/EmergencyPhoneModal';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

// Custom marker icons
const createCustomIcon = (color, icon = 'car') => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
            <i class="fa-solid fa-${icon}"></i>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

// Map updater component
function MapUpdater({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || 13);
        }
    }, [center, zoom, map]);
    return null;
}

// Map click handler component
function MapClickHandler({ onMapClick, enabled }) {
    const map = useMap();
    
    useEffect(() => {
        if (!enabled) return;
        
        const handleClick = (e) => {
            onMapClick(e.latlng);
        };
        
        map.on('click', handleClick);
        
        return () => {
            map.off('click', handleClick);
        };
    }, [map, onMapClick, enabled]);
    
    return null;
}

function FitBounds({ coordinates }) {
    const map = useMap();
    useEffect(() => {
        if (coordinates && coordinates.length > 1) {
            map.fitBounds(coordinates, { padding: [40, 40] });
        }
    }, [coordinates, map]);
    return null;
}

export default function UberStyleRiderDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [driver, setDriver] = useState(null);
    const [showEmergencyPhoneModal, setShowEmergencyPhoneModal] = useState(false);
    
    // Status
    const [isOnline, setIsOnline] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('offline'); // offline, online, on_trip
    
    // Location
    const [currentLocation, setCurrentLocation] = useState([28.6139, 77.2090]);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
    const [routeCoords, setRouteCoords] = useState(null);
    
    // Ride states
    const [rideRequests, setRideRequests] = useState([]);
    const [currentRide, setCurrentRide] = useState(null);
    const [nearbyRides, setNearbyRides] = useState([]);
    const [declinedRides, setDeclinedRides] = useState([]); // Track declined rides
    
    // Earnings
    const [earnings, setEarnings] = useState({
        today: 0,
        week: 0,
        month: 0,
        total: 0
    });
    
    // UI states
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showRideRequest, setShowRideRequest] = useState(false);
    const [showChatWidget, setShowChatWidget] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [preferences, setPreferences] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRides, setFilteredRides] = useState([]);
    
    // Draggable panel state
    const [panelPosition, setPanelPosition] = useState({ x: null, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Chat
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    
    // Stats
    const [stats, setStats] = useState({
        totalRides: 0,
        rating: 4.8,
        acceptanceRate: 95,
        completionRate: 98
    });
    const [acceptingBookingId, setAcceptingBookingId] = useState(null);

    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    async function loadDriverData(userId) {
        if (!userId) {
            console.error('Cannot load driver data: User ID is null');
            addNotification('Unable to load driver profile. Please try again.', 'warning');
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/drivers/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setDriver(data);
                setStats(prev => ({
                    ...prev,
                    totalRides: data.totalTrips || 0,
                    rating: data.rating || 4.8
                }));
            } else {
                addNotification('Unable to load driver profile right now.', 'warning');
            }
        } catch (error) {
            console.error('Error loading driver data:', error);
            addNotification('Unable to load driver profile right now.', 'warning');
        }
    }

    useEffect(() => {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
            console.log('No user data found, redirecting to login');
            navigate('/login');
            return;
        }
        
        try {
            const parsedUser = JSON.parse(userData);
            
            // Validate user data
            if (!parsedUser || !parsedUser.id || !parsedUser.email) {
                console.error('Invalid user data:', parsedUser);
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            // Check if user role is rider
            if (parsedUser.role !== 'rider') {
                console.error('User is not a rider:', parsedUser.role);
                alert('This dashboard is only for drivers. Please log in with a driver account.');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            console.log('User authenticated:', parsedUser);
            setUser(parsedUser);

            try {
                const missing = !parsedUser?.emergencyPhone;
                if (missing) setShowEmergencyPhoneModal(true);
            } catch {}
            
            // Load driver data only after user is set
            loadDriverData(parsedUser.id);
            loadEarnings(parsedUser.id);
            
            // Get current location
            getCurrentLocation()
                .then(coords => {
                    console.log('Location obtained:', coords);
                    setCurrentLocation([coords.lat, coords.lng]);
                    setMapCenter([coords.lat, coords.lng]);
                })
                .catch(err => {
                    console.warn('Location access denied:', err);
                    addNotification('Location access denied. Please enable location permissions in your browser settings.', 'warning');
                });
            
            // Connect WebSocket
            webSocketService.connect(
                () => {
                    console.log('WebSocket connected for user:', parsedUser.id);
                    // Subscribe to ride requests
                    webSocketService.subscribeToRideRequests(parsedUser.id, handleRideRequest);
                    // Also subscribe to ride updates relevant to this driver (cancellations, etc.)
                    webSocketService.subscribeToRideUpdates(parsedUser.id, handleRideUpdateEvent);
                },
                (error) => {
                    console.error('WebSocket error:', error);
                    addNotification('Real-time updates unavailable', 'warning');
                }
            );
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            navigate('/login');
        }
        
        return () => {
            webSocketService.disconnect();
        };
    }, [navigate]);

    // Settings removed; strict filters enabled by default

    // Update location periodically when online or during an active ride
    useEffect(() => {
        if ((isOnline || !!currentRide) && user && user.id) {
            const interval = setInterval(() => {
                getCurrentLocation()
                    .then(coords => {
                        setCurrentLocation([coords.lat, coords.lng]);
                        // Send location update to server
                        webSocketService.sendLocationUpdate(user.id, {
                            lat: coords.lat,
                            lng: coords.lng,
                            heading: 0,
                            speed: 0
                        });
                    })
                    .catch(err => console.log('Location error:', err));
            }, 10000); // Update every 10 seconds
            
            return () => clearInterval(interval);
        }
    }, [isOnline, currentRide, user]);

    // Poll for nearby rides when online
    useEffect(() => {
        if (isOnline && currentStatus === 'online' && user && user.id) {
            const interval = setInterval(() => {
                fetchNearbyRides();
            }, 5000); // Poll every 5 seconds

            fetchNearbyRides(); // Initial fetch
            return () => clearInterval(interval);
        }
        return undefined;
    }, [isOnline, currentStatus, user]);

    const loadEarnings = async (userId) => {
        if (!userId) {
            console.error('Cannot load earnings: User ID is null');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/rides/rider/${userId}`);
            if (response.ok) {
                const rides = await response.json();
                calculateEarnings(rides);
            } else if (response.status === 403 || response.status === 401) {
                console.error('Authentication failed while loading earnings');
                addNotification('Unable to load earnings right now. Please try again.', 'warning');
            }
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    };

    const calculateEarnings = (rides) => {
        const completedRides = rides.filter(r => r.status === 'COMPLETED');
        const total = completedRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
        
        const today = new Date().toDateString();
        const todayRides = completedRides.filter(r => 
            new Date(r.requestedAt).toDateString() === today
        );
        const todayTotal = todayRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekRides = completedRides.filter(r => 
            new Date(r.requestedAt) >= weekAgo
        );
        const weekTotal = weekRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
        
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthRides = completedRides.filter(r => 
            new Date(r.requestedAt) >= monthAgo
        );
        const monthTotal = monthRides.reduce((sum, r) => sum + (r.fare * 0.8), 0);
        
        setEarnings({
            today: todayTotal.toFixed(2),
            week: weekTotal.toFixed(2),
            month: monthTotal.toFixed(2),
            total: total.toFixed(2)
        });
    };

    const fetchNearbyRides = async () => {
        if (!isOnline) return;
        
        try {
            // Build URL with preferences if available
            let url = `${API_BASE}/rides/nearby?latitude=${currentLocation[0]}&longitude=${currentLocation[1]}&radius=10`;
            
            if (preferences) {
                if (preferences.minDistanceKm) url += `&minDistance=${preferences.minDistanceKm}`;
                if (preferences.maxDistanceKm) url += `&maxDistance=${preferences.maxDistanceKm}`;
                if (preferences.minFare) url += `&minFare=${preferences.minFare}`;
            }
            
            const response = await fetch(url);
            if (response.ok) {
                let rides = await response.json();
                console.log('Nearby rides fetched:', rides.length);
                if (driver?.vehicleType) {
                    const myType = String(driver.vehicleType).toLowerCase();
                    rides = rides.filter(r => String(r.vehicleType || '').toLowerCase() === myType);
                }
                setNearbyRides(rides);
                setFilteredRides(rides);
                
                // Show notification if new rides available
                if (rides.length > nearbyRides.length) {
                    const newRides = rides.length - nearbyRides.length;
                    addNotification(`${newRides} new ride request(s) nearby!`, 'success');
                    
                    // Auto-show first ride request if not already showing
                    if (rides.length > 0 && !showRideRequest && !currentRide) {
                        setRideRequests([rides[0]]);
                        setShowRideRequest(true);
                        console.log('Auto-showing ride request:', rides[0]);
                    }
                }
            } else {
                console.log('No nearby rides or API error');
            }
        } catch (error) {
            console.error('Error fetching nearby rides:', error);
        }
    };

    // Filter rides based on search query and exclude declined rides
    useEffect(() => {
        // First, filter out declined rides
        const availableRides = nearbyRides.filter(ride => !declinedRides.includes(ride.bookingId));
        
        if (!searchQuery.trim()) {
            setFilteredRides(availableRides);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = availableRides.filter(ride => 
                ride.pickupLocation?.toLowerCase().includes(query) ||
                ride.dropLocation?.toLowerCase().includes(query) ||
                ride.vehicleType?.toLowerCase().includes(query) ||
                ride.bookingId?.toLowerCase().includes(query)
            );
            setFilteredRides(filtered);
        }
    }, [searchQuery, nearbyRides, declinedRides]);

    const handleRideRequest = (request) => {
        console.log('New ride request:', request);
        setRideRequests(prev => [...prev, request]);
        setShowRideRequest(true);
        addNotification('New ride request!');
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('Audio play failed'));
    };

    const addNotification = (message, type = 'info') => {
        const notification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    };

    const handleRideUpdateEvent = (update) => {
        try {
            if (!update) return;
            console.log('Ride update (driver):', update);

            if (update.type === 'RIDE_CANCELLED') {
                addNotification('Ride was cancelled', 'warning');
                setCurrentRide(null);
                setCurrentStatus(isOnline ? 'online' : 'offline');
                setRouteCoords(null);
                return;
            }

            if (update.type === 'RIDE_STARTED') {
                addNotification('Ride started', 'success');
                return;
            }

            if (update.type === 'RIDE_COMPLETED') {
                addNotification('Ride completed', 'success');
                setCurrentRide(null);
                setCurrentStatus(isOnline ? 'online' : 'offline');
                setRouteCoords(null);
            }
        } catch (e) {
            console.warn('Failed to handle ride update event', e);
        }
    };
    
    const handleMapClick = async (latlng) => {
        if (currentStatus === 'on_trip') return;
        
        try {
            const response = await fetch(
                `/nominatim/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await response.json();
            const address = data.display_name;
            
            setCurrentLocation([latlng.lat, latlng.lng]);
            setMapCenter([latlng.lat, latlng.lng]);
            addNotification(`Service location updated to ${address.split(',')[0]}`, 'success');
            
            // Update location on server
            if (isOnline) {
                webSocketService.sendLocationUpdate(user.id, {
                    lat: latlng.lat,
                    lng: latlng.lng,
                    heading: 0,
                    speed: 0
                });
            }
        } catch (err) {
            console.error('Reverse geocoding error:', err);
            addNotification('Location updated', 'success');
        }
    };

    const handleToggleOnline = async () => {
        // Require emergency WhatsApp number before going online
        if (!user?.emergencyPhone) {
            addNotification('Please add your emergency WhatsApp number to go online.', 'warning');
            setShowEmergencyPhoneModal(true);
            return;
        }

        const newStatus = !isOnline;
        setIsOnline(newStatus);
        
        try {
            await fetch(`${API_BASE}/drivers/${user.id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isOnline: newStatus })
            });
            
            setCurrentStatus(newStatus ? 'online' : 'offline');
            addNotification(newStatus ? 'You are now online' : 'You are now offline');
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleAcceptRide = async (ride) => {
        // Guard: prevent duplicate accepts for the same booking
        if (!ride || !ride.bookingId) return;
        if (acceptingBookingId === ride.bookingId || currentRide) return;
        setAcceptingBookingId(ride.bookingId);
        setIsLoading(true);
        
        try {
            const response = await fetch(`${API_BASE}/rides/${ride.bookingId}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: user.id })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Accept response:', result);
                
                // Handle both old and new response formats
                const acceptedRide = result.ride || result;
                
                if (result.success === false) {
                    console.error('Failed to accept ride:', result.error);
                    addNotification(result.error || 'Failed to accept ride', 'error');
                } else {
                    // Show success animation
                    setShowSuccessAnimation(true);
                    
                    setTimeout(() => {
                        setCurrentRide(acceptedRide);
                        setCurrentStatus('on_trip');
                        // Center map to destination on trip start
                        try {
                            const dropLat = acceptedRide.dropLat || acceptedRide.dropLatitude;
                            const dropLng = acceptedRide.dropLng || acceptedRide.dropLongitude;
                            if (dropLat != null && dropLng != null) {
                                setMapCenter([dropLat, dropLng]);
                            }
                        } catch {}
                        setShowRideRequest(false);
                        setRideRequests(prev => prev.filter(r => r.bookingId !== ride.bookingId));
                        setNearbyRides(prev => prev.filter(r => r.bookingId !== ride.bookingId));
                        addNotification('Ride accepted successfully! 🎉', 'success');
                        
                        // Update earnings optimistically
                        const earning = ride.fare * 0.8;
                        setEarnings(prev => ({
                            ...prev,
                            today: (parseFloat(prev.today) + earning).toFixed(2)
                        }));
                    }, 1000);
                }
            } else {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error || 'Failed to accept ride';
                console.error('Failed to accept ride:', errorMessage);
                // If already accepted, treat as success by fetching details
                if (response.status === 400 && /already accepted/i.test(errorMessage)) {
                    try {
                        const detailsRes = await fetch(`${API_BASE}/rides/${ride.bookingId}`);
                        if (detailsRes.ok) {
                            const details = await detailsRes.json();
                            const acceptedRide = details.ride || details;
                            setCurrentRide(acceptedRide);
                            setCurrentStatus('on_trip');
                            try {
                                const dropLat = acceptedRide.dropLat || acceptedRide.dropLatitude;
                                const dropLng = acceptedRide.dropLng || acceptedRide.dropLongitude;
                                if (dropLat != null && dropLng != null) setMapCenter([dropLat, dropLng]);
                            } catch {}
                            setShowRideRequest(false);
                            setRideRequests(prev => prev.filter(r => r.bookingId !== ride.bookingId));
                            setNearbyRides(prev => prev.filter(r => r.bookingId !== ride.bookingId));
                            addNotification('Ride already accepted. Resuming trip view.', 'success');
                        } else {
                            addNotification(errorMessage, 'error');
                        }
                    } catch {
                        addNotification(errorMessage, 'error');
                    }
                } else {
                    addNotification(errorMessage, 'error');
                }
            }
        } catch (error) {
            console.error('Error accepting ride:', error);
            addNotification('Network error. Please check your connection.', 'error');
        }
        
        setIsLoading(false);
        setAcceptingBookingId(null);
    };

    // Accept handler when the card already completed the POST
    const handleAcceptRideFromCard = (acceptedRide) => {
        if (!acceptedRide || !acceptedRide.bookingId) return;
        setCurrentRide(acceptedRide);
        setCurrentStatus('on_trip');
        try {
            const dropLat = acceptedRide.dropLat || acceptedRide.dropLatitude;
            const dropLng = acceptedRide.dropLng || acceptedRide.dropLongitude;
            if (dropLat != null && dropLng != null) setMapCenter([dropLat, dropLng]);
        } catch {}
        setShowRideRequest(false);
        setRideRequests(prev => prev.filter(r => r.bookingId !== acceptedRide.bookingId));
        setNearbyRides(prev => prev.filter(r => r.bookingId !== acceptedRide.bookingId));
        addNotification('Ride accepted successfully! 🎉', 'success');
    };

    const handleDeclineRide = (rideOrBookingId) => {
        const bookingId = typeof rideOrBookingId === 'string' ? rideOrBookingId : rideOrBookingId.bookingId;
        
        // Add to declined rides list (won't show again in this session)
        setDeclinedRides(prev => [...prev, bookingId]);
        
        // Close modal
        setShowRideRequest(false);
        
        addNotification('Ride declined - will be removed in 2 minutes', 'warning');
        
        // Auto-remove from all lists after 2 minutes
        setTimeout(() => {
            setRideRequests(prev => prev.filter(r => r.bookingId !== bookingId));
            setNearbyRides(prev => prev.filter(r => r.bookingId !== bookingId));
            setFilteredRides(prev => prev.filter(r => r.bookingId !== bookingId));
            setDeclinedRides(prev => prev.filter(id => id !== bookingId));
            console.log(`Ride ${bookingId} auto-removed after 2 minutes`);
        }, 120000); // 2 minutes = 120000ms
    };

    const handleStartRide = async () => {
        if (!currentRide) return;
        setOtpModalOpen(true);
    };

    const verifyAndStart = async () => {
        if (!currentRide || otpInput.length !== 4) return;
        setOtpLoading(true);
        try {
            const res = await fetch(`${API_BASE}/rides/${currentRide.bookingId}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: otpInput })
            });
            if (!res.ok) {
                addNotification('Incorrect OTP. Please try again.', 'error');
                setOtpLoading(false);
                return;
            }
            await fetch(`${API_BASE}/rides/${currentRide.bookingId}/start`, { method: 'POST' }).catch(() => {});
            addNotification('OTP verified. Ride started!', 'success');
            setOtpModalOpen(false);
            setOtpInput('');
            setCurrentStatus('on_trip');
            try {
                const dropLat = currentRide.dropLat || currentRide.dropLatitude;
                const dropLng = currentRide.dropLng || currentRide.dropLongitude;
                if (dropLat != null && dropLng != null && currentLocation) {
                    const route = await getRoute(currentLocation, [dropLat, dropLng]);
                    if (route && route.coordinates) {
                        setRouteCoords(route.coordinates);
                    }
                }
            } catch {}
        } catch {
            addNotification('Network error verifying OTP', 'error');
        }
        setOtpLoading(false);
    };

    const handleCompleteRide = async () => {
        if (!currentRide) return;
        
        try {
            await fetch(`${API_BASE}/rides/${currentRide.bookingId}/complete`, {
                method: 'POST'
            });
            
            addNotification('Ride completed!', 'success');
            setCurrentRide(null);
            setCurrentStatus('online');
            setRouteCoords(null);
            
            // Reload earnings
            loadEarnings(user.id);
        } catch (error) {
            console.error('Error completing ride:', error);
            addNotification('Error completing ride', 'error');
        }
    };

    const handleCancelTrip = async () => {
        if (!currentRide) return;
        
        if (!window.confirm('Are you sure you want to cancel this trip? This may affect your rating.')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/rides/${currentRide.bookingId}/cancel`, {
                method: 'POST'
            });
            
            if (response.ok) {
                addNotification('Trip cancelled', 'warning');
                setCurrentRide(null);
                setCurrentStatus('online');
                setRouteCoords(null);
            } else {
                addNotification('Failed to cancel trip', 'error');
            }
        } catch (error) {
            console.error('Error cancelling trip:', error);
            addNotification('Error cancelling trip', 'error');
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim() || !currentRide) return;

        const message = {
            sender: 'driver',
            text: chatInput,
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, message]);
        webSocketService.sendChatMessage(currentRide.bookingId, user.id, chatInput);
        setChatInput('');
    };

    const handleNavigateToPickup = () => {
        if (!currentRide) return;
        const lat = currentRide.pickupLat || currentRide.pickupLatitude;
        const lng = currentRide.pickupLng || currentRide.pickupLongitude;
        if (lat == null || lng == null) {
            addNotification('Pickup location not available yet. Please wait a moment.', 'warning');
            return;
        }
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    if (!user) return null;

    const currentRequest = rideRequests[0];

    return (
        <div className="uber-map-container">
            {showEmergencyPhoneModal && user && (
                <EmergencyPhoneModal
                    user={user}
                    required={!user?.emergencyPhone}
                    onClose={() => {
                        if (!user?.emergencyPhone) return;
                        setShowEmergencyPhoneModal(false);
                        try { localStorage.removeItem('needsEmergencyPhone'); } catch {}
                    }}
                    onSaved={(newUser) => {
                        setUser(newUser);
                        setShowEmergencyPhoneModal(false);
                        try { localStorage.removeItem('needsEmergencyPhone'); } catch {}
                    }}
                />
            )}

            {/* Settings removed as requested */}
            {/* Success Animation */}
            {showSuccessAnimation && (
                <SuccessAnimation 
                    message="Ride Accepted!"
                    onComplete={() => setShowSuccessAnimation(false)}
                />
            )}

            {/* Chat Panel (Rider) - unified with customer */}
            {currentRide && showChatWidget && (
                <div className="uber-floating-card uber-floating-card-right" style={{ width: '360px', height: '60vh', zIndex: 1003 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                        <h4 style={{ margin: 0 }}>Chat with Customer</h4>
                        <button className="uber-btn-icon" onClick={() => setShowChatWidget(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style={{ height: 'calc(100% - 44px)' }}>
                        <RealTimeChat 
                            rideId={currentRide.bookingId}
                            userId={user?.id}
                            userName={user?.name || 'Driver'}
                            userType="rider"
                            showHeader={false}
                        />
                    </div>
                </div>
            )}

            {/* Floating Chat Toggle Button (Rider) */}
            {currentRide && !showChatWidget && (
                <div className="uber-chat-widget">
                    <button className="uber-chat-button" onClick={() => setShowChatWidget(true)} title="Open chat">
                        💬
                    </button>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <LoadingSpinner fullScreen message="Processing..." />
            )}

            {/* Map */}
            <MapContainer 
                center={mapCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <MapUpdater center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} enabled={currentStatus !== 'on_trip'} />
                {routeCoords && <Polyline positions={routeCoords} color="#007AFF" weight={6} />} 
                {routeCoords && <FitBounds coordinates={routeCoords} />}
                
                {/* Current location marker */}
                <Marker position={currentLocation} icon={createCustomIcon('#00C853', 'car')}>
                    <Popup>Your Location</Popup>
                </Marker>
                
                {/* Nearby ride markers */}
                {isOnline && currentStatus !== 'on_trip' && filteredRides.map((ride, index) => {
                    const lat = ride.pickupLat || ride.pickupLatitude;
                    const lng = ride.pickupLng || ride.pickupLongitude;
                    if (!lat || !lng) return null;
                    return (
                        <Marker 
                            key={index}
                            position={[lat, lng]} 
                            icon={createCustomIcon('#FFD700', 'user')}
                        >
                            <Popup>
                                <div>
                                    <strong>Ride Request</strong><br/>
                                    {ride.pickupLocation}<br/>
                                    ₹{ride.fare}<br/>
                                    Distance: {ride.rideDistance || ride.distance}km
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                
                {/* Current ride pickup marker */}
                {currentRide && (() => {
                    const lat = currentRide.pickupLat || currentRide.pickupLatitude;
                    const lng = currentRide.pickupLng || currentRide.pickupLongitude;
                    if (!lat || !lng) return null;
                    return (
                        <Marker 
                            position={[lat, lng]} 
                            icon={createCustomIcon('#000000', 'location-dot')}
                        >
                            <Popup>Pickup Location</Popup>
                        </Marker>
                    );
                })()}
                
                {/* Current ride destination marker */}
                {currentRide && (() => {
                    const lat = currentRide.dropLat || currentRide.dropLatitude;
                    const lng = currentRide.dropLng || currentRide.dropLongitude;
                    if (!lat || !lng) return null;
                    return (
                        <Marker 
                            position={[lat, lng]} 
                            icon={createCustomIcon('#D32F2F', 'flag-checkered')}
                        >
                            <Popup>Destination</Popup>
                        </Marker>
                    );
                })()}
                
                {/* Route line from driver to pickup to destination */}
                {currentRide && (() => {
                    const pickupLat = currentRide.pickupLat || currentRide.pickupLatitude;
                    const pickupLng = currentRide.pickupLng || currentRide.pickupLongitude;
                    const dropLat = currentRide.dropLat || currentRide.dropLatitude;
                    const dropLng = currentRide.dropLng || currentRide.dropLongitude;
                    
                    if (!pickupLat || !pickupLng || !dropLat || !dropLng) return null;
                    
                    // Route: Driver -> Pickup -> Destination
                    const routePoints = [
                        currentLocation, // Driver's current location
                        [pickupLat, pickupLng], // Pickup location
                        [dropLat, dropLng] // Destination
                    ];
                    
                    return (
                        <>
                            {/* Driver to Pickup (Blue dashed line) */}
                            <Polyline 
                                positions={[currentLocation, [pickupLat, pickupLng]]}
                                pathOptions={{ 
                                    color: '#2196F3', 
                                    weight: 4,
                                    opacity: 0.8,
                                    dashArray: '10, 10'
                                }}
                            />
                            {/* Pickup to Destination (Green solid line) */}
                            <Polyline 
                                positions={[[pickupLat, pickupLng], [dropLat, dropLng]]}
                                pathOptions={{ 
                                    color: '#00C853', 
                                    weight: 4,
                                    opacity: 0.8
                                }}
                            />
                        </>
                    );
                })()}
                
                {/* Service radius circle */}
                {isOnline && currentStatus !== 'on_trip' && (
                    <Circle
                        center={currentLocation}
                        radius={5000}
                        pathOptions={{ 
                            color: '#00C853', 
                            fillColor: '#00C853', 
                            fillOpacity: 0.1,
                            weight: 2
                        }}
                    />
                )}
            </MapContainer>

            {/* Floating Header */}
            <div className="uber-header" style={{ background: 'rgba(0, 0, 0, 0.9)', color: '#fff' }}>
                <div className="uber-logo" style={{ color: '#fff' }}>ApnaRide Driver</div>
                <div className="uber-header-actions">
                    {/* Earnings Display */}
                    <div style={{ 
                        background: '#00C853', 
                        padding: '8px 16px', 
                        borderRadius: '20px',
                        fontWeight: '700'
                    }}>
                        ₹{earnings.today}
                    </div>
                    
                    {notifications.length > 0 && (
                        <button className="uber-btn-icon" style={{ position: 'relative', background: '#fff' }}>
                            <i className="fa-solid fa-bell"></i>
                            <span className="uber-notification-badge">{notifications.length}</span>
                        </button>
                    )}
                    
                    <button 
                        className="uber-btn-icon"
                        style={{ background: '#fff' }}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <i className="fa-solid fa-user"></i>
                    </button>
                </div>
            </div>

            {/* Profile Menu */}
            {showProfileMenu && (
                <div className="scale-in" style={{
                    position: 'fixed',
                    top: '70px',
                    right: '20px',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    padding: '12px',
                    minWidth: '280px',
                    zIndex: 1001
                }}>
                    {[
                        { icon: 'fa-gauge-high', label: 'Overview', color: '#2196F3', tab: 'overview' },
                        { icon: 'fa-clock-rotate-left', label: 'Trip History', color: '#9C27B0', tab: 'history' },
                        { icon: 'fa-wallet', label: 'Earnings', color: '#00C853', tab: 'earnings' },
                        { icon: 'fa-car', label: 'Vehicle Info', color: '#FF9800', tab: 'vehicle' },
                        { icon: 'fa-shield-heart', label: 'Privacy & Safety', color: '#F44336', tab: 'privacy' },
                        { icon: 'fa-sliders', label: 'Ride Preferences', color: '#00BCD4', tab: 'preferences' }
                    ].map((item, index) => (
                        <div 
                            key={index}
                            className="modern-card"
                            onClick={() => { setShowProfileMenu(false); navigate(`/rider/profile?tab=${item.tab}`); }}
                            style={{
                                padding: '14px 16px',
                                borderRadius: '12px',
                                marginBottom: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                transition: 'all 0.2s',
                                background: '#fff',
                                border: '1px solid #f0f0f0'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `${item.color}10`;
                                e.currentTarget.style.borderColor = item.color;
                                e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.borderColor = '#f0f0f0';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}40 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: '18px' }}></i>
                            </div>
                            <span style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{item.label}</span>
                        </div>
                    ))}
                    
                    <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }}></div>
                    
                    <div 
                        className="modern-card"
                        onClick={() => {
                            localStorage.removeItem('user');
                            navigate('/login');
                        }}
                        style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            transition: 'all 0.2s',
                            background: '#fff',
                            border: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FFEBEE';
                            e.currentTarget.style.borderColor = '#F44336';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#f0f0f0';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="fa-solid fa-right-from-bracket" style={{ color: '#F44336', fontSize: '18px' }}></i>
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '15px', color: '#F44336' }}>Sign Out</span>
                    </div>
                </div>
            )}

            {/* Left Sidebar - Rides List */}
            {isOnline && currentStatus === 'online' && (
                <motion.div
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -400, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 100 }}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: '80px',
                        bottom: 0,
                        width: '380px',
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px',
                        borderBottom: '2px solid #f0f0f0',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}>
                        <h2 style={{ 
                            margin: 0, 
                            fontSize: '20px', 
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fa-solid fa-list"></i>
                            Available Rides
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.3)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                marginLeft: 'auto'
                            }}>
                                {filteredRides.length}
                            </span>
                        </h2>
                        
                        {/* Search Box */}
                        <div style={{ position: 'relative', marginTop: '16px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search rides..."
                                style={{
                                    width: '100%',
                                    padding: '12px 40px 12px 40px',
                                    borderRadius: '25px',
                                    border: 'none',
                                    fontSize: '14px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    color: '#000',
                                    outline: 'none'
                                }}
                            />
                            <i className="fa-solid fa-search" style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#666',
                                fontSize: '14px'
                            }}></i>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#666',
                                        fontSize: '16px',
                                        padding: '4px'
                                    }}
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Rides List */}
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        {filteredRides.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#999'
                            }}>
                                <i className="fa-solid fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                    {searchQuery ? 'No rides match your search' : 'No rides available'}
                                </p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                                    {searchQuery ? 'Try a different search term' : 'Waiting for new ride requests...'}
                                </p>
                            </div>
                        ) : (
                            filteredRides.map((ride, index) => (
                                <motion.div
                                    key={ride.bookingId || index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    onClick={() => {
                                        setRideRequests([ride]);
                                        setShowRideRequest(true);
                                    }}
                                    style={{
                                        padding: '16px',
                                        marginBottom: '12px',
                                        background: '#fff',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        border: '2px solid #f0f0f0',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                                            color: '#000',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <i className="fa-solid fa-rupee-sign"></i>
                                            {Math.round(ride.fare)}
                                        </div>
                                        <div style={{
                                            background: '#f8f9fa',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: '#666'
                                        }}>
                                            {ride.vehicleType || 'Bike'}
                                        </div>
                                    </div>

                                    {/* Pickup */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ 
                                            fontSize: '11px', 
                                            color: '#999', 
                                            marginBottom: '4px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="fa-solid fa-circle" style={{ color: '#00ff88', marginRight: '6px', fontSize: '8px' }}></i>
                                            Pickup
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#333', fontWeight: '500', paddingLeft: '14px' }}>
                                            {ride.pickupLocation?.substring(0, 45)}{ride.pickupLocation?.length > 45 ? '...' : ''}
                                        </div>
                                    </div>

                                    {/* Destination */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ 
                                            fontSize: '11px', 
                                            color: '#999', 
                                            marginBottom: '4px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="fa-solid fa-circle" style={{ color: '#ff4757', marginRight: '6px', fontSize: '8px' }}></i>
                                            Destination
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#333', fontWeight: '500', paddingLeft: '14px' }}>
                                            {ride.dropLocation?.substring(0, 45)}{ride.dropLocation?.length > 45 ? '...' : ''}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #f0f0f0',
                                        fontSize: '12px',
                                        color: '#666'
                                    }}>
                                        <span>
                                            <i className="fa-solid fa-route" style={{ marginRight: '4px' }}></i>
                                            {ride.rideDistance ? `${ride.rideDistance.toFixed(1)} km` : 
                                             ride.pickupDistance ? `${ride.pickupDistance.toFixed(1)} km away` : '~5 km'}
                                        </span>
                                        <span style={{ 
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            background: '#f8f9fa',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {ride.bookingId}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}

            {/* Advanced Toast Notifications */}
            <AdvancedToast 
                notifications={notifications}
                onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />

            {/* OTP Modal for driver */}
            <OtpModal 
                open={otpModalOpen}
                otp={otpInput}
                onChange={setOtpInput}
                onVerify={verifyAndStart}
                onResend={() => setOtpInput('')}
                onClose={() => setOtpModalOpen(false)}
                loading={otpLoading}
                error={null}
                phone={null}
            />

            {/* Online/Offline Toggle - Draggable Floating Card */}
            {currentStatus !== 'on_trip' && (
                <div 
                    className="uber-floating-card uber-fade-in"
                    style={{
                        position: 'fixed',
                        right: panelPosition.x === null ? '20px' : 'auto',
                        left: panelPosition.x !== null ? `${panelPosition.x}px` : 'auto',
                        top: `${panelPosition.y}px`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: 1001,
                        userSelect: 'none'
                    }}
                    onMouseDown={(e) => {
                        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
                            setIsDragging(true);
                            setDragStart({
                                x: e.clientX - (panelPosition.x || window.innerWidth - e.currentTarget.offsetWidth - 20),
                                y: e.clientY - panelPosition.y
                            });
                        }
                    }}
                    onMouseMove={(e) => {
                        if (isDragging) {
                            setPanelPosition({
                                x: e.clientX - dragStart.x,
                                y: e.clientY - dragStart.y
                            });
                        }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    <div className="uber-earnings-card" style={{ marginBottom: '20px', position: 'relative' }}>
                        {/* Drag Handle Indicator */}
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '12px',
                            cursor: 'grab'
                        }}>
                            <i className="fa-solid fa-grip-vertical"></i>
                        </div>
                        <div className="uber-earnings-label">Today's Earnings</div>
                        <div className="uber-earnings-amount">₹{earnings.today}</div>
                        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
                            This Week: ₹{earnings.week}
                        </div>
                    </div>

                    <div style={{ 
                        background: '#fff', 
                        padding: '20px', 
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: isOnline 
                                    ? 'linear-gradient(135deg, #00C853 0%, #00A040 100%)' 
                                    : 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)',
                                color: '#fff',
                                textAlign: 'center',
                                boxShadow: isOnline 
                                    ? '0 8px 24px rgba(0, 200, 83, 0.3)' 
                                    : '0 8px 24px rgba(255, 82, 82, 0.3)',
                                transition: 'all 0.3s ease',
                                animation: isOnline ? 'pulse 2s infinite' : 'none'
                            }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '18px',
                                    fontWeight: '600'
                                }}>
                                    <span style={{ 
                                        width: '12px', 
                                        height: '12px', 
                                        borderRadius: '50%', 
                                        background: '#fff',
                                        animation: isOnline ? 'pulse 1.5s infinite' : 'none'
                                    }}></span>
                                    {isOnline ? '🟢 You are Online' : '🔴 You are Offline'}
                                </div>
                                <div style={{ 
                                    fontSize: '13px', 
                                    marginTop: '6px',
                                    opacity: 0.9
                                }}>
                                    {isOnline ? 'Accepting ride requests' : 'Not accepting requests'}
                                </div>
                            </div>
                        </div>

                        <button
                            className="modern-btn"
                            style={{ 
                                width: '100%',
                                background: isOnline 
                                    ? 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)'
                                    : 'linear-gradient(135deg, #00C853 0%, #00A040 100%)',
                                fontSize: '16px',
                                padding: '16px',
                                fontWeight: '700',
                                boxShadow: isOnline 
                                    ? '0 4px 15px rgba(255, 82, 82, 0.3)'
                                    : '0 4px 15px rgba(0, 200, 83, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={handleToggleOnline}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = isOnline 
                                    ? '0 6px 20px rgba(255, 82, 82, 0.4)'
                                    : '0 6px 20px rgba(0, 200, 83, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = isOnline 
                                    ? '0 4px 15px rgba(255, 82, 82, 0.3)'
                                    : '0 4px 15px rgba(0, 200, 83, 0.3)';
                            }}
                        >
                            <i className={`fa-solid fa-${isOnline ? 'power-off' : 'bolt'}`} style={{ marginRight: '8px' }}></i>
                            {isOnline ? 'Go Offline' : 'Go Online Now'}
                        </button>

                        <button
                            className="modern-btn modern-btn-secondary ripple"
                            style={{ width: '100%', marginTop: '12px', fontSize: '15px' }}
                            onClick={() => setShowPreferences(true)}
                        >
                            <i className="fa-solid fa-sliders" style={{ marginRight: '8px' }}></i>
                            Ride Preferences
                        </button>

                        {isOnline && (
                            <p style={{ 
                                marginTop: '12px', 
                                fontSize: '14px', 
                                color: '#666',
                                textAlign: 'center'
                            }}>
                                {preferences && (preferences.minDistanceKm > 0 || preferences.maxDistanceKm < 100) ? (
                                    <>
                                        <i className="fa-solid fa-filter" style={{ marginRight: '6px', color: '#00C853' }}></i>
                                        Filters active: {preferences.minDistanceKm}-{preferences.maxDistanceKm}km
                                    </>
                                ) : (
                                    "You're accepting ride requests"
                                )}
                            </p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="uber-stats-grid" style={{ marginTop: '20px' }}>
                        <div className="uber-stat-card">
                            <div className="uber-stat-icon">🚗</div>
                            <div className="uber-stat-value">{stats.totalRides}</div>
                            <div className="uber-stat-label">Total Rides</div>
                        </div>
                        <div className="uber-stat-card">
                            <div className="uber-stat-icon">⭐</div>
                            <div className="uber-stat-value">{stats.rating}</div>
                            <div className="uber-stat-label">Rating</div>
                        </div>
                    </div>

                    {/* Info Message - Rides shown in left sidebar */}
                    {isOnline && filteredRides.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                padding: '16px',
                                borderRadius: '12px',
                                color: '#fff',
                                textAlign: 'center'
                            }}>
                                <i className="fa-solid fa-arrow-left" style={{ fontSize: '24px', marginBottom: '8px' }}></i>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                    {filteredRides.length} ride{filteredRides.length !== 1 ? 's' : ''} available
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                                    Check the left sidebar to view and accept rides
                                </p>
                            </div>
                        </div>
                    )}

                    {/* No Rides Message */}
                    {isOnline && filteredRides.length === 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{
                                background: '#fff',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                textAlign: 'center'
                            }}>
                                <i className="fa-solid fa-hourglass-half" style={{ fontSize: '32px', color: '#999', marginBottom: '12px' }}></i>
                                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
                                    Waiting for ride requests...
                                </p>
                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                                    Stay online to receive new requests
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Animated Background */}
            <SimpleAnimatedBackground variant="rider" />

            {/* 3D Ride Request Modal */}
            {showRideRequest && currentRequest && (
                <RideRequestCard3D
                    ride={currentRequest}
                    driverId={user.id}
                    onAccept={handleAcceptRideFromCard}
                    onDecline={handleDeclineRide}
                />
            )}

            {/* Old Ride Request Modal - BACKUP */}
            {false && showRideRequest && currentRequest && (
                <div className="uber-floating-card uber-slide-up" style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '500px',
                    width: '90%',
                    zIndex: 1003
                }}>
                    <div className="uber-ride-request">
                        <div className="uber-ride-request-header">
                            <h2 className="uber-ride-request-title">New Ride Request!</h2>
                            <div className="uber-ride-request-pulse">
                                <i className="fa-solid fa-bell"></i>
                            </div>
                        </div>

                        {/* Booking ID */}
                        <div style={{ 
                            background: '#F5F5F5', 
                            padding: '12px', 
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <p style={{ fontSize: '12px', color: '#666' }}>Booking ID</p>
                            <p style={{ fontWeight: '700', fontFamily: 'monospace' }}>
                                {currentRequest.bookingId}
                            </p>
                        </div>

                        {/* Route */}
                        <div className="uber-route">
                            <div className="uber-route-line">
                                <div className="uber-route-dot" style={{ background: '#00C853' }}></div>
                                <div className="uber-route-connector"></div>
                                <div className="uber-route-dot" style={{ background: '#D32F2F' }}></div>
                            </div>
                            <div className="uber-route-info">
                                <div style={{ marginBottom: '20px' }}>
                                    <p className="uber-route-label">Pickup</p>
                                    <p className="uber-route-address">{currentRequest.pickupLocation}</p>
                                </div>
                                <div>
                                    <p className="uber-route-label">Drop</p>
                                    <p className="uber-route-address">{currentRequest.dropLocation}</p>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="uber-stats-grid" style={{ margin: '20px 0' }}>
                            <div className="uber-stat-card">
                                <div className="uber-stat-icon">📍</div>
                                <div className="uber-stat-value">
                                    {currentRequest.distance ? `${currentRequest.distance.toFixed(1)} km` : '5.2 km'}
                                </div>
                                <div className="uber-stat-label">Distance</div>
                            </div>
                            <div className="uber-stat-card">
                                <div className="uber-stat-icon">🚗</div>
                                <div className="uber-stat-value">{currentRequest.vehicleType}</div>
                                <div className="uber-stat-label">Vehicle</div>
                            </div>
                            <div className="uber-stat-card">
                                <div className="uber-stat-icon">⏱️</div>
                                <div className="uber-stat-value">~8 min</div>
                                <div className="uber-stat-label">ETA</div>
                            </div>
                        </div>

                        {/* Earnings */}
                        <div style={{
                            background: 'linear-gradient(135deg, #00C853 0%, #00A040 100%)',
                            color: '#fff',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '14px', opacity: 0.9 }}>Your Earnings</p>
                                    <p style={{ fontSize: '12px', opacity: 0.8 }}>(80% of fare)</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '32px', fontWeight: '700' }}>
                                        ₹{(currentRequest.fare * 0.8).toFixed(2)}
                                    </p>
                                    <p style={{ fontSize: '12px', opacity: 0.8 }}>
                                        Total: ₹{currentRequest.fare}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="uber-btn uber-btn-outline"
                                style={{ flex: 1 }}
                                onClick={() => handleDeclineRide(currentRequest)}
                                disabled={isLoading}
                            >
                                <i className="fa-solid fa-times"></i>
                                Decline
                            </button>
                            <button
                                className="uber-btn uber-btn-success"
                                style={{ flex: 1 }}
                                onClick={() => handleAcceptRide(currentRequest)}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="uber-spinner"></span>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        Accept Ride
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Trip Panel */}
            {currentStatus === 'on_trip' && currentRide && (
                <div className="uber-floating-card uber-floating-card-left uber-fade-in">
                    <div style={{ 
                        background: 'linear-gradient(135deg, #4285F4 0%, #0D47A1 100%)',
                        color: '#fff',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                            <i className="fa-solid fa-route" style={{ marginRight: '8px' }}></i>
                            On Trip
                        </h3>
                        <p style={{ fontSize: '14px', opacity: 0.9 }}>
                            {currentRide.bookingId}
                        </p>
                    </div>

                    {/* Customer Info */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        padding: '16px',
                        background: '#F5F5F5',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: '#000',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: '700'
                        }}>
                            {currentRide.customerName?.charAt(0) || 'C'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                                {currentRide.customerName || 'Customer'}
                            </p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                {currentRide.customerPhone || 'Phone not available'}
                            </p>
                        </div>
                        <button 
                            className="uber-btn-icon"
                            onClick={() => setShowChatWidget(true)}
                        >
                            <i className="fa-solid fa-comment"></i>
                        </button>
                    </div>

                    {/* Route Info */}
                    <div className="uber-route" style={{ marginBottom: '20px' }}>
                        <div className="uber-route-line">
                            <div className="uber-route-dot" style={{ background: '#00C853' }}></div>
                            <div className="uber-route-connector"></div>
                            <div className="uber-route-dot" style={{ background: '#D32F2F' }}></div>
                        </div>
                        <div className="uber-route-info">
                            <div style={{ marginBottom: '20px' }}>
                                <p className="uber-route-label">Pickup</p>
                                <p className="uber-route-address">{currentRide.pickupLocation}</p>
                            </div>
                            <div>
                                <p className="uber-route-label">Drop</p>
                                <p className="uber-route-address">{currentRide.dropLocation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Earnings */}
                    <div style={{
                        padding: '16px',
                        background: '#E8F5E9',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>Your Earning</span>
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#00C853' }}>
                            ₹{(currentRide.fare * 0.8).toFixed(2)}
                        </span>
                    </div>

                    {/* Actions */}
                    <button
                        className="uber-btn uber-btn-primary"
                        style={{ width: '100%', marginBottom: '12px' }}
                        onClick={handleNavigateToPickup}
                    >
                        <i className="fa-solid fa-navigation"></i>
                        Navigate
                    </button>

                    <button
                        className="uber-btn uber-btn-outline"
                        style={{ width: '100%', marginBottom: '12px' }}
                        onClick={handleStartRide}
                        disabled={currentRide.status === 'IN_PROGRESS' || currentRide.status === 'COMPLETED'}
                    >
                        <i className="fa-solid fa-play"></i>
                        {currentRide.status === 'IN_PROGRESS' ? 'Ride Started' : 'Verify OTP & Start'}
                    </button>

                    <button
                        className="uber-btn uber-btn-success"
                        style={{ width: '100%', marginBottom: '12px' }}
                        onClick={handleCompleteRide}
                    >
                        <i className="fa-solid fa-flag-checkered"></i>
                        Complete Ride
                    </button>

                    <button
                        className="uber-btn uber-btn-outline"
                        style={{ 
                            width: '100%', 
                            background: '#DC3545',
                            color: '#fff',
                            border: 'none'
                        }}
                        onClick={handleCancelTrip}
                    >
                        <i className="fa-solid fa-times-circle"></i>
                        Cancel Trip
                    </button>
                </div>
            )}

            {/* Legacy rider chat widget removed; using unified RealTimeChat panel above */}

            {/* Preferences Modal */}
            {showPreferences && user && (
                <RiderPreferences
                    driverId={user.id}
                    onClose={() => setShowPreferences(false)}
                    onSave={(savedPrefs) => {
                        setPreferences(savedPrefs);
                        setShowPreferences(false);
                        addNotification('Preferences saved successfully!', 'success');
                        // Refresh nearby rides with new preferences
                        fetchNearbyRides();
                    }}
                />
            )}
        </div>
    );
}
