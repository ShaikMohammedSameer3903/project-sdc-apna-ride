import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import '../../App.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function EnhancedAdminDashboard() {
    const navigate = useNavigate();
    const { t, language, changeLanguage } = useLanguage();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'admin') {
                navigate('/login');
            }
            setUser(parsedUser);
            loadAnalytics();
        }
    }, [navigate]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/analytics`);
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
        setLoading(false);
    };

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/drivers`);
            if (response.ok) {
                const data = await response.json();
                setDrivers(data);
            }
        } catch (error) {
            console.error('Error loading drivers:', error);
        }
        setLoading(false);
    };

    const loadPendingDrivers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/pending`);
            if (response.ok) {
                const data = await response.json();
                setPendingDrivers(data);
            }
        } catch (error) {
            console.error('Error loading pending drivers:', error);
        }
        setLoading(false);
    };

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/customers`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
        setLoading(false);
    };

    const loadRides = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/rides/all`);
            if (response.ok) {
                const data = await response.json();
                setRides(data);
            }
        } catch (error) {
            console.error('Error loading rides:', error);
        }
        setLoading(false);
    };

    const approveDriver = async (driverId) => {
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/${driverId}/approve`, {
                method: 'PUT'
            });
            if (response.ok) {
                alert('Driver approved successfully!');
                loadPendingDrivers();
                loadAnalytics();
            }
        } catch (error) {
            console.error('Error approving driver:', error);
        }
    };

    const rejectDriver = async (driverId) => {
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/${driverId}/reject`, {
                method: 'PUT'
            });
            if (response.ok) {
                alert('Driver rejected');
                loadPendingDrivers();
            }
        } catch (error) {
            console.error('Error rejecting driver:', error);
        }
    };

    const suspendDriver = async (driverId) => {
        if (!confirm('Are you sure you want to suspend this driver?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/${driverId}/suspend`, {
                method: 'PUT'
            });
            if (response.ok) {
                alert('Driver suspended successfully');
                loadDrivers();
            }
        } catch (error) {
            console.error('Error suspending driver:', error);
        }
    };

    const activateDriver = async (driverId) => {
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/${driverId}/activate`, {
                method: 'PUT'
            });
            if (response.ok) {
                alert('Driver activated successfully');
                loadDrivers();
            }
        } catch (error) {
            console.error('Error activating driver:', error);
        }
    };

    const deleteDriver = async (driverId) => {
        if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/drivers/${driverId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Driver deleted successfully');
                loadDrivers();
                loadAnalytics();
            }
        } catch (error) {
            console.error('Error deleting driver:', error);
        }
    };

    const deleteCustomer = async (customerId) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        
        try {
            const response = await fetch(`${API_BASE}/admin/customers/${customerId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                alert('Customer deleted successfully');
                loadCustomers();
                loadAnalytics();
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'riders') loadDrivers();
        else if (activeTab === 'pending') loadPendingDrivers();
        else if (activeTab === 'customers') loadCustomers();
        else if (activeTab === 'rides') loadRides();
    }, [activeTab]);

    const handleSignOut = () => {
        localStorage.removeItem('user');
        navigate('/login');
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
                        <div className="logo-text">{t('appName')} - {t('admin')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Language Selector */}
                        <select 
                            value={language} 
                            onChange={(e) => changeLanguage(e.target.value)}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #ddd',
                                background: 'white'
                            }}
                        >
                            <option value="en">English</option>
                            <option value="hi">हिन्दी</option>
                            <option value="ta">தமிழ்</option>
                            <option value="te">తెలుగు</option>
                            <option value="bn">বাংলা</option>
                        </select>
                        <span className="nav-user-info">{t('admin')}: {user.name}</span>
                        <button onClick={handleSignOut} className="btn-yellow">{t('signOut')}</button>
                    </div>
                </nav>
            </header>

            <main className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Tab Navigation */}
                <div className="card mb-6">
                    <div className="flex gap-4 border-b pb-2" style={{ overflowX: 'auto' }}>
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'overview' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-chart-line mr-2"></i>{t('overview')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'pending' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-clock mr-2"></i>Pending Approvals
                            {analytics?.pendingApprovals > 0 && (
                                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                    {analytics.pendingApprovals}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('riders')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'riders' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-motorcycle mr-2"></i>{t('riders')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('customers')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'customers' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-users mr-2"></i>{t('customers')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('rides')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'rides' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-route mr-2"></i>{t('rides')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 font-semibold whitespace-nowrap ${activeTab === 'analytics' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-chart-bar mr-2"></i>{t('analytics')}
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && analytics && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">{t('dashboard')} {t('overview')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                <i className="fa-solid fa-route text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">{t('totalRides')}</p>
                                <p className="text-3xl font-bold">{analytics.totalRides}</p>
                                <p className="text-xs mt-2">Today: {analytics.todayRides}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                                <i className="fa-solid fa-motorcycle text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">{t('activeRiders')}</p>
                                <p className="text-3xl font-bold">{analytics.activeDrivers}</p>
                                <p className="text-xs mt-2">Total: {analytics.totalDrivers}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                <i className="fa-solid fa-users text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">{t('totalCustomers')}</p>
                                <p className="text-3xl font-bold">{analytics.totalCustomers}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                                <i className="fa-solid fa-indian-rupee-sign text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">{t('revenue')}</p>
                                <p className="text-3xl font-bold">₹{analytics.totalRevenue?.toFixed(2)}</p>
                                <p className="text-xs mt-2">Today: ₹{analytics.todayRevenue?.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-xl font-bold mb-4">Vehicle Distribution</h3>
                                {analytics.vehicleDistribution && Object.entries(analytics.vehicleDistribution).map(([type, count]) => (
                                    <div key={type} className="mb-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold">{type}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{width: `${(count / analytics.totalDrivers) * 100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="card">
                                <h3 className="text-xl font-bold mb-4">Ride Status</h3>
                                {analytics.rideStatusDistribution && Object.entries(analytics.rideStatusDistribution).map(([status, count]) => (
                                    <div key={status} className="mb-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold">{status}</span>
                                            <span>{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${
                                                    status === 'COMPLETED' ? 'bg-green-600' :
                                                    status === 'IN_PROGRESS' ? 'bg-blue-600' :
                                                    status === 'REQUESTED' ? 'bg-yellow-600' :
                                                    'bg-gray-600'
                                                }`}
                                                style={{width: `${(count / analytics.totalRides) * 100}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pending Approvals Tab */}
                {activeTab === 'pending' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Pending Driver Approvals</h2>
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : pendingDrivers.length === 0 ? (
                            <p className="text-center text-gray-600">No pending approvals</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Vehicle</th>
                                            <th className="px-4 py-3 text-left">License</th>
                                            <th className="px-4 py-3 text-left">City</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingDrivers.map(item => (
                                            <tr key={item.driver.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">{item.name}</td>
                                                <td className="px-4 py-3">{item.email}</td>
                                                <td className="px-4 py-3">{item.driver.vehicleType} - {item.driver.vehicleNumber}</td>
                                                <td className="px-4 py-3">{item.driver.licenseNumber}</td>
                                                <td className="px-4 py-3">{item.driver.city || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <button 
                                                        onClick={() => approveDriver(item.driver.id)}
                                                        className="text-green-600 hover:underline mr-3"
                                                    >
                                                        <i className="fa-solid fa-check mr-1"></i>{t('approve')}
                                                    </button>
                                                    <button 
                                                        onClick={() => rejectDriver(item.driver.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        <i className="fa-solid fa-times mr-1"></i>{t('reject')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Riders Tab */}
                {activeTab === 'riders' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">{t('riders')} Management</h2>
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Vehicle</th>
                                            <th className="px-4 py-3 text-left">Rating</th>
                                            <th className="px-4 py-3 text-left">Trips</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map(item => (
                                            <tr key={item.driver.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">{item.name}</td>
                                                <td className="px-4 py-3">{item.email}</td>
                                                <td className="px-4 py-3">{item.driver.vehicleType}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-yellow-500">★</span> {item.driver.rating?.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3">{item.totalRides}</td>
                                                <td className="px-4 py-3">
                                                    {item.driver.isSuspended ? (
                                                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">Suspended</span>
                                                    ) : item.driver.isOnline ? (
                                                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Online</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">Offline</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {item.driver.isSuspended ? (
                                                        <button 
                                                            onClick={() => activateDriver(item.driver.id)}
                                                            className="text-green-600 hover:underline mr-2"
                                                        >
                                                            {t('activate')}
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => suspendDriver(item.driver.id)}
                                                            className="text-orange-600 hover:underline mr-2"
                                                        >
                                                            {t('suspend')}
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteDriver(item.driver.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        {t('delete')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Customers Tab */}
                {activeTab === 'customers' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">{t('customers')} Management</h2>
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Name</th>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Total Rides</th>
                                            <th className="px-4 py-3 text-left">Total Spent</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map(customer => (
                                            <tr key={customer.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3">{customer.name}</td>
                                                <td className="px-4 py-3">{customer.email}</td>
                                                <td className="px-4 py-3">{customer.totalRides}</td>
                                                <td className="px-4 py-3">₹{customer.totalSpent?.toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <button 
                                                        onClick={() => deleteCustomer(customer.id)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        {t('delete')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Rides Tab */}
                {activeTab === 'rides' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">{t('rides')} History</h2>
                        {loading ? (
                            <p className="text-center">Loading...</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Booking ID</th>
                                            <th className="px-4 py-3 text-left">Customer</th>
                                            <th className="px-4 py-3 text-left">Rider</th>
                                            <th className="px-4 py-3 text-left">Route</th>
                                            <th className="px-4 py-3 text-left">Fare</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rides.map(item => (
                                            <tr key={item.ride.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-sm">{item.ride.bookingId}</td>
                                                <td className="px-4 py-3">{item.customerName || 'N/A'}</td>
                                                <td className="px-4 py-3">{item.riderName || 'Pending'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {item.ride.pickupLocation} → {item.ride.dropLocation}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-green-600">₹{item.ride.fare?.toFixed(2)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        item.ride.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        item.ride.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                        item.ride.status === 'ACCEPTED' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {item.ride.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && analytics && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Advanced {t('analytics')}</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-xl font-bold mb-4">Platform Metrics</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                        <span>Average Rides per Day</span>
                                        <span className="font-bold">{(analytics.totalRides / 30).toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                        <span>Driver Utilization</span>
                                        <span className="font-bold">
                                            {((analytics.activeDrivers / analytics.totalDrivers) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-gray-50 rounded">
                                        <span>Pending Approvals</span>
                                        <span className="font-bold text-orange-600">{analytics.pendingApprovals}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-xl font-bold mb-4">Revenue Insights</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between p-3 bg-green-50 rounded">
                                        <span>Total Revenue</span>
                                        <span className="font-bold text-green-600">₹{analytics.totalRevenue?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-blue-50 rounded">
                                        <span>Today's Revenue</span>
                                        <span className="font-bold text-blue-600">₹{analytics.todayRevenue?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-purple-50 rounded">
                                        <span>Average Revenue per Ride</span>
                                        <span className="font-bold text-purple-600">
                                            ₹{(analytics.totalRevenue / analytics.totalRides).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
