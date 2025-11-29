
import React from 'react';

export const Arcade: React.FC = () => {
  const width = 16;
  const depth = 16;
  const height = 5;

  return (
    <group position={[0, height/2, 0]}>
      {/* Interior Lights - Brighter for Night Visibility */}
      <pointLight position={[0, 3, 0]} intensity={5} distance={25} color="#ffffff" decay={1} />
      <pointLight position={[0, 2, 4]} intensity={3} distance={15} color="#d946ef" decay={2} />
      <pointLight position={[0, 2, -4]} intensity={3} distance={15} color="#3b82f6" decay={2} />

      {/* Floor - Dark Carpet */}
      <mesh position={[0, -height/2 + 0.1, 0]} receiveShadow>
         <boxGeometry args={[width, 0.2, depth]} />
         <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height/2, 0]} castShadow>
         <boxGeometry args={[width, 0.5, depth]} />
         <meshStandardMaterial color="#312e81" />
      </mesh>
      
      {/* Neon Sign Strip */}
      <mesh position={[0, height/2 + 0.3, depth/2]}>
          <boxGeometry args={[width, 0.2, 0.2]} />
          <meshStandardMaterial color="#f0abfc" emissive="#d946ef" emissiveIntensity={2} />
      </mesh>

      {/* Walls */}
      {/* Back */}
      <mesh position={[0, 0, -depth/2]}>
          <boxGeometry args={[width, height, 0.5]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      {/* Left */}
      <mesh position={[-width/2, 0, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      {/* Right */}
      <mesh position={[width/2, 0, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      {/* Front (Open Entrance) */}
      <mesh position={[-5, 0, depth/2]}>
          <boxGeometry args={[6, height, 0.5]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      <mesh position={[5, 0, depth/2]}>
          <boxGeometry args={[6, height, 0.5]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      <mesh position={[0, 1.5, depth/2]}>
          <boxGeometry args={[4, 2, 0.5]} />
          <meshStandardMaterial color="#1e1b4b" />
      </mesh>

      {/* --- Claw Machines (Left Side) --- */}
      {[-4, 0, 4].map((z, i) => (
          <group key={`claw-${i}`} position={[-6, -height/2 + 1.5, z]}>
              {/* Base */}
              <mesh position={[0, -0.5, 0]} castShadow>
                  <boxGeometry args={[1.5, 1, 1.5]} />
                  <meshStandardMaterial color="#ec4899" />
              </mesh>
              {/* Glass Case */}
              <mesh position={[0, 0.7, 0]}>
                  <boxGeometry args={[1.4, 1.4, 1.4]} />
                  <meshStandardMaterial color="#a5f3fc" opacity={0.3} transparent />
              </mesh>
              {/* Roof */}
              <mesh position={[0, 1.5, 0]}>
                  <boxGeometry args={[1.5, 0.2, 1.5]} />
                  <meshStandardMaterial color="#ec4899" />
              </mesh>
              {/* Controls */}
              <mesh position={[0.4, 0.05, 0.8]}>
                   <sphereGeometry args={[0.1]} />
                   <meshStandardMaterial color="red" />
              </mesh>
              <mesh position={[-0.4, 0.15, 0.8]}>
                   <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                   <meshStandardMaterial color="black" />
              </mesh>
              {/* Claw */}
              <mesh position={[0, 1, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.5]} />
                  <meshStandardMaterial color="silver" />
              </mesh>
              {/* Prize inside */}
              <mesh position={[0, -0.2, 0]}>
                  <sphereGeometry args={[0.3]} />
                  <meshStandardMaterial color="yellow" />
              </mesh>
          </group>
      ))}

      {/* --- Flappy Bird Cabinets (Right Side) --- */}
      {[-4, 0, 4].map((z, i) => (
          <group key={`arcade-${i}`} position={[6, -height/2 + 1.5, z]} rotation={[0, -Math.PI/2, 0]}>
              {/* Cabinet Body */}
              <mesh castShadow>
                  <boxGeometry args={[1.2, 3, 1.2]} />
                  <meshStandardMaterial color="#333" />
              </mesh>
              {/* Screen */}
              <mesh position={[0, 0.5, 0.61]}>
                  <planeGeometry args={[1, 0.8]} />
                  <meshStandardMaterial color="#86efac" emissive="#22c55e" emissiveIntensity={0.5} />
              </mesh>
              {/* Bird on screen */}
              <mesh position={[0, 0.5, 0.62]}>
                  <planeGeometry args={[0.2, 0.2]} />
                  <meshStandardMaterial color="yellow" />
              </mesh>
              {/* Control Panel */}
              <mesh position={[0, -0.2, 0.8]} rotation={[-0.5, 0, 0]}>
                  <boxGeometry args={[1.2, 0.1, 0.6]} />
                  <meshStandardMaterial color="#555" />
              </mesh>
              {/* Joystick */}
              <mesh position={[-0.3, -0.1, 0.9]} rotation={[-0.5, 0, 0]}>
                   <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                   <meshStandardMaterial color="red" />
              </mesh>
              {/* Buttons */}
              <mesh position={[0.3, -0.15, 0.9]} rotation={[-0.5, 0, 0]}>
                   <cylinderGeometry args={[0.05, 0.05, 0.05]} />
                   <meshStandardMaterial color="blue" />
              </mesh>
          </group>
      ))}

      {/* Ticket Machine */}
      <group position={[0, -height/2 + 1, -6]}>
           <mesh>
               <boxGeometry args={[2, 2, 1]} />
               <meshStandardMaterial color="orange" />
           </mesh>
           <mesh position={[0, 0.5, 0.51]}>
               <planeGeometry args={[1.5, 0.5]} />
               <meshStandardMaterial color="black" />
           </mesh>
      </group>

    </group>
  );
};
