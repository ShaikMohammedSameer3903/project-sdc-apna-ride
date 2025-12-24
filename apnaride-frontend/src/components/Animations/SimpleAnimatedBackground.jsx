import React from 'react';
import { motion } from 'framer-motion';

export default function SimpleAnimatedBackground({ variant = 'default' }) {
    const colors = {
        default: ['#667eea', '#764ba2', '#f093fb'],
        customer: ['#4facfe', '#00f2fe', '#43e97b'],
        rider: ['#fa709a', '#fee140', '#30cfd0'],
        landing: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
    };
    
    const selectedColors = colors[variant] || colors.default;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            overflow: 'hidden'
        }}>
            {/* Animated Circles */}
            {selectedColors.map((color, index) => (
                <motion.div
                    key={index}
                    animate={{
                        x: [0, 100, 0, -100, 0],
                        y: [0, -100, 0, 100, 0],
                        scale: [1, 1.2, 1, 0.8, 1],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{
                        duration: 20 + index * 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}40, transparent)`,
                        filter: 'blur(40px)',
                        top: `${20 + index * 20}%`,
                        left: `${10 + index * 20}%`
                    }}
                />
            ))}
            
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={`particle-${i}`}
                    animate={{
                        y: [-20, -100, -20],
                        x: [0, Math.random() * 50 - 25, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "easeInOut"
                    }}
                    style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#00ff88',
                        bottom: '0',
                        left: `${Math.random() * 100}%`,
                        boxShadow: '0 0 10px #00ff88'
                    }}
                />
            ))}
        </div>
    );
}
