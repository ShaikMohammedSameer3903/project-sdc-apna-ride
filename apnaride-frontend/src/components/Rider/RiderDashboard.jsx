import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../../App.css';

export default function RiderDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [onTrip, setOnTrip] = useState(false);
    const [rideRequest, setRideRequest] = useState(null);
    const [tripDetails, setTripDetails] = useState(null);
    const [earnings, setEarnings] = useState({ today: 0, week: 0, total: 0 });
    const [currentLocation, setCurrentLocation] = useState([28.6139, 77.2090]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
            // Simulate earnings
            setEarnings({
                today: (Math.random() * 500 + 200).toFixed(2),
                week: (Math.random() * 3000 + 1500).toFixed(2),
                total: (Math.random() * 15000 + 5000).toFixed(2)
            });
        }
    }, [navigate]);

    useEffect(() => {
        // Simulate incoming ride requests when online
        if (isOnline && !onTrip && !rideRequest) {
            const timer = setTimeout(() => {
                setRideRequest({
                    id: `REQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    pickup: 'Connaught Place, Delhi',
                    destination: 'Gurgaon Cyber City',
                    distance: '18.5 km',
                    fare: (Math.random() * 200 + 150).toFixed(2),
                    customerName: 'Priya Sharma'
                });
            }, Math.random() * 10000 + 5000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, onTrip, rideRequest]);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleAcceptRide = () => {
        setTripDetails(rideRequest);
        setOnTrip(true);
        setRideRequest(null);
    };

    const handleDeclineRide = () => {
        setRideRequest(null);
    };

    const handleEndTrip = () => {
        const tripEarning = parseFloat(tripDetails.fare) * 0.8;
        setEarnings(prev => ({
            today: (parseFloat(prev.today) + tripEarning).toFixed(2),
            week: (parseFloat(prev.week) + tripEarning).toFixed(2),
            total: (parseFloat(prev.total) + tripEarning).toFixed(2)
        }));
        setOnTrip(false);
        setTripDetails(null);
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
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={currentLocation}>
                                    <Popup>Your Location</Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        {/* Earnings Card */}
                        <div className="card mt-6">
                            <h3 className="text-xl font-bold mb-4">Earnings Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Today</p>
                                    <p className="text-2xl font-bold text-green-600">₹{earnings.today}</p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-gray-600">This Week</p>
                                    <p className="text-2xl font-bold text-blue-600">₹{earnings.week}</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-purple-600">₹{earnings.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status & Requests Section */}
                    <div>
                        {/* Online/Offline Toggle */}
                        <div className="card mb-6">
                            <h3 className="text-xl font-bold mb-4">Status</h3>
                            <button 
                                onClick={() => setIsOnline(!isOnline)}
                                className={`btn w-full ${isOnline ? 'btn-danger' : 'btn-success'}`}
                            >
                                <i className={`fa-solid ${isOnline ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2`}></i>
                                {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                            <p className="text-center mt-3 text-sm text-gray-600">
                                {isOnline ? 'You are online and accepting rides' : 'You are offline'}
                            </p>
                        </div>

                        {/* Current Trip */}
                        {onTrip && tripDetails && (
                            <div className="card animate-slide-in">
                                <h3 className="text-xl font-bold text-blue-600 mb-4">
                                    <i className="fa-solid fa-route mr-2"></i>On Trip
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Trip ID:</strong> {tripDetails.id}</p>
                                    <p><strong>Customer:</strong> {tripDetails.customerName}</p>
                                    <p><strong>Pickup:</strong> {tripDetails.pickup}</p>
                                    <p><strong>Drop:</strong> {tripDetails.destination}</p>
                                    <p><strong>Distance:</strong> {tripDetails.distance}</p>
                                    <p className="text-lg"><strong>Your Earning:</strong> 
                                        <span className="text-green-600 font-bold"> ₹{(tripDetails.fare * 0.8).toFixed(2)}</span>
                                    </p>
                                </div>
                                <button onClick={handleEndTrip} className="btn btn-danger w-full mt-4">
                                    <i className="fa-solid fa-flag-checkered mr-2"></i>End Trip
                                </button>
                            </div>
                        )}

                        {/* Ride Request */}
                        {!onTrip && rideRequest && (
                            <div className="card animate-slide-in">
                                <h3 className="text-xl font-bold text-green-600 mb-4">
                                    <i className="fa-solid fa-bell mr-2"></i>New Ride Request!
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p><strong>Request ID:</strong> {rideRequest.id}</p>
                                    <p><strong>Customer:</strong> {rideRequest.customerName}</p>
                                    <p><strong>From:</strong> {rideRequest.pickup}</p>
                                    <p><strong>To:</strong> {rideRequest.destination}</p>
                                    <p><strong>Distance:</strong> {rideRequest.distance}</p>
                                    <p className="text-lg"><strong>Your Earning:</strong> 
                                        <span className="text-green-600 font-bold"> ₹{(rideRequest.fare * 0.8).toFixed(2)}</span>
                                    </p>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={handleAcceptRide} className="btn btn-success flex-1">
                                        <i className="fa-solid fa-check mr-2"></i>Accept
                                    </button>
                                    <button onClick={handleDeclineRide} className="btn btn-danger flex-1">
                                        <i className="fa-solid fa-times mr-2"></i>Decline
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Waiting State */}
                        {!onTrip && !rideRequest && isOnline && (
                            <div className="card text-center">
                                <i className="fa-solid fa-clock text-4xl text-yellow-500 mb-3"></i>
                                <p className="text-lg font-semibold">Waiting for ride requests...</p>
                                <p className="text-sm text-gray-600 mt-2">Stay online to receive requests</p>
                            </div>
                        )}

                        {!isOnline && !onTrip && (
                            <div className="card text-center">
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
