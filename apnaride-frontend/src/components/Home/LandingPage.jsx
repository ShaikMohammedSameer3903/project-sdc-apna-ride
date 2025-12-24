import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// framer-motion not used directly here
import SimpleAnimatedBackground from '../Animations/SimpleAnimatedBackground';
import { 
    pageVariants, 
    containerVariants, 
    itemVariants, 
    heroVariants, 
    heroTextVariants,
    scrollRevealVariants,
    viewportSettings,
    buttonVariants
} from '../../config/animations';
import '../../uber-style.css';
import '../../modern-animations.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
        }
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    return (
        <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            style={{ background: darkMode ? '#1a1a2e' : '#fff', transition: 'background 0.3s ease', position: 'relative' }}
        >
            {/* Animated Background */}
            <SimpleAnimatedBackground variant="landing" />
            
            {/* Navigation Bar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: scrolled 
                    ? (darkMode ? '#16213e' : '#fff') 
                    : 'transparent',
                boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s ease',
                padding: '16px 0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: darkMode ? '#fff' : '#000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <i className="fa-solid fa-bolt" style={{ color: '#00C853' }}></i>
                        ApnaRide
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <motion.button 
                            onClick={toggleDarkMode}
                            className="modern-btn modern-btn-ghost"
                            style={{ 
                                width: '48px', 
                                height: '48px', 
                                padding: '0',
                                borderRadius: '50%'
                            }}
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <i className={`fa-solid fa-${darkMode ? 'sun' : 'moon'}`} style={{ fontSize: '18px' }}></i>
                        </motion.button>
                        <motion.button 
                            onClick={() => navigate('/login')}
                            className="modern-btn modern-btn-ghost"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign In
                        </motion.button>
                        <motion.button 
                            onClick={() => navigate('/signup')}
                            className="modern-btn modern-btn-primary pulse-btn"
                            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(0, 200, 83, 0.5)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Sign Up
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Animated Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }}></div>

                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <motion.div 
                        variants={heroVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                            maxWidth: '600px'
                        }}
                    >
                        <motion.h1 
                            variants={heroTextVariants}
                            style={{
                                fontSize: '64px',
                                fontWeight: '700',
                                marginBottom: '24px',
                                lineHeight: '1.2'
                            }}
                        >
                            Move with <span style={{ color: '#00C853' }}>ApnaRide</span>
                        </motion.h1>
                        <motion.p 
                            variants={heroTextVariants}
                            style={{
                                fontSize: '24px',
                                marginBottom: '40px',
                                color: '#ccc',
                                lineHeight: '1.6'
                            }}
                        >
                            Request a ride, hop in, and go. Or become a driver and earn money on your schedule.
                        </motion.p>
                        <motion.div 
                            variants={heroTextVariants}
                            style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
                        >
                            <motion.button 
                                onClick={() => navigate('/signup')}
                                className="modern-btn modern-btn-primary shimmer-btn"
                                style={{ fontSize: '18px', padding: '16px 32px' }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Get Started
                            </motion.button>
                            <motion.button 
                                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                                className="modern-btn modern-btn-outline"
                                style={{ fontSize: '18px', padding: '16px 32px', color: '#fff', borderColor: '#fff' }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Learn More
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    animation: 'bounce 2s infinite'
                }}>
                    <i className="fa-solid fa-chevron-down" style={{ fontSize: '24px', opacity: 0.6 }}></i>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{
                padding: '100px 24px',
                background: '#fff'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.h2 
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportSettings}
                        variants={scrollRevealVariants}
                        style={{
                            fontSize: '48px',
                            fontWeight: '700',
                            textAlign: 'center',
                            marginBottom: '60px',
                            color: '#000'
                        }}
                    >
                        Why Choose ApnaRide?
                    </motion.h2>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportSettings}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '40px'
                        }}
                    >
                        {[
                            {
                                icon: 'fa-bolt',
                                title: 'Fast & Reliable',
                                description: 'Get a ride in minutes. Our drivers are always nearby and ready to take you where you need to go.',
                                color: '#FFD700'
                            },
                            {
                                icon: 'fa-shield-halved',
                                title: 'Safe & Secure',
                                description: 'Your safety is our priority. All drivers are verified, and you can share your trip with loved ones.',
                                color: '#00C853'
                            },
                            {
                                icon: 'fa-indian-rupee-sign',
                                title: 'Affordable Prices',
                                description: 'Transparent pricing with no hidden fees. Choose from multiple ride options to fit your budget.',
                                color: '#2196F3'
                            },
                            {
                                icon: 'fa-clock',
                                title: '24/7 Availability',
                                description: 'Need a ride at 3 AM? No problem. ApnaRide is available round the clock, every day.',
                                color: '#FF5722'
                            },
                            {
                                icon: 'fa-star',
                                title: 'Top-Rated Drivers',
                                description: 'Our drivers maintain high ratings and provide excellent service to ensure your comfort.',
                                color: '#FFC107'
                            },
                            {
                                icon: 'fa-mobile-screen',
                                title: 'Easy to Use',
                                description: 'Simple, intuitive app design. Book a ride in just a few taps and track your driver in real-time.',
                                color: '#9C27B0'
                            }
                        ].map((feature, index) => (
                            <motion.div 
                                key={index} 
                                variants={itemVariants}
                                whileHover={{ y: -8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                                style={{
                                    padding: '32px',
                                    borderRadius: '16px',
                                    background: '#f5f5f5',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    background: feature.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <i className={`fa-solid ${feature.icon}`} style={{ fontSize: '28px', color: '#fff' }}></i>
                                </div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    color: '#000'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#666',
                                    lineHeight: '1.6'
                                }}>
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section style={{
                padding: '100px 24px',
                background: '#f5f5f5'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '60px',
                        color: '#000'
                    }}>
                        How It Works
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '40px'
                    }}>
                        {[
                            {
                                step: '1',
                                title: 'Request a Ride',
                                description: 'Enter your destination and request a ride',
                                icon: 'fa-mobile-screen'
                            },
                            {
                                step: '2',
                                title: 'Get Matched',
                                description: 'We connect you with a nearby driver',
                                icon: 'fa-user-check'
                            },
                            {
                                step: '3',
                                title: 'Track Your Driver',
                                description: 'See your driver\'s location in real-time',
                                icon: 'fa-location-dot'
                            },
                            {
                                step: '4',
                                title: 'Enjoy Your Ride',
                                description: 'Sit back, relax, and enjoy the journey',
                                icon: 'fa-car'
                            }
                        ].map((item, index) => (
                            <div key={index} style={{
                                textAlign: 'center',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: '#000',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontSize: '32px',
                                    fontWeight: '700'
                                }}>
                                    {item.step}
                                </div>
                                <i className={`fa-solid ${item.icon}`} style={{
                                    fontSize: '32px',
                                    color: '#00C853',
                                    marginBottom: '16px'
                                }}></i>
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    color: '#000'
                                }}>
                                    {item.title}
                                </h3>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#666'
                                }}>
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Driver CTA Section */}
            <section style={{
                padding: '100px 24px',
                background: 'linear-gradient(135deg, #00C853 0%, #00A040 100%)',
                color: '#fff'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        marginBottom: '24px'
                    }}>
                        Drive with ApnaRide
                    </h2>
                    <p style={{
                        fontSize: '20px',
                        marginBottom: '40px',
                        opacity: 0.9
                    }}>
                        Set your own schedule, be your own boss, and earn money on your terms. Join thousands of drivers already earning with ApnaRide.
                    </p>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="modern-btn glow-btn"
                        style={{
                            padding: '16px 48px',
                            background: '#fff',
                            color: '#00C853',
                            fontSize: '18px'
                        }}
                    >
                        Become a Driver
                    </button>
                </div>
            </section>

            {/* Advanced Features Section */}
            <section style={{
                padding: '100px 24px',
                background: '#fff'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '20px',
                        color: '#000'
                    }} className="slide-in-up">
                        Advanced Features
                    </h2>
                    <p style={{
                        textAlign: 'center',
                        fontSize: '18px',
                        color: '#666',
                        marginBottom: '60px',
                        maxWidth: '600px',
                        margin: '0 auto 60px'
                    }}>
                        Experience the future of ride-sharing with our cutting-edge technology
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '30px'
                    }}>
                        {[
                            {
                                icon: 'fa-sliders',
                                title: 'Custom Distance Range',
                                description: 'Drivers can set their preferred ride distance range and only receive requests that match their preferences.',
                                color: '#FF6B6B',
                                gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'
                            },
                            {
                                icon: 'fa-filter',
                                title: 'Smart Ride Filtering',
                                description: 'Filter rides by vehicle type, fare amount, and pickup location to find the perfect match.',
                                color: '#4ECDC4',
                                gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
                            },
                            {
                                icon: 'fa-map-location-dot',
                                title: 'Real-Time Tracking',
                                description: 'Track your driver or customer in real-time with live location updates every 10 seconds.',
                                color: '#FFE66D',
                                gradient: 'linear-gradient(135deg, #FFE66D 0%, #FFCA28 100%)'
                            },
                            {
                                icon: 'fa-bell',
                                title: 'Instant Notifications',
                                description: 'Get instant push notifications for new ride requests, acceptances, and ride status updates.',
                                color: '#A8E6CF',
                                gradient: 'linear-gradient(135deg, #A8E6CF 0%, #81C784 100%)'
                            },
                            {
                                icon: 'fa-chart-line',
                                title: 'Earnings Analytics',
                                description: 'Track your daily, weekly, and monthly earnings with detailed analytics and insights.',
                                color: '#C7CEEA',
                                gradient: 'linear-gradient(135deg, #C7CEEA 0%, #9FA8DA 100%)'
                            },
                            {
                                icon: 'fa-shield-heart',
                                title: 'Safety First',
                                description: 'Emergency SOS button, ride sharing with contacts, and 24/7 support for your safety.',
                                color: '#FFDAB9',
                                gradient: 'linear-gradient(135deg, #FFDAB9 0%, #FFB74D 100%)'
                            }
                        ].map((feature, index) => (
                            <div key={index} 
                                className="modern-card scale-in glass-card"
                                style={{
                                    padding: '32px',
                                    borderRadius: '20px',
                                    background: '#fff',
                                    border: '1px solid #f0f0f0',
                                    animationDelay: `${index * 0.1}s`
                                }}>
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '20px',
                                    background: feature.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    boxShadow: `0 10px 30px ${feature.color}40`
                                }} className="floating">
                                    <i className={`fa-solid ${feature.icon}`} style={{ fontSize: '30px', color: '#fff' }}></i>
                                </div>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    color: '#000'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '15px',
                                    color: '#666',
                                    lineHeight: '1.7'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section style={{
                padding: '80px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '40px',
                        textAlign: 'center'
                    }}>
                        {[
                            { number: '10K+', label: 'Active Drivers', icon: 'fa-car' },
                            { number: '50K+', label: 'Happy Customers', icon: 'fa-users' },
                            { number: '100K+', label: 'Rides Completed', icon: 'fa-route' },
                            { number: '4.8', label: 'Average Rating', icon: 'fa-star' }
                        ].map((stat, index) => (
                            <div key={index} className="scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <i className={`fa-solid ${stat.icon}`} style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.9 }}></i>
                                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }} className="neon-text">
                                    {stat.number}
                                </div>
                                <div style={{ fontSize: '18px', opacity: 0.9 }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section style={{
                padding: '100px 24px',
                background: '#f9f9f9'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '60px',
                        color: '#000'
                    }}>
                        What Our Users Say
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '30px'
                    }}>
                        {[
                            {
                                name: 'Priya Sharma',
                                role: 'Regular Customer',
                                image: '👩',
                                rating: 5,
                                text: 'ApnaRide has made my daily commute so much easier! The drivers are professional and the app is super easy to use.'
                            },
                            {
                                name: 'Rajesh Kumar',
                                role: 'Driver Partner',
                                image: '👨',
                                rating: 5,
                                text: 'I love the flexibility! The distance range feature helps me choose rides that work best for my schedule.'
                            },
                            {
                                name: 'Anita Desai',
                                role: 'Business Traveler',
                                image: '👩‍💼',
                                rating: 5,
                                text: 'Reliable, safe, and affordable. ApnaRide is my go-to app for all my travel needs in the city.'
                            }
                        ].map((testimonial, index) => (
                            <div key={index} 
                                className="modern-card slide-in-up"
                                style={{
                                    padding: '32px',
                                    borderRadius: '20px',
                                    background: '#fff',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    animationDelay: `${index * 0.2}s`
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '30px',
                                        marginRight: '16px'
                                    }}>
                                        {testimonial.image}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '18px', color: '#000' }}>
                                            {testimonial.name}
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#666' }}>
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <i key={i} className="fa-solid fa-star" style={{ color: '#FFD700', marginRight: '4px' }}></i>
                                    ))}
                                </div>
                                <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.7', fontStyle: 'italic' }}>
                                    "{testimonial.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '60px 24px',
                background: '#000',
                color: '#fff'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '40px'
                }}>
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <i className="fa-solid fa-bolt" style={{ color: '#00C853' }}></i>
                            ApnaRide
                        </div>
                        <p style={{ color: '#999', marginBottom: '16px' }}>
                            Moving India, one ride at a time.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <i className="fa-brands fa-facebook" style={{ fontSize: '24px', cursor: 'pointer' }}></i>
                            <i className="fa-brands fa-twitter" style={{ fontSize: '24px', cursor: 'pointer' }}></i>
                            <i className="fa-brands fa-instagram" style={{ fontSize: '24px', cursor: 'pointer' }}></i>
                            <i className="fa-brands fa-linkedin" style={{ fontSize: '24px', cursor: 'pointer' }}></i>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '16px', fontWeight: '600' }}>Company</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>About Us</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Careers</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Press</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '16px', fontWeight: '600' }}>Support</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Help Center</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Safety</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Contact Us</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>FAQs</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ marginBottom: '16px', fontWeight: '600' }}>Legal</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Cookie Policy</a></li>
                            <li style={{ marginBottom: '12px' }}><a href="#" style={{ color: '#999', textDecoration: 'none' }}>Licenses</a></li>
                        </ul>
                    </div>
                </div>
                <div style={{
                    maxWidth: '1200px',
                    margin: '40px auto 0',
                    paddingTop: '40px',
                    borderTop: '1px solid #333',
                    textAlign: 'center',
                    color: '#666'
                }}>
                    © 2025 ApnaRide. All rights reserved.
                </div>
            </footer>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce {
                    0%, 100% {
                        transform: translateX(-50%) translateY(0);
                    }
                    50% {
                        transform: translateX(-50%) translateY(-10px);
                    }
                }
            `}</style>
        </motion.div>
    );
}
