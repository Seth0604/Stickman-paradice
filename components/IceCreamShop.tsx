
import React from 'react';
import { Text } from '@react-three/drei';

export const IceCreamShop: React.FC = () => {
  return (
    <group position={[0, 2, 0]}>
      {/* Base */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4, 4, 4, 8]} />
        <meshStandardMaterial color="#fce7f3" /> {/* Light pink */}
      </mesh>

      {/* Roof / Cone */}
      <mesh position={[0, 3.5, 0]} castShadow>
         <coneGeometry args={[4.5, 3, 8]} />
         <meshStandardMaterial color="#ec4899" /> {/* Darker pink */}
      </mesh>

      {/* Giant Ice Cream Cone Sign */}
      <group position={[0, 6, 0]} rotation={[0, 0, 0.2]}>
         <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="white" />
         </mesh>
         <mesh position={[0, -0.5, 0]}>
            <coneGeometry args={[0.8, 2, 16]} />
            <meshStandardMaterial color="#d4a373" />
         </mesh>
      </group>

      {/* Sign Text */}
      <group position={[0, 3.5, 3.5]}>
        <Text
            color="#be185d" // Pink-700
            anchorX="center"
            anchorY="middle"
            fontSize={0.8}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            outlineWidth={0.05}
            outlineColor="white"
        >
            ICE CREAM
        </Text>
      </group>

      {/* Counter Window */}
      <mesh position={[0, 0, 2.1]}>
        <boxGeometry args={[3, 1.5, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.8, 2.1]}>
        <planeGeometry args={[2.8, 1]} />
        <meshStandardMaterial color="#black" />
      </mesh>
    </group>
  );
};
