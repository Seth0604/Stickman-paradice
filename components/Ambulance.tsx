
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { AmbulanceState } from '../types';

interface AmbulanceProps {
    state: AmbulanceState;
    hospitalPos: Vector3;
    onArriveAtScene: () => void;
    onArriveAtHospital: () => void;
}

export const Ambulance: React.FC<AmbulanceProps> = ({ state, hospitalPos, onArriveAtScene, onArriveAtHospital }) => {
    const group = useRef<Group>(null);
    const [currentPos, setCurrentPos] = useState(hospitalPos.clone());
    
    // Siren Lights
    const [flash, setFlash] = useState(false);

    useFrame(({ clock }, delta) => {
        if (!group.current) return;

        // Flash lights only when active
        if (state.status !== 'IDLE') {
             if (Math.floor(clock.getElapsedTime() * 10) % 2 === 0) {
                setFlash(true);
            } else {
                setFlash(false);
            }
        } else {
            setFlash(false);
        }

        const speed = 40 * delta; // Fast

        if (state.status === 'IDLE') {
             // Parked position
             group.current.position.copy(hospitalPos);
             group.current.rotation.y = Math.PI; // Face out
             return;
        }

        let target: Vector3 | null = null;
        if (state.status === 'DISPATCHED' && state.targetPos) {
            target = state.targetPos;
        } else if (state.status === 'RETURNING') {
            target = hospitalPos;
        }

        if (target) {
            const direction = new Vector3().subVectors(target, currentPos);
            const dist = direction.length();

            if (dist > 1.0) {
                direction.normalize().multiplyScalar(speed);
                currentPos.add(direction);
                group.current.position.copy(currentPos);
                group.current.lookAt(target);
            } else {
                // Arrived
                if (state.status === 'DISPATCHED') {
                    onArriveAtScene();
                } else if (state.status === 'RETURNING') {
                    onArriveAtHospital();
                }
            }
        }
    });

    return (
        <group ref={group}>
            {/* Body */}
            <mesh position={[0, 1.2, 0]} castShadow>
                <boxGeometry args={[2.5, 2.0, 5]} />
                <meshStandardMaterial color="white" />
            </mesh>
            {/* Cab */}
            <mesh position={[0, 1.0, 3]}>
                <boxGeometry args={[2.4, 1.6, 1.5]} />
                <meshStandardMaterial color="white" />
            </mesh>
            
            {/* Red Stripes */}
            <mesh position={[0, 1.2, 0]}>
                 <boxGeometry args={[2.55, 0.4, 4.5]} />
                 <meshStandardMaterial color="#ef4444" />
            </mesh>
            {/* Red Cross Top */}
            <group position={[0, 2.21, -0.5]} rotation={[-Math.PI/2, 0, 0]}>
                <mesh>
                    <boxGeometry args={[0.5, 1.5, 0.1]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
                <mesh>
                    <boxGeometry args={[1.5, 0.5, 0.1]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
            </group>

            {/* Windows */}
            <mesh position={[0, 1.2, 3.5]}>
                <boxGeometry args={[2.3, 0.8, 0.6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>

            {/* Wheels */}
            {[[-1.3, 2], [1.3, 2], [-1.3, -1.5], [1.3, -1.5]].map((pos, i) => (
                <mesh key={i} position={[pos[0], 0.4, pos[1]]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            ))}

            {/* Siren Lights */}
            <mesh position={[-0.8, 2.3, 2.5]}>
                <boxGeometry args={[0.4, 0.2, 0.4]} />
                <meshStandardMaterial 
                    color="red" 
                    emissive="red" 
                    emissiveIntensity={flash ? 2 : 0} 
                />
            </mesh>
            <mesh position={[0.8, 2.3, 2.5]}>
                <boxGeometry args={[0.4, 0.2, 0.4]} />
                <meshStandardMaterial 
                    color="blue" 
                    emissive="blue" 
                    emissiveIntensity={!flash ? 2 : 0} 
                />
            </mesh>
        </group>
    );
};
