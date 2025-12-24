import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, backdropVariants } from '../../config/animations';

export default function RideRatingModal({ isOpen, onClose, onSubmit, rideDetails }) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ rating, feedback });
            // Success animation then close
            setTimeout(() => {
                onClose();
                setRating(0);
                setFeedback('');
            }, 1000);
        } catch (error) {
            console.error('Rating submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const quickFeedback = [
        { emoji: '😊', text: 'Great ride!' },
        { emoji: '🚗', text: 'Clean car' },
        { emoji: '⭐', text: 'Professional' },
        { emoji: '💬', text: 'Good conversation' },
        { emoji: '🎵', text: 'Nice music' },
        { emoji: '❄️', text: 'Good AC' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        {/* Modal */}
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '24px',
                                padding: '40px',
                                maxWidth: '500px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                                        margin: '0 auto 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '40px'
                                    }}
                                >
                                    ✓
                                </motion.div>
                                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#000' }}>
                                    Ride Completed!
                                </h2>
                                <p style={{ color: '#666', fontSize: '16px' }}>
                                    How was your experience?
                                </p>
                            </div>

                            {/* Ride Details */}
                            {rideDetails && (
                                <div style={{
                                    background: '#f9f9f9',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#666' }}>Driver:</span>
                                        <span style={{ fontWeight: '600' }}>{rideDetails.driverName || 'Driver'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#666' }}>Fare:</span>
                                        <span style={{ fontWeight: '700', color: '#00C853', fontSize: '18px' }}>
                                            ₹{rideDetails.fare}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Star Rating */}
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                                    Rate your ride
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <motion.button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            whileHover={{ scale: 1.2, rotate: 10 }}
                                            whileTap={{ scale: 0.9 }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '48px',
                                                padding: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <motion.span
                                                animate={{
                                                    scale: (hoveredRating >= star || rating >= star) ? 1.1 : 1,
                                                }}
                                                style={{
                                                    color: (hoveredRating >= star || rating >= star) ? '#FFD700' : '#ddd',
                                                    filter: (hoveredRating >= star || rating >= star) 
                                                        ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))' 
                                                        : 'none'
                                                }}
                                            >
                                                ★
                                            </motion.span>
                                        </motion.button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ marginTop: '12px', fontSize: '16px', fontWeight: '600', color: '#00C853' }}
                                    >
                                        {rating === 5 && '⭐ Excellent!'}
                                        {rating === 4 && '😊 Great!'}
                                        {rating === 3 && '👍 Good'}
                                        {rating === 2 && '😐 Okay'}
                                        {rating === 1 && '😞 Poor'}
                                    </motion.div>
                                )}
                            </div>

                            {/* Quick Feedback Tags */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                                    Quick feedback (optional)
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {quickFeedback.map((item, index) => (
                                        <motion.button
                                            key={index}
                                            onClick={() => setFeedback(prev => 
                                                prev.includes(item.text) 
                                                    ? prev.replace(item.text + ' ', '') 
                                                    : prev + item.text + ' '
                                            )}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: feedback.includes(item.text) ? '2px solid #00C853' : '2px solid #e0e0e0',
                                                background: feedback.includes(item.text) ? '#e8f5e9' : '#fff',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {item.emoji} {item.text}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Feedback Textarea */}
                            <div style={{ marginBottom: '24px' }}>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share more details about your experience (optional)"
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '2px solid #e0e0e0',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px solid #e0e0e0',
                                        background: '#fff',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    Skip
                                </motion.button>
                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={rating === 0 || isSubmitting}
                                    whileHover={rating > 0 ? { scale: 1.02 } : {}}
                                    whileTap={rating > 0 ? { scale: 0.98 } : {}}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: rating > 0 
                                            ? 'linear-gradient(135deg, #00C853 0%, #00E676 100%)' 
                                            : '#e0e0e0',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: rating > 0 ? 'pointer' : 'not-allowed',
                                        color: '#fff',
                                        boxShadow: rating > 0 ? '0 4px 15px rgba(0, 200, 83, 0.3)' : 'none'
                                    }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
