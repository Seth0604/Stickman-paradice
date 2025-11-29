
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export const Beach: React.FC = () => {
  const waterRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
        // Simple wave simulation by moving texture or position
        waterRef.current.position.y = 0.5 + Math.sin(clock.getElapsedTime()) * 0.2;
    }
  });

  return (
    <group position={[0, 0.1, 0]}>
      {/* Sand Base - HUGE 50x50 */}
      <mesh position={[0, 0, 0]} receiveShadow>
         <boxGeometry args={[50, 0.5, 50]} />
         <meshStandardMaterial color="#fcd34d" /> {/* Sand Yellow */}
      </mesh>

      {/* Ocean - Deep Blue */}
      <mesh ref={waterRef} position={[0, 0.5, 15]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[50, 20, 16, 16]} />
         <meshStandardMaterial color="#2563eb" transparent opacity={0.8} wireframe={false} />
      </mesh>

      {/* Shoreline Foam */}
      <mesh position={[0, 0.55, 5]}>
          <boxGeometry args={[50, 0.05, 1]} />
          <meshStandardMaterial color="white" opacity={0.5} transparent />
      </mesh>

      {/* Building Area Markers (Invisible visual guide or decor) */}
      {/* Just some shells or rocks to denote the building area */}
      <mesh position={[-10, 0.3, -10]} castShadow>
          <dodecahedronGeometry args={[0.5]} />
          <meshStandardMaterial color="gray" />
      </mesh>
      <mesh position={[10, 0.3, -5]} castShadow>
          <dodecahedronGeometry args={[0.7]} />
          <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
};
