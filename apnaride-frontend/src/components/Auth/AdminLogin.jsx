import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const Spinner = () => <i className="fa-solid fa-spinner spinner"></i>;

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE
    : '/api';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Only allow admin role
                if (data.role !== 'admin') {
                    setError('Access denied. Admin credentials required.');
                    setIsLoading(false);
                    return;
                }
                
                localStorage.setItem('user', JSON.stringify(data));
                navigate('/admin');
            } else {
                const errorText = await response.text();
                setError(errorText || 'Invalid admin credentials');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen admin-login-bg p-4">
            <div className="card admin-login-card" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="logo-container" style={{justifyContent: 'center', marginBottom: '1rem'}}>
                    <div className="logo-icon admin-logo-icon">
                        <i className="fa-solid fa-shield-halved"></i>
                    </div>
                </div>
                <h1 style={{fontSize: '1.875rem', fontWeight: '800', textAlign: 'center', marginBottom: '0.5rem', color: '#1e293b'}}>
                    Admin Portal
                </h1>
                <p style={{textAlign: 'center', color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem'}}>
                    Secure access for administrators only
                </p>

                {error && (
                    <div className="error-alert animate-shake">
                        <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="form-container">
                    <div>
                        <label className="form-label">Admin Email</label>
                        <div className="input-container">
                            <div className="input-icon"><i className="fa-solid fa-user-shield"></i></div>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className="input-field" 
                                placeholder="admin@apnaride.com"
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Password</label>
                        <div className="input-container">
                            <div className="input-icon"><i className="fa-solid fa-lock"></i></div>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="input-field" 
                                placeholder="Enter admin password"
                                required 
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn btn-admin">
                        {isLoading ? <Spinner /> : (
                            <>
                                <i className="fa-solid fa-right-to-bracket mr-2"></i>
                                Secure Login
                            </>
                        )}
                    </button>
                </form>
                
                <div style={{textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb'}}>
                    <p style={{fontSize: '0.85rem', color: '#64748b'}}>
                        Not an admin? 
                        <button 
                            onClick={() => navigate('/login')} 
                            style={{color: '#667eea', fontWeight: '600', marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}
                        >
                            Go to User Login
                        </button>
                    </p>
                </div>
                
                <div className="admin-security-badge">
                    <i className="fa-solid fa-shield-check mr-2"></i>
                    Secured with enterprise-grade encryption
                </div>
            </div>
        </div>
    );
}
