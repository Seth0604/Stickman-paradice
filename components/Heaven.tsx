
import React from 'react';

export const Heaven: React.FC = () => {
  return (
    <group>
      {/* Cloud Floor */}
      {Array.from({length: 20}).map((_, i) => (
          <mesh 
            key={i} 
            position={[
                (Math.random() - 0.5) * 60, 
                (Math.random() - 0.5) * 5, 
                (Math.random() - 0.5) * 60
            ]}
          >
              <sphereGeometry args={[5 + Math.random() * 5, 16, 16]} />
              <meshStandardMaterial color="white" transparent opacity={0.6} />
          </mesh>
      ))}

      {/* Golden Gate */}
      <group position={[0, 5, -20]}>
          <mesh position={[-8, 5, 0]}>
              <cylinderGeometry args={[1, 1, 10]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[8, 5, 0]}>
              <cylinderGeometry args={[1, 1, 10]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Arch */}
          <mesh position={[0, 10, 0]} rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[1, 1, 16]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Bars */}
          {[-6, -4, -2, 0, 2, 4, 6].map((x, i) => (
               <mesh key={i} position={[x, 5, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 10]} />
                  <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
               </mesh>
          ))}
      </group>
      
      {/* Light */}
      <pointLight position={[0, 20, 0]} intensity={2} color="#fef08a" distance={100} />
    </group>
  );
};
