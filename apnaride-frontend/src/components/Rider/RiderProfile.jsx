import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EditProfileModal from '../Common/EditProfileModal';
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import '../../profile-styles.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function RiderProfile() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [driver, setDriver] = useState(null);
    const [rideHistory, setRideHistory] = useState([]);
    const [earnings, setEarnings] = useState({
        today: 0,
        week: 0,
        month: 0,
        total: 0
    });
    const [stats, setStats] = useState({
        totalRides: 0,
        rating: 4.8,
        acceptanceRate: 95,
        completionRate: 98
    });
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            loadDriverData(parsedUser.id);
            loadRideHistory(parsedUser.id);
        }
    }, [navigate]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const loadDriverData = async (userId) => {
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
            }
        } catch (error) {
            console.error('Error loading driver data:', error);
        }
    };

    const loadRideHistory = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/rides/rider/${userId}`);
            if (response.ok) {
                const rides = await response.json();
                setRideHistory(rides);
                calculateEarnings(rides);
            }
        } catch (error) {
            console.error('Error loading ride history:', error);
        }
        setIsLoading(false);
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

    const getStatusColor = (status) => {
        const colors = {
            'COMPLETED': 'bg-green-100 text-green-700',
            'ACCEPTED': 'bg-blue-100 text-blue-700',
            'IN_PROGRESS': 'bg-yellow-100 text-yellow-700',
            'CANCELLED': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (!user) return null;

    return (
        <div className="profile-container">
            {/* Animated Background */}
            <SimpleAnimatedBackground variant="rider" />
            
            {/* Header */}
            <header className="profile-header">
                <div className="profile-header-content">
                    <button onClick={() => navigate('/rider')} className="profile-back-btn">
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Dashboard
                    </button>
                    <h1 className="profile-title">Driver Profile</h1>
                    <div style={{ width: '150px' }}></div>
                </div>
            </header>

            <div className="container mx-auto p-6 max-w-6xl">
                {/* Profile Header */}
                <div className="card-minimal mb-6 animate-slide-down">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-600">{user.email}</p>
                            {driver && (
                                <div className="flex gap-4 mt-3">
                                    <span className={`status-indicator ${driver.isOnline ? 'status-online' : 'status-offline'}`}>
                                        <span className={`status-dot ${driver.isOnline ? 'status-dot-online' : 'status-dot-offline'}`}></span>
                                        {driver.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        <i className="fa-solid fa-car mr-1"></i>
                                        {driver.vehicleType} • {driver.vehicleNumber}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button 
                            className="btn-outline"
                            onClick={() => setShowEditModal(true)}
                        >
                            <i className="fa-solid fa-edit mr-2"></i>
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Edit Profile Modal */}
                {showEditModal && (
                    <EditProfileModal
                        user={user}
                        onClose={() => setShowEditModal(false)}
                        onUpdate={(updatedUser) => setUser(updatedUser)}
                    />
                )}

                {/* Earnings Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card-minimal text-center hover-lift animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <i className="fa-solid fa-calendar-day text-3xl text-blue-600 mb-2"></i>
                        <p className="text-2xl font-bold text-green-600">₹{earnings.today}</p>
                        <p className="text-sm text-gray-600">Today's Earnings</p>
                    </div>
                    <div className="card-minimal text-center hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
                        <i className="fa-solid fa-calendar-week text-3xl text-purple-600 mb-2"></i>
                        <p className="text-2xl font-bold text-green-600">₹{earnings.week}</p>
                        <p className="text-sm text-gray-600">This Week</p>
                    </div>
                    <div className="card-minimal text-center hover-lift animate-slide-up" style={{animationDelay: '0.3s'}}>
                        <i className="fa-solid fa-calendar-alt text-3xl text-orange-600 mb-2"></i>
                        <p className="text-2xl font-bold text-green-600">₹{earnings.month}</p>
                        <p className="text-sm text-gray-600">This Month</p>
                    </div>
                    <div className="card-minimal text-center hover-lift animate-slide-up" style={{animationDelay: '0.4s'}}>
                        <i className="fa-solid fa-wallet text-3xl text-green-600 mb-2"></i>
                        <p className="text-2xl font-bold text-green-600">₹{earnings.total}</p>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="card-minimal hover-lift animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Rides</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalRides}</p>
                            </div>
                            <i className="fa-solid fa-route text-4xl text-blue-500"></i>
                        </div>
                    </div>
                    <div className="card-minimal hover-lift animate-fade-in" style={{animationDelay: '0.1s'}}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Rating</p>
                                <p className="text-3xl font-bold text-yellow-500">{stats.rating} ⭐</p>
                            </div>
                            <i className="fa-solid fa-star text-4xl text-yellow-500"></i>
                        </div>
                    </div>
                    <div className="card-minimal hover-lift animate-fade-in" style={{animationDelay: '0.2s'}}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Acceptance Rate</p>
                                <p className="text-3xl font-bold text-green-600">{stats.acceptanceRate}%</p>
                            </div>
                            <i className="fa-solid fa-check-circle text-4xl text-green-500"></i>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="card-minimal animate-fade-in">
                    <div className="flex gap-4 border-b pb-4 mb-4 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'overview'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-chart-line mr-2"></i>
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'history'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-history mr-2"></i>
                            Trip History
                        </button>
                        <button
                            onClick={() => setActiveTab('earnings')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'earnings'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-wallet mr-2"></i>
                            Earnings
                        </button>
                        <button
                            onClick={() => setActiveTab('vehicle')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'vehicle'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-car mr-2"></i>
                            Vehicle Info
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'privacy'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-shield-alt mr-2"></i>
                            Privacy & Safety
                        </button>
                        <button
                            onClick={() => setActiveTab('preferences')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'preferences'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-sliders mr-2"></i>
                            Ride Preferences
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'settings'
                                    ? 'text-black border-b-2 border-black'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <i className="fa-solid fa-cog mr-2"></i>
                            Settings
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Recent Trips</h3>
                            {rideHistory.slice(0, 5).map((ride, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover-lift">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                            <i className="fa-solid fa-route text-green-600"></i>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{ride.pickupLocation}</p>
                                            <p className="text-sm text-gray-600">to {ride.dropLocation}</p>
                                            <p className="text-xs text-gray-500">{new Date(ride.requestedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-green-600">₹{(ride.fare * 0.8).toFixed(2)}</p>
                                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(ride.status)}`}>
                                            {ride.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-3 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">All Trips ({rideHistory.length})</h3>
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="loading-spinner mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading trips...</p>
                                </div>
                            ) : rideHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <i className="fa-solid fa-car text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-600">No trips yet. Go online to start earning!</p>
                                </div>
                            ) : (
                                rideHistory.map((ride, index) => (
                                    <div key={index} className="p-4 border border-gray-200 rounded-lg hover-lift">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-lg">{ride.bookingId}</p>
                                                <p className="text-sm text-gray-600">{new Date(ride.requestedAt).toLocaleString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(ride.status)}`}>
                                                {ride.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Pickup</p>
                                                <p className="font-medium">{ride.pickupLocation}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Drop</p>
                                                <p className="font-medium">{ride.dropLocation}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                            <span className="text-sm text-gray-600">Your Earning (80%)</span>
                                            <span className="font-bold text-lg text-green-600">₹{(ride.fare * 0.8).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'earnings' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Earnings Breakdown</h3>
                            
                            {/* Earnings Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg">
                                    <p className="text-sm opacity-90 mb-2">Total Earnings</p>
                                    <p className="text-4xl font-bold">₹{earnings.total}</p>
                                    <p className="text-sm opacity-80 mt-2">All time</p>
                                </div>
                                <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg">
                                    <p className="text-sm opacity-90 mb-2">This Month</p>
                                    <p className="text-4xl font-bold">₹{earnings.month}</p>
                                    <p className="text-sm opacity-80 mt-2">Last 30 days</p>
                                </div>
                            </div>

                            {/* Weekly Breakdown */}
                            <div className="p-4 border border-gray-200 rounded-lg mb-4">
                                <h4 className="font-bold mb-3">This Week</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Total Earnings</span>
                                        <span className="font-bold text-green-600">₹{earnings.week}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Completed Trips</span>
                                        <span className="font-bold">{stats.totalRides}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Average per Trip</span>
                                        <span className="font-bold">₹{stats.totalRides > 0 ? (earnings.week / stats.totalRides).toFixed(2) : 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payout Options */}
                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-bold mb-3">Payout Methods</h4>
                                <div className="space-y-3">
                                    <div className="p-3 border-2 border-green-500 bg-green-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <i className="fa-solid fa-building-columns text-green-600 text-xl"></i>
                                                <div>
                                                    <p className="font-semibold">Bank Account</p>
                                                    <p className="text-sm text-gray-600">****1234</p>
                                                </div>
                                            </div>
                                            <span className="text-green-600 font-semibold">Default</span>
                                        </div>
                                    </div>
                                    <button className="uber-btn uber-btn-outline" style={{ width: '100%' }}>
                                        <i className="fa-solid fa-plus mr-2"></i>
                                        Add Payout Method
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vehicle' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Vehicle Information</h3>
                            {!driver ? (
                                <div className="text-center py-12">
                                    <i className="fa-solid fa-car text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-600 mb-4">No vehicle information available</p>
                                    <p className="text-sm text-gray-500">Please complete your driver registration to add vehicle details</p>
                                </div>
                            ) : (
                                <>
                            <h3 className="text-xl font-bold mb-4 hidden">Vehicle Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Vehicle Type</p>
                                    <p className="text-lg font-semibold">{driver.vehicleType}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Vehicle Number</p>
                                    <p className="text-lg font-semibold">{driver.vehicleNumber}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">License Number</p>
                                    <p className="text-lg font-semibold">{driver.licenseNumber}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Verification Status</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        <i className="fa-solid fa-check-circle mr-2"></i>
                                        {driver.verificationStatus}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h4 className="font-bold mb-3">Documents</h4>
                                <div className="space-y-2">
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-id-card text-green-600"></i>
                                            <span className="font-semibold">Driving License</span>
                                        </div>
                                        <span className="text-green-600 text-sm">✓ Verified</span>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-file-alt text-green-600"></i>
                                            <span className="font-semibold">Vehicle Registration</span>
                                        </div>
                                        <span className="text-green-600 text-sm">✓ Verified</span>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-shield-alt text-green-600"></i>
                                            <span className="font-semibold">Insurance</span>
                                        </div>
                                        <span className="text-green-600 text-sm">✓ Verified</span>
                                    </div>
                                </div>
                            </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Privacy & Safety</h3>
                            
                            <div className="space-y-4">
                                {/* Safety Features */}
                                <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-shield-halved text-green-600"></i>
                                        Safety Features
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            24/7 Driver Support
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            Emergency SOS Button
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            Trip Recording
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            Background Verification
                                        </li>
                                    </ul>
                                </div>

                                {/* Location Privacy */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-location-dot text-purple-600"></i>
                                        Location Sharing
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Share location during trips</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Location history</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                    </div>
                                </div>

                                {/* Data Privacy */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-database text-blue-600"></i>
                                        Data Privacy
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Save trip history</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Analytics & Performance</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <button className="text-red-600 text-sm font-semibold mt-2">
                                            <i className="fa-solid fa-trash mr-2"></i>
                                            Delete All Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Ride Preferences</h3>
                            
                            <div className="space-y-4">
                                {/* Ride Acceptance */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-check-circle text-blue-600"></i>
                                        Ride Acceptance
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Auto-accept rides</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Accept long distance trips</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <div>
                                            <label className="text-sm font-semibold">Maximum Distance (km)</label>
                                            <input type="number" defaultValue="50" min="1" max="200" className="uber-input mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Preferences */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-car text-green-600"></i>
                                        Vehicle Preferences
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Accept bike rides</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Accept auto rides</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Accept car rides</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                    </div>
                                </div>

                                {/* Working Hours */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-clock text-purple-600"></i>
                                        Preferred Working Hours
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold">Start Time</label>
                                            <input type="time" defaultValue="08:00" className="uber-input mt-2" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold">End Time</label>
                                            <input type="time" defaultValue="20:00" className="uber-input mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Service Areas */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-map-marked-alt text-orange-600"></i>
                                        Preferred Service Areas
                                    </h4>
                                    <div className="space-y-2">
                                        <input type="text" placeholder="Add preferred area" className="uber-input" />
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                Downtown <i className="fa-solid fa-times ml-2 cursor-pointer"></i>
                                            </span>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                                Airport <i className="fa-solid fa-times ml-2 cursor-pointer"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button className="uber-btn uber-btn-primary" style={{ width: '100%' }}>
                                    <i className="fa-solid fa-save mr-2"></i>
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Settings</h3>
                            
                            <div className="space-y-4">
                                {/* Notifications */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3">Notifications</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Ride Request Alerts</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Push Notifications</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">SMS Notifications</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Sound Alerts</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3">Language</h4>
                                    <select className="uber-input">
                                        <option>English</option>
                                        <option>हिंदी (Hindi)</option>
                                        <option>বাংলা (Bengali)</option>
                                        <option>தமிழ் (Tamil)</option>
                                        <option>తెలుగు (Telugu)</option>
                                    </select>
                                </div>

                                {/* Account Actions */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 text-red-600">Account Actions</h4>
                                    <div className="space-y-2">
                                        <button className="uber-btn uber-btn-outline" style={{ width: '100%', borderColor: '#D32F2F', color: '#D32F2F' }}>
                                            <i className="fa-solid fa-pause mr-2"></i>
                                            Pause Account
                                        </button>
                                        <button className="uber-btn uber-btn-outline" style={{ width: '100%', borderColor: '#D32F2F', color: '#D32F2F' }}>
                                            <i className="fa-solid fa-trash mr-2"></i>
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
