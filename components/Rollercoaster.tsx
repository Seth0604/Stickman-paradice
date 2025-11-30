
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, TubeGeometry, Mesh, Group, Matrix4 } from 'three';
import { CoasterState } from '../types';

interface RollercoasterProps {
  coasterRef: React.MutableRefObject<CoasterState>;
  onCrash: (victims: string[]) => void;
}

export const Rollercoaster: React.FC<RollercoasterProps> = ({ coasterRef, onCrash }) => {
  const cartRef = useRef<Group>(null);
  const [progress, setProgress] = useState(0);
  const [isExploding, setIsExploding] = useState(false);

  // Define Track Curve (SCALED UP 3x) and Compute Frames for stability
  const { curve, frames } = useMemo(() => {
    const points = [
      new Vector3(30, 0, 30),
      new Vector3(0, 0, 30),
      new Vector3(-30, 15, 0), // Hill up
      new Vector3(0, 45, -30), // Top of loop
      new Vector3(30, 15, 0), // Down loop
      new Vector3(0, 0, 15), // Bank
      new Vector3(30, 0, 30) // Close loop
    ];
    const c = new CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    // 128 segments matches the TubeGeometry segments
    const f = c.computeFrenetFrames(128, true);
    return { curve: c, frames: f };
  }, []);

  // Create Geometry from curve (Thicker tube)
  const tubeGeo = useMemo(() => {
    return new TubeGeometry(curve, 128, 1.0, 12, true);
  }, [curve]);

  useFrame((state, delta) => {
    const coaster = coasterRef.current;
    
    // --- BOARDING LOGIC ---
    if (coaster.status === 'BOARDING') {
       // Reset Cart Position to Start
       const startPoint = curve.getPointAt(0);
       
       if (cartRef.current) {
            cartRef.current.position.copy(startPoint);
            // Align to start frame
            const t = frames.tangents[0];
            const n = frames.normals[0];
            const b = frames.binormals[0];
            const mat = new Matrix4();
            mat.makeBasis(b, n, t);
            cartRef.current.quaternion.setFromRotationMatrix(mat);
       }
       
       // Update Ref for Stickmen to find
       coaster.cartPosition.copy(startPoint);
       
       // Check if full
       if (coaster.riderIds.length >= 4) {
           coaster.status = 'RUNNING';
           setProgress(0);
       }
    }
    
    // --- RUNNING LOGIC ---
    else if (coaster.status === 'RUNNING') {
        const speed = 0.2 * delta; // Adjusted speed for larger track
        // Varies speed based on height (gravity simulation simple)
        const currentHeight = curve.getPointAt(progress).y;
        const gravityMod = Math.max(0.1, (45 - currentHeight) / 30);
        
        let nextProgress = progress + (speed * gravityMod);
        
        // --- CRASH CHECK ---
        // Check crash at top of loop (approx progress 0.4 - 0.6)
        // 50% Chance
        if (progress < 0.5 && nextProgress >= 0.5) {
             if (Math.random() < 0.50) {
                 coaster.status = 'CRASHED';
                 setIsExploding(true);
                 onCrash([...coaster.riderIds]); // Kill everyone
                 
                 // Reset after 5 seconds
                 setTimeout(() => {
                     coaster.riderIds = [];
                     coaster.status = 'BOARDING';
                     setIsExploding(false);
                     setProgress(0);
                 }, 5000);
                 return;
             }
        }

        if (nextProgress >= 1) {
            nextProgress = 0;
            // Ride Over
            coaster.riderIds = []; // Kick everyone off
            coaster.status = 'BOARDING';
        }

        setProgress(nextProgress);

        // Update Cart Position & Orientation using Frenet Frames
        const point = curve.getPointAt(nextProgress);
        
        // Interpolate or pick nearest frame
        const frameIndex = Math.floor(nextProgress * 128) % 128;
        const t = frames.tangents[frameIndex];
        const n = frames.normals[frameIndex];
        const b = frames.binormals[frameIndex];
        
        if (cartRef.current) {
            cartRef.current.position.copy(point);
            
            // Construct Rotation Matrix basis:
            // Tangent is Forward (Z), Normal is Up (Y), Binormal is Right (X)
            const mat = new Matrix4();
            mat.makeBasis(b, n, t);
            cartRef.current.quaternion.setFromRotationMatrix(mat);
            
            // Sync Ref
            coaster.cartPosition.copy(point);
            // Rough rotation for stickmen to align (Y-only approx)
            coaster.cartRotation = Math.atan2(t.x, t.z);
            
            // Update Matrix for strict attachment
            cartRef.current.updateMatrixWorld();
            coaster.matrix.copy(cartRef.current.matrixWorld);
        }
    }
  });

  return (
    <group position={[0, 0, 0]}>
        {/* Track */}
        <mesh geometry={tubeGeo} castShadow receiveShadow>
            <meshStandardMaterial color="#f0f9ff" />
        </mesh>
        
        {/* Support Pillars (Scaled) */}
        {[0.2, 0.5, 0.8].map((p, i) => {
            const pos = curve.getPointAt(p);
            return (
                <mesh key={i} position={[pos.x, pos.y / 2, pos.z]}>
                    <cylinderGeometry args={[0.5, 1.0, pos.y]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            )
        })}

        {/* The Cart */}
        <group ref={cartRef}>
            {/* Chassis - Larger for 4 seats */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[2.5, 0.5, 6]} />
                <meshStandardMaterial color="red" />
            </mesh>
            
            {/* Seats */}
            {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
                <group key={`seat-${i}`} position={[0, 1.0, z]}>
                    {/* Seat Base */}
                    <mesh position={[0, -0.1, 0]}>
                         <boxGeometry args={[1.5, 0.2, 0.6]} />
                         <meshStandardMaterial color="#333" />
                    </mesh>
                    {/* Seat Back */}
                    <mesh position={[0, 0.2, -0.2]}>
                         <boxGeometry args={[1.5, 0.6, 0.1]} />
                         <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            ))}

            {/* Wheels */}
            <mesh position={[1.3, 0.2, 2]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-1.3, 0.2, 2]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[1.3, 0.2, -2]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-1.3, 0.2, -2]}>
                <sphereGeometry args={[0.4]} />
                <meshStandardMaterial color="black" />
            </mesh>

            {/* Explosion FX */}
            {isExploding && (
                <group>
                     {Array.from({length: 10}).map((_, i) => (
                         <mesh key={i} position={[(Math.random()-0.5)*3, (Math.random())*3, (Math.random()-0.5)*3]}>
                             <dodecahedronGeometry args={[0.5]} />
                             <meshStandardMaterial color="orange" emissive="red" emissiveIntensity={2} />
                         </mesh>
                     ))}
                </group>
            )}
        </group>
        
        {/* Entry Platform */}
        <mesh position={[30, 0.1, 30]}>
            <boxGeometry args={[8, 0.2, 8]} />
            <meshStandardMaterial color="#64748b" />
        </mesh>

        {/* The Line / Queue Visuals */}
        <group position={[34, 0, 34]}>
            {/* Stanchions */}
            {[0, 1.5, 3].map(i => (
                <group key={i}>
                    <mesh position={[0, 0.5, i]}>
                        <cylinderGeometry args={[0.05, 0.05, 1]} />
                        <meshStandardMaterial color="silver" />
                    </mesh>
                    <mesh position={[2, 0.5, i]}>
                        <cylinderGeometry args={[0.05, 0.05, 1]} />
                        <meshStandardMaterial color="silver" />
                    </mesh>
                    {/* Rope */}
                    <mesh position={[1, 0.9, i]}>
                         <boxGeometry args={[2, 0.05, 0.05]} />
                         <meshStandardMaterial color="red" />
                    </mesh>
                </group>
            ))}
        </group>
    </group>
  );
};
