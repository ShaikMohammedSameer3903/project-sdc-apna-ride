import React, { useMemo, useState } from 'react';
import '../../uber-style.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

function normalizePhoneToE164Like(raw) {
    if (!raw) return '';
    const trimmed = String(raw).trim();
    const plus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (!digits) return '';

    // If user entered without country code, default to India (+91)
    if (!plus && digits.length === 10) return `+91${digits}`;

    // If user typed + already, keep it
    if (plus) return `+${digits}`;

    // Otherwise keep as +<digits>
    return `+${digits}`;
}

export default function EmergencyPhoneModal({ user, onClose, onSaved, required = false }) {
    const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyPhone || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const normalized = useMemo(() => normalizePhoneToE164Like(emergencyPhone), [emergencyPhone]);

    const save = async () => {
        setError('');
        const formatted = normalizePhoneToE164Like(emergencyPhone);
        if (!formatted) {
            setError('Please enter an emergency WhatsApp number');
            return;
        }

        // Basic sanity: 10-15 digits as E.164-like
        const digits = formatted.replace(/[^0-9]/g, '');
        if (digits.length < 10 || digits.length > 15) {
            setError('Please enter a valid phone number (10-15 digits)');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emergencyPhone: formatted })
            });

            if (!res.ok) {
                setError('Failed to save emergency number');
                setIsLoading(false);
                return;
            }

            const updatedUser = await res.json().catch(() => null);
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = { ...stored, ...(updatedUser || {}), emergencyPhone: formatted };
            localStorage.setItem('user', JSON.stringify(newUser));

            if (onSaved) onSaved(newUser);
            if (onClose) onClose();
        } catch (e) {
            console.error(e);
            setError('Network error saving emergency number');
        }
        setIsLoading(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
            onClick={required ? undefined : onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '28px',
                    maxWidth: '520px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Emergency WhatsApp Number</h2>
                    <button
                        onClick={required ? undefined : onClose}
                        style={{ background: 'transparent', border: 'none', fontSize: '22px', cursor: required ? 'not-allowed' : 'pointer', color: required ? '#ccc' : '#666' }}
                        title={required ? 'Required' : 'Close'}
                        disabled={required}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div style={{ background: '#E3F2FD', color: '#1976D2', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: 8 }}></i>
                    This number will receive a WhatsApp message if you or the other person taps SOS during a ride.
                </div>

                {error && (
                    <div style={{ background: '#F8D7DA', color: '#721C24', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                        <i className="fa-solid fa-exclamation-circle" style={{ marginRight: 8 }}></i>
                        {error}
                    </div>
                )}

                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>
                    Emergency WhatsApp Phone
                </label>
                <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Example: +91 9876543210"
                    style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E0E0E0',
                        borderRadius: '10px',
                        fontSize: '16px'
                    }}
                />

                <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                    Saved as: <strong>{normalized || '-'}</strong>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
                    {!required && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="uber-btn uber-btn-outline"
                            style={{ flex: 1 }}
                            disabled={isLoading}
                        >
                            Later
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={save}
                        className="uber-btn uber-btn-primary"
                        style={{ flex: 1 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
