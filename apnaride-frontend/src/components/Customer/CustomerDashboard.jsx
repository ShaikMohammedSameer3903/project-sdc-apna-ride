import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../App.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ShareIcon = () => <i className="fa-solid fa-users ride-icon"></i>;
const BikeIcon = () => <i className="fa-solid fa-motorcycle ride-icon"></i>;
const AutoIcon = () => <i className="fa-solid fa-car-side ride-icon"></i>;
const CarIcon = () => <i className="fa-solid fa-car ride-icon"></i>;
const Spinner = ({className}) => <i className={`fa-solid fa-spinner spinner ${className || ''}`}></i>;

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [pickupCoords, setPickupCoords] = useState([28.6139, 77.2090]); // Delhi default
    const [destCoords, setDestCoords] = useState([28.7041, 77.1025]); // Delhi NCR
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulate getting quotes
        setTimeout(() => {
            const basePrice = Math.random() * 100 + 80;
            setVehicles([
                { type: 'Share', price: (basePrice * 0.5).toFixed(0), eta: Math.floor(Math.random() * 8 + 4) },
                { type: 'Bike', price: (basePrice * 0.6).toFixed(0), eta: Math.floor(Math.random() * 5 + 2) },
                { type: 'Auto', price: (basePrice * 0.8).toFixed(0), eta: Math.floor(Math.random() * 7 + 3) },
                { type: 'Car', price: basePrice.toFixed(0), eta: Math.floor(Math.random() * 10 + 5) },
            ]);
            setStep(2);
            setIsLoading(false);
        }, 1000);
    };

    const handleBooking = () => {
        setStep(3);
        // Simulate driver matching
        setTimeout(() => {
            setBookingDetails({
                bookingId: `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                driver: 'Suresh Kumar',
                vehicle: `${selectedVehicle.type} - DL 05 BA 1234`,
                eta: selectedVehicle.eta,
                rating: (Math.random() * 1.5 + 3.5).toFixed(1),
                fare: selectedVehicle.price
            });
            setStep(4);
        }, 2000);
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map Section */}
                    <div className="card" style={{height: '500px', padding: '0', overflow: 'hidden'}}>
                        <MapContainer 
                            center={pickupCoords} 
                            zoom={12} 
                            style={{height: '100%', width: '100%'}}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={pickupCoords}>
                                <Popup>Pickup Location</Popup>
                            </Marker>
                            <Marker position={destCoords}>
                                <Popup>Drop Location</Popup>
                            </Marker>
                            <Polyline positions={[pickupCoords, destCoords]} color="blue" />
                        </MapContainer>
                    </div>

                    {/* Booking Section */}
                    <div>
                        {step === 1 && (
                            <div className="card">
                                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                                    Moving India, one ride at a time.
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
                                                placeholder="Enter pickup location" 
                                                className="input-field" 
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Drop Location</label>
                                        <div className="input-container">
                                            <div className="input-icon"><i className="fa-solid fa-map-marker-alt"></i></div>
                                            <input 
                                                type="text" 
                                                value={destination} 
                                                onChange={e => setDestination(e.target.value)} 
                                                placeholder="Enter drop location" 
                                                className="input-field" 
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="btn btn-dark">
                                        {isLoading ? <Spinner /> : 'Search Rides'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-slide-in">
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
                                                    <p className="ride-eta">{v.eta} min ETA</p>
                                                </div>
                                            </div>
                                            <p className="ride-price">₹{v.price}</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleBooking} 
                                    disabled={!selectedVehicle} 
                                    className="btn btn-dark w-full mt-6"
                                >
                                    Book Now
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center card animate-slide-in">
                                <h2 className="text-2xl font-bold">Finding your ride...</h2>
                                <Spinner className="text-yellow-500 mx-auto my-6 text-4xl" />
                                <p className="text-gray-600">Please wait while we connect you with a nearby driver.</p>
                            </div>
                        )}

                        {step === 4 && bookingDetails && (
                            <div className="text-center card animate-slide-in">
                                <h2 className="text-2xl font-bold text-green-600">Driver on the way!</h2>
                                <div className="text-left mt-6 bg-gray-50 p-4 rounded-lg">
                                    <p><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
                                    <p><strong>Driver:</strong> {bookingDetails.driver} 
                                        <span className="text-yellow-500 ml-2">★ {bookingDetails.rating}</span>
                                    </p>
                                    <p><strong>Vehicle:</strong> {bookingDetails.vehicle}</p>
                                    <p className="font-bold text-2xl mt-2">Arriving in: {bookingDetails.eta} min</p>
                                    <p className="text-lg mt-2"><strong>Fare:</strong> ₹{bookingDetails.fare}</p>
                                </div>
                                <button 
                                    onClick={() => setStep(1)} 
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
