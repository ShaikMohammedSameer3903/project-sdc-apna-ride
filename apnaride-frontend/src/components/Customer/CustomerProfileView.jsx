import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../3D/AnimatedBackground';
import { pageVariants, containerVariants, itemVariants } from '../../config/animations';
import '../../modern-animations.css';
import '../../uber-style.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function CustomerProfileView() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [editing, setEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        emergencyPhone: '',
        address: ''
    });
    const [rideHistory, setRideHistory] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 1, type: 'UPI', details: 'user@upi', default: true },
        { id: 2, type: 'Card', details: '**** 1234', default: false }
    ]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setProfile({
                name: parsedUser.name || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || '',
                emergencyPhone: parsedUser.emergencyPhone || '',
                address: parsedUser.address || ''
            });
            fetchRideHistory(parsedUser.id);
        }
    }, [navigate]);

    const fetchRideHistory = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/rides/customer/${userId}`);
            if (response.ok) {
                const rides = await response.json();
                setRideHistory(rides);
            }
        } catch (error) {
            console.error('Failed to fetch ride history:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const payload = {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                emergencyPhone: profile.emergencyPhone
            };
            const resp = await fetch(`${API_BASE}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let updatedUser = user;
            if (resp.ok) {
                updatedUser = await resp.json();
            } else {
                updatedUser = { ...user, ...payload };
            }

            // Preserve local-only address field in profile and localStorage copy
            const mergedForStorage = { ...updatedUser, address: profile.address };
            localStorage.setItem('user', JSON.stringify(mergedForStorage));
            setUser(mergedForStorage);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (e) {
            console.error('Failed to save profile', e);
            const updatedUser = { ...user, ...profile };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setEditing(false);
            alert('Profile updated locally. Please check your connection.');
        }
    };

    if (!user) return null;

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: 'fa-user' },
        { id: 'history', label: 'Ride History', icon: 'fa-history' },
        { id: 'payments', label: 'Payment Methods', icon: 'fa-credit-card' },
        { id: 'privacy', label: 'Privacy & Safety', icon: 'fa-shield-alt' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' }
    ];

    if (!user) return null;

    return (
        <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            style={{ minHeight: '100vh', background: '#f5f7fa', position: 'relative' }}
        >
            <AnimatedBackground variant="customer" />
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                padding: '24px',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button 
                            onClick={() => navigate('/customer')}
                            className="modern-btn modern-btn-ghost"
                            style={{ color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>My Profile</h1>
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.removeItem('user');
                            navigate('/login');
                        }}
                        className="modern-btn modern-btn-ghost"
                        style={{ color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}
                    >
                        <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '8px' }}></i>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '16px 24px',
                                border: 'none',
                                background: 'transparent',
                                borderBottom: activeTab === tab.id ? '3px solid #00C853' : '3px solid transparent',
                                color: activeTab === tab.id ? '#00C853' : '#666',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <i className={`fa-solid ${tab.icon}`} style={{ marginRight: '8px' }}></i>
                            {tab.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
                <AnimatePresence mode="wait">
                <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <motion.div key="profile" variants={itemVariants} initial="hidden" animate="visible">
                    {/* Profile Picture */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            color: '#fff',
                            fontWeight: '700',
                            boxShadow: '0 10px 30px rgba(0,200,83,0.3)'
                        }} className="floating">
                            {user.name?.charAt(0).toUpperCase() || '👤'}
                        </div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: '700', color: '#000' }}>
                            {user.name}
                        </h2>
                        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
                            <i className="fa-solid fa-user" style={{ marginRight: '8px', color: '#00C853' }}></i>
                            Customer Account
                        </p>
                    </div>

                    {/* Profile Details */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#000' }}>
                                Personal Information
                            </h3>
                            <button 
                                onClick={() => editing ? handleSave() : setEditing(true)}
                                className="modern-btn modern-btn-primary"
                                style={{ padding: '10px 24px' }}
                            >
                                <i className={`fa-solid fa-${editing ? 'check' : 'pen'}`} style={{ marginRight: '8px' }}></i>
                                {editing ? 'Save' : 'Edit'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '14px' }}>
                                    <i className="fa-solid fa-user" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                    Full Name
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="uber-input"
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <div style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', fontSize: '16px' }}>
                                        {profile.name || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '14px' }}>
                                    <i className="fa-solid fa-envelope" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                    Email Address
                                </label>
                                {editing ? (
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="uber-input"
                                        style={{ width: '100%' }}
                                    />
                                ) : (
                                    <div style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', fontSize: '16px' }}>
                                        {profile.email || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '14px' }}>
                                    <i className="fa-solid fa-phone" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                    Phone Number
                                </label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="uber-input"
                                        style={{ width: '100%' }}
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                ) : (
                                    <div style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', fontSize: '16px' }}>
                                        {profile.phone || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Emergency WhatsApp */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '14px' }}>
                                    <i className="fa-solid fa-phone-volume" style={{ marginRight: '8px', color: '#FF3B30' }}></i>
                                    Emergency WhatsApp Number
                                </label>
                                {editing ? (
                                    <input
                                        type="tel"
                                        value={profile.emergencyPhone}
                                        onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                                        className="uber-input"
                                        style={{ width: '100%' }}
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                ) : (
                                    <div style={{ padding: '12px 16px', background: '#fff5f5', borderRadius: '8px', fontSize: '16px', border: '1px dashed #FFCDD2' }}>
                                        {profile.emergencyPhone || 'Not set'}
                                    </div>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666', fontSize: '14px' }}>
                                    <i className="fa-solid fa-location-dot" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                    Address
                                </label>
                                {editing ? (
                                    <textarea
                                        value={profile.address}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        className="uber-input"
                                        style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Enter your address"
                                    />
                                ) : (
                                    <div style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: '8px', fontSize: '16px' }}>
                                        {profile.address || 'Not set'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginTop: '40px',
                        paddingTop: '40px',
                        borderTop: '1px solid #f0f0f0'
                    }}>
                        {[
                            { icon: '🚗', label: 'Total Rides', value: '0' },
                            { icon: '⭐', label: 'Rating', value: '5.0' },
                            { icon: '💰', label: 'Spent', value: '₹0' }
                        ].map((stat, index) => (
                            <div key={index} className="modern-card" style={{
                                textAlign: 'center',
                                padding: '20px',
                                background: '#f9f9f9',
                                borderRadius: '12px'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00C853', marginBottom: '4px' }}>
                                    {stat.value}
                                </div>
                                <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                        </motion.div>
                    )}
                    
                    {/* Ride History Tab */}
                    {activeTab === 'history' && (
                        <motion.div key="history" variants={itemVariants} initial="hidden" animate="visible">
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Ride History</h2>
                            {rideHistory.length > 0 ? (
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {rideHistory.map((ride) => (
                                        <div key={ride.id} style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{ride.pickup} → {ride.destination}</div>
                                                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>{new Date(ride.createdAt).toLocaleDateString()}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#00C853' }}>₹{ride.fare}</div>
                                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{ride.status}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                                    <i className="fa-solid fa-car" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                                    <p>No rides yet. Book your first ride!</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                    
                    {/* Payment Methods Tab */}
                    {activeTab === 'payments' && (
                        <motion.div key="payments" variants={itemVariants} initial="hidden" animate="visible">
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Payment Methods</h2>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {paymentMethods.map((method) => (
                                    <div key={method.id} style={{ padding: '20px', background: method.default ? '#e8f5e9' : '#f9f9f9', borderRadius: '12px', border: `2px solid ${method.default ? '#00C853' : '#e0e0e0'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '16px' }}>{method.type}</div>
                                                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>{method.details}</div>
                                            </div>
                                            {method.default && <span style={{ background: '#00C853', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Default</span>}
                                        </div>
                                    </div>
                                ))}
                                <motion.button className="modern-btn modern-btn-outline" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ width: '100%', padding: '16px' }}>
                                    <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                                    Add Payment Method
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Privacy & Safety Tab */}
                    {activeTab === 'privacy' && (
                        <motion.div key="privacy" variants={itemVariants} initial="hidden" animate="visible">
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Privacy & Safety</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                                        <i className="fa-solid fa-shield-alt" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                        Share Trip Status
                                    </h3>
                                    <p style={{ color: '#666', marginBottom: '16px' }}>Share your live location with trusted contacts during rides</p>
                                    <button className="modern-btn modern-btn-primary">Add Emergency Contacts</button>
                                </div>
                                <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                                        <i className="fa-solid fa-bell" style={{ marginRight: '8px', color: '#00C853' }}></i>
                                        Safety Alerts
                                    </h3>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                                        <span>Notify me of unusual route deviations</span>
                                    </label>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={itemVariants} initial="hidden" animate="visible">
                            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Settings</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Notifications</h3>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>Push Notifications</span>
                                            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>Email Updates</span>
                                            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                                        </label>
                                    </div>
                                </div>
                                <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Language</h3>
                                    <select className="uber-input" style={{ width: '100%' }}>
                                        <option>English</option>
                                        <option>हिंदी (Hindi)</option>
                                        <option>தமிழ் (Tamil)</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
