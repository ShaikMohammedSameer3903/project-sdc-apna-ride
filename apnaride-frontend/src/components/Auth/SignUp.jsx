import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// framer-motion not used here
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import '../../uber-style.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'customer'
    });
    const [driverData, setDriverData] = useState({
        vehicleType: 'Bike',
        vehicleNumber: '',
        licenseNumber: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleDriverChange = (e) => {
        setDriverData({ ...driverData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Require phone number (10 digits for India). You can relax this to E.164 as needed.
        const phoneDigits = (formData.phone || '').replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (formData.role === 'rider' && (!driverData.vehicleNumber || !driverData.licenseNumber)) {
            setError('Please fill in all driver details');
            return;
        }

        setIsLoading(true);

        try {
            // Register user
            const userResponse = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone,
                    role: formData.role
                })
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.text();
                throw new Error(errorData || 'Registration failed');
            }

            const userData = await userResponse.json();

            // Ensure phone is saved on backend profile (backend /auth/register may ignore phone)
            try {
                await fetch(`${API_BASE}/users/${userData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: formData.phone })
                });
            } catch {}

            // If rider, register driver details
            if (formData.role === 'rider') {
                const driverResponse = await fetch(`${API_BASE}/drivers/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userData.id,
                        vehicleType: driverData.vehicleType,
                        vehicleNumber: driverData.vehicleNumber,
                        licenseNumber: driverData.licenseNumber,
                        isOnline: false,
                        verificationStatus: 'PENDING'
                    })
                });

                if (!driverResponse.ok) {
                    throw new Error('Failed to register driver details');
                }
            }

            // Success - redirect to login
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            position: 'relative'
        }}>
            <style>{`
                .auth-actions .uber-btn-primary:hover,
                .auth-actions .modern-btn-primary:hover,
                .auth-actions .modern-btn-outline:hover {
                    transform: none !important;
                }

                .auth-actions {
                    position: static !important;
                    transform: none !important;
                }

                .auth-actions button {
                    position: static !important;
                    transform: none !important;
                }
            `}</style>
            {/* Animated Background */}
            <SimpleAnimatedBackground variant="default" />
            
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                {/* Logo */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <i className="fa-solid fa-bolt" style={{ color: '#00C853' }}></i>
                        ApnaRide
                    </div>
                    <p style={{ color: '#666', marginTop: '8px' }}>Create your account</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FFEBEE',
                        color: '#D32F2F',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Role Selection */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#000'
                        }}>
                            I want to
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'customer' })}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    border: formData.role === 'customer' ? '2px solid #000' : '2px solid #ddd',
                                    borderRadius: '8px',
                                    background: formData.role === 'customer' ? '#f5f5f5' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-user" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                                <div style={{ fontWeight: '600' }}>Ride</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'rider' })}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    border: formData.role === 'rider' ? '2px solid #000' : '2px solid #ddd',
                                    borderRadius: '8px',
                                    background: formData.role === 'rider' ? '#f5f5f5' : '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-car" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                                <div style={{ fontWeight: '600' }}>Drive</div>
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="uber-input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                            Full Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            className="uber-input"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="uber-input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="uber-input"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="uber-input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 1234567890"
                            className="uber-input"
                            required
                            pattern="[0-9]{10}"
                            title="Enter a valid 10-digit number"
                        />
                    </div>

                    {/* Password */}
                    <div className="uber-input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                            Password *
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            className="uber-input"
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="uber-input-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className="uber-input"
                            required
                        />
                    </div>

                    {/* Driver Details */}
                    {formData.role === 'rider' && (
                        <>
                            <div style={{
                                background: '#f5f5f5',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                                    Driver Details
                                </h3>

                                {/* Vehicle Type */}
                                <div className="uber-input-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                        Vehicle Type *
                                    </label>
                                    <select
                                        name="vehicleType"
                                        value={driverData.vehicleType}
                                        onChange={handleDriverChange}
                                        className="uber-input"
                                        required
                                    >
                                        <option value="Bike">Bike</option>
                                        <option value="Auto">Auto</option>
                                        <option value="Car">Car</option>
                                    </select>
                                </div>

                                {/* Vehicle Number */}
                                <div className="uber-input-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                        Vehicle Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="vehicleNumber"
                                        value={driverData.vehicleNumber}
                                        onChange={handleDriverChange}
                                        placeholder="DL 01 AB 1234"
                                        className="uber-input"
                                        required
                                    />
                                </div>

                                {/* License Number */}
                                <div className="uber-input-group">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                        License Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={driverData.licenseNumber}
                                        onChange={handleDriverChange}
                                        placeholder="DL-1234567890"
                                        className="uber-input"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Submit Button */}
                    <div className="auth-actions" style={{ width: '100%', marginTop: 16 }}>
                        <button
                            type="submit"
                            className="uber-btn uber-btn-primary modern-btn modern-btn-primary ripple shimmer-btn"
                            style={{ width: '100%', maxWidth: 320, margin: '0 auto', display: 'block' }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="uber-spinner"></span>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </div>
                </form>

                {/* Sign In Link */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: '#666'
                }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </div>

                {/* Back to Home */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '16px'
                }}>
                    <Link to="/" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
                        <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i>
                        Back to Home
                    </Link>
                </div>
            </div>
            </div>
        </div>
    );
}
