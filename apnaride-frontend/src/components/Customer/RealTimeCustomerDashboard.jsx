import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeAddress, getCurrentLocation, calculateDistance } from '../../services/geocodingService';
import '../../App.css';
import webSocketService from '../../services/webSocketService';
import paymentIntegration from '../../services/paymentIntegration';
import RealTimeChat from '../Common/RealTimeChat';
import { useToast } from '../../context/ToastContext';

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

const ShareIcon = () => <i className="fa-solid fa-users ride-icon"></i>;
const BikeIcon = () => <i className="fa-solid fa-motorcycle ride-icon"></i>;
const AutoIcon = () => <i className="fa-solid fa-car-side ride-icon"></i>;
const CarIcon = () => <i className="fa-solid fa-car ride-icon"></i>;
const Spinner = ({className}) => <i className={`fa-solid fa-spinner spinner ${className || ''}`}></i>;

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

export default function RealTimeCustomerDashboard() {
    const navigate = useNavigate();
    const toast = useToast?.();
    const [user, setUser] = useState(null);
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [pickupCoords, setPickupCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default Delhi
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [currentRideId, setCurrentRideId] = useState(null);
    const [driverCoords, setDriverCoords] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
            // Get current location
            getCurrentLocation()
                .then(coords => {
                    setMapCenter([coords.lat, coords.lng]);
                })
                .catch(err => console.log('Location access denied, using default'));
        }
    }, [navigate]);

    // WebSocket ride updates subscription (replaces polling)
    useEffect(() => {
        if (!currentRideId || !user || step !== 3) return;
        let sub = null;
        const connectAndSubscribe = async () => {
            if (!webSocketService.isConnected()) {
                await new Promise(resolve => webSocketService.connect(resolve, resolve));
            }
            sub = webSocketService.subscribeToRideUpdates(user.id, (update) => {
                if (!update) return;
                if (update.type === 'RIDE_ACCEPTED' && (update.bookingId === currentRideId || (update.ride && update.ride.bookingId === currentRideId))) {
                    const r = update.ride || {};
                    setBookingDetails({
                        bookingId: r.bookingId || currentRideId,
                        driver: r.driverName || 'Driver',
                        vehicle: r.vehicleNumber || r.vehicleType,
                        eta: 5,
                        rating: r.rating || 4.5,
                        fare: r.fare,
                        driverId: r.driverId
                    });
                    setStep(4);
                    if (toast) toast.success('Driver accepted your ride!');
                }
            });
        };
        connectAndSubscribe();
        return () => { if (sub) try { sub.unsubscribe(); } catch {} };
    }, [currentRideId, step, user]);

    // Subscribe to driver location updates once driverId is known (step 4)
    useEffect(() => {
        if (!bookingDetails?.driverId) return;
        let sub = null;
        const run = async () => {
            if (!webSocketService.isConnected()) {
                await new Promise(resolve => webSocketService.connect(resolve, resolve));
            }
            sub = webSocketService.subscribeToDriverLocation(bookingDetails.driverId, (loc) => {
                if (loc?.latitude && loc?.longitude) {
                    setDriverCoords([loc.latitude, loc.longitude]);
                }
            });
        };
        run();
        return () => { if (sub) try { sub.unsubscribe(); } catch {} };
    }, [bookingDetails?.driverId]);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const geocodePickup = async () => {
        if (!pickup.trim()) return;
        
        setIsGeocoding(true);
        setError('');
        try {
            const result = await geocodeAddress(pickup);
            if (result) {
                setPickupCoords([result.lat, result.lng]);
                setMapCenter([result.lat, result.lng]);
                setError('');
            } else {
                setError('Could not find pickup location. Please try a different address.');
            }
        } catch (err) {
            setError('Error finding location. Please try again.');
        }
        setIsGeocoding(false);
    };

    const geocodeDestination = async () => {
        if (!destination.trim()) return;
        
        setIsGeocoding(true);
        setError('');
        try {
            const result = await geocodeAddress(destination);
            if (result) {
                setDestCoords([result.lat, result.lng]);
                setError('');
            } else {
                setError('Could not find destination. Please try a different address.');
            }
        } catch (err) {
            setError('Error finding location. Please try again.');
        }
        setIsGeocoding(false);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!pickupCoords || !destCoords) {
            setError('Please wait for locations to be found on the map');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Calculate distance
            const distance = calculateDistance(
                pickupCoords[0], pickupCoords[1],
                destCoords[0], destCoords[1]
            );

            // Calculate fares based on distance
            const baseFares = {
                'Share': 30,
                'Bike': 40,
                'Auto': 50,
                'Car': 80
            };

            const vehicleOptions = Object.keys(baseFares).map(type => ({
                type,
                price: Math.round(baseFares[type] + (distance * 10)),
                eta: Math.round(distance * 2 + Math.random() * 5 + 2),
                distance: distance.toFixed(1)
            }));

            setVehicles(vehicleOptions);
            setStep(2);
        } catch (err) {
            setError('Error calculating fare. Please try again.');
        }
        setIsLoading(false);
    };

    const handleBooking = async () => {
        if (!selectedVehicle || !user) return;

        setIsLoading(true);
        setError('');

        try {
            const rideRequest = {
                customerId: user.id,
                pickupLocation: pickup,
                dropLocation: destination,
                vehicleType: selectedVehicle.type,
                pickupLat: pickupCoords[0],
                pickupLng: pickupCoords[1],
                dropLat: destCoords[0],
                dropLng: destCoords[1]
            };

            const response = await fetch(`${API_BASE}/rides/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rideRequest)
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentRideId(data.bookingId);
                setStep(3); // Waiting for driver
            } else {
                setError('Failed to book ride. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        }
        setIsLoading(false);
    };

    if (!user) return null;

    return (
        <div className="w-full">
            <header className="header">
                <nav className="navbar container">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div className="logo-text">ApnaRide</div>
                    </div>
                    <div>
                        <span className="nav-user-info">Welcome, {user.name}!</span>
                        <button onClick={handleSignOut} className="btn-yellow">Sign Out</button>
                    </div>
                </nav>
            </header>
            
            <main className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {error && (
                    <div className="error-alert animate-shake mb-4">
                        <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    <div className="card" style={{height: '500px', padding: '0', overflow: 'hidden'}}>
                        <MapContainer 
                            center={mapCenter} 
                            zoom={13} 
                            style={{height: '100%', width: '100%'}}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            <MapUpdater center={mapCenter} />
                            
                            {pickupCoords && (
                                <Marker position={pickupCoords}>
                                    <Popup>
                                        <strong>Pickup:</strong><br/>
                                        {pickup}
                                    </Popup>
                                </Marker>
                            )}
                            
                            {destCoords && (
                                <Marker position={destCoords}>
                                    <Popup>
                                        <strong>Drop:</strong><br/>
                                        {destination}
                                    </Popup>
                                </Marker>
                            )}
                            
                            {pickupCoords && destCoords && (
                                <Polyline 
                                    positions={[pickupCoords, destCoords]} 
                                    color="#667eea" 
                                    weight={4}
                                />
                            )}
                            {/* Show driver live position towards pickup when available */}
                            {driverCoords && (
                                <>
                                    <Marker position={driverCoords}>
                                        <Popup>
                                            <strong>Driver</strong>
                                        </Popup>
                                    </Marker>
                                    {pickupCoords && (
                                        <Polyline positions={[driverCoords, pickupCoords]} color="#10b981" weight={3} />
                                    )}
                                </>
                            )}
                        </MapContainer>
                    </div>

                    {/* Booking Section */}
                    <div>
                        {step === 1 && (
                            <div className="card animate-slide-up">
                                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                                    Book Your Ride
                                </h1>
                                <form onSubmit={handleSearch} className="form-container">
                                    <div>
                                        <label className="form-label">Pickup Location</label>
                                        <div className="input-container">
                                            <div className="input-icon"><i className="fa-solid fa-location-arrow"></i></div>
                                            <input 
                                                type="text" 
                                                value={pickup} 
                                                onChange={e => setPickup(e.target.value)}
                                                onBlur={geocodePickup}
                                                placeholder="e.g., Connaught Place, Delhi" 
                                                className="input-field" 
                                                required
                                            />
                                        </div>
                                        {isGeocoding && <p className="text-sm text-blue-600 mt-1">Finding location...</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Drop Location</label>
                                        <div className="input-container">
                                            <div className="input-icon"><i className="fa-solid fa-map-marker-alt"></i></div>
                                            <input 
                                                type="text" 
                                                value={destination} 
                                                onChange={e => setDestination(e.target.value)}
                                                onBlur={geocodeDestination}
                                                placeholder="e.g., Gurgaon Cyber City" 
                                                className="input-field" 
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !pickupCoords || !destCoords} 
                                        className="btn btn-dark"
                                    >
                                        {isLoading ? <Spinner /> : 'Search Rides'}
                                    </button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        💡 Tip: Enter full address for accurate location
                                    </p>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-slide-up">
                                <button onClick={() => setStep(1)} className="btn-back">
                                    <i className="fa-solid fa-arrow-left"></i> Go Back
                                </button>
                                <h2 className="text-2xl font-bold text-center mb-6">Choose your ride</h2>
                                <div className="space-y-4">
                                    {vehicles.map(v => (
                                        <div 
                                            key={v.type} 
                                            onClick={() => setSelectedVehicle(v)} 
                                            className={`ride-option ${selectedVehicle?.type === v.type ? 'selected' : ''}`}
                                        >
                                            <div className="ride-info">
                                                {v.type === 'Share' && <ShareIcon />}
                                                {v.type === 'Bike' && <BikeIcon />}
                                                {v.type === 'Auto' && <AutoIcon />}
                                                {v.type === 'Car' && <CarIcon />}
                                                <div>
                                                    <p className="ride-name">{v.type}</p>
                                                    <p className="ride-eta">{v.distance} km • {v.eta} min</p>
                                                </div>
                                            </div>
                                            <p className="ride-price">₹{v.price}</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleBooking} 
                                    disabled={!selectedVehicle || isLoading} 
                                    className="btn btn-dark w-full mt-6"
                                >
                                    {isLoading ? <Spinner /> : 'Book Now'}
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center card animate-slide-up">
                                <div className="loading-spinner mx-auto mb-4"></div>
                                <h2 className="text-2xl font-bold">Finding your driver...</h2>
                                <p className="text-gray-600 mt-4">Please wait while we connect you with a nearby driver.</p>
                                <p className="text-sm text-gray-500 mt-2">Booking ID: {currentRideId}</p>
                                <div className="loading-dots mt-6">
                                    <div className="loading-dot"></div>
                                    <div className="loading-dot"></div>
                                    <div className="loading-dot"></div>
                                </div>
                            </div>
                        )}

                        {step === 4 && bookingDetails && (
                            <div className="text-center card animate-bounce-in">
                                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>✅</div>
                                <h2 className="text-2xl font-bold text-green-600">Driver Accepted!</h2>
                                <div className="text-left mt-6 bg-gray-50 p-4 rounded-lg">
                                    <p><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
                                    <p><strong>Driver:</strong> {bookingDetails.driver} 
                                        <span className="text-yellow-500 ml-2">★ {bookingDetails.rating}</span>
                                    </p>
                                    <p><strong>Vehicle:</strong> {bookingDetails.vehicle}</p>
                                    <p className="font-bold text-2xl mt-2 text-blue-600">Arriving in: ~{bookingDetails.eta} min</p>
                                    <p className="text-lg mt-2"><strong>Fare:</strong> ₹{bookingDetails.fare}</p>
                                </div>
                                {/* Cash Payment CTA */}
                                <button 
                                    onClick={async () => {
                                        try {
                                            const res = await paymentIntegration.processCashPayment(currentRideId, bookingDetails.fare);
                                            if (res.success) {
                                                if (toast) toast.success('Cash payment recorded. Have a safe ride!');
                                            } else {
                                                if (toast) toast.error(res.error || 'Could not record cash payment');
                                            }
                                        } catch (e) {
                                            if (toast) toast.error('Network error recording cash payment');
                                        }
                                    }}
                                    className="btn btn-dark w-full mt-3"
                                >Pay Cash to Driver</button>
                                {/* Inline Chat */}
                                <div className="mt-4" style={{ height: 320 }}>
                                    <RealTimeChat 
                                        rideId={currentRideId} 
                                        userId={user.id} 
                                        userName={user.name} 
                                        userType="customer" 
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        setStep(1);
                                        setPickup('');
                                        setDestination('');
                                        setPickupCoords(null);
                                        setDestCoords(null);
                                        setSelectedVehicle(null);
                                        setCurrentRideId(null);
                                    }} 
                                    className="btn btn-dark w-full mt-4"
                                >
                                    Book Another Ride
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
