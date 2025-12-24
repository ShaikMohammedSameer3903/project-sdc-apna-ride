import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalRides: 0,
        activeRiders: 0,
        totalCustomers: 0,
        revenue: 0
    });
    const [riders, setRiders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [recentRides, setRecentRides] = useState([]);

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
            loadMockData();
        }
    }, [navigate]);

    const loadMockData = () => {
        // Mock statistics
        setStats({
            totalRides: Math.floor(Math.random() * 5000 + 1000),
            activeRiders: Math.floor(Math.random() * 200 + 50),
            totalCustomers: Math.floor(Math.random() * 3000 + 500),
            revenue: (Math.random() * 500000 + 100000).toFixed(2)
        });

        // Mock riders
        setRiders([
            { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', vehicle: 'Bike', rating: 4.8, trips: 245, status: 'Active' },
            { id: 2, name: 'Amit Singh', email: 'amit@example.com', vehicle: 'Auto', rating: 4.6, trips: 189, status: 'Active' },
            { id: 3, name: 'Suresh Patel', email: 'suresh@example.com', vehicle: 'Car', rating: 4.9, trips: 312, status: 'Offline' },
            { id: 4, name: 'Vijay Sharma', email: 'vijay@example.com', vehicle: 'Bike', rating: 4.7, trips: 156, status: 'Active' },
        ]);

        // Mock customers
        setCustomers([
            { id: 1, name: 'Priya Sharma', email: 'priya@example.com', totalRides: 45, joined: '2024-01-15' },
            { id: 2, name: 'Ankit Verma', email: 'ankit@example.com', totalRides: 32, joined: '2024-02-20' },
            { id: 3, name: 'Neha Gupta', email: 'neha@example.com', totalRides: 67, joined: '2023-12-10' },
            { id: 4, name: 'Rohit Mehta', email: 'rohit@example.com', totalRides: 23, joined: '2024-03-05' },
        ]);

        // Mock recent rides
        setRecentRides([
            { id: 'BK-ABC123', customer: 'Priya Sharma', rider: 'Rajesh Kumar', fare: 145, status: 'Completed', date: '2025-10-08' },
            { id: 'BK-XYZ789', customer: 'Ankit Verma', rider: 'Amit Singh', fare: 230, status: 'Completed', date: '2025-10-08' },
            { id: 'BK-DEF456', customer: 'Neha Gupta', rider: 'Suresh Patel', fare: 189, status: 'In Progress', date: '2025-10-08' },
            { id: 'BK-GHI012', customer: 'Rohit Mehta', rider: 'Vijay Sharma', fare: 95, status: 'Completed', date: '2025-10-07' },
        ]);
    };

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
                        <div className="logo-text">ApnaRide - Admin</div>
                    </div>
                    <div>
                        <span className="nav-user-info">Admin: {user.name}</span>
                        <button onClick={handleSignOut} className="btn-yellow">Sign Out</button>
                    </div>
                </nav>
            </header>

            <main className="container" style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Tab Navigation */}
                <div className="card mb-6">
                    <div className="flex gap-4 border-b pb-2">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 font-semibold ${activeTab === 'overview' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-chart-line mr-2"></i>Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('riders')}
                            className={`px-4 py-2 font-semibold ${activeTab === 'riders' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-motorcycle mr-2"></i>Riders
                        </button>
                        <button 
                            onClick={() => setActiveTab('customers')}
                            className={`px-4 py-2 font-semibold ${activeTab === 'customers' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-users mr-2"></i>Customers
                        </button>
                        <button 
                            onClick={() => setActiveTab('rides')}
                            className={`px-4 py-2 font-semibold ${activeTab === 'rides' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-route mr-2"></i>Rides
                        </button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                <i className="fa-solid fa-route text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">Total Rides</p>
                                <p className="text-3xl font-bold">{stats.totalRides}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                                <i className="fa-solid fa-motorcycle text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">Active Riders</p>
                                <p className="text-3xl font-bold">{stats.activeRiders}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                <i className="fa-solid fa-users text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">Total Customers</p>
                                <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                            </div>
                            <div className="card bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                                <i className="fa-solid fa-indian-rupee-sign text-4xl mb-3"></i>
                                <p className="text-sm opacity-90">Total Revenue</p>
                                <p className="text-3xl font-bold">₹{stats.revenue}</p>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {recentRides.slice(0, 5).map(ride => (
                                    <div key={ride.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{ride.id}</p>
                                            <p className="text-sm text-gray-600">{ride.customer} → {ride.rider}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">₹{ride.fare}</p>
                                            <span className={`text-xs px-2 py-1 rounded ${ride.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {ride.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Riders Tab */}
                {activeTab === 'riders' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Rider Management</h2>
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
                                    {riders.map(rider => (
                                        <tr key={rider.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{rider.name}</td>
                                            <td className="px-4 py-3">{rider.email}</td>
                                            <td className="px-4 py-3">{rider.vehicle}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-yellow-500">★</span> {rider.rating}
                                            </td>
                                            <td className="px-4 py-3">{rider.trips}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${rider.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {rider.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button className="text-blue-600 hover:underline mr-2">View</button>
                                                <button className="text-red-600 hover:underline">Suspend</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Customers Tab */}
                {activeTab === 'customers' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Customer Management</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Name</th>
                                        <th className="px-4 py-3 text-left">Email</th>
                                        <th className="px-4 py-3 text-left">Total Rides</th>
                                        <th className="px-4 py-3 text-left">Joined</th>
                                        <th className="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(customer => (
                                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3">{customer.name}</td>
                                            <td className="px-4 py-3">{customer.email}</td>
                                            <td className="px-4 py-3">{customer.totalRides}</td>
                                            <td className="px-4 py-3">{customer.joined}</td>
                                            <td className="px-4 py-3">
                                                <button className="text-blue-600 hover:underline mr-2">View</button>
                                                <button className="text-red-600 hover:underline">Block</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Rides Tab */}
                {activeTab === 'rides' && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-6">Ride History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Booking ID</th>
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Rider</th>
                                        <th className="px-4 py-3 text-left">Fare</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRides.map(ride => (
                                        <tr key={ride.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-sm">{ride.id}</td>
                                            <td className="px-4 py-3">{ride.customer}</td>
                                            <td className="px-4 py-3">{ride.rider}</td>
                                            <td className="px-4 py-3 font-bold text-green-600">₹{ride.fare}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${ride.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {ride.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{ride.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
