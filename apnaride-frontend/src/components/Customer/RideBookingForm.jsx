import React, { useState } from 'react';
import { geocodeAddress } from '../../services/geocodingService';
import '../../modern-design-system.css';

const VEHICLE_TYPES = [
    { type: 'Share', icon: 'fa-users', baseFare: 30, perKm: 8 },
    { type: 'Bike', icon: 'fa-motorcycle', baseFare: 40, perKm: 10 },
    { type: 'Auto', icon: 'fa-car-side', baseFare: 50, perKm: 12 },
    { type: 'Car', icon: 'fa-car', baseFare: 80, perKm: 15 }
];

export default function RideBookingForm({ onBookingSubmit }) {
    const [pickup, setPickup] = useState('');
    const [drop, setDrop] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [pickupCoords, setPickupCoords] = useState(null);
    const [dropCoords, setDropCoords] = useState(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [estimatedFare, setEstimatedFare] = useState(null);

    const handlePickupBlur = async () => {
        if (!pickup.trim()) return;
        setIsGeocoding(true);
        try {
            const result = await geocodeAddress(pickup);
            if (result) {
                setPickupCoords(result);
                calculateFare(result, dropCoords);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        setIsGeocoding(false);
    };

    const handleDropBlur = async () => {
        if (!drop.trim()) return;
        setIsGeocoding(true);
        try {
            const result = await geocodeAddress(drop);
            if (result) {
                setDropCoords(result);
                calculateFare(pickupCoords, result);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        setIsGeocoding(false);
    };

    const calculateFare = (pickup, drop) => {
        if (!pickup || !drop || !selectedVehicle) return;

        const distance = calculateDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
        const vehicle = VEHICLE_TYPES.find(v => v.type === selectedVehicle);
        const fare = vehicle.baseFare + (distance * vehicle.perKm);
        
        setEstimatedFare({
            distance: distance.toFixed(1),
            fare: Math.round(fare),
            eta: Math.round(distance * 2 + 5)
        });
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pickupCoords || !dropCoords || !selectedVehicle) {
            alert('Please fill all fields and wait for locations to be geocoded');
            return;
        }

        onBookingSubmit({
            pickup,
            drop,
            pickupCoords,
            dropCoords,
            vehicleType: selectedVehicle,
            estimatedFare: estimatedFare.fare
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pickup Location */}
            <div>
                <label className="block text-sm font-semibold mb-2">Pickup Location</label>
                <div className="input-group">
                    <i className="fa-solid fa-location-dot input-icon text-green-600"></i>
                    <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        onBlur={handlePickupBlur}
                        placeholder="Enter pickup location"
                        className="input-minimal input-with-icon"
                        required
                    />
                </div>
                {isGeocoding && <p className="text-xs text-blue-600 mt-1">Finding location...</p>}
            </div>

            {/* Drop Location */}
            <div>
                <label className="block text-sm font-semibold mb-2">Drop Location</label>
                <div className="input-group">
                    <i className="fa-solid fa-map-marker-alt input-icon text-red-600"></i>
                    <input
                        type="text"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        onBlur={handleDropBlur}
                        placeholder="Enter drop location"
                        className="input-minimal input-with-icon"
                        required
                    />
                </div>
            </div>

            {/* Vehicle Selection */}
            <div>
                <label className="block text-sm font-semibold mb-2">Select Vehicle</label>
                <div className="grid grid-cols-2 gap-3">
                    {VEHICLE_TYPES.map(vehicle => (
                        <button
                            key={vehicle.type}
                            type="button"
                            onClick={() => {
                                setSelectedVehicle(vehicle.type);
                                calculateFare(pickupCoords, dropCoords);
                            }}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                selectedVehicle === vehicle.type
                                    ? 'border-black bg-black text-white'
                                    : 'border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            <i className={`fa-solid ${vehicle.icon} text-2xl mb-2`}></i>
                            <p className="font-semibold">{vehicle.type}</p>
                            <p className="text-xs opacity-75">₹{vehicle.baseFare} + ₹{vehicle.perKm}/km</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Estimated Fare */}
            {estimatedFare && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600">Distance</p>
                            <p className="font-bold">{estimatedFare.distance} km</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">ETA</p>
                            <p className="font-bold">{estimatedFare.eta} min</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Fare</p>
                            <p className="font-bold text-green-600 text-xl">₹{estimatedFare.fare}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!pickupCoords || !dropCoords || !selectedVehicle}
                className="btn-primary w-full py-4 text-lg"
            >
                <i className="fa-solid fa-check mr-2"></i>
                Book Ride
            </button>
        </form>
    );
}
