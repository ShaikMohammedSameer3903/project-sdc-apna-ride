import React, { useState, useEffect } from 'react';
import '../../modern-animations.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function RiderPreferences({ driverId, onClose, onSave }) {
    const [preferences, setPreferences] = useState({
        minDistanceKm: 0,
        maxDistanceKm: 50,
        minFare: 0,
        acceptNightRides: true,
        acceptWeekendRides: true,
        autoAcceptEnabled: false,
        autoAcceptMaxDistance: 10,
        autoAcceptMinFare: 100
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, [driverId]);

    const loadPreferences = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/driver-preferences/${driverId}`);
            if (response.ok) {
                const data = await response.json();
                setPreferences(data);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/driver-preferences/${driverId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            
            if (response.ok) {
                const saved = await response.json();
                if (onSave) onSave(saved);
                alert('Preferences saved successfully!');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Failed to save preferences');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}>
                <div className="modern-spinner"></div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }} className="fade-in">
            <div style={{
                background: '#fff',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }} className="scale-in">
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #00C853 0%, #00A040 100%)',
                    borderRadius: '20px 20px 0 0',
                    color: '#fff'
                }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                        <i className="fa-solid fa-sliders" style={{ marginRight: '12px' }}></i>
                        Ride Preferences
                    </h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            color: '#fff',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Distance Range */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="fa-solid fa-route" style={{ marginRight: '8px', color: '#00C853' }}></i>
                            Distance Range
                        </h3>
                        <div style={{ 
                            background: '#f9f9f9', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '2px solid #f0f0f0'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: '600',
                                    color: '#666',
                                    fontSize: '14px'
                                }}>
                                    Minimum Distance: {preferences.minDistanceKm} km
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={preferences.minDistanceKm}
                                    onChange={(e) => setPreferences({
                                        ...preferences,
                                        minDistanceKm: parseFloat(e.target.value)
                                    })}
                                    style={{
                                        width: '100%',
                                        height: '8px',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        background: `linear-gradient(to right, #00C853 0%, #00C853 ${preferences.minDistanceKm}%, #ddd ${preferences.minDistanceKm}%, #ddd 100%)`
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: '600',
                                    color: '#666',
                                    fontSize: '14px'
                                }}>
                                    Maximum Distance: {preferences.maxDistanceKm} km
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={preferences.maxDistanceKm}
                                    onChange={(e) => setPreferences({
                                        ...preferences,
                                        maxDistanceKm: parseFloat(e.target.value)
                                    })}
                                    style={{
                                        width: '100%',
                                        height: '8px',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        background: `linear-gradient(to right, #00C853 0%, #00C853 ${preferences.maxDistanceKm}%, #ddd ${preferences.maxDistanceKm}%, #ddd 100%)`
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Minimum Fare */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="fa-solid fa-indian-rupee-sign" style={{ marginRight: '8px', color: '#00C853' }}></i>
                            Minimum Fare
                        </h3>
                        <div style={{ 
                            background: '#f9f9f9', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '2px solid #f0f0f0'
                        }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontWeight: '600',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                Minimum Fare: ₹{preferences.minFare}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="500"
                                step="10"
                                value={preferences.minFare}
                                onChange={(e) => setPreferences({
                                    ...preferences,
                                    minFare: parseFloat(e.target.value)
                                })}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    background: `linear-gradient(to right, #00C853 0%, #00C853 ${(preferences.minFare / 500) * 100}%, #ddd ${(preferences.minFare / 500) * 100}%, #ddd 100%)`
                                }}
                            />
                        </div>
                    </div>

                    {/* Time Preferences */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="fa-solid fa-clock" style={{ marginRight: '8px', color: '#00C853' }}></i>
                            Time Preferences
                        </h3>
                        <div style={{ 
                            background: '#f9f9f9', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '2px solid #f0f0f0'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.acceptNightRides}
                                    onChange={(e) => setPreferences({
                                        ...preferences,
                                        acceptNightRides: e.target.checked
                                    })}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginRight: '12px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{ fontWeight: '500' }}>Accept Night Rides (10 PM - 6 AM)</span>
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontSize: '15px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.acceptWeekendRides}
                                    onChange={(e) => setPreferences({
                                        ...preferences,
                                        acceptWeekendRides: e.target.checked
                                    })}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginRight: '12px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{ fontWeight: '500' }}>Accept Weekend Rides</span>
                            </label>
                        </div>
                    </div>

                    {/* Auto Accept */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <i className="fa-solid fa-bolt" style={{ marginRight: '8px', color: '#00C853' }}></i>
                            Auto Accept (Coming Soon)
                        </h3>
                        <div style={{ 
                            background: '#f9f9f9', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '2px solid #f0f0f0',
                            opacity: 0.6
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '16px',
                                cursor: 'not-allowed',
                                fontSize: '15px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.autoAcceptEnabled}
                                    disabled
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        marginRight: '12px'
                                    }}
                                />
                                <span style={{ fontWeight: '500' }}>Enable Auto Accept</span>
                            </label>
                            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                                Automatically accept rides that match your preferences
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '24px',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        className="modern-btn modern-btn-outline"
                        style={{ padding: '12px 24px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="modern-btn modern-btn-primary"
                        style={{ padding: '12px 32px' }}
                    >
                        {saving ? (
                            <>
                                <span className="modern-spinner" style={{ 
                                    width: '16px', 
                                    height: '16px', 
                                    borderWidth: '2px',
                                    marginRight: '8px',
                                    display: 'inline-block'
                                }}></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i>
                                Save Preferences
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
