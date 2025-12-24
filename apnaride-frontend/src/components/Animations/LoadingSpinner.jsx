import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', fullScreen = false }) => {
    const sizes = {
        small: { spinner: 30, dot: 8 },
        medium: { spinner: 50, dot: 12 },
        large: { spinner: 80, dot: 16 }
    };

    const { spinner, dot } = sizes[size];

    const containerVariants = {
        start: { transition: { staggerChildren: 0.2 } },
        end: { transition: { staggerChildren: 0.2 } }
    };

    const dotVariants = {
        start: { y: '0%' },
        end: { y: '100%' }
    };

    const dotTransition = {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut'
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
    } : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    };

    return (
        <div style={containerStyle}>
            {/* Circular spinner */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                    width: spinner,
                    height: spinner,
                    border: `4px solid rgba(102, 126, 234, 0.2)`,
                    borderTop: `4px solid #667eea`,
                    borderRadius: '50%',
                    marginBottom: '20px'
                }}
            />

            {/* Pulsing dots */}
            <motion.div
                variants={containerVariants}
                initial="start"
                animate="end"
                style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px'
                }}
            >
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        variants={dotVariants}
                        transition={dotTransition}
                        style={{
                            width: dot,
                            height: dot,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                    />
                ))}
            </motion.div>

            {/* Message */}
            {message && (
                <motion.p
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: fullScreen ? '#fff' : '#667eea',
                        textAlign: 'center'
                    }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;
