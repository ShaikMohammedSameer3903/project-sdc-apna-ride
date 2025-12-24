import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../uber-style.css';
import '../../modern-animations.css';

export default function ExcitingLandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [activeCity, setActiveCity] = useState(0);

    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai'];
    const stats = [
        { value: '10K+', label: 'Active Drivers', icon: '🚗' },
        { value: '50K+', label: 'Happy Riders', icon: '😊' },
        { value: '100K+', label: 'Rides Completed', icon: '✅' },
        { value: '4.8⭐', label: 'Average Rating', icon: '⭐' }
    ];

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
        }

        // Rotate cities
        const interval = setInterval(() => {
            setActiveCity((prev) => (prev + 1) % cities.length);
        }, 2000);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(interval);
        };
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    return (
        <div style={{ 
            background: darkMode ? '#0a0a0a' : '#ffffff',
            minHeight: '100vh',
            transition: 'background 0.3s ease',
            overflow: 'hidden'
        }}>
            {/* Animated Background Particles */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 0
            }}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="floating"
                        style={{
                            position: 'absolute',
                            width: Math.random() * 100 + 50 + 'px',
                            height: Math.random() * 100 + 50 + 'px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${darkMode ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)'}, transparent)`,
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animation: `floating ${3 + Math.random() * 3}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Navigation */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: scrolled 
                    ? (darkMode ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)') 
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s ease',
                padding: '20px 0'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }} className="slide-in-left">
                        <span style={{ fontSize: '40px' }}>⚡</span>
                        ApnaRide
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="slide-in-right">
                        <button 
                            onClick={toggleDarkMode}
                            className="modern-btn modern-btn-ghost"
                            style={{ 
                                width: '50px', 
                                height: '50px', 
                                padding: '0',
                                borderRadius: '50%',
                                fontSize: '20px'
                            }}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button 
                            onClick={() => navigate('/login')}
                            className="modern-btn modern-btn-ghost"
                            style={{ fontSize: '16px', padding: '12px 28px' }}
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => navigate('/signup')}
                            className="modern-btn modern-btn-primary pulse-btn"
                            style={{ fontSize: '16px', padding: '12px 32px' }}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '100px 40px 60px'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '80px',
                    alignItems: 'center'
                }}>
                    {/* Left Content */}
                    <div className="slide-in-left">
                        <div style={{
                            display: 'inline-block',
                            padding: '8px 20px',
                            background: 'linear-gradient(135deg, rgba(0,200,83,0.1) 0%, rgba(0,230,118,0.1) 100%)',
                            borderRadius: '50px',
                            marginBottom: '30px',
                            border: '1px solid rgba(0,200,83,0.2)'
                        }}>
                            <span style={{ 
                                color: '#00C853', 
                                fontWeight: '600',
                                fontSize: '14px'
                            }}>
                                🎉 Now Available in {cities[activeCity]}!
                            </span>
                        </div>
                        
                        <h1 style={{
                            fontSize: '72px',
                            fontWeight: '900',
                            marginBottom: '30px',
                            lineHeight: '1.1',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            Your Ride,
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Your Way
                            </span>
                        </h1>
                        
                        <p style={{
                            fontSize: '22px',
                            marginBottom: '50px',
                            color: darkMode ? '#ccc' : '#666',
                            lineHeight: '1.8'
                        }}>
                            Experience the future of transportation. Book rides in seconds, 
                            track in real-time, and travel safely with verified drivers.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="modern-btn"
                                style={{
                                    fontSize: '18px',
                                    padding: '18px 40px',
                                    background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                                    boxShadow: '0 10px 40px rgba(0,200,83,0.3)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 15px 50px rgba(0,200,83,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 10px 40px rgba(0,200,83,0.3)';
                                }}
                            >
                                <span style={{ marginRight: '10px' }}>🚀</span>
                                Start Riding Now
                            </button>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="modern-btn"
                                style={{
                                    fontSize: '18px',
                                    padding: '18px 40px',
                                    background: 'transparent',
                                    border: `2px solid #00C853`,
                                    borderRadius: '12px',
                                    color: darkMode ? '#00E676' : '#00C853',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#00C853';
                                    e.target.style.color = '#fff';
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = darkMode ? '#00E676' : '#00C853';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ marginRight: '10px' }}>💼</span>
                                Drive & Earn
                            </button>
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '30px',
                            marginTop: '60px'
                        }}>
                            {stats.map((stat, index) => (
                                <div key={index} className="scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: '800',
                                        color: '#00C853',
                                        marginBottom: '5px'
                                    }}>
                                        {stat.value}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: darkMode ? '#999' : '#666',
                                        fontWeight: '500'
                                    }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - 3D Phone Mockup */}
                    <div className="slide-in-right" style={{ position: 'relative' }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '700px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Phone Frame */}
                            <div className="floating" style={{
                                width: '350px',
                                height: '700px',
                                background: darkMode ? '#1a1a1a' : '#fff',
                                borderRadius: '50px',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.3)',
                                border: `10px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Notch */}
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '150px',
                                    height: '30px',
                                    background: darkMode ? '#0a0a0a' : '#000',
                                    borderRadius: '0 0 20px 20px'
                                }}></div>

                                {/* Screen Content */}
                                <div style={{
                                    padding: '60px 30px 30px',
                                    height: '100%',
                                    background: 'linear-gradient(180deg, #00C853 0%, #00E676 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '28px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            marginBottom: '20px'
                                        }}>
                                            Where to?
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
                                                📍 Current Location
                                            </div>
                                            <div style={{ color: '#fff', fontSize: '14px' }}>
                                                🎯 Enter Destination
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {['🏍️ Bike - ₹50', '🚗 Auto - ₹80', '🚙 Car - ₹120'].map((option, i) => (
                                            <div key={i} className="scale-in" style={{
                                                background: 'rgba(255,255,255,0.9)',
                                                borderRadius: '15px',
                                                padding: '15px 20px',
                                                marginBottom: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                animationDelay: `${i * 0.1}s`
                                            }}>
                                                <span style={{ fontSize: '16px', fontWeight: '600' }}>{option}</span>
                                                <span style={{ fontSize: '12px', color: '#00C853' }}>2 min</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="floating" style={{
                                position: 'absolute',
                                top: '10%',
                                right: '-50px',
                                width: '100px',
                                height: '100px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                boxShadow: '0 20px 60px rgba(255,215,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '50px',
                                animationDelay: '0.5s'
                            }}>
                                ⚡
                            </div>
                            
                            <div className="floating" style={{
                                position: 'absolute',
                                bottom: '15%',
                                left: '-50px',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                                boxShadow: '0 20px 60px rgba(255,107,107,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                animationDelay: '1s'
                            }}>
                                🎯
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="bounce" style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '30px',
                    opacity: 0.6,
                    cursor: 'pointer'
                }} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                    ⬇️
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{
                padding: '100px 40px',
                background: darkMode ? '#0f0f0f' : '#f9f9f9',
                position: 'relative'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: '56px',
                            fontWeight: '800',
                            marginBottom: '20px',
                            color: darkMode ? '#fff' : '#000'
                        }} className="slide-in-up">
                            Why Choose ApnaRide?
                        </h2>
                        <p style={{
                            fontSize: '20px',
                            color: darkMode ? '#999' : '#666',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            Experience the best ride-sharing service with cutting-edge features
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '40px'
                    }}>
                        {[
                            {
                                icon: '⚡',
                                title: 'Lightning Fast',
                                description: 'Get a ride in under 2 minutes. Our AI matches you with the nearest driver instantly.',
                                color: '#FFD700'
                            },
                            {
                                icon: '🛡️',
                                title: 'Super Safe',
                                description: 'All drivers verified with background checks. Share your trip with family in real-time.',
                                color: '#00C853'
                            },
                            {
                                icon: '💰',
                                title: 'Best Prices',
                                description: 'Transparent pricing with no surge. Get the best rates guaranteed.',
                                color: '#2196F3'
                            },
                            {
                                icon: '🎯',
                                title: 'Smart Matching',
                                description: 'Advanced algorithm finds the perfect driver for your ride preferences.',
                                color: '#FF6B6B'
                            },
                            {
                                icon: '📱',
                                title: 'Easy to Use',
                                description: 'Book a ride in 3 taps. Intuitive interface designed for everyone.',
                                color: '#9C27B0'
                            },
                            {
                                icon: '🌟',
                                title: '24/7 Support',
                                description: 'Round-the-clock customer support. We are always here to help you.',
                                color: '#FF9800'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="modern-card scale-in" style={{
                                background: darkMode ? '#1a1a1a' : '#fff',
                                padding: '40px',
                                borderRadius: '30px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                border: `2px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}`,
                                animationDelay: `${index * 0.1}s`
                            }}>
                                <div style={{
                                    fontSize: '60px',
                                    marginBottom: '20px'
                                }} className="floating">
                                    {feature.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    marginBottom: '15px',
                                    color: darkMode ? '#fff' : '#000'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    color: darkMode ? '#999' : '#666',
                                    lineHeight: '1.8'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '120px 40px',
                background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <h2 style={{
                        fontSize: '56px',
                        fontWeight: '800',
                        marginBottom: '30px',
                        color: '#fff'
                    }} className="scale-in">
                        Ready to Ride?
                    </h2>
                    <p style={{
                        fontSize: '22px',
                        marginBottom: '50px',
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        Join millions of happy riders and drivers. Start your journey today!
                    </p>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="modern-btn glow-btn"
                        style={{
                            fontSize: '20px',
                            padding: '20px 50px',
                            background: '#fff',
                            color: '#00C853',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                        }}
                    >
                        Get Started Free →
                    </button>
                </div>

                {/* Animated Background */}
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="floating"
                        style={{
                            position: 'absolute',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </section>

            {/* Footer */}
            <footer style={{
                padding: '60px 40px',
                background: darkMode ? '#0a0a0a' : '#000',
                color: '#fff'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        marginBottom: '20px',
                        background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        ⚡ ApnaRide
                    </div>
                    <p style={{ color: '#666', marginBottom: '30px' }}>
                        Moving India, one ride at a time.
                    </p>
                    <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', fontSize: '24px' }}>
                        {['📘', '🐦', '📸', '💼'].map((icon, i) => (
                            <span key={i} className="modern-card" style={{
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)'
                            }}>
                                {icon}
                            </span>
                        ))}
                    </div>
                    <div style={{
                        marginTop: '40px',
                        paddingTop: '40px',
                        borderTop: '1px solid #333',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        © 2025 ApnaRide. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
