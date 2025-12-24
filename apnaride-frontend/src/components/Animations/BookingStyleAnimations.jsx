import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ensure linter recognizes JSX-only usage of motion
void motion;

// Exciting Pulse Animation for New Rides
export const PulsingRideAlert = ({ children, show }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [- 180, 10, 0],
                    opacity: 1
                }}
                exit={{ scale: 0, rotate: 180, opacity: 0 }}
                transition={{ 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 200
                }}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000
                }}
            >
                <motion.div
                    animate={{
                        boxShadow: [
                            '0 0 0 0 rgba(0, 200, 83, 0.7)',
                            '0 0 0 20px rgba(0, 200, 83, 0)',
                            '0 0 0 0 rgba(0, 200, 83, 0)'
                        ]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity
                    }}
                >
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// Booking Confirmation Animation
export const BookingConfirmation = ({ show }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                    zIndex: 10001,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
            >
                {/* Checkmark Circle */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                        delay: 0.2,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                    }}
                    style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '30px'
                    }}
                >
                    <motion.svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
                    >
                        <motion.path
                            d="M5 13l4 4L19 7"
                            fill="none"
                            stroke="#00C853"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>
                </motion.div>

                {/* Success Text */}
                <motion.h1
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        color: '#fff',
                        fontSize: '48px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        textAlign: 'center'
                    }}
                >
                    Ride Accepted! 🎉
                </motion.h1>

                <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    style={{
                        color: '#fff',
                        fontSize: '20px',
                        textAlign: 'center',
                        opacity: 0.9
                    }}
                >
                    Get ready to pick up your passenger
                </motion.p>

                {/* Confetti Particles */}
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ 
                            x: '50vw',
                            y: '50vh',
                            scale: 0,
                            opacity: 1
                        }}
                        animate={{
                            x: `${Math.random() * 100}vw`,
                            y: `${Math.random() * 100}vh`,
                            scale: [0, 1, 0.5],
                            opacity: [1, 1, 0],
                            rotate: Math.random() * 360
                        }}
                        transition={{
                            duration: 2,
                            delay: 0.5 + Math.random() * 0.5,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: ['#FFD700', '#FF69B4', '#00FFFF', '#FF4500'][Math.floor(Math.random() * 4)]
                        }}
                    />
                ))}
            </motion.div>
        )}
    </AnimatePresence>
);

// Shimmer Loading Effect
export const ShimmerLoader = () => (
    <motion.div
        animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
        }}
        style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '8px'
        }}
    />
);

// Floating Action Button with Ripple
export const FloatingButton = ({ children, onClick, color = '#00C853' }) => (
    <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{
            position: 'relative',
            padding: '16px 32px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 8px 24px ${color}40`,
            overflow: 'hidden'
        }}
    >
        <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.4
            }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#fff'
            }}
        />
        {children}
    </motion.button>
);

// Card Flip Animation
export const FlipCard = ({ front, back, isFlipped }) => (
    <motion.div
        style={{
            perspective: '1000px',
            width: '100%',
            height: '100%'
        }}
    >
        <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                transformStyle: 'preserve-3d'
            }}
        >
            {/* Front */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden'
            }}>
                {front}
            </div>

            {/* Back */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
            }}>
                {back}
            </div>
        </motion.div>
    </motion.div>
);

// Slide In Notification
export const SlideNotification = ({ message, type = 'success', show, onClose }) => {
    const colors = {
        success: '#00C853',
        error: '#FF5252',
        warning: '#FFA726',
        info: '#2196F3'
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: colors[type],
                        color: '#fff',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        zIndex: 10002,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '300px'
                    }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                    >
                        {type === 'success' && '✓'}
                        {type === 'error' && '✕'}
                        {type === 'warning' && '⚠'}
                        {type === 'info' && 'ℹ'}
                    </motion.div>
                    <span style={{ flex: 1 }}>{message}</span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '20px'
                            }}
                        >
                            ×
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Bouncing Dots Loader
export const BouncingDots = () => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                animate={{
                    y: [0, -20, 0]
                }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2
                }}
                style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#00C853'
                }}
            />
        ))}
    </div>
);

// Progress Bar with Animation
export const AnimatedProgressBar = ({ progress, color = '#00C853' }) => (
    <div style={{
        width: '100%',
        height: '8px',
        background: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden'
    }}>
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                height: '100%',
                background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                borderRadius: '4px'
            }}
        />
    </div>
);

export default {
    PulsingRideAlert,
    BookingConfirmation,
    ShimmerLoader,
    FloatingButton,
    FlipCard,
    SlideNotification,
    BouncingDots,
    AnimatedProgressBar
};
