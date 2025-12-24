import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../Common/EditProfileModal';
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import '../../profile-styles.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function CustomerProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [rideHistory, setRideHistory] = useState([]);
    const [stats, setStats] = useState({
        totalRides: 0,
        totalSpent: 0,
        favoriteVehicle: 'Bike',
        memberSince: new Date().toLocaleDateString()
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            loadRideHistory(parsedUser.id);
        }
    }, [navigate]);

    const loadRideHistory = async (customerId) => {
        try {
            const response = await fetch(`${API_BASE}/rides/customer/${customerId}`);
            if (response.ok) {
                const rides = await response.json();
                setRideHistory(rides);
                calculateStats(rides);
            }
        } catch (error) {
            console.error('Error loading ride history:', error);
        }
        setIsLoading(false);
    };

    const calculateStats = (rides) => {
        const totalSpent = rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        const vehicleCounts = {};
        rides.forEach(ride => {
            vehicleCounts[ride.vehicleType] = (vehicleCounts[ride.vehicleType] || 0) + 1;
        });
        const favoriteVehicle = Object.keys(vehicleCounts).reduce((a, b) => 
            vehicleCounts[a] > vehicleCounts[b] ? a : b, 'Bike'
        );

        setStats({
            totalRides: rides.length,
            totalSpent: totalSpent.toFixed(2),
            favoriteVehicle,
            memberSince: user?.createdAt || new Date().toLocaleDateString()
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'COMPLETED': 'bg-green-100 text-green-700',
            'REQUESTED': 'bg-yellow-100 text-yellow-700',
            'ACCEPTED': 'bg-blue-100 text-blue-700',
            'CANCELLED': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (!user) return null;

    return (
        <div className="profile-container">
            {/* Animated Background */}
            <SimpleAnimatedBackground variant="customer" />
            
            {/* Header */}
            <header className="profile-header">
                <div className="profile-header-content">
                    <button onClick={() => navigate('/customer')} className="profile-back-btn">
                        <i className="fa-solid fa-arrow-left"></i>
                        Back to Dashboard
                    </button>
                    <h1 className="profile-title">My Profile</h1>
                    <div style={{ width: '150px' }}></div>
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Profile Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="profile-info">
                            <h2 className="profile-name">{user.name}</h2>
                            <p className="profile-email">{user.email}</p>
                            <div className="profile-badges">
                                <span className="profile-badge profile-badge-online">
                                    <span className="profile-badge-dot"></span>
                                    Active Member
                                </span>
                                <span className="profile-badge profile-badge-info">
                                    <i className="fa-solid fa-calendar"></i>
                                    Joined {stats.memberSince}
                                </span>
                            </div>
                        </div>
                        <button 
                            className="profile-edit-btn"
                            onClick={() => setShowEditModal(true)}
                        >
                            <i className="fa-solid fa-edit"></i>
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

                {/* Stats Cards */}
                <div className="profile-stats-grid">
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ color: '#3b82f6' }}>
                            <i className="fa-solid fa-route"></i>
                        </div>
                        <div className="profile-stat-value">{stats.totalRides}</div>
                        <div className="profile-stat-label">Total Rides</div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ color: '#10b981' }}>
                            <i className="fa-solid fa-indian-rupee-sign"></i>
                        </div>
                        <div className="profile-stat-value">₹{stats.totalSpent}</div>
                        <div className="profile-stat-label">Total Spent</div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ color: '#8b5cf6' }}>
                            <i className="fa-solid fa-motorcycle"></i>
                        </div>
                        <div className="profile-stat-value">{stats.favoriteVehicle}</div>
                        <div className="profile-stat-label">Favorite Vehicle</div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ color: '#f59e0b' }}>
                            <i className="fa-solid fa-star"></i>
                        </div>
                        <div className="profile-stat-value">4.8</div>
                        <div className="profile-stat-label">Average Rating</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`profile-tab ${activeTab === 'overview' ? 'profile-tab-active' : ''}`}
                    >
                        <i className="fa-solid fa-chart-line"></i>
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`profile-tab ${activeTab === 'history' ? 'profile-tab-active' : ''}`}
                    >
                        <i className="fa-solid fa-history"></i>
                        Ride History
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`profile-tab ${activeTab === 'payments' ? 'profile-tab-active' : ''}`}
                    >
                        <i className="fa-solid fa-credit-card"></i>
                        Payments
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`profile-tab ${activeTab === 'privacy' ? 'profile-tab-active' : ''}`}
                    >
                        <i className="fa-solid fa-shield-alt"></i>
                        Privacy & Safety
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`profile-tab ${activeTab === 'settings' ? 'profile-tab-active' : ''}`}
                    >
                        <i className="fa-solid fa-cog"></i>
                        Settings
                    </button>
                </div>

                {/* Tab Content */}
                <div className="profile-tab-content">{/* Existing tab content */}

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                            {rideHistory.slice(0, 5).map((ride, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover-lift">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                            <i className="fa-solid fa-car text-blue-600"></i>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{ride.pickupLocation}</p>
                                            <p className="text-sm text-gray-600">to {ride.dropLocation}</p>
                                            <p className="text-xs text-gray-500">{new Date(ride.requestedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">₹{ride.fare}</p>
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
                            <h3 className="text-xl font-bold mb-4">All Rides ({rideHistory.length})</h3>
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="loading-spinner mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading rides...</p>
                                </div>
                            ) : rideHistory.length === 0 ? (
                                <div className="text-center py-12">
                                    <i className="fa-solid fa-car text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-600">No rides yet. Book your first ride!</p>
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
                                            <span className="text-sm text-gray-600">{ride.vehicleType}</span>
                                            <span className="font-bold text-lg text-green-600">₹{ride.fare}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Payment Methods</h3>
                            <div className="space-y-3">
                                <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-money-bill-wave text-2xl text-green-600"></i>
                                            <div>
                                                <p className="font-semibold">Cash</p>
                                                <p className="text-sm text-gray-600">Pay after ride</p>
                                            </div>
                                        </div>
                                        <span className="text-green-600 font-semibold">Default</span>
                                    </div>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg hover-lift cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-mobile-screen text-2xl text-purple-600"></i>
                                            <div>
                                                <p className="font-semibold">UPI</p>
                                                <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                                            </div>
                                        </div>
                                        <button className="text-blue-600">Add</button>
                                    </div>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg hover-lift cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-credit-card text-2xl text-blue-600"></i>
                                            <div>
                                                <p className="font-semibold">Credit/Debit Card</p>
                                                <p className="text-sm text-gray-600">Visa, Mastercard, RuPay</p>
                                            </div>
                                        </div>
                                        <button className="text-blue-600">Add</button>
                                    </div>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-lg hover-lift cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fa-solid fa-wallet text-2xl text-orange-600"></i>
                                            <div>
                                                <p className="font-semibold">Wallet</p>
                                                <p className="text-sm text-gray-600">ApnaRide Wallet</p>
                                            </div>
                                        </div>
                                        <button className="text-blue-600">Add Money</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <h4 className="font-bold mb-3">Payment History</h4>
                                <div className="space-y-2">
                                    {rideHistory.slice(0, 5).map((ride, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-semibold text-sm">{ride.bookingId}</p>
                                                <p className="text-xs text-gray-500">{new Date(ride.requestedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">₹{ride.fare}</p>
                                                <p className="text-xs text-gray-500">Cash</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-bold mb-4">Privacy & Safety</h3>
                            
                            <div className="space-y-4">
                                {/* Emergency WhatsApp */}
                                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <i className="fa-solid fa-phone-volume text-red-600"></i>
                                        Emergency WhatsApp Number
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                        This number will be used for SOS messages from the app.
                                    </p>
                                    <div className="px-3 py-2 rounded-lg border border-dashed border-red-300 bg-white inline-block min-w-[220px]">
                                        <span className="font-semibold text-gray-800">
                                            {user?.emergencyPhone || 'Not set yet'}
                                        </span>
                                    </div>
                                    {!user?.emergencyPhone && (
                                        <p className="text-xs text-red-600 mt-2">
                                            Tip: Open your profile "Edit" and add an emergency WhatsApp number so SOS can reach your trusted contact.
                                        </p>
                                    )}
                                </div>

                                {/* Emergency Contacts */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-phone text-red-600"></i>
                                        Emergency Contacts
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">Add trusted contacts who can be notified in case of emergency</p>
                                    <button className="uber-btn uber-btn-outline">
                                        <i className="fa-solid fa-plus mr-2"></i>
                                        Add Contact
                                    </button>
                                </div>

                                {/* Share Trip */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-share-nodes text-blue-600"></i>
                                        Share Trip
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">Share your trip details with friends and family in real-time</p>
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-5 h-5" />
                                        <span>Auto-share trips with emergency contacts</span>
                                    </label>
                                </div>

                                {/* Location Privacy */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-location-dot text-purple-600"></i>
                                        Location Privacy
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Share location during rides</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Save favorite locations</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                    </div>
                                </div>

                                {/* Data Privacy */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-database text-green-600"></i>
                                        Data Privacy
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Save ride history</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Personalized recommendations</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <button className="text-red-600 text-sm font-semibold mt-2">
                                            <i className="fa-solid fa-trash mr-2"></i>
                                            Delete All Data
                                        </button>
                                    </div>
                                </div>

                                {/* Safety Features */}
                                <div className="p-4 border border-gray-200 rounded-lg bg-red-50">
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-shield-halved text-red-600"></i>
                                        Safety Features
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            24/7 Safety Support
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            SOS Emergency Button
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            Real-time Trip Tracking
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-600"></i>
                                            Driver Verification
                                        </li>
                                    </ul>
                                </div>
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
                                            <span className="text-sm">Push Notifications</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Email Notifications</span>
                                            <input type="checkbox" defaultChecked className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">SMS Notifications</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Promotional Offers</span>
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

                                {/* Accessibility */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3">Accessibility</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Large Text</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">High Contrast</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-sm">Voice Guidance</span>
                                            <input type="checkbox" className="w-5 h-5" />
                                        </label>
                                    </div>
                                </div>

                                {/* Account Actions */}
                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <h4 className="font-bold mb-3 text-red-600">Account Actions</h4>
                                    <div className="space-y-2">
                                        <button className="uber-btn uber-btn-outline" style={{ width: '100%', borderColor: '#D32F2F', color: '#D32F2F' }}>
                                            <i className="fa-solid fa-user-slash mr-2"></i>
                                            Deactivate Account
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
