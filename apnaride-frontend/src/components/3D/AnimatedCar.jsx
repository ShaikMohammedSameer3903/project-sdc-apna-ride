import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// 3D Car Model (Simple)
function Car3D({ position = [0, 0, 0], color = '#00ff88' }) {
    const carRef = useRef();
    
    useFrame((state) => {
        carRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.2;
    });
    
    return (
        <group ref={carRef} position={position}>
            {/* Car Body */}
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[2, 0.6, 1]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Car Top */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[1.2, 0.6, 0.9]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Wheels */}
            {[[-0.7, 0, 0.5], [0.7, 0, 0.5], [-0.7, 0, -0.5], [0.7, 0, -0.5]].map((pos, i) => (
                <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>
            ))}
            
            {/* Headlights */}
            <mesh position={[1, 0.3, 0.4]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
            </mesh>
            <mesh position={[1, 0.3, -0.4]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
            </mesh>
        </group>
    );
}

// Animated Car Component
export default function AnimatedCar({ type = 'bike', animate = true }) {
    const colors = {
        bike: '#00ff88',
        auto: '#ffd700',
        car: '#4facfe'
    };
    
    return (
        <div style={{ width: '100%', height: '300px' }}>
            <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-5, 5, 5]} intensity={0.5} color="#00ff88" />
                
                {animate ? (
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                        <Car3D color={colors[type] || colors.bike} />
                    </Float>
                ) : (
                    <Car3D color={colors[type] || colors.bike} />
                )}
                
                {/* Ground */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
                </mesh>
            </Canvas>
        </div>
    );
}
