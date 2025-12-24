import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Animated 3D Sphere with enhanced visuals
function AnimatedSphere({ position, color, speed }) {
    const meshRef = useRef();
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * speed;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.5;
        }
    });
    
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <Sphere ref={meshRef} args={[1, 64, 64]} position={position} castShadow receiveShadow>
                <MeshDistortMaterial
                    color={color}
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
            </Sphere>
        </Float>
    );
}

// Particle System
function Particles({ count = 100 }) {
    const points = useRef();
    
    const particlesPosition = React.useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        return positions;
    }, [count]);
    
    useFrame((state) => {
        points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    });
    
    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.05}
                color="#00ff88"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

// Main Animated Background Component with advanced effects
export default function AnimatedBackground({ variant = 'default' }) {
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
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        }}>
            <Canvas 
                camera={{ position: [0, 0, 8], fov: 75 }}
                shadows
                dpr={[1, 2]}
                gl={{ 
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance"
                }}
            >
                {/* Enhanced Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight 
                    position={[10, 10, 5]} 
                    intensity={1.2} 
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-10, -10, -5]} intensity={0.6} color="#00ff88" />
                <spotLight 
                    position={[0, 10, 0]} 
                    intensity={0.5} 
                    angle={0.3} 
                    penumbra={1}
                    castShadow
                />
                
                {/* Fog for depth */}
                <fog attach="fog" args={['#16213e', 5, 20]} />
                
                {/* Stars background */}
                <Stars 
                    radius={100} 
                    depth={50} 
                    count={5000} 
                    factor={4} 
                    saturation={0} 
                    fade 
                    speed={1}
                />
                
                {/* Animated Spheres */}
                {selectedColors.map((color, index) => (
                    <AnimatedSphere
                        key={index}
                        position={[
                            Math.cos(index * 2) * 3,
                            Math.sin(index * 2) * 3,
                            -2
                        ]}
                        color={color}
                        speed={0.2 + index * 0.1}
                    />
                ))}
                
                {/* Particle System */}
                <Particles count={200} />
                
                {/* Environment for reflections */}
                <Environment preset="night" />
                
                {/* Controls with subtle auto-rotation */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.3}
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>
        </div>
    );
}
