
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils, Color } from 'three';
import { TravelState } from '../types';

interface AirportProps {
    travelState: TravelState;
}

// Simple Particle System for Explosion
const ExplosionParticles: React.FC<{ active: boolean }> = ({ active }) => {
    const group = useRef<Group>(null);
    // Generate random particle data
    const particles = useMemo(() => {
        return new Array(40).fill(0).map(() => ({
            velocity: new Vector3((Math.random() - 0.5) * 15, Math.random() * 15, (Math.random() - 0.5) * 15),
            offset: new Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2),
            color: Math.random() > 0.5 ? '#ef4444' : '#f97316', // Red or Orange
            scale: Math.random() * 1.5 + 0.5,
            rotationSpeed: Math.random() * 5
        }));
    }, []);

    useFrame((state, delta) => {
        if (!group.current || !active) return;
        
        group.current.children.forEach((child, i) => {
            // Map the child index to the particle data index.
            // The first 40 children are fire particles.
            // The next 10 children are smoke particles (reusing data from the first 10).
            const dataIndex = i < particles.length ? i : i - particles.length;
            const data = particles[dataIndex];

            if (!data) return;

            // Move
            child.position.add(data.velocity.clone().multiplyScalar(delta));
            // Gravity
            data.velocity.y -= 20 * delta; 
            if (child.position.y < 0) {
                 child.position.y = 0;
                 data.velocity.x *= 0.5;
                 data.velocity.z *= 0.5;
            }
            
            // Fade/Shrink
            child.scale.multiplyScalar(0.95);
            child.rotation.x += data.rotationSpeed * delta;
            child.rotation.y += data.rotationSpeed * delta;
        });
    });

    if (!active) return null;

    return (
        <group ref={group} position={[0, 0, -50]}> {/* Impact Zone */}
            {particles.map((p, i) => (
                <mesh key={i} position={p.offset}>
                    <dodecahedronGeometry args={[p.scale, 0]} />
                    <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={2} />
                </mesh>
            ))}
             {/* Smoke */}
             {particles.slice(0, 10).map((p, i) => (
                <mesh key={`smoke-${i}`} position={p.offset.clone().add(new Vector3(0,2,0))}>
                    <dodecahedronGeometry args={[p.scale * 2, 0]} />
                    <meshStandardMaterial color="#555" transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
};

export const Airport: React.FC<AirportProps> = ({ travelState }) => {
    const planeRef = useRef<Group>(null);
    const [animState, setAnimState] = useState<'IDLE' | 'TAKEOFF' | 'LANDING' | 'CRASHING' | 'WRECKAGE'>('IDLE');
    const animStartTime = useRef(0);
    const [showExplosion, setShowExplosion] = useState(false);

    const { status } = travelState;

    useEffect(() => {
        if (status === 'AWAY') {
            setAnimState('TAKEOFF');
            animStartTime.current = Date.now();
            setShowExplosion(false);
        } else if (status === 'RETURNING') {
            setAnimState('LANDING');
            animStartTime.current = Date.now();
            setShowExplosion(false);
        } else if (status === 'CRASHED') {
            setAnimState('CRASHING');
            animStartTime.current = Date.now();
            setShowExplosion(false);
        } else {
            setAnimState('IDLE');
            setShowExplosion(false);
        }
    }, [status]);

    useFrame(() => {
        if (!planeRef.current) return;

        if (animState === 'IDLE') {
            // Parked
            planeRef.current.position.set(0, 2, 10);
            planeRef.current.rotation.set(0, Math.PI, 0);
            planeRef.current.visible = true;
        } 
        else if (animState === 'TAKEOFF') {
            // Animate Takeoff
            const elapsed = (Date.now() - animStartTime.current) / 1000;
            planeRef.current.visible = true;
            
            if (elapsed < 3) {
                // Accelerate down runway
                const progress = elapsed / 3;
                const z = 10 - (progress * 50); 
                planeRef.current.position.set(0, 2, z);
                planeRef.current.rotation.set(0, Math.PI, 0); 
            } else if (elapsed < 10) {
                // Fly up
                const flyProgress = (elapsed - 3) / 7;
                const z = -40 - (flyProgress * 150);
                const y = 2 + (flyProgress * 80);
                planeRef.current.position.set(0, y, z);
                planeRef.current.rotation.set(-Math.PI / 8, Math.PI, 0); // Tilt up
            } else {
                planeRef.current.visible = false;
            }
        } 
        else if (animState === 'LANDING') {
            // Animate Landing
            const elapsed = (Date.now() - animStartTime.current) / 1000;
            planeRef.current.visible = true;

            if (elapsed < 8) {
                const progress = elapsed / 8;
                const z = -200 + (progress * 210);
                const y = 100 - (progress * 98);
                planeRef.current.position.set(0, y, z);
                planeRef.current.rotation.set(Math.PI / 12, Math.PI, 0); // Tilt down
            } else {
                planeRef.current.position.set(0, 2, 10);
                planeRef.current.rotation.set(0, Math.PI, 0);
            }
        }
        else if (animState === 'CRASHING') {
            const elapsed = (Date.now() - animStartTime.current) / 1000;
            planeRef.current.visible = true;

            // Phase 1: Rapid Climb / Stall (0s - 2s)
            if (elapsed < 2) {
                const progress = elapsed / 2;
                // Move forward and up aggressively
                const z = 10 - (progress * 40);
                const y = 2 + (progress * 30);
                
                planeRef.current.position.set(0, y, z);
                // Pitch up severely (Stall)
                planeRef.current.rotation.set(-Math.PI / 3 * progress, Math.PI, 0);
                // Shake
                planeRef.current.position.x = (Math.random() - 0.5) * 0.5;
            }
            // Phase 2: Spin Dive (2s - 3.5s)
            else if (elapsed < 3.5) {
                const progress = (elapsed - 2) / 1.5;
                // Fall towards ground
                const startY = 32;
                const startZ = -30;
                
                const y = MathUtils.lerp(startY, 0, progress); // Hit ground at 0
                const z = startZ - (progress * 20); // Continue momentum
                
                planeRef.current.position.set(0, y, z);
                
                // Spin Logic
                planeRef.current.rotation.x += 0.05; // Nose down tumble
                planeRef.current.rotation.z += 0.2; // Spiral roll
            }
            // Phase 3: Impact (3.5s)
            else {
                planeRef.current.visible = false;
                setAnimState('WRECKAGE');
                setShowExplosion(true);
            }
        }
        else if (animState === 'WRECKAGE') {
             planeRef.current.visible = false;
        }
    });

    return (
        <group position={[0, 0.1, 0]}>
            {/* Giant Floodlight on Tower */}
            <group position={[-10, 18, 10]}>
                <spotLight 
                    position={[0, 0, 0]} 
                    target-position={[0, 0, -50]}
                    angle={0.5} 
                    penumbra={0.5} 
                    intensity={20} 
                    color="#fff" 
                    castShadow 
                    distance={200}
                />
                {/* Light Beam Visual */}
                <mesh position={[0, -5, -15]} rotation={[Math.PI/2.5, 0, 0]}>
                     <coneGeometry args={[2, 40, 32, 1, true]} />
                     <meshBasicMaterial color="white" opacity={0.1} transparent depthWrite={false} />
                </mesh>
            </group>

            {/* Runway - Long Asphalt Strip */}
            <mesh position={[0, 0, -40]} receiveShadow rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[15, 140]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Runway Markings */}
            <mesh position={[0, 0.05, -40]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[0.5, 120]} />
                <meshStandardMaterial color="white" />
            </mesh>
            {/* Threshold Stripes */}
            {[-1, 0, 1].map(i => (
                <mesh key={i} position={[i * 2, 0.06, 20]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[1, 5]} />
                    <meshStandardMaterial color="white" />
                </mesh>
            ))}

            {/* Terminal Building */}
            <group position={[18, 0, 10]}>
                {/* Roof */}
                <mesh position={[0, 7, 0]}>
                    <boxGeometry args={[12, 1, 16]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
                {/* Floor */}
                <mesh position={[0, 0.1, 0]} receiveShadow>
                     <boxGeometry args={[12, 0.2, 16]} />
                     <meshStandardMaterial color="#e2e8f0" />
                </mesh>
                {/* Back Wall */}
                <mesh position={[6, 3.5, 0]}>
                     <boxGeometry args={[0.2, 6, 16]} />
                     <meshStandardMaterial color="#94a3b8" />
                </mesh>
                {/* Side Walls */}
                <mesh position={[0, 3.5, 8]}>
                     <boxGeometry args={[12, 6, 0.2]} />
                     <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0, 3.5, -8]}>
                     <boxGeometry args={[12, 6, 0.2]} />
                     <meshStandardMaterial color="#94a3b8" />
                </mesh>
                {/* Pillars (Open Front) */}
                <mesh position={[-5.8, 3.5, 7.8]}>
                     <boxGeometry args={[0.4, 7, 0.4]} />
                     <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[-5.8, 3.5, -7.8]}>
                     <boxGeometry args={[0.4, 7, 0.4]} />
                     <meshStandardMaterial color="#334155" />
                </mesh>
                
                {/* Sign */}
                <mesh position={[-6.2, 5, 0]} rotation={[0, -Math.PI/2, 0]}>
                    <planeGeometry args={[10, 1.5]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>

                {/* --- Interior Infrastructure --- */}
                
                {/* Check-in Desk (Front Left) */}
                <group position={[-4, 0, 6]}>
                    <mesh position={[0, 1, 0]}>
                        <boxGeometry args={[2, 1.2, 1]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    {/* Scale */}
                    <mesh position={[0.5, 0.1, -0.6]}>
                        <boxGeometry args={[1, 0.1, 1]} />
                        <meshStandardMaterial color="silver" />
                    </mesh>
                </group>

                {/* Security Scanner (Front Right) */}
                <group position={[4, 0, 4]}>
                    {/* Archway */}
                    <mesh position={[0, 2, 0]}>
                         <boxGeometry args={[0.2, 4, 3]} />
                         <meshStandardMaterial color="#333" />
                    </mesh>
                    <mesh position={[0, 2, 0]}>
                         <boxGeometry args={[0.3, 3.5, 2]} />
                         <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                    {/* X-Ray Belt */}
                    <mesh position={[2, 0.8, 0]}>
                         <boxGeometry args={[2, 0.8, 3]} />
                         <meshStandardMaterial color="#475569" />
                    </mesh>
                    <mesh position={[2, 0.8, 0]}>
                         <boxGeometry args={[2.2, 0.9, 2.8]} />
                         <meshStandardMaterial color="black" />
                    </mesh>
                </group>

                 {/* Seating / Gate Area (Back) */}
                 <group position={[0, 0, -4]}>
                     <mesh position={[0, 0.4, 0]}>
                         <boxGeometry args={[8, 0.4, 1]} />
                         <meshStandardMaterial color="#1e40af" />
                     </mesh>
                 </group>
            </group>

            {/* Control Tower */}
            <group position={[-10, 0, 10]}>
                <mesh position={[0, 8, 0]} castShadow>
                    <cylinderGeometry args={[1.5, 2, 16]} />
                    <meshStandardMaterial color="#cbd5e1" />
                </mesh>
                <mesh position={[0, 17, 0]}>
                    <cylinderGeometry args={[2.5, 1.5, 2]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                {/* Windows */}
                <mesh position={[0, 17, 0]}>
                    <cylinderGeometry args={[2.6, 2.6, 1.5, 8]} />
                    <meshStandardMaterial color="#bae6fd" opacity={0.6} transparent />
                </mesh>
                {/* Antenna */}
                <mesh position={[0, 19, 0]}>
                     <cylinderGeometry args={[0.1, 0.1, 4]} />
                     <meshStandardMaterial color="red" />
                </mesh>
                <mesh position={[0, 21, 0]}>
                     <sphereGeometry args={[0.3]} />
                     <meshBasicMaterial color="red" />
                </mesh>
            </group>

            {/* Airplane */}
            <group ref={planeRef} position={[0, 2, 10]}>
                {/* Fuselage (Rotated Horizontal) */}
                <group rotation={[0, 0, 0]}>
                    <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                        <capsuleGeometry args={[1, 8, 4, 16]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    
                    {/* Cockpit */}
                    <mesh position={[0, 0.5, 2.5]}>
                        <boxGeometry args={[1.2, 0.8, 1.5]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>

                    {/* Wings */}
                    <mesh position={[0, 0, 0.5]}>
                        <boxGeometry args={[14, 0.2, 3]} />
                        <meshStandardMaterial color="#cbd5e1" />
                    </mesh>

                    {/* Tail Horizontal */}
                    <mesh position={[0, 0.5, -3.5]}>
                        <boxGeometry args={[5, 0.2, 2]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                    
                    {/* Tail Vertical */}
                    <mesh position={[0, 1.5, -3.5]}>
                        <boxGeometry args={[0.2, 3, 2]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>

                    {/* Engines */}
                    <mesh position={[3, -0.6, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 2]} />
                        <meshStandardMaterial color="#64748b" />
                    </mesh>
                    <mesh position={[-3, -0.6, 0.5]} rotation={[Math.PI/2, 0, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 2]} />
                        <meshStandardMaterial color="#64748b" />
                    </mesh>
                </group>
            </group>

            {/* Explosion Particles */}
            <ExplosionParticles active={showExplosion} />

            {/* Wreckage (Only visible if CRASHED and impacted) */}
            {animState === 'WRECKAGE' && (
                <group position={[0, 0, -50]}>
                    <mesh position={[0, 1, 0]} rotation={[0.5, 0.5, 0]}>
                        <dodecahedronGeometry args={[3]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                     <mesh position={[4, 0.5, 2]} rotation={[0, 0.2, 0.5]}>
                        <boxGeometry args={[4, 1, 1]} />
                        <meshStandardMaterial color="#1f2937" />
                    </mesh>
                    <mesh position={[-3, 0.5, -3]} rotation={[0.2, 0, -0.5]}>
                        <boxGeometry args={[3, 0.5, 5]} />
                        <meshStandardMaterial color="#ef4444" />
                    </mesh>
                </group>
            )}
        </group>
    );
};
