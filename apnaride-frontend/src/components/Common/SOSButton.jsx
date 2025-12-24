import React, { useState } from 'react';
import EmergencyPhoneModal from './EmergencyPhoneModal';
import '../../modern-design-system.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

function normalizeToWhatsAppDigits(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    const digits = s.replace(/[^0-9]/g, '');
    return digits;
}

function buildMapsLink(lat, lng) {
    if (lat == null || lng == null) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function SOSButton({ rideId, userId, onEmergency }) {
    const [isActivated, setIsActivated] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const handleSOSClick = () => {
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        setIsActivated(true);
        setShowConfirm(false);
        
        // Trigger emergency protocol
        if (onEmergency) {
            onEmergency({
                rideId,
                userId,
                timestamp: new Date().toISOString(),
                location: null // Get from GPS
            });
        }

        const storedUser = (() => {
            try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
        })();

        const emergencyPhone = storedUser?.emergencyPhone;
        const toDigits = normalizeToWhatsAppDigits(emergencyPhone);

        const sendWithLocation = (lat, lng) => {
            try {
                const maps = buildMapsLink(lat, lng);
                const locationLine = maps ? `%0ALocation: ${maps}` : '';
                const msg = `SOS ALERT!%0AUser: ${storedUser?.name || userId}%0ARide: ${rideId || '-'}%0ATime: ${new Date().toLocaleString()}${locationLine}%0A%0APlease help immediately.`;

                // Notify backend (non-blocking)
                fetch(`${API_BASE}/emergency/sos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        rideId,
                        location: (lat != null && lng != null) ? { lat, lng } : null,
                        timestamp: new Date().toISOString()
                    })
                }).catch(() => {});

                if (toDigits) {
                    const url = `https://wa.me/${toDigits}?text=${msg}`;
                    window.open(url, '_blank');
                } else {
                    setShowPhoneModal(true);
                }
            } catch (e) {
                console.warn('SOS WhatsApp open failed', e);
            }
        };

        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => sendWithLocation(pos.coords.latitude, pos.coords.longitude),
                () => sendWithLocation(null, null),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        } else {
            sendWithLocation(null, null);
        }

        // Here you would:
        // 1. Send alert to backend
        // 2. Notify emergency contacts
        // 3. Share live location
        // 4. Call emergency services if needed

        alert('Emergency alert activated.');
    };

    const handleCancel = () => {
        setShowConfirm(false);
    };

    return (
        <>
            {showPhoneModal && (
                <EmergencyPhoneModal
                    user={JSON.parse(localStorage.getItem('user') || '{}')}
                    onClose={() => setShowPhoneModal(false)}
                    onSaved={(newUser) => {
                        localStorage.setItem('user', JSON.stringify(newUser));
                        setShowPhoneModal(false);
                        try {
                            const digits = normalizeToWhatsAppDigits(newUser?.emergencyPhone);
                            if (!digits) return;
                            if (typeof navigator !== 'undefined' && navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        const maps = buildMapsLink(pos.coords.latitude, pos.coords.longitude);
                                        const msg = `SOS ALERT!%0AUser: ${newUser?.name || userId}%0ARide: ${rideId || '-'}%0ATime: ${new Date().toLocaleString()}%0ALocation: ${maps}%0A%0APlease help immediately.`;
                                        window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
                                    },
                                    () => {
                                        const msg = `SOS ALERT!%0AUser: ${newUser?.name || userId}%0ARide: ${rideId || '-'}%0ATime: ${new Date().toLocaleString()}%0A%0APlease help immediately.`;
                                        window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
                                    },
                                    { enableHighAccuracy: true, timeout: 8000 }
                                );
                            } else {
                                const msg = `SOS ALERT!%0AUser: ${newUser?.name || userId}%0ARide: ${rideId || '-'}%0ATime: ${new Date().toLocaleString()}%0A%0APlease help immediately.`;
                                window.open(`https://wa.me/${digits}?text=${msg}`, '_blank');
                            }
                        } catch {}
                    }}
                />
            )}
            {/* SOS Button */}
            <button
                onClick={handleSOSClick}
                className={`fixed top-20 right-4 w-16 h-16 rounded-full shadow-xl z-50 flex items-center justify-center font-bold text-lg ${
                    isActivated 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                }`}
                style={{ 
                    animation: isActivated ? 'pulse 1s infinite' : 'none'
                }}
            >
                SOS
            </button>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4 animate-scale-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-exclamation-triangle text-3xl text-red-600"></i>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Emergency Alert</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to activate SOS? This will:
                            </p>
                            <ul className="text-left text-sm text-gray-700 mb-6 space-y-2">
                                <li>✓ Alert emergency contacts</li>
                                <li>✓ Share your live location</li>
                                <li>✓ Notify support team</li>
                                <li>✓ Record trip details</li>
                            </ul>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                                >
                                    Activate SOS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
