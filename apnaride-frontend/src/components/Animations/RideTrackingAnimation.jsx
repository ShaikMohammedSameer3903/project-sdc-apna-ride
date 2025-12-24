import React from 'react';
// framer-motion removed to avoid unused import

const RideTrackingAnimation = ({ status = 'searching' }) => {
    const animations = {
        searching: {
            icon: 'fa-search',
            color: '#3742fa',
            message: 'Finding nearby drivers...',
            subMessage: 'Please wait while we search for available drivers'
        },
        accepted: {
            icon: 'fa-check-circle',
            color: '#00ff88',
            message: 'Driver Accepted!',
            subMessage: 'Your driver is on the way'
        },
        arriving: {
            icon: 'fa-car',
            color: '#ffa502',
            message: 'Driver Arriving',
            subMessage: 'Your driver will arrive shortly'
        },
        started: {
            icon: 'fa-route',
            color: '#667eea',
            message: 'Ride Started',
            subMessage: 'Enjoy your ride!'
        },
        completed: {
            icon: 'fa-flag-checkered',
            color: '#2ed573',
            message: 'Ride Completed',
            subMessage: 'Thank you for riding with us!'
        }
    };

    const current = animations[status] || animations.searching;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: '20px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background circles */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${current.color}40 0%, transparent 70%)`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Main icon with pulse animation */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: status === 'searching' ? [0, 360] : 0
                }}
                transition={{
                    scale: { duration: 2, repeat: Infinity },
                    rotate: { duration: 2, repeat: Infinity, ease: 'linear' }
                }}
                style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${current.color} 0%, ${current.color}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 10px 40px ${current.color}40`,
                    marginBottom: '20px',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <i className={`fa-solid ${current.icon}`} style={{ 
                    fontSize: '40px', 
                    color: '#fff' 
                }}></i>

                {/* Ripple effect */}
                {status === 'searching' && (
                    <>
                        {[0, 1, 2].map((index) => (
                            <motion.div
                                key={index}
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{
                                    duration: 2,
                                    delay: index * 0.6,
                                    repeat: Infinity
                                }}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    border: `3px solid ${current.color}`,
                                    top: 0,
                                    left: 0
                                }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Message */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#2c3e50',
                    marginBottom: '8px',
                    textAlign: 'center'
                }}
            >
                {current.message}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#7f8c8d',
                    textAlign: 'center'
                }}
            >
                {current.subMessage}
            </motion.p>

            {/* Animated dots for searching */}
            {status === 'searching' && (
                <motion.div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '20px'
                    }}
                >
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                delay: index * 0.2,
                                repeat: Infinity
                            }}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: current.color
                            }}
                        />
                    ))}
                </motion.div>
            )}

            {/* Progress bar for accepted/arriving */}
            {(status === 'accepted' || status === 'arriving') && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    style={{
                        marginTop: '20px',
                        height: '4px',
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        width: '200px'
                    }}
                >
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            height: '100%',
                            width: '50%',
                            background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
                            borderRadius: '2px'
                        }}
                    />
                </motion.div>
            )}
        </div>
    );
};

export default RideTrackingAnimation;
