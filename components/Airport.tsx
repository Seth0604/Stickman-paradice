
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils } from 'three';
import { TravelState } from '../types';

interface AirportProps {
    travelState: TravelState;
}

export const Airport: React.FC<AirportProps> = ({ travelState }) => {
    const planeRef = useRef<Group>(null);
    const [animState, setAnimState] = useState<'IDLE' | 'TAKEOFF' | 'LANDING' | 'CRASHED'>('IDLE');
    const animStartTime = useRef(0);

    const { status } = travelState;

    useEffect(() => {
        if (status === 'AWAY') {
            setAnimState('TAKEOFF');
            animStartTime.current = Date.now();
        } else if (status === 'RETURNING') {
            setAnimState('LANDING');
            animStartTime.current = Date.now();
        } else if (status === 'CRASHED') {
            setAnimState('CRASHED');
        } else {
            setAnimState('IDLE');
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
            
            // Phase 1: Taxi/Accelerate (0s - 3s)
            // Phase 2: Lift off (3s - 8s)
            
            if (elapsed < 3) {
                // Accelerate down runway (Starts at Z=10, goes to Z=-40)
                const progress = elapsed / 3;
                const z = 10 - (progress * 50); 
                planeRef.current.position.set(0, 2, z);
                planeRef.current.rotation.set(0, Math.PI, 0); // Facing -Z (down runway)
            } else if (elapsed < 10) {
                // Fly up
                const flyProgress = (elapsed - 3) / 7;
                const z = -40 - (flyProgress * 150);
                const y = 2 + (flyProgress * 80);
                planeRef.current.position.set(0, y, z);
                planeRef.current.rotation.set(-Math.PI / 8, Math.PI, 0); // Tilt up
            } else {
                // Gone
                planeRef.current.visible = false;
            }
        } 
        else if (animState === 'LANDING') {
            // Animate Landing
            const elapsed = (Date.now() - animStartTime.current) / 1000;
            planeRef.current.visible = true;

            // Coming in from high sky (-Z) to Terminal (Z=10)
            if (elapsed < 8) {
                const progress = elapsed / 8;
                // Start: Z=-200, Y=100
                // End: Z=10, Y=2
                const z = -200 + (progress * 210);
                const y = 100 - (progress * 98);
                planeRef.current.position.set(0, y, z);
                planeRef.current.rotation.set(Math.PI / 12, Math.PI, 0); // Tilt down
            } else {
                // Parked
                planeRef.current.position.set(0, 2, 10);
                planeRef.current.rotation.set(0, Math.PI, 0);
            }
        }
        else if (animState === 'CRASHED') {
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
                <mesh position={[0, 3, 0]} castShadow>
                    <boxGeometry args={[12, 6, 20]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-6.1, 2, 0]}>
                     <boxGeometry args={[0.2, 4, 16]} />
                     <meshStandardMaterial color="#bae6fd" opacity={0.5} transparent />
                </mesh>
                <mesh position={[0, 7, 0]}>
                    <boxGeometry args={[10, 2, 16]} />
                    <meshStandardMaterial color="#64748b" />
                </mesh>
                {/* Sign */}
                <mesh position={[-6.2, 5, 0]} rotation={[0, -Math.PI/2, 0]}>
                    <planeGeometry args={[10, 1.5]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>
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

            {/* Wreckage (Only visible if CRASHED) */}
            {animState === 'CRASHED' && (
                <group position={[0, 0, -60]}>
                    <mesh position={[0, 1, 0]}>
                        <dodecahedronGeometry args={[3]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                     <mesh position={[3, 0.5, 2]}>
                        <boxGeometry args={[4, 1, 1]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                     {/* Fire/Smoke Particles placeholder */}
                    {Array.from({length: 10}).map((_, i) => (
                        <mesh key={i} position={[(Math.random()-0.5)*5, Math.random()*5, (Math.random()-0.5)*5]}>
                             <dodecahedronGeometry args={[0.5]} />
                             <meshStandardMaterial color={Math.random()>0.5 ? "orange" : "gray"} />
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
};
