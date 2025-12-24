import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../uber-style.css';
import '../../modern-animations.css';
import { geocodeAddress, calculateDistance, getCurrentLocation } from '../../services/geocodingService';
import { getRoute, animateMarker } from '../../services/routingService';
import webSocketService from '../../services/webSocketService';
import OtpModal from '../Common/OtpModal';
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import AdvancedToast from '../Animations/AdvancedToast';
import LoadingSpinner from '../Animations/LoadingSpinner';
import RideTrackingAnimation from '../Animations/RideTrackingAnimation';
import RideRatingModal from '../Common/RideRatingModal';
import RealTimeChat from '../Common/RealTimeChat';
import EmergencyPhoneModal from '../Common/EmergencyPhoneModal';
// removed unused import of motion to avoid lint warnings
import CampaignBanner from '../Common/CampaignBanner';

// Fix Leaflet default icon — guarded to avoid TS/parse errors in some editors
if (typeof L !== 'undefined' && L && L.Icon && L.Icon.Default && typeof L.Icon.Default.mergeOptions === 'function') {
    try {
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    } catch {
        // ignore
    }
}

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

// Custom marker icons
const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
};

// Create a rotated driver icon using CSS transform on the inner element
// Small SVG arrow marker to reduce bitmap/icon size
const createRotatedIcon = (color, bearing = 0) => {
    const imgUrl = '/assets/driver-arrow.svg';
    const html = `<div class="driver-pulse"><img src="${imgUrl}" style="width:28px;height:28px;transform: rotate(${bearing}deg);"/></div>`;
    return L.divIcon({
        className: 'custom-marker svg-marker',
        html,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
};

// Compute bearing in degrees from point A to B
const computeBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (d) => d * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    let brng = toDeg(Math.atan2(y, x));
    brng = (brng + 360) % 360;
    return brng;
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

export default function UberStyleCustomerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showEmergencyPhoneModal, setShowEmergencyPhoneModal] = useState(false);
    const [pendingSOS, setPendingSOS] = useState(false);
    const [step, setStep] = useState('search'); // search, selecting, booking, tracking, completed
    const [isBottomSheetCollapsed, setIsBottomSheetCollapsed] = useState(false);
    
    // Location states
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [pickupCoords, setPickupCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    
    // Ride states
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [currentRide, setCurrentRide] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    
    // UI states
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showChatWidget, setShowChatWidget] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [notifications, setNotifications] = useState([]);
    
    // Route and rating states
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [completedRideDetails, setCompletedRideDetails] = useState(null);
    const [liveETA, setLiveETA] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(() => {
        try { return !!JSON.parse(localStorage.getItem('settings_customer') || '{}').showHeatmap; } catch { return false; }
    });
    const [heatPoints, setHeatPoints] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const dragStartYRef = useRef(null);
    const [sosCountdown, setSosCountdown] = useState(0);
    const sosTimerRef = useRef(null);
    // Preview route info (distance in meters, duration in seconds)
    const [previewRouteInfo, setPreviewRouteInfo] = useState(null);
    const [driverToPickupRoute, setDriverToPickupRoute] = useState(null);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpInput, setOtpInput] = useState('');
    
    // Nearby drivers
    const [nearbyDrivers, setNearbyDrivers] = useState([]);
    const [rideTimeout, setRideTimeout] = useState(null);
    const stepRef = useRef(step);
    useEffect(() => { stepRef.current = step; }, [step]);
    
    // Saved places
    const [savedPlaces, setSavedPlaces] = useState({
        home: null,
        work: null
    });
    
    // Promo code
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    
    // Chat
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Keep refs to latest values to use inside a stable WS handler without deps
    const pickupCoordsRef = useRef(pickupCoords);
    const driverLocationRef = useRef(driverLocation);
    const currentRideRef = useRef(currentRide);
    const otpHydrateInFlightRef = useRef(null); // bookingId currently hydrating
    // Debounce and request tracking for faster, race-free geocoding
    const pickupDebounce = useRef(null);
    const destDebounce = useRef(null);
    const pickupReqId = useRef(0);
    const destReqId = useRef(0);

    useEffect(() => { pickupCoordsRef.current = pickupCoords; }, [pickupCoords]);
    useEffect(() => { driverLocationRef.current = driverLocation; }, [driverLocation]);
    useEffect(() => { currentRideRef.current = currentRide; }, [currentRide]);

    const addNotification = useCallback((message, type = 'info') => {
        const notification = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    }, []);

    // Fallback: if in tracking and currentRide exists but otp missing, fetch details to hydrate OTP
    useEffect(() => {
        const needOtp = step === 'tracking' && currentRide && !currentRide.otp && currentRide.bookingId;
        if (!needOtp) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/rides/${currentRide.bookingId}`);
                if (!res.ok) return;
                const ride = await res.json();
                if (cancelled) return;
                setCurrentRide(prev => ({ ...(prev || {}), ...(ride || {}), otp: ride?.otp ?? prev?.otp }));
                console.log('Hydrated OTP from GET /rides:', ride?.otp);
            } catch (e) {
                console.warn('Failed to hydrate OTP', e);
            }
        })();
        return () => { cancelled = true; };
    }, [step, currentRide]);

    const clearOldRides = async (userId) => {
        try {
            // Cancel any pending rides older than 5 minutes
            const res = await fetch(`${API_BASE}/rides/customer/${userId}/clear-pending`, {
                method: 'DELETE'
            });
            if (res.ok) {
                console.log('Old pending rides cleared');
            }
        } catch (error) {
            console.error('Error clearing old rides:', error);
        }
    };

    // Subscribe to driver's live location when a ride has a driverId
    useEffect(() => {
        if (!user || !currentRide || !currentRide.driverId) return undefined;

        let subscription = null;
        try {
            subscription = webSocketService.subscribeToDriverLocation(currentRide.driverId, (loc) => {
                try {
                    const lat = loc?.latitude ?? loc?.lat;
                    const lng = loc?.longitude ?? loc?.lng;
                    if (lat != null && lng != null) setDriverLocation([lat, lng]);
                } catch {}
            });
        } catch (e) {
            console.warn('Driver location subscribe failed', e);
        }

        return () => {
            try { if (subscription) subscription.unsubscribe(); } catch {}
        };
    }, [user, currentRide?.driverId]);

    const fetchNearbyDrivers = useCallback(async () => {
        if (!currentLocation) return;
        try {
            const response = await fetch(`${API_BASE}/drivers/nearby?lat=${currentLocation[0]}&lng=${currentLocation[1]}&radius=5`);
            if (response.ok) {
                const drivers = await response.json();
                setNearbyDrivers(drivers);
            }
        } catch (error) {
            console.error('Error fetching nearby drivers:', error);
        }
    }, [currentLocation]);

    const handleRideUpdate = useCallback((update) => {
        console.log('Ride update:', update);
        if (update.type === 'RIDE_ACCEPTED') {
            const ride = update.ride;
            console.log('Setting current ride with OTP:', ride.otp);
            // Preserve any existing fields (including otp) if missing from update
            setCurrentRide(prev => ({ ...(prev || {}), ...(ride || {}), otp: (ride && ride.otp != null) ? ride.otp : prev?.otp }));
            setStep('tracking');
            // Kick off a fast OTP hydrate in case the payload missed it
            try { if (ride?.bookingId) ensureOtp(ride.bookingId, 3, 500); } catch {}
            // Clear any pending auto-cancel timers on acceptance
            try { if (rideTimeout) { clearTimeout(rideTimeout); setRideTimeout(null); } } catch {}
            addNotification('Driver accepted your ride!');
            setTimeline(prev => [...prev, { t: Date.now(), label: 'Driver accepted' }]);

            // Compute driver -> pickup route immediately using freshest refs
            const drvLat = ride.driverLat || ride.driverLocation?.lat || driverLocationRef.current?.[0];
            const drvLng = ride.driverLng || ride.driverLocation?.lng || driverLocationRef.current?.[1];
            const pickupNow = pickupCoordsRef.current;
            if (drvLat != null && drvLng != null && pickupNow) {
                getRoute([drvLat, drvLng], pickupNow)
                    .then(r => {
                        setDriverToPickupRoute(r);
                        setRouteCoordinates([]); // show only driver->pickup until OTP
                    })
                    .catch(() => { /* ignore route compute error */ });
            }
        } else if (update.type === 'DRIVER_LOCATION') {
            const newLocation = [update.latitude, update.longitude];
            if (driverLocationRef.current) {
                animateMarker(driverLocationRef.current, newLocation, 2000, (pos) => setDriverLocation(pos));
            } else {
                setDriverLocation(newLocation);
            }
        } else if (update.type === 'RIDE_CANCELLED') {
            addNotification('Ride was cancelled', 'warning');
            setCurrentRide(null);
            setStep('search');
            setRouteCoordinates([]);
            setTimeline(prev => [...prev, { t: Date.now(), label: 'Ride cancelled' }]);
        } else if (update.type === 'RIDE_STARTED') {
            addNotification('Ride started!');
            setTimeline(prev => [...prev, { t: Date.now(), label: 'Ride started' }]);
        } else if (update.type === 'RIDE_COMPLETED') {
            setStep('completed');
            setCompletedRideDetails({
                driverName: update.ride?.driverName || 'Driver',
                fare: update.ride?.fare || currentRideRef.current?.fare || 0
            });
            setShowRatingModal(true);
            addNotification('Ride completed!');
            setTimeline(prev => [...prev, { t: Date.now(), label: 'Ride completed' }]);
        }
    }, [addNotification]);
    
    useEffect(() => {
        let mounted = true;
        const tryRehydrate = async () => {
            // try localStorage first
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    if (!mounted) return;
                    setUser(parsed);
                    try {
                        const missing = !parsed?.emergencyPhone;
                        if (missing) setShowEmergencyPhoneModal(true);
                    } catch {}
                    clearOldRides(parsed.id);
                    // set location from browser
                    getCurrentLocation()
                        .then(coords => {
                            setCurrentLocation([coords.lat, coords.lng]);
                            setMapCenter([coords.lat, coords.lng]);
                            setPickupCoords([coords.lat, coords.lng]);
                            setPickup('Current Location');
                        })
                        .catch(() => {
                            // If geolocation is denied/unavailable, don't fallback to a city.
                            setPickupCoords(null);
                            setPickup('');
                            setError('Location not available. Please pick a pickup on the map or enable location services.');
                        });

                    // connect websocket
                    webSocketService.connect(() => {
                        webSocketService.subscribeToRideUpdates(parsed.id, handleRideUpdate);
                    });

                    return;
                } catch {
                    // parse error, fallthrough to server check
                }
            }

            // Try backend session endpoint
            try {
                const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
                if (!mounted) return;
                if (res.ok) {
                    const me = await res.json().catch(() => null);
                    if (me) {
                        setUser(me);
                        localStorage.setItem('user', JSON.stringify(me));
                        try {
                            const missing = !me?.emergencyPhone;
                            if (missing) setShowEmergencyPhoneModal(true);
                        } catch {}
                        clearOldRides(me.id);
                        webSocketService.connect(() => {
                            webSocketService.subscribeToRideUpdates(me.id, handleRideUpdate);
                        });
                        getCurrentLocation()
                            .then(coords => {
                                setCurrentLocation([coords.lat, coords.lng]);
                                setMapCenter([coords.lat, coords.lng]);
                                setPickupCoords([coords.lat, coords.lng]);
                                setPickup('Current Location');
                            })
                            .catch(() => {
                                    setPickupCoords(null);
                                    setPickup('');
                                    setError('Location not available. Please pick a pickup on the map or enable location services.');
                                });
                        return;
                    }
                }
            } catch {
                // ignore
            }

            // Do not redirect to login here.
            // This app persists auth in localStorage; /auth/me may not exist or may not use cookies.
            // If there is no localStorage user, the earlier check already navigates to /login.
        };

        tryRehydrate();

        return () => { mounted = false; };
    }, [navigate, handleRideUpdate]);

    // Silent background polling: drivers every 10s. Removed full-page reload for better UX.
    useEffect(() => {
        if (!user) return undefined;

        // drivers polling
        let abortController = null;
        const poll = async () => {
            if (stepRef.current !== 'search') return; // only fetch on search screen
            try {
                if (abortController) abortController.abort();
            } catch {}
            abortController = new AbortController();
            await fetchNearbyDrivers();
        };
        const drvInterval = setInterval(poll, 5000);

        // initial fetch
        poll();

        return () => { try { clearInterval(drvInterval); if (abortController) abortController.abort(); } catch {} };
    }, [user, fetchNearbyDrivers]);
    // After user is known, connect websocket and start polling for drivers
    useEffect(() => {
        if (!user) return undefined;

        webSocketService.connect(
            () => {
                try {
                    webSocketService.subscribeToRideUpdates(user.id, handleRideUpdate);
                } catch {
                    console.warn('Subscribe error');
                }
            },
            (error) => console.error('WebSocket error:', error)
        );

        return () => {
            try { webSocketService.disconnect(); } catch (err) { console.warn('WS disconnect failed', err); }
            if (rideTimeout) clearTimeout(rideTimeout);
        };
    }, [user, rideTimeout, handleRideUpdate]);

    // Ride status is handled via WebSocket updates (handleRideUpdate) to avoid polling
    
    // Fetch route when ride is accepted
    useEffect(() => {
        if (currentRide && pickupCoords && destCoords && step === 'tracking') {
            getRoute(pickupCoords, destCoords)
                .then(route => {
                    setRouteCoordinates(route.coordinates);
                    console.log('Route loaded:', route.distance, 'meters');
                })
                .catch(err => console.error('Route error:', err));
        }
    }, [currentRide, pickupCoords, destCoords, step]);

    // When ride is accepted, show driver->pickup preview and open OTP modal if provided
    useEffect(() => {
        if (!currentRide) return;
        if (currentRide.status === 'ACCEPTED' || currentRide.status === 'DRIVER_ASSIGNED') {
            // show driver to pickup route if we have driver location
            const drvLat = currentRide.driverLat || currentRide.driverLocation?.lat || driverLocation?.[0];
            const drvLng = currentRide.driverLng || currentRide.driverLocation?.lng || driverLocation?.[1];
            if (drvLat != null && drvLng != null && pickupCoords) {
                getRoute([drvLat, drvLng], pickupCoords)
                    .then(r => setDriverToPickupRoute(r))
                    .catch(() => {
                        console.warn('Driver->pickup route failed');
                        setDriverToPickupRoute(null);
                    });
            }
            // open OTP modal if OTP is required or provided by server
            // Do not open OTP modal on customer desktop; driver verifies OTP in their app
        }
    }, [currentRide, driverLocation, pickupCoords]);

    // Preview route while selecting pickup/destination (before booking)
    useEffect(() => {
        let mounted = true;
        const shouldPreview = pickupCoords && destCoords && !(step === 'tracking' && currentRide);
        if (!shouldPreview) {
            setPreviewRouteInfo(null);
            return;
        }

        (async () => {
            try {
                const route = await getRoute(pickupCoords, destCoords);
                if (!mounted) return;
                if (route && route.coordinates) {
                    setRouteCoordinates(route.coordinates);
                    setPreviewRouteInfo({ distance: route.distance || 0, duration: route.duration || 0 });
                    console.log('Preview route loaded:', route.distance, 'm,', route.duration, 's');
                }
            } catch (err) {
                // non-fatal
                console.error('Preview route error:', err);
                setPreviewRouteInfo(null);
            }
        })();

        return () => { mounted = false; };
    }, [pickupCoords, destCoords, step, currentRide]);

    // Quickly fetch OTP with short retries to avoid slow appearance
    const ensureOtp = useCallback((bookingId, retries = 3, intervalMs = 500) => {
        if (!bookingId) return;
        if (otpHydrateInFlightRef.current === bookingId) return; // avoid duplicate hydrators
        otpHydrateInFlightRef.current = bookingId;
        let attempts = 0;
        const tick = async () => {
            attempts++;
            try {
                const res = await fetch(`${API_BASE}/rides/${bookingId}`, { cache: 'no-store' });
                if (res.ok) {
                    const ride = await res.json();
                    if (ride?.otp) {
                        setCurrentRide(prev => ({ ...(prev || {}), ...(ride || {}), otp: ride.otp }));
                        otpHydrateInFlightRef.current = null;
                        return; // done
                    }
                }
            } catch {}
            if (attempts < retries) {
                setTimeout(tick, intervalMs);
            } else {
                otpHydrateInFlightRef.current = null;
            }
        };
        tick();
    }, []);

    // Continuous geolocation watch to keep current location updated
    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return;
        let watchId;
        try {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCurrentLocation([latitude, longitude]);
                    if (!pickupCoords && !mapCenter) {
                        setMapCenter([latitude, longitude]);
                    }
                },
                () => { /* ignore errors here; initial getCurrentLocation covers UI messaging */ },
                { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 }
            );
        } catch {}
        return () => {
            try { if (watchId != null) navigator.geolocation.clearWatch(watchId); } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // compute driver distance (km) to pickup/customer for display
    let driverDistanceKm = null;
    try {
        const drv = driverLocation || (currentRide && (currentRide.driverLocation ? [currentRide.driverLocation.lat, currentRide.driverLocation.lng] : (currentRide.driverLat ? [currentRide.driverLat, currentRide.driverLng] : null)));
        const cust = pickupCoords || currentLocation || mapCenter;
        if (drv && cust) {
            driverDistanceKm = calculateDistance(drv[0], drv[1], cust[0], cust[1]);
        }
    } catch {
        driverDistanceKm = null;
    }

    // Live ETA computation
    useEffect(() => {
        try {
            if (step === 'booking') {
                if (previewRouteInfo?.duration) {
                    const minutes = Math.max(1, Math.round(previewRouteInfo.duration / 60));
                    setLiveETA(minutes);
                } else {
                    setLiveETA(null);
                }
                return;
            }
            if (!currentRide || !driverLocation) { setLiveETA(null); return; }
            let from = null, to = null;
            const status = (currentRide.status || '').toUpperCase();
            if (status === 'ACCEPTED' || status === 'DRIVER_ASSIGNED') {
                from = driverLocation;
                to = pickupCoords;
            } else if (status === 'IN_PROGRESS') {
                from = driverLocation;
                to = destCoords;
            }
            if (!from || !to) { setLiveETA(null); return; }
            const dKm = calculateDistance(from[0], from[1], to[0], to[1]);
            const minutes = Math.max(1, Math.round((dKm / 30) * 60));
            setLiveETA(minutes);
        } catch { setLiveETA(null); }
    }, [step, currentRide, driverLocation, pickupCoords, destCoords, previewRouteInfo]);

    // Heatmap calculation
    useEffect(() => {
        if (!showHeatmap) { setHeatPoints([]); return; }
        const pts = [];
        try {
            (nearbyDrivers || []).forEach(d => {
                const lat = d?.latitude ?? d?.currentLat;
                const lng = d?.longitude ?? d?.currentLng;
                if (lat != null && lng != null) pts.push({ lat, lng });
            });
            if (pts.length === 0 && Array.isArray(currentLocation)) {
                const [clat, clng] = currentLocation;
                for (let i = 0; i < 6; i++) {
                    const dlat = (Math.random() - 0.5) * 0.01;
                    const dlng = (Math.random() - 0.5) * 0.01;
                    pts.push({ lat: clat + dlat, lng: clng + dlng });
                }
            }
        } catch {}
        setHeatPoints(pts);
    }, [showHeatmap, nearbyDrivers, currentLocation]);

    // Razorpay scaffold (frontend)
    const RAZORPAY_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID)
        ? import.meta.env.VITE_RAZORPAY_KEY_ID
        : null;

    const loadRazorpayScript = () => new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const handlePayWithRazorpay = async () => {
        try {
            if (!currentRide) { addNotification('No ride to pay for', 'warning'); return; }
            if (!RAZORPAY_KEY) { addNotification('Payment unavailable: missing Razorpay key', 'warning'); return; }
            const loaded = await loadRazorpayScript();
            if (!loaded) { addNotification('Failed to load payment SDK', 'error'); return; }
            const amountPaise = Math.max(100, Math.round((currentRide.fare || 0) * 100));
            const receipt = currentRide.bookingId || `rcpt_${Date.now()}`;
            const res = await fetch(`${API_BASE}/payments/create-order`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt })
            });
            if (!res.ok) { addNotification('Failed to create order', 'error'); return; }
            const order = await res.json();
            const options = {
                key: RAZORPAY_KEY,
                amount: order.amount,
                currency: order.currency || 'INR',
                name: 'ApnaRide',
                description: `Ride ${receipt}`,
                order_id: order.orderId,
                prefill: {
                    name: user?.name || 'Customer',
                    email: user?.email || 'customer@example.com',
                    contact: (user?.phone || user?.emergencyPhone || '').toString()
                },
                theme: { color: '#000000' },
                handler: async function (response) {
                    try {
                        await fetch(`${API_BASE}/payments/verify`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(response)
                        });
                        addNotification('Payment successful!', 'success');
                    } catch { addNotification('Payment verification failed', 'warning'); }
                }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (e) {
            addNotification('Payment failed', 'error');
        }
    };

    const verifyOtp = async () => {
        if (!currentRide) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/rides/${currentRide.bookingId}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: otpInput })
            });
            const payload = await res.json().catch(() => null);
            if (!res.ok) {
                const msg = payload?.message || payload?.error || 'OTP verification failed';
                setError(msg);
                setIsLoading(false);
                return;
            }
            // success
            setOtpModalOpen(false);
            addNotification('OTP verified. Showing route to destination.', 'success');
            // After OTP verified, compute full route pickup -> destination
            if (pickupCoords && destCoords) {
                try {
                    const route = await getRoute(pickupCoords, destCoords);
                    setRouteCoordinates(route.coordinates);
                } catch (routeErr) {
                    console.warn('Could not fetch full route after OTP:', routeErr);
                }
            }
        } catch (err) {
            console.error('OTP verify error', err);
            setError('Network error verifying OTP');
        }
        setIsLoading(false);
    };

    const resendOtp = async () => {
        if (!currentRide) return;
        try {
            const res = await fetch(`${API_BASE}/rides/${currentRide.bookingId}/resend-otp`, { method: 'POST' });
            if (res.ok) {
                addNotification('OTP resent to your phone', 'success');
                setOtpInput('');
                setOtpModalOpen(true);
            } else {
                addNotification('Unable to resend OTP', 'warning');
            }
        } catch (e) {
            console.warn('Resend OTP network error', e);
            addNotification('Unable to resend OTP (network). Please ask driver.', 'warning');
        }
    };

    // notifications handled by addNotification defined earlier
    
    const handleMapClick = async (latlng) => {
        if (step !== 'search') return;
        
        try {
            const response = await fetch(
                `/nominatim/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
            );
            const data = await response.json();
            const address = data.display_name;
            
            if (!pickup) {
                setPickup(address);
                setPickupCoords([latlng.lat, latlng.lng]);
                setMapCenter([latlng.lat, latlng.lng]);
                addNotification('Pickup location set', 'success');
            } else if (!destination) {
                setDestination(address);
                setDestCoords([latlng.lat, latlng.lng]);
                addNotification('Destination set', 'success');
            }
        } catch (err) {
            console.error('Reverse geocoding error:', err);
        }
    };

    const handlePickupChange = async (value) => {
        setPickup(value);
        if (pickupDebounce.current) clearTimeout(pickupDebounce.current);
        if (value.length <= 3) return;
        pickupDebounce.current = setTimeout(async () => {
            try {
                const myId = ++pickupReqId.current;
                const result = await geocodeAddress(value);
                if (myId !== pickupReqId.current) return; // ignore stale
                if (result) {
                    setPickupCoords([result.lat, result.lng]);
                    setMapCenter([result.lat, result.lng]);
                }
            } catch (err) {
                console.error('Geocoding error:', err);
            }
        }, 300);
    };

    const handleDestinationChange = async (value) => {
        setDestination(value);
        if (destDebounce.current) clearTimeout(destDebounce.current);
        if (value.length <= 3) return;
        destDebounce.current = setTimeout(async () => {
            try {
                const myId = ++destReqId.current;
                const result = await geocodeAddress(value);
                if (myId !== destReqId.current) return; // ignore stale
                if (result) {
                    setDestCoords([result.lat, result.lng]);
                }
            } catch (err) {
                console.error('Geocoding error:', err);
            }
        }, 300);
    };

    const handleSearchRides = async () => {
        if (!user?.emergencyPhone) {
            setShowEmergencyPhoneModal(true);
            addNotification('Please add your emergency WhatsApp number to continue.', 'warning');
            return;
        }
        if (!pickup || !destination) {
            setError('Please enter pickup and destination');
            addNotification('Please enter both pickup and destination', 'error');
            return;
        }

        if (!pickupCoords || !destCoords) {
            setError('Please wait for locations to be found');
            addNotification('Waiting for location coordinates...', 'warning');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // First, check for available drivers nearby
            const driversResponse = await fetch(
                `${API_BASE}/drivers/nearby?latitude=${pickupCoords[0]}&longitude=${pickupCoords[1]}&radius=10`
            );
            
            let availableDrivers = 0;
            if (driversResponse.ok) {
                const drivers = await driversResponse.json();
                availableDrivers = drivers.filter(d => d.isAvailable === true || d.isOnline === true).length;
                console.log('Available drivers:', availableDrivers, 'Total drivers:', drivers.length);
                console.log('Drivers data:', drivers);
            } else {
                console.error('Failed to fetch drivers:', driversResponse.status);
            }

            if (availableDrivers === 0) {
                addNotification('No drivers available nearby. Showing estimated fares.', 'warning');
            } else {
                addNotification(`${availableDrivers} driver(s) available nearby`, 'success');
            }

            const distance = calculateDistance(
                pickupCoords[0], pickupCoords[1],
                destCoords[0], destCoords[1]
            );

            // Align estimation with backend: base fare + (distance * 10)
            const baseFares = { Share: 30, Bike: 40, Auto: 50, Car: 80 };
            const allTypes = [
                { type: 'Bike', icon: 'fa-motorcycle', capacity: '1 person', description: 'Affordable bike rides' },
                { type: 'Auto', icon: 'fa-car-side', capacity: '3 people', description: 'Comfortable auto rides' },
                { type: 'Car', icon: 'fa-car', capacity: '4 people', description: 'Premium car rides' },
                { type: 'Share', icon: 'fa-users', capacity: 'Shared', description: 'Share and save' }
            ];
            const vehicleOptions = allTypes.map(v => ({
                ...v,
                price: Math.round((baseFares[v.type] || 50) + (distance * 10)),
                eta: Math.floor(Math.random() * 8 + 2)
            }));

            setVehicles(vehicleOptions);
            setStep('selecting');
            setShowBottomSheet(true);
            setIsBottomSheetCollapsed(false);
        } catch {
            setError('Error calculating fares');
        }
        setIsLoading(false);
    };

    const handleBookRide = async () => {
        if (!user?.emergencyPhone) {
            setShowEmergencyPhoneModal(true);
            addNotification('Please add your emergency WhatsApp number to continue.', 'warning');
            return;
        }
        if (!selectedVehicle) return;

        setIsLoading(true);
        setStep('booking');

        try {
            const bookingData = {
                customerId: user.id,
                pickupLocation: pickup,
                dropLocation: destination,
                pickupLat: pickupCoords[0],
                pickupLng: pickupCoords[1],
                dropLat: destCoords[0],
                dropLng: destCoords[1],
                vehicleType: selectedVehicle.type,
                fare: appliedPromo ? selectedVehicle.price * (1 - appliedPromo.discount / 100) : selectedVehicle.price,
                promoCode: appliedPromo?.code
            };

            const response = await fetch(`${API_BASE}/rides/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                const ride = await response.json();
                setCurrentRide(ride);
                addNotification('Ride booked! Finding driver...');
                setIsBottomSheetCollapsed(false);
                
                // Set 5-minute auto-cancel timeout
                const timeout = setTimeout(async () => {
                    // Use latest step value; avoid stale closure
                    if (stepRef.current === 'booking') {
                        try {
                            await fetch(`${API_BASE}/rides/${ride.bookingId}/cancel`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ reason: 'No driver found' })
                            });
                            addNotification('No driver found. Ride cancelled.', 'error');
                            setStep('search');
                            setCurrentRide(null);
                        } catch {
                                    console.error('Auto-cancel failed:');
                                }
                    }
                }, 300000); // 5 minutes
                
                setRideTimeout(timeout);
                
                // Poll for driver acceptance
                pollForDriver(ride.bookingId);
            } else {
                setError('Failed to book ride');
                setStep('selecting');
            }
        } catch {
            setError('Error booking ride');
            setStep('selecting');
        }
        setIsLoading(false);
    };

    const pollForDriver = (bookingId) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/rides/${bookingId}`);
                if (response.ok) {
                    const ride = await response.json();
                    if (ride.status === 'ACCEPTED') {
                        // Merge to preserve fields like otp that may be missing from polling response
                        setCurrentRide(prev => ({ ...(prev || {}), ...(ride || {}), otp: (ride && ride.otp != null) ? ride.otp : prev?.otp }));
                        setStep('tracking');
                        // Fast hydrate OTP if still missing
                        try { ensureOtp(bookingId, 5, 800); } catch {}
                        clearInterval(interval);
                        addNotification('Driver found!');
                    }
                }
            } catch {
                console.error('Polling error:');
            }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(interval), 120000);
    };

    const handleCancelRide = async () => {
        if (!currentRide) return;

        try {
            const response = await fetch(`${API_BASE}/rides/${currentRide.bookingId}/cancel`, {
                method: 'POST'
            });

            if (response.ok) {
                setCurrentRide(null);
                setStep('search');
                setShowBottomSheet(false);
                addNotification('Ride cancelled');
            }
        } catch {
            console.error('Cancel error:');
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode) return;

        try {
            const response = await fetch(`${API_BASE}/promo/validate/${promoCode}`);
            if (response.ok) {
                const promo = await response.json();
                setAppliedPromo(promo);
                addNotification(`Promo applied! ${promo.discount}% off`);
            } else {
                setError('Invalid promo code');
            }
        } catch {
            setError('Error applying promo');
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim() || !currentRide) return;

        const message = {
            sender: 'customer',
            text: chatInput,
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, message]);
        webSocketService.sendChatMessage(currentRide.bookingId, user.id, chatInput);
        setChatInput('');
    };

    const openWhatsAppToEmergency = (targetUser) => {
        if (!targetUser) return false;
        const raw = targetUser.emergencyPhone;
        if (!raw) return false;
        const digits = String(raw).replace(/[^0-9]/g, '');
        if (!digits) return false;
        let locationLine = '';
        try {
            if (Array.isArray(currentLocation) && currentLocation.length >= 2) {
                const lat = currentLocation[0];
                const lng = currentLocation[1];
                const maps = `https://www.google.com/maps?q=${lat},${lng}`;
                locationLine = `%0ALocation: ${maps}`;
            }
        } catch {}
        const msg = `SOS ALERT!%0AUser: ${targetUser.name || targetUser.id}%0ARide: ${currentRide?.bookingId || '-'}%0ATime: ${new Date().toLocaleString()}${locationLine}%0A%0APlease help immediately.`;
        const url = `https://wa.me/${digits}?text=${msg}`;
        window.open(url, '_blank');
        return true;
    };

    const sendSOSNow = (targetUser) => {
        addNotification('SOS activated! Help is on the way.');
        // Notify backend (non-blocking). Location can be [lat,lng]; backend handles both array or object.
        let locPayload = null;
        try {
            if (Array.isArray(currentLocation) && currentLocation.length >= 2) {
                locPayload = { lat: currentLocation[0], lng: currentLocation[1] };
            }
        } catch {}
        fetch(`${API_BASE}/emergency/sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: targetUser?.id,
                location: locPayload,
                rideId: currentRide?.bookingId || null
            })
        }).catch(e => console.error('SOS send failed', e));

        // Try opening WhatsApp if number exists
        openWhatsAppToEmergency(targetUser);
    };

    const handleSOS = () => {
        const proceed = confirm('SOS will be auto-shared in 10 seconds unless cancelled. Proceed?');
        if (!proceed) return;
        if (!user?.emergencyPhone) {
            setPendingSOS(true);
            setShowEmergencyPhoneModal(true);
            return;
        }
        // Start auto-share countdown
        setSosCountdown(10);
        try { if (sosTimerRef.current) clearInterval(sosTimerRef.current); } catch {}
        sosTimerRef.current = setInterval(() => {
            setSosCountdown(prev => {
                const next = prev - 1;
                if (next <= 0) {
                    try { clearInterval(sosTimerRef.current); sosTimerRef.current = null; } catch {}
                    sendSOSNow(user);
                    return 0;
                }
                return next;
            });
        }, 1000);
    };

    const cancelSOSAutoShare = () => {
        try { if (sosTimerRef.current) clearInterval(sosTimerRef.current); } catch {}
        sosTimerRef.current = null;
        setSosCountdown(0);
        addNotification('SOS auto-share cancelled', 'warning');
    };

    const handleSavePlace = (type) => {
        if (type === 'home' && pickupCoords) {
            setSavedPlaces(prev => ({ ...prev, home: { address: pickup, coords: pickupCoords } }));
            addNotification('Home saved!');
        } else if (type === 'work' && pickupCoords) {
            setSavedPlaces(prev => ({ ...prev, work: { address: pickup, coords: pickupCoords } }));
            addNotification('Work saved!');
        }
    };

    const handleUseSavedPlace = (type) => {
        const place = savedPlaces[type];
        if (place) {
            setPickup(place.address);
            setPickupCoords(place.coords);
            setMapCenter(place.coords);
        }
    };

    if (!user) return null;

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
                        if (pendingSOS) {
                            setPendingSOS(false);
                            sendSOSNow(newUser);
                        }
                    }}
                />
            )}

            {/* Settings panel removed as requested */}
            <OtpModal
                open={false}
                otp={otpInput}
                onChange={setOtpInput}
                onVerify={verifyOtp}
                onResend={resendOtp}
                onClose={() => setOtpModalOpen(false)}
                loading={isLoading}
                error={error}
                phone={currentRide?.riderPhone || currentRide?.phone}
            />
            {/* Animated Background */}
            <SimpleAnimatedBackground variant="customer" />
            
            {/* Map */}
            <MapContainer
                center={mapCenter || currentLocation || pickupCoords || [0, 0]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    maxZoom={19}
                />
                <MapUpdater center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} enabled={step === 'search'} />
                
                {/* Animated Route Polyline */}
                {routeCoordinates.length > 0 && (
                    <Polyline 
                        positions={routeCoordinates}
                        pathOptions={{
                            color: '#00C853',
                            weight: 5,
                            opacity: 0.7,
                            dashArray: '10, 10'
                        }}
                    />
                )}
                
                {/* Current location marker */}
                {currentLocation && (
                    <Marker position={currentLocation} icon={createCustomIcon('#4285F4')}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}
                
                {/* Pickup marker */}
                {pickupCoords && (
                    <Marker position={pickupCoords} icon={createCustomIcon('#000000')}>
                        <Popup>Pickup: {pickup}</Popup>
                    </Marker>
                )}
                
                {/* Destination marker */}
                {destCoords && (
                    <Marker position={destCoords} icon={createCustomIcon('#00C853')}>
                        <Popup>Destination: {destination}</Popup>
                    </Marker>
                )}
                
                {/* Driver location marker with smooth animation and bearing */}
                {driverLocation && (() => {
                    let bearing = 0;
                    try {
                        const nextPoint = pickupCoords || (routeCoordinates && routeCoordinates[0]);
                        if (nextPoint && driverLocation) {
                            bearing = computeBearing(driverLocation[0], driverLocation[1], nextPoint[0], nextPoint[1]);
                        }
                    } catch { bearing = 0; }
                    return (
                        <Marker position={driverLocation} icon={createRotatedIcon('#FFD700', bearing)}>
                            <Popup>Driver Location</Popup>
                        </Marker>
                    );
                })()}

                {/* Draw driver -> pickup route if available */}
                {driverToPickupRoute && driverToPickupRoute.coordinates && (
                    <Polyline positions={driverToPickupRoute.coordinates} color="#ff9800" weight={5} opacity={0.9} />
                )}

                {/* Draw pickup -> destination route when set (routeCoordinates already handled elsewhere) */}
                
                {/* Nearby Drivers with 3D animation */}
                {(nearbyDrivers || []).map((driver, idx) => {
                    // Support both frontend-calculated shape and backend /api/drivers/nearby shape
                    const lat = driver?.latitude ?? driver?.currentLat;
                    const lng = driver?.longitude ?? driver?.currentLng;
                    if (lat == null || lng == null) return null;
                    const key = driver?.id ?? driver?.driverId ?? idx;
                    const name = driver?.name ?? `Driver ${driver?.driverId ?? ''}`.trim();
                    const type = driver?.vehicleType ?? 'Unknown';
                    const rating = driver?.rating ?? 4.5;
                    
                    // Calculate bearing for rotation if driver has movement data
                    let bearing = 0;
                    if (driver?.bearing != null) {
                        bearing = driver.bearing;
                    }
                    
                    return (
                        <Marker 
                            key={key}
                            position={[lat, lng]}
                            icon={createRotatedIcon('#4CAF50', bearing)}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center' }}>
                                    <strong>{name}</strong><br/>
                                    <small>{type}</small><br/>
                                    <span style={{ color: '#FFD700' }}>⭐ {rating}</span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Heatmap overlay (disabled by default unless enabled elsewhere) */}
                {showHeatmap && (heatPoints || []).map((p, idx) => (
                    <Circle
                        key={`heat-${idx}`}
                        center={[p.lat, p.lng]}
                        radius={250}
                        pathOptions={{ color: '#FF5722', weight: 0, fillColor: '#FF5722', fillOpacity: 0.25 }}
                    />
                ))}
            </MapContainer>

            {/* Floating Header */}
            <CampaignBanner onCta={() => setStep('selecting')} />
            <div className="uber-header">
                <div className="uber-logo">ApnaRide</div>
                <div className="uber-header-actions">
                    {notifications.length > 0 && (
                        <button className="uber-btn-icon" style={{ position: 'relative' }}>
                            <i className="fa-solid fa-bell"></i>
                            <span className="uber-notification-badge">{notifications.length}</span>
                        </button>
                    )}
                    <button 
                        className="uber-btn-icon"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <i className="fa-solid fa-user"></i>
                    </button>
                </div>
            </div>

            {/* Profile Menu */}
            {showProfileMenu && (
                <div className="uber-profile-menu uber-fade-in">
                    <div className="uber-profile-menu-item" onClick={() => navigate('/customer/profile')}>
                        <i className="fa-solid fa-user uber-profile-menu-icon"></i>
                        <span>My Profile</span>
                    </div>
                    <div className="uber-profile-menu-item" onClick={() => navigate('/customer/profile')}>
                        <i className="fa-solid fa-history uber-profile-menu-icon"></i>
                        <span>Ride History</span>
                    </div>
                    <div className="uber-profile-menu-item" onClick={() => navigate('/customer/profile')}>
                        <i className="fa-solid fa-credit-card uber-profile-menu-icon"></i>
                        <span>Payment Methods</span>
                    </div>
                    <div className="uber-profile-menu-item" onClick={() => navigate('/customer/profile')}>
                        <i className="fa-solid fa-shield-alt uber-profile-menu-icon"></i>
                        <span>Privacy & Safety</span>
                    </div>
                    
                    <div className="uber-profile-menu-item" onClick={() => {
                        localStorage.removeItem('user');
                        navigate('/login');
                    }}>
                        <i className="fa-solid fa-sign-out-alt uber-profile-menu-icon"></i>
                        <span>Sign Out</span>
                    </div>
                </div>
            )}

            {/* Nearby drivers panel removed - drivers shown on map with 3D animation */}

            {/* Route preview panel */}
            {previewRouteInfo && (
                <div className="nearby-panel" style={{ right: 240, minWidth: 160 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <strong>Route preview</strong>
                        <span style={{ color: '#666' }}>{(previewRouteInfo.distance/1000).toFixed(1)} km</span>
                    </div>
                    <div style={{ color: '#444', fontSize: 13 }}>
                        <div>ETA: {Math.round(previewRouteInfo.duration/60)} min</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: '#777' }}>Based on street routing</div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {notifications.map((notif, index) => {
                const bgColors = {
                    'success': '#00C853',
                    'error': '#DC3545',
                    'warning': '#FFC107',
                    'info': '#000000'
                };
                const icons = {
                    'success': 'fa-check-circle',
                    'error': 'fa-exclamation-circle',
                    'warning': 'fa-exclamation-triangle',
                    'info': 'fa-info-circle'
                };
                return (
                    <div 
                        key={notif.id}
                        className="uber-floating-card uber-slide-down"
                        style={{ 
                            top: `${80 + index * 70}px`,
                            right: '20px',
                            background: bgColors[notif.type] || bgColors.info,
                            color: '#fff',
                            padding: '12px 20px',
                            maxWidth: '320px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    >
                        <i className={`fa-solid ${icons[notif.type] || icons.info}`} style={{ fontSize: '20px' }}></i>
                        <span style={{ flex: 1 }}>{notif.message}</span>
                        <button 
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#fff', 
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                );
            })}

            {/* Chat Panel (Customer) - Single unified chat interface */}
            {currentRide && showChatWidget && (
                <div className="uber-floating-card uber-floating-card-right" style={{ width: '360px', height: '60vh', zIndex: 1003 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                        <h4 style={{ margin: 0 }}>Chat with Driver</h4>
                        <button className="uber-btn-icon" onClick={() => setShowChatWidget(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div style={{ height: 'calc(100% - 44px)' }}>
                        <RealTimeChat 
                            rideId={currentRide.bookingId}
                            userId={user?.id}
                            userName={user?.name || 'Customer'}
                            userType="customer"
                            showHeader={false}
                        />
                    </div>
                </div>
            )}

            {/* Left Floating Card: Search / Selecting / Booking / Tracking */}
            {(step === 'search' || step === 'selecting' || step === 'booking' || step === 'tracking') && (
                <div className="uber-floating-card uber-floating-card-left uber-fade-in">
                    <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '700' }}>
                        {step === 'search' ? 'Where to?' :
                         step === 'selecting' ? 'Set pickup & destination' :
                         step === 'booking' ? 'Finding driver...' :
                         (currentRide ? 'Driver on the way!' : 'Ride')}
                    </h2>
                    
                    {/* OTP Display - only when a ride exists and provided */}
                    {currentRide?.otp && (
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 16,
                            padding: '20px',
                            marginBottom: 20,
                            textAlign: 'center',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                        }}>
                            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>Share this code with your driver</div>
                            <div style={{
                                background: 'rgba(255,255,255,0.95)',
                                borderRadius: 12,
                                padding: '16px 24px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 12
                            }}>
                                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, color: '#111827', fontFamily: 'monospace' }}>
                                    {currentRide.otp}
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(currentRide.otp);
                                        addNotification('OTP copied!', 'success');
                                    }}
                                    style={{
                                        background: '#667eea',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }}
                                    title="Copy OTP"
                                >
                                    <i className="fa-solid fa-copy"></i>
                                </button>
                            </div>
                            <div style={{ color: '#fff', fontSize: 12, opacity: 0.85 }}>Driver will verify this code before starting your ride</div>
                        </div>
                    )}
                    
                    {/* Saved Places */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div 
                            className="uber-saved-place"
                            onClick={() => handleUseSavedPlace('home')}
                        >
                            <div className="uber-saved-place-icon">🏠</div>
                            <div className="uber-saved-place-label">Home</div>
                        </div>
                        <div 
                            className="uber-saved-place"
                            onClick={() => handleUseSavedPlace('work')}
                        >
                            <div className="uber-saved-place-icon">💼</div>
                            <div className="uber-saved-place-label">Work</div>
                        </div>
                    </div>

                    {/* Location Inputs */}
                    <div className="uber-location-input">
                        <div className="uber-location-item">
                            <div className="uber-location-dot uber-location-dot-pickup"></div>
                            <input
                                type="text"
                                value={pickup}
                                onChange={(e) => handlePickupChange(e.target.value)}
                                placeholder="Pickup location"
                                className="uber-input"
                                style={{ border: 'none', padding: '8px' }}
                            />
                        </div>
                        <div className="uber-location-line"></div>
                        <div className="uber-location-item">
                            <div className="uber-location-dot uber-location-dot-drop"></div>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => handleDestinationChange(e.target.value)}
                                placeholder="Where to?"
                                className="uber-input"
                                style={{ border: 'none', padding: '8px' }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#D32F2F', fontSize: '14px', marginTop: '12px' }}>
                            {error}
                        </div>
                    )}

                    <button 
                        className="uber-btn uber-btn-primary"
                        style={{ width: '100%', marginTop: '16px' }}
                        onClick={handleSearchRides}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="uber-spinner"></span>
                        ) : (
                            'Search Rides'
                        )}
                    </button>

                    {/* Quick actions */}
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <button 
                            className="uber-btn-ghost"
                            onClick={() => handleSavePlace('home')}
                            style={{ fontSize: '12px' }}
                        >
                            Save as Home
                        </button>
                        <button 
                            className="uber-btn-ghost"
                            onClick={() => handleSavePlace('work')}
                            style={{ fontSize: '12px' }}
                        >
                            Save as Work
                        </button>
                    </div>
                </div>
            )}

            {/* Vehicle Selection - Bottom Sheet */}
            {step === 'selecting' && (
                <div className={`uber-bottom-sheet ${showBottomSheet ? '' : 'hidden'} ${isBottomSheetCollapsed ? 'collapsed' : ''}`}>
                    <div className="uber-bottom-sheet-handle"></div>
                    <div style={{ position: 'absolute', right: 16, top: 12 }}>
                        <button className="uber-btn uber-btn-ghost" onClick={() => setIsBottomSheetCollapsed(v => !v)}>
                            {isBottomSheetCollapsed ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                    
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
                        Choose a ride
                    </h2>

                    {/* Promo Code */}
                    <div className="uber-promo-input">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter promo code"
                            className="uber-input"
                        />
                        <button 
                            className="uber-btn uber-btn-outline"
                            onClick={handleApplyPromo}
                        >
                            Apply
                        </button>
                    </div>

                    {appliedPromo && (
                        <div style={{ 
                            background: '#E8F5E9', 
                            color: '#00C853', 
                            padding: '12px', 
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}>
                            ✓ {appliedPromo.discount}% discount applied!
                        </div>
                    )}

                    {/* Vehicle Options */}
                    {vehicles.map((vehicle) => (
                        <div
                            key={vehicle.type}
                            className={`uber-vehicle-card ${selectedVehicle?.type === vehicle.type ? 'selected' : ''}`}
                            onClick={() => setSelectedVehicle(vehicle)}
                        >
                            <div className="uber-vehicle-info">
                                <div className="uber-vehicle-icon">
                                    <i className={`fa-solid ${vehicle.icon}`}></i>
                                </div>
                                <div>
                                    <p className="uber-vehicle-name">{vehicle.type}</p>
                                    <p className="uber-vehicle-eta">
                                        {vehicle.eta} min • {vehicle.capacity}
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                        {vehicle.description}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="uber-vehicle-price">
                                    ₹{appliedPromo ? Math.round(vehicle.price * (1 - appliedPromo.discount / 100)) : vehicle.price}
                                </p>
                                {appliedPromo && (
                                    <p style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>
                                        ₹{vehicle.price}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    <div style={{ position: 'sticky', bottom: 0, background: '#fff', paddingTop: 8 }}>
                        <button
                            className="uber-btn uber-btn-primary"
                            style={{ width: '100%', marginTop: '20px' }}
                            onClick={handleBookRide}
                            disabled={!selectedVehicle || isLoading}
                        >
                            {isLoading ? <span className="uber-spinner"></span> : 'Confirm Ride'}
                        </button>

                        <button
                            className="uber-btn uber-btn-ghost"
                            style={{ width: '100%', marginTop: '12px' }}
                            onClick={() => {
                                setStep('search');
                                setShowBottomSheet(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Booking Progress */}
            {step === 'booking' && (
                <div className={`uber-bottom-sheet ${isBottomSheetCollapsed ? 'collapsed' : ''}`}>
                    <div 
                        className="uber-bottom-sheet-handle"
                        onTouchStart={(e) => { dragStartYRef.current = e.touches[0].clientY; }}
                        onTouchMove={(e) => {
                            if (dragStartYRef.current == null) return;
                            const dy = e.touches[0].clientY - dragStartYRef.current;
                            if (dy > 40) setIsBottomSheetCollapsed(true);
                            if (dy < -40) setIsBottomSheetCollapsed(false);
                        }}
                        onTouchEnd={() => { dragStartYRef.current = null; }}
                    ></div>
                    <div style={{ position: 'absolute', right: 16, top: 12 }}>
                        <button className="uber-btn uber-btn-ghost" onClick={() => setIsBottomSheetCollapsed(v => !v)}>
                            {isBottomSheetCollapsed ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div className="uber-spinner" style={{ 
                            width: '60px', 
                            height: '60px', 
                            margin: '0 auto 20px',
                            borderWidth: '6px'
                        }}></div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                            Finding your driver...
                        </h2>
                        <p style={{ color: '#666' }}>
                            Please wait while we match you with a nearby driver
                        </p>
                        {liveETA && (
                            <div className="eta-ticker" style={{ display: 'inline-flex', marginTop: 10 }}>
                                <span className="eta-dot"></span>
                                ETA: {liveETA} min
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tracking Ride */}
            {step === 'tracking' && currentRide && (
                <div className={`uber-bottom-sheet ${isBottomSheetCollapsed ? 'collapsed' : ''}`}>
                    <div 
                        className="uber-bottom-sheet-handle"
                        onTouchStart={(e) => { dragStartYRef.current = e.touches[0].clientY; }}
                        onTouchMove={(e) => {
                            if (dragStartYRef.current == null) return;
                            const dy = e.touches[0].clientY - dragStartYRef.current;
                            if (dy > 40) setIsBottomSheetCollapsed(true);
                            if (dy < -40) setIsBottomSheetCollapsed(false);
                        }}
                        onTouchEnd={() => { dragStartYRef.current = null; }}
                    ></div>
                    <div style={{ position: 'absolute', right: 16, top: 12 }}>
                        <button className="uber-btn uber-btn-ghost" onClick={() => setIsBottomSheetCollapsed(v => !v)}>
                            {isBottomSheetCollapsed ? 'Expand' : 'Minimize'}
                        </button>
                    </div>
                    
                    <div className="uber-ride-request">
                        <div className="uber-ride-request-header">
                            <h2 className="uber-ride-request-title">Driver on the way!</h2>
                            <div className="uber-ride-request-pulse">
                                <i className="fa-solid fa-car"></i>
                            </div>
                        </div>
                        {liveETA && (
                            <div className="eta-ticker" style={{ marginBottom: 12 }}>
                                <span className="eta-dot"></span>
                                ETA: {liveETA} min
                            </div>
                        )}

                        {/* Debug: Show OTP status */}
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ background: '#fff3cd', padding: '8px', fontSize: '11px', marginBottom: '8px', borderRadius: '4px' }}>
                                Debug: OTP = {currentRide?.otp || 'NOT SET'} | Status = {currentRide?.status}
                            </div>
                        )}

                        {/* Trip timeline */}
                        {timeline.length > 0 && (
                            <div style={{ background: '#fafafa', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 8 }}>Trip timeline</div>
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {timeline.map((ev, idx) => (
                                        <li key={idx} style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                                            {new Date(ev.t).toLocaleTimeString()} • {ev.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Driver Info */}
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
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: '#000',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: '700'
                            }}>
                                {currentRide.driverName?.charAt(0) || 'D'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                                    {currentRide.driverName || 'Driver'}
                                </p>
                                <div className="uber-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className="uber-star">★</span>
                                    ))}
                                    <span style={{ marginLeft: '8px', color: '#666' }}>4.9</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                                    {currentRide.vehicleNumber} • {currentRide.vehicleType}
                                </p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                {/* OTP Display - Share with driver to start ride */}
                                {(!showChatWidget && currentRide?.otp) ? (
                                    <div style={{
                                        background: '#000',
                                        borderRadius: 12,
                                        padding: '10px 16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 4,
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                                        minWidth: '100px'
                                    }}>
                                        <div style={{ 
                                            color: '#fff', 
                                            fontSize: 11, 
                                            fontWeight: 600, 
                                            opacity: 0.8,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5
                                        }}>
                                            Share OTP
                                        </div>
                                        <div style={{
                                            background: '#fff',
                                            borderRadius: 8,
                                            padding: '8px 14px',
                                            fontSize: 24,
                                            fontWeight: 900,
                                            letterSpacing: 6,
                                            color: '#000',
                                            fontFamily: 'monospace',
                                            textAlign: 'center'
                                        }}>
                                            {currentRide.otp}
                                        </div>
                                        <div style={{ 
                                            color: '#fff', 
                                            fontSize: 9, 
                                            opacity: 0.7,
                                            textAlign: 'center',
                                            marginTop: 2
                                        }}>
                                            Driver needs this to start
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: '#f0f0f0',
                                        borderRadius: 12,
                                        padding: '10px 16px',
                                        fontSize: 11,
                                        color: '#666',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <span className="uber-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                                        Fetching OTP...
                                    </div>
                                )}
                                <button 
                                    type="button"
                                    className="uber-btn-icon"
                                    onClick={() => setShowChatWidget(true)}
                                    title="Chat with driver"
                                    style={{
                                        background: '#000',
                                        color: '#fff',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                    }}
                                >
                                    <i className="fa-solid fa-comment"></i>
                                </button>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="uber-route">
                            <div className="uber-route-line">
                                <div className="uber-route-dot" style={{ background: '#000' }}></div>
                                <div className="uber-route-connector"></div>
                                <div className="uber-route-dot" style={{ background: '#00C853' }}></div>
                            </div>
                            <div className="uber-route-info">
                                <div style={{ marginBottom: '20px' }}>
                                    <p className="uber-route-label">Pickup</p>
                                    <p className="uber-route-address">{pickup}</p>
                                </div>
                                <div>
                                    <p className="uber-route-label">Destination</p>
                                    <p className="uber-route-address">{destination}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver distance & Fare */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 12 }}>
                            <div style={{ fontSize: '14px', color: '#555' }}>
                                {driverDistanceKm != null ? (
                                    <span>Driver distance: <strong>{driverDistanceKm.toFixed(2)} km</strong></span>
                                ) : (
                                    <span>Driver distance: unknown</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '50%', gap: 12 }}>
                                <div style={{
                                    padding: '16px',
                                    background: '#E8F5E9',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '600' }}>Total Fare</span>
                                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#00C853' }}>
                                        ₹{currentRide.fare}
                                    </span>
                                </div>

                                <button
                                    className="uber-btn uber-btn-primary"
                                    style={{ width: '100%' }}
                                    onClick={handlePayWithRazorpay}
                                    disabled={!RAZORPAY_KEY}
                                >
                                    Pay with Razorpay
                                </button>

                                <button
                                    className="uber-btn uber-btn-outline"
                                    style={{ width: '100%' }}
                                    onClick={async () => {
                                        const vpa = prompt('Enter UPI ID (e.g., user@bank)');
                                        if (!vpa) return;
                                        try {
                                            await fetch(`${API_BASE}/payments/upi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vpa, rideId: currentRide.bookingId, amount: currentRide.fare }) });
                                            // Try opening UPI intent link (mobile)
                                            const upi = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent('ApnaRide')}&am=${encodeURIComponent(currentRide.fare)}&cu=INR&tn=${encodeURIComponent('Ride ' + currentRide.bookingId)}`;
                                            window.location.href = upi;
                                            addNotification('UPI payment initiated', 'success');
                                        } catch { addNotification('UPI failed to start', 'error'); }
                                    }}
                                >
                                    Pay via UPI
                                </button>

                                <button
                                    className="uber-btn uber-btn-outline"
                                    style={{ width: '100%' }}
                                    onClick={handleCancelRide}
                                >
                                    Cancel Ride
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP modal is rendered via the reusable <OtpModal /> earlier */}

            {/* SOS Button */}
            {(step === 'tracking' || step === 'booking') && (
                <button className="uber-sos-button" onClick={handleSOS}>
                    SOS
                </button>
            )}

            {/* Floating Chat Toggle Button - only show when chat is closed */}
            {currentRide && !showChatWidget && (
                <div className="uber-chat-widget">
                    <button className="uber-chat-button" onClick={() => setShowChatWidget(true)} title="Open chat">
                        💬
                    </button>
                </div>
            )}

            {/* SOS auto-share overlay */}
            {sosCountdown > 0 && (
                <div style={{ position: 'fixed', left: 20, bottom: 100, background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 6px 20px rgba(0,0,0,0.2)', zIndex: 1004 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>SOS sending in {sosCountdown}s</div>
                    <button className="uber-btn uber-btn-outline" onClick={cancelSOSAutoShare}>Cancel</button>
                </div>
            )}
            
            {/* Rating Modal */}
            <RideRatingModal
                isOpen={showRatingModal}
                onClose={() => {
                    setShowRatingModal(false);
                    setCompletedRideDetails(null);
                    setCurrentRide(null);
                    setStep('search');
                    setRouteCoordinates([]);
                }}
                onSubmit={async ({ rating, feedback }) => {
                    try {
                        const bookingId = currentRide?.bookingId;
                        if (!bookingId) {
                            addNotification('Cannot submit rating: booking ID missing', 'error');
                            return;
                        }
                        const response = await fetch(`${API_BASE}/rides/${bookingId}/rate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                customerId: user.id,
                                rating, 
                                feedback 
                            })
                        });
                        if (response.ok) {
                            addNotification('Thank you for your feedback!', 'success');
                        }
                    } catch (error) {
                        console.error('Rating submission failed:', error);
                    }
                }}
                rideDetails={completedRideDetails}
            />
        </div>
    );
}
