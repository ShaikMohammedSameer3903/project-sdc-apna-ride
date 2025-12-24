import React from 'react';
import { motion } from 'framer-motion';

const SuccessAnimation = ({ message = 'Success!', onComplete }) => {
    React.useEffect(() => {
        if (onComplete) {
            const timer = setTimeout(onComplete, 2000);
            return () => clearTimeout(timer);
        }
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999
            }}
        >
            {/* Success circle with checkmark */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                    position: 'relative',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(0, 255, 136, 0.6)'
                }}
            >
                {/* Animated checkmark */}
                <motion.svg
                    width="80"
                    height="80"
                    viewBox="0 0 52 52"
                    style={{ position: 'absolute' }}
                >
                    <motion.path
                        fill="none"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 27l7.5 7.5L38 18"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    />
                </motion.svg>

                {/* Ripple effect */}
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{
                            duration: 1.5,
                            delay: index * 0.3,
                            repeat: Infinity
                        }}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '3px solid rgba(0, 255, 136, 0.8)'
                        }}
                    />
                ))}
            </motion.div>

            {/* Success message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    marginTop: '30px',
                    textAlign: 'center'
                }}
            >
                <h2 style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '10px'
                }}>
                    {message}
                </h2>
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    <p style={{
                        margin: 0,
                        fontSize: '16px',
                        color: 'rgba(255, 255, 255, 0.8)'
                    }}>
                        🎉 Great! Everything is set.
                    </p>
                </motion.div>
            </motion.div>

            {/* Confetti particles */}
            {[...Array(20)].map((_, index) => (
                <motion.div
                    key={index}
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 0
                    }}
                    animate={{
                        x: (Math.random() - 0.5) * 400,
                        y: Math.random() * 400 + 200,
                        opacity: 0,
                        scale: 1,
                        rotate: Math.random() * 360
                    }}
                    transition={{
                        duration: 1.5,
                        delay: 0.3 + Math.random() * 0.3
                    }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '10px',
                        height: '10px',
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        background: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'][Math.floor(Math.random() * 5)]
                    }}
                />
            ))}
        </motion.div>
    );
};

export default SuccessAnimation;
