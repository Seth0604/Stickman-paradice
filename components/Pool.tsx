
import React from 'react';

export const Pool: React.FC = () => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Deck */}
      <mesh position={[0, 0, 0]} receiveShadow>
         <boxGeometry args={[20, 0.5, 20]} />
         <meshStandardMaterial color="#d1d5db" /> {/* Concrete */}
      </mesh>

      {/* Water */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <planeGeometry args={[16, 16]} />
         <meshStandardMaterial color="#3b82f6" transparent opacity={0.8} />
      </mesh>

      {/* Pool Basin Walls (Visual fake depth) */}
      <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[16, 1, 16]} />
          <meshStandardMaterial color="#60a5fa" />
      </mesh>

      {/* Diving Board */}
      <group position={[0, 0.5, -9]}>
          <mesh position={[0, 0.5, 1]}>
              <boxGeometry args={[2, 0.1, 4]} />
              <meshStandardMaterial color="#fef08a" />
          </mesh>
          <mesh position={[0, 0, 2.5]}>
              <cylinderGeometry args={[0.2, 0.2, 1]} />
              <meshStandardMaterial color="gray" />
          </mesh>
      </group>

      {/* Ladder */}
      <group position={[7, 1, 7]}>
           <mesh position={[0, 0, 0]}>
               <boxGeometry args={[0.1, 2, 0.1]} />
               <meshStandardMaterial color="silver" />
           </mesh>
           <mesh position={[-1, 0, 0]}>
               <boxGeometry args={[0.1, 2, 0.1]} />
               <meshStandardMaterial color="silver" />
           </mesh>
      </group>
    </group>
  );
};
