
import React from 'react';

export const Island: React.FC = () => {
  return (
    <group>
      {/* Water Base */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
         <cylinderGeometry args={[60, 60, 4, 32]} />
         <meshStandardMaterial color="#0ea5e9" transparent opacity={0.8} />
      </mesh>

      {/* Sand Island */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
         <cylinderGeometry args={[40, 45, 2, 32]} />
         <meshStandardMaterial color="#fcd34d" />
      </mesh>

      {/* Hotel */}
      <group position={[0, 1.5, -20]}>
          <mesh castShadow>
              <boxGeometry args={[30, 15, 10]} />
              <meshStandardMaterial color="white" />
          </mesh>
          {/* Windows */}
          {Array.from({length: 4}).map((_, i) => (
             <mesh key={i} position={[0, -4 + i*3, 5.1]}>
                 <boxGeometry args={[25, 1.5, 0.1]} />
                 <meshStandardMaterial color="#38bdf8" />
             </mesh>
          ))}
          {/* Sign */}
          <mesh position={[0, 8, 5.1]}>
              <boxGeometry args={[15, 2, 0.5]} />
              <meshStandardMaterial color="#f43f5e" />
          </mesh>
      </group>

      {/* Palm Trees */}
      {[[-15, 10], [15, 10], [-20, 0], [20, 0]].map((pos, i) => (
          <group key={i} position={[pos[0], 1.5, pos[1]]}>
              <mesh position={[0, 3, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.4, 6]} />
                  <meshStandardMaterial color="#78350f" />
              </mesh>
              <mesh position={[0, 6, 0]} castShadow>
                  <dodecahedronGeometry args={[2]} />
                  <meshStandardMaterial color="#16a34a" />
              </mesh>
          </group>
      ))}

      {/* Sunbeds */}
      {[[-5, 5], [0, 5], [5, 5]].map((pos, i) => (
          <group key={`bed-${i}`} position={[pos[0], 1.6, pos[1]]}>
              <mesh rotation={[-0.2, 0, 0]} castShadow>
                  <boxGeometry args={[3, 0.2, 6]} />
                  <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0.1, -2]} rotation={[0.5, 0, 0]}>
                  <boxGeometry args={[3, 0.2, 2]} />
                  <meshStandardMaterial color="white" />
              </mesh>
          </group>
      ))}
    </group>
  );
};
