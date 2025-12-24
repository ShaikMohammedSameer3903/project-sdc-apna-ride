import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
void motion;
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import { pageVariants, modalVariants } from '../../config/animations';
import '../../uber-style.css';
import '../../modern-animations.css';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState('customer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpInfo, setOtpInfo] = useState(null); // { expiresAt, debugCode }
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (loginMode === 'password') {
            if (!email || !password) {
                setError('Please enter email and password');
                setIsLoading(false);
                return;
            }

            try {
                console.log('=== LOGIN REQUEST ===');
                console.log('Email:', email);
                console.log('Role:', role);
                console.log('API URL:', `${API_BASE}/auth/signin`);

                const response = await fetch(`${API_BASE}/auth/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                console.log('Response Status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Login successful:', data);

                    if (data.role !== role) {
                        setError(`❌ This account is registered as a ${data.role}. Please select the correct role.`);
                        return;
                    }

                    localStorage.setItem('user', JSON.stringify(data));
                    try {
                        const needsEmergencyPhone = !data?.emergencyPhone;
                        if (needsEmergencyPhone) {
                            localStorage.setItem('needsEmergencyPhone', '1');
                        } else {
                            localStorage.removeItem('needsEmergencyPhone');
                        }
                    } catch {}

                    if (data.role === 'customer') navigate('/customer');
                    else if (data.role === 'rider') navigate('/rider');
                    else if (data.role === 'admin') navigate('/admin');
                } else {
                    const errorText = await response.text();
                    console.error('Login failed:', response.status, errorText);

                    if (response.status === 401) {
                        setError('❌ Invalid email or password. Please check your credentials or sign up for a new account.');
                    } else if (response.status === 404) {
                        setError('❌ Account not found. Please sign up first.');
                    } else if (response.status === 403) {
                        setError('❌ Account is suspended or not verified. Please contact support.');
                    } else {
                        setError(errorText || '❌ Login failed. Please try again.');
                    }
                }
            } catch (err) {
                console.error('Network error:', err);
                setError('❌ Cannot connect to server. Please ensure:\n1. Backend is running on port 9031\n2. Your internet connection is active');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // OTP mode
        if (!phone || !otp) {
            setError('Please enter mobile number and OTP');
            setIsLoading(false);
            return;
        }
        try {
            const phoneDigits = (phone || '').replace(/\D/g, '');
            const response = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneDigits, code: otp })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.role !== role) {
                    setError(`❌ This account is registered as a ${data.role}. Please select the correct role.`);
                    return;
                }
                localStorage.setItem('user', JSON.stringify(data));
                try {
                    const needsEmergencyPhone = !data?.emergencyPhone;
                    if (needsEmergencyPhone) {
                        localStorage.setItem('needsEmergencyPhone', '1');
                    } else {
                        localStorage.removeItem('needsEmergencyPhone');
                    }
                } catch {}
                if (data.role === 'customer') navigate('/customer');
                else if (data.role === 'rider') navigate('/rider');
                else if (data.role === 'admin') navigate('/admin');
            } else {
                const tx = await response.text();
                setError(tx || '❌ Invalid or expired OTP');
            }
        } catch (err) {
            setError('❌ Could not verify OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async () => {
        setError('');
        const phoneDigits = (phone || '').replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            setError('Enter a valid 10-digit mobile number');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneDigits })
            });
            if (res.status === 404) {
                setError('❌ OTP endpoint not found (404). Start/restart the Spring Boot backend on port 9031 so /api/auth/send-otp is registered.');
                return;
            }

            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (res.ok) {
                setOtpInfo(data);
                return;
            }

            setError(data?.error || 'Unable to send OTP. Please wait and try again.');
        } catch {
            setError('Unable to send OTP at the moment.');
        }
    };

    const handleGoogleSignin = async () => {
        setError('');
        // Minimal stub: prompt email for now
        const emailInput = prompt('Enter Google email (dev stub):');
        if (!emailInput) return;
        try {
            const res = await fetch(`${API_BASE}/auth/google-signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, name: emailInput.split('@')[0], role })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.role !== role) {
                    setError(`❌ This account is registered as a ${data.role}. Please select the correct role.`);
                    return;
                }
                localStorage.setItem('user', JSON.stringify(data));
                if (data.role === 'customer') navigate('/customer');
                else if (data.role === 'rider') navigate('/rider');
                else if (data.role === 'admin') navigate('/admin');
                return;
            }

            if (res.status === 404) {
                setError('❌ Google sign-in endpoint not found (404). Restart the Spring Boot backend so /api/auth/google-signin is registered.');
                return;
            }

            const text = await res.text();
            setError(text || 'Google sign-in failed');
        } catch {
            setError('Google sign-in failed');
        }
    };

    return (
        <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                position: 'relative'
            }}
        >
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
                <motion.div 
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '40px',
                        maxWidth: '450px',
                        width: '100%',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}
                >
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
                    <p style={{ color: '#666', marginTop: '8px' }}>Sign in to your account</p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                background: '#FFEBEE',
                                color: '#D32F2F',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontSize: '14px',
                                whiteSpace: 'pre-line'
                            }}
                        >
                            <i className="fa-solid fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Helpful Info */}
                {!error && (
                    <div style={{
                        background: '#E3F2FD',
                        color: '#1976D2',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '13px'
                    }}>
                        <i className="fa-solid fa-info-circle" style={{ marginRight: '8px' }}></i>
                        <strong>First time?</strong> Click "Sign Up" below to create an account.
                    </div>
                )}

                {/* Role Selection */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#000'
                    }}>
                        Sign in as
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setRole('customer')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                border: role === 'customer' ? '2px solid #000' : '2px solid #ddd',
                                borderRadius: '8px',
                                background: role === 'customer' ? '#f5f5f5' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className="fa-solid fa-user" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                            <div style={{ fontWeight: '600' }}>Customer</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('rider')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                border: role === 'rider' ? '2px solid #000' : '2px solid #ddd',
                                borderRadius: '8px',
                                background: role === 'rider' ? '#f5f5f5' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: '600' }}>Driver</div>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <button type="button" className={`modern-btn ${loginMode === 'password' ? 'modern-btn-primary' : 'modern-btn-outline'}`} onClick={() => setLoginMode('password')}>Email & Password</button>
                        <button type="button" className={`modern-btn ${loginMode === 'otp' ? 'modern-btn-primary' : 'modern-btn-outline'}`} onClick={() => setLoginMode('otp')}>Mobile OTP</button>
                    </div>
                    {loginMode === 'password' ? (
                        <>
                            {/* Email */}
                            <div className="uber-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="uber-input"
                                    required
                                />
                            </div>
                            {/* Password */}
                            <div className="uber-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="uber-input"
                                    required
                                />
                            </div>
                            {/* Forgot Password */}
                            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                                <a href="#" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
                                    Forgot password?
                                </a>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Phone */}
                            <div className="uber-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter 10-digit number"
                                    className="uber-input"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                                <button type="button" className="modern-btn modern-btn-secondary ripple" onClick={handleSendOtp}>Send OTP</button>
                            </div>
                            {/* OTP */}
                            <div className="uber-input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#000' }}>
                                    OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="6-digit code"
                                    className="uber-input"
                                />
                            </div>
                        </>
                    )}

                    <div className="auth-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="uber-btn uber-btn-primary modern-btn modern-btn-primary ripple shimmer-btn"
                            style={{ width: '100%', maxWidth: 320, display: 'block' }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="uber-spinner"></span>
                            ) : (
                                loginMode === 'password' ? 'Sign In' : 'Verify OTP'
                            )}
                        </button>

                        {/* Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', width: '100%', maxWidth: 320 }}>
                            <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                            <div style={{ padding: '0 8px', color: '#999', fontSize: 12 }}>OR</div>
                            <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                        </div>

                        {/* Google Sign-in */}
                        <button type="button" onClick={handleGoogleSignin} className="modern-btn modern-btn-outline ripple" style={{ width: '100%', maxWidth: 320, display: 'block' }}>
                            Continue with Google
                        </button>
                    </div>
                </form>

                {/* Sign Up Link */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '24px',
                    color: '#666'
                }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </div>

                {/* Admin Login Link */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #eee'
                }}>
                    <Link to="/admin-login" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
                        Admin Login
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
                </motion.div>
            </div>
        </motion.div>
    );
}
