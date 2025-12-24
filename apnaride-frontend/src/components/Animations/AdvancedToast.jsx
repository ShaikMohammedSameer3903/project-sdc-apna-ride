import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AdvancedToast = ({ notifications, onClose }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return { icon: 'fa-check-circle', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' };
            case 'error':
                return { icon: 'fa-times-circle', color: '#ff4757', bg: 'rgba(255, 71, 87, 0.1)' };
            case 'warning':
                return { icon: 'fa-exclamation-triangle', color: '#ffa502', bg: 'rgba(255, 165, 2, 0.1)' };
            default:
                return { icon: 'fa-info-circle', color: '#3742fa', bg: 'rgba(55, 66, 250, 0.1)' };
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px'
        }}>
            <AnimatePresence>
                {notifications.map((notification) => {
                    const { icon, color, bg } = getIcon(notification.type);
                    return (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                background: 'white',
                                borderRadius: '12px',
                                padding: '16px 20px',
                                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                minWidth: '300px',
                                borderLeft: `4px solid ${color}`,
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <i className={`fa-solid ${icon}`} style={{ color, fontSize: '18px' }}></i>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: '14px', 
                                    fontWeight: '600',
                                    color: '#2c3e50'
                                }}>
                                    {notification.message}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onClose && onClose(notification.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: '#95a5a6',
                                    fontSize: '16px'
                                }}
                            >
                                <i className="fa-solid fa-times"></i>
                            </motion.button>
                            
                            {/* Progress bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 5, ease: 'linear' }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: color,
                                    transformOrigin: 'left',
                                    borderBottomLeftRadius: '12px',
                                    borderBottomRightRadius: '12px'
                                }}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default AdvancedToast;
