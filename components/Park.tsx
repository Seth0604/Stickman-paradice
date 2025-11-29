import React from 'react';

export const Park: React.FC = () => {
  return (
    <group>
      {/* Green Patch */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
         <boxGeometry args={[12, 0.2, 12]} />
         <meshStandardMaterial color="#4ade80" />
      </mesh>

      {/* Tree 1 */}
      <group position={[-3, 0, -3]}>
         <mesh position={[0, 1.5, 0]} castShadow>
             <cylinderGeometry args={[0.3, 0.4, 3]} />
             <meshStandardMaterial color="#5c3a21" />
         </mesh>
         <mesh position={[0, 3, 0]} castShadow>
             <dodecahedronGeometry args={[1.5]} />
             <meshStandardMaterial color="#15803d" />
         </mesh>
      </group>

      {/* Tree 2 */}
      <group position={[4, 0, 2]}>
         <mesh position={[0, 1, 0]} castShadow>
             <cylinderGeometry args={[0.2, 0.3, 2]} />
             <meshStandardMaterial color="#5c3a21" />
         </mesh>
         <mesh position={[0, 2, 0]} castShadow>
             <dodecahedronGeometry args={[1.2]} />
             <meshStandardMaterial color="#166534" />
         </mesh>
      </group>

      {/* Slide */}
      <group position={[1, 0, -2]}>
          {/* Ladder */}
          <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[0.5, 3, 0.1]} />
              <meshStandardMaterial color="gray" />
          </mesh>
          {/* Ramp */}
          <mesh position={[0, 1.4, 1.5]} rotation={[Math.PI/4, 0, 0]}>
              <boxGeometry args={[0.6, 4, 0.1]} />
              <meshStandardMaterial color="red" />
          </mesh>
      </group>
      
      {/* Sandbox */}
      <mesh position={[-2, 0.2, 3]}>
          <boxGeometry args={[3, 0.4, 3]} />
          <meshStandardMaterial color="#d4a373" />
      </mesh>
    </group>
  );
};