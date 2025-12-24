import React, { useState, useEffect } from 'react';
import '../../uber-style.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function EditProfileModal({ user, onClose, onUpdate }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        emergencyPhone: user?.emergencyPhone || '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setSuccess('Profile updated successfully!');
                
                // Update localStorage
                const storedUser = JSON.parse(localStorage.getItem('user'));
                const newUser = { ...storedUser, ...updatedUser };
                localStorage.setItem('user', JSON.stringify(newUser));
                try {
                    if (newUser?.emergencyPhone) {
                        localStorage.removeItem('needsEmergencyPhone');
                    }
                } catch {}
                
                setTimeout(() => {
                    onUpdate(newUser);
                    onClose();
                }, 1500);
            } else {
                setError('Failed to update profile');
            }
        } catch (err) {
            setError('Error updating profile');
            console.error(err);
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
            onClick={onClose}
        >
            <div 
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                        Edit Profile
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '4px 8px'
                        }}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Success Message */}
                {success && (
                    <div style={{
                        background: '#D4EDDA',
                        color: '#155724',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <i className="fa-solid fa-check-circle"></i>
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#F8D7DA',
                        color: '#721C24',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <i className="fa-solid fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#000'}
                            onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                        />
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#000'}
                            onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                        />
                    </div>

                    {/* Phone */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#000'}
                            onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                        />
                    </div>

                    {/* Emergency WhatsApp */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#333'
                        }}>
                            Emergency WhatsApp Number
                        </label>
                        <input
                            type="tel"
                            name="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={handleChange}
                            placeholder="Example: +91 9876543210"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #E0E0E0',
                                borderRadius: '8px',
                                fontSize: '16px',
                                transition: 'border-color 0.3s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#000'}
                            onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: '2px solid #E0E0E0',
                                background: '#fff',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#F5F5F5'}
                            onMouseLeave={(e) => e.target.style.background = '#fff'}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                padding: '14px',
                                border: 'none',
                                background: '#000',
                                color: '#fff',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: isLoading ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => !isLoading && (e.target.style.background = '#333')}
                            onMouseLeave={(e) => !isLoading && (e.target.style.background = '#000')}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-save" style={{ marginRight: '8px' }}></i>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
