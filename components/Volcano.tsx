
import React from 'react';

export const Volcano: React.FC = () => {
  return (
    <group>
      {/* Mountain Base */}
      <mesh position={[0, 10, 0]} castShadow receiveShadow>
         <coneGeometry args={[30, 20, 16, 1, true]} />
         <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      
      {/* Lava Pool */}
      <mesh position={[0, 18, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[5, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={2} />
      </mesh>

      {/* Smoke/Ash Particles (Static Visual) */}
      {Array.from({length: 10}).map((_, i) => (
          <mesh key={i} position={[(Math.random()-0.5)*10, 25 + Math.random()*10, (Math.random()-0.5)*10]}>
              <dodecahedronGeometry args={[1 + Math.random()]} />
              <meshStandardMaterial color="#374151" transparent opacity={0.6} />
          </mesh>
      ))}
    </group>
  );
};
