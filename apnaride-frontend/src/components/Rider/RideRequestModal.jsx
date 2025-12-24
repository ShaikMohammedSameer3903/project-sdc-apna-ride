import React from 'react';
import '../../modern-design-system.css';

export default function RideRequestModal({ ride, onAccept, onDecline, isLoading }) {
    if (!ride) return null;

    const calculateEarnings = (fare) => {
        return (fare * 0.8).toFixed(2); // 80% to driver
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">New Ride Request!</h2>
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                            <i className="fa-solid fa-bell text-2xl"></i>
                        </div>
                    </div>
                    <p className="text-green-100">A customer is waiting for you</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Booking ID */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Booking ID</p>
                        <p className="font-mono font-bold">{ride.bookingId}</p>
                    </div>

                    {/* Route */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-location-dot text-green-600"></i>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Pickup</p>
                                <p className="font-semibold">{ride.pickupLocation}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fa-solid fa-map-marker-alt text-red-600"></i>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">Drop</p>
                                <p className="font-semibold">{ride.dropLocation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <i className="fa-solid fa-road text-blue-600 mb-1"></i>
                            <p className="text-xs text-gray-600">Distance</p>
                            <p className="font-bold">{ride.distance || '5.2'} km</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <i className="fa-solid fa-car text-purple-600 mb-1"></i>
                            <p className="text-xs text-gray-600">Vehicle</p>
                            <p className="font-bold">{ride.vehicleType}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <i className="fa-solid fa-clock text-orange-600 mb-1"></i>
                            <p className="text-xs text-gray-600">ETA</p>
                            <p className="font-bold">~8 min</p>
                        </div>
                    </div>

                    {/* Earnings */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Your Earnings</p>
                                <p className="text-xs text-gray-500">(80% of fare)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-green-600">
                                    ₹{calculateEarnings(ride.fare)}
                                </p>
                                <p className="text-xs text-gray-500">Total: ₹{ride.fare}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onDecline}
                            disabled={isLoading}
                            className="flex-1 py-4 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                        >
                            <i className="fa-solid fa-times mr-2"></i>
                            Decline
                        </button>
                        <button
                            onClick={() => onAccept(ride)}
                            disabled={isLoading}
                            className="flex-1 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg"
                        >
                            {isLoading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-check mr-2"></i>
                                    Accept Ride
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
