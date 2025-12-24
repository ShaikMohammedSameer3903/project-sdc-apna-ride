import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookingConfirmation } from '../Animations/BookingStyleAnimations';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

export default function RideRequestCard3D({ ride, onAccept, onDecline, driverId }) {
    const [isAccepting, setIsAccepting] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [pulseAnimation, setPulseAnimation] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);

    useEffect(() => {
        // Auto-stop pulse after 10 seconds
        const timer = setTimeout(() => setPulseAnimation(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    const handleAccept = async () => {
        setIsAccepting(true);
        
        // Validation checks
        if (!ride || !ride.bookingId) {
            console.error('Invalid ride data:', ride);
            alert('Invalid ride information. Please refresh and try again.');
            setIsAccepting(false);
            return;
        }
        
        if (!driverId) {
            console.error('Driver ID is missing');
            alert('Driver information not found. Please sign in again.');
            setIsAccepting(false);
            return;
        }
        
        try {
            console.log('=== RIDE ACCEPT REQUEST ===');
            console.log('Ride ID:', ride.bookingId);
            console.log('Driver ID:', driverId);
            console.log('Ride Status:', ride.status);
            console.log('API URL:', `${API_BASE}/rides/${ride.bookingId}/accept`);
            
            const requestBody = { driverId: driverId };
            console.log('Request Body:', JSON.stringify(requestBody));
            
            const response = await fetch(`${API_BASE}/rides/${ride.bookingId}/accept`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response Status:', response.status);
            console.log('Response OK:', response.ok);
            
            // Try to get response body
            const responseText = await response.text();
            console.log('Response Body (raw):', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Response Body (parsed):', result);
            } catch (parseError) {
                console.error('Failed to parse response:', parseError);
                alert(`Server error: ${responseText.substring(0, 100)}`);
                setIsAccepting(false);
                return;
            }
            
            if (response.ok) {
                // Handle both old and new response formats
                let acceptedRide = result.ride || result;
                // If minimal payload returned, fetch full ride details
                if (!acceptedRide.pickupLocation || !acceptedRide.dropLocation || !acceptedRide.fare) {
                    try {
                        const detailsRes = await fetch(`${API_BASE}/rides/${ride.bookingId}`);
                        if (detailsRes.ok) {
                            const details = await detailsRes.json();
                            acceptedRide = details.ride || details; // support both formats
                        }
                    } catch (e) {
                        console.warn('Could not fetch ride details after accept:', e);
                    }
                }
                
                if (result.success === false) {
                    console.error('Backend returned success=false:', result.error);
                    alert(`❌ ${result.error || 'Failed to accept ride. Please try again.'}`);
                } else {
                    console.log('✅ Ride accepted successfully!');
                    console.log('Accepted Ride Data:', acceptedRide);
                    setShowBookingConfirmation(true);
                    setTimeout(() => {
                        setShowBookingConfirmation(false);
                        onAccept(acceptedRide);
                    }, 2500);
                }
            } else {
                // Handle HTTP error responses
                const errorMessage = result?.error || result?.message || `HTTP ${response.status}: Failed to accept ride`;
                console.error('❌ HTTP Error:', response.status, errorMessage);
                console.error('Full error response:', result);
                
                // More specific error messages
                if (response.status === 404) {
                    alert('❌ Ride not found. It may have been accepted by another driver.');
                } else if (response.status === 400) {
                    alert(`❌ ${errorMessage}`);
                } else if (response.status === 500) {
                    alert('❌ Server error. Please try again in a moment.');
                } else {
                    alert(`❌ ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('=== NETWORK ERROR ===');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert('❌ Cannot connect to server. Please check:\n1. Backend is running on port 9031\n2. Your internet connection\n3. CORS is configured');
            } else {
                alert(`❌ Network error: ${error.message}`);
            }
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDecline = () => {
        setIsDeclining(true);
        setTimeout(() => {
            onDecline(ride.bookingId);
        }, 300);
    };

    return (
        <>
            <BookingConfirmation show={showBookingConfirmation} />
            <AnimatePresence>
            {showSuccess && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10001,
                        background: 'rgba(0, 255, 136, 0.95)',
                        borderRadius: '50%',
                        width: '150px',
                        height: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 50px rgba(0, 255, 136, 0.8)'
                    }}
                >
                    <motion.i
                        className="fa-solid fa-check"
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        style={{ fontSize: '80px', color: '#fff' }}
                    />
                </motion.div>
            )}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ 
                    opacity: 1, 
                    scale: pulseAnimation ? [1, 1.02, 1] : 1, 
                    rotateY: 0 
                }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                transition={{ 
                    duration: 0.6, 
                    type: 'spring',
                    scale: {
                        repeat: pulseAnimation ? Infinity : 0,
                        duration: 2
                    }
                }}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10000,
                    width: '90%',
                    maxWidth: '420px',
                    maxHeight: '80vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    padding: '0',
                    boxShadow: pulseAnimation 
                        ? '0 20px 60px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4)'
                        : '0 20px 60px rgba(0, 0, 0, 0.6)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header with Vehicle Icon */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <motion.div
                        animate={{
                            y: [0, -5, 0],
                            rotate: [-1, 1, -1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            fontSize: '48px',
                            filter: 'drop-shadow(0 4px 20px rgba(0, 255, 136, 0.5))'
                        }}
                    >
                        {ride.vehicleType === 'Bike' ? '🏍️' : ride.vehicleType === 'Auto' ? '🛺' : '🚗'}
                    </motion.div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                            🔔 New Ride Request!
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9, color: '#fff' }}>
                            {ride.customerName || 'Customer'}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div style={{ 
                    padding: '16px 20px 20px 20px', 
                    color: '#fff', 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflowY: 'auto',
                    maxHeight: 'calc(85vh - 120px)',
                    position: 'relative'
                }}>
                    {/* Ride Details */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '16px',
                            padding: '16px',
                            marginBottom: '20px',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {/* Pickup */}
                        <div style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#00ff88',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <i className="fa-solid fa-location-dot" style={{ color: '#000' }}></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Pickup</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                    {ride.pickupLocation}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{
                            height: '2px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            margin: '12px 0 12px 16px',
                            width: 'calc(100% - 16px)'
                        }}></div>

                        {/* Destination */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: '#ff4757',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <i className="fa-solid fa-flag-checkered" style={{ color: '#fff' }}></i>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Destination</p>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                                    {ride.dropLocation}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Fare & Distance */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '20px'
                        }}
                    >
                        <div style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Fare</p>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#00ff88' }}>
                                ₹{Math.round(ride.fare)}
                            </p>
                        </div>
                        <div style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '12px',
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Distance</p>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                                {(() => {
                                    if (ride.distance) return `${Math.round(ride.distance)}km`;
                                    if (ride.pickupLat && ride.pickupLng && ride.dropLat && ride.dropLng) {
                                        const dist = calculateDistance(ride.pickupLat, ride.pickupLng, ride.dropLat, ride.dropLng);
                                        return `${dist}km`;
                                    }
                                    if (ride.pickupLatitude && ride.pickupLongitude && ride.dropLatitude && ride.dropLongitude) {
                                        const dist = calculateDistance(ride.pickupLatitude, ride.pickupLongitude, ride.dropLatitude, ride.dropLongitude);
                                        return `${dist}km`;
                                    }
                                    return '~5km';
                                })()}
                            </p>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: '12px', 
                            marginTop: 'auto', 
                            paddingTop: '16px' 
                        }}
                    >
                        <motion.button
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: '0 8px 30px rgba(0, 255, 136, 0.7)'
                            }}
                            whileTap={{ scale: 0.95 }}
                            animate={pulseAnimation ? {
                                boxShadow: [
                                    '0 6px 20px rgba(0, 255, 136, 0.5)',
                                    '0 8px 30px rgba(0, 255, 136, 0.8)',
                                    '0 6px 20px rgba(0, 255, 136, 0.5)'
                                ]
                            } : {}}
                            transition={{ 
                                boxShadow: { duration: 1.5, repeat: pulseAnimation ? Infinity : 0 }
                            }}
                            onClick={handleAccept}
                            disabled={isAccepting || isDeclining}
                            style={{
                                width: '100%',
                                padding: '18px',
                                border: 'none',
                                background: isAccepting 
                                    ? 'linear-gradient(135deg, #00cc70 0%, #00a8cc 100%)'
                                    : 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                                color: '#000',
                                borderRadius: '12px',
                                fontSize: '18px',
                                fontWeight: '700',
                                cursor: isAccepting || isDeclining ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 6px 20px rgba(0, 255, 136, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isAccepting && (
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                        pointerEvents: 'none'
                                    }}
                                />
                            )}
                            {isAccepting ? (
                                <>
                                    <motion.i 
                                        className="fa-solid fa-spinner"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <span>Accepting...</span>
                                </>
                            ) : (
                                <>
                                    <motion.i 
                                        className="fa-solid fa-check-circle"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                    <span>Accept Ride</span>
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDecline}
                            disabled={isDeclining || isAccepting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                borderRadius: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isDeclining || isAccepting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isDeclining ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <span>Declining...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-times-circle"></i>
                                    <span>Decline</span>
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </div>

                {/* Animated Border */}
                <motion.div
                    animate={{
                        background: [
                            'linear-gradient(90deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)',
                            'linear-gradient(90deg, #00d4ff 0%, #00ff88 50%, #00d4ff 100%)',
                            'linear-gradient(90deg, #00ff88 0%, #00d4ff 50%, #00ff88 100%)'
                        ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px'
                    }}
                />
            </motion.div>
        </AnimatePresence>
        </>
    );
}
