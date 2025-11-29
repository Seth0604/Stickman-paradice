
import React, { useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';

// Logic to get exact desk world position based on School position and Index
export const getSchoolDeskPosition = (schoolPos: Vector3, index: number): Vector3 => {
    // 25 desks (5x5)
    const row = Math.floor(index / 5);
    const col = index % 5;
    
    const localX = -6 + (col * 3.0);
    const localZ = -4 + (row * 2.5);

    // Target slightly behind desk to sit on chair (Z + 0.75)
    return new Vector3(
        schoolPos.x + localX,
        0, // Y handled by Stickman
        schoolPos.z + localZ + 0.75
    );
};

export const School: React.FC = () => {
  const wallColor = "#b91c1c";
  const floorColor = "#9ca3af";
  
  const width = 20;
  const depth = 20;
  const halfW = width / 2; 
  const halfD = depth / 2; 

  const desks = [];
  for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
          const x = -6 + (c * 3.0); 
          const z = -4 + (r * 2.5); 
          desks.push({ x, z });
      }
  }

  // Toggle text
  const [textOption, setTextOption] = useState(0);
  useEffect(() => {
      const interval = setInterval(() => {
          setTextOption(prev => (prev + 1) % 2);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
  }, []);

  return (
    <group position={[0, 3, 0]}>
      {/* Floor */}
      <mesh position={[0, -3, 0]} receiveShadow>
         <boxGeometry args={[width, 0.2, depth]} />
         <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Roof - Pyramid matches square base */}
      <mesh position={[0, 7, 0]} castShadow rotation={[0, Math.PI/4, 0]}>
         <coneGeometry args={[16, 6, 4]} />
         <meshStandardMaterial color="#475569" /> 
      </mesh>

      {/* --- Walls (Hollow Inside) --- */}

      {/* Back Wall */}
      <mesh position={[0, 0, -halfD]} castShadow receiveShadow>
         <boxGeometry args={[width, 6, 0.2]} />
         <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Left Wall */}
      <group position={[-halfW, 0, 0]}>
          <mesh position={[0, -2, 0]}>
               <boxGeometry args={[0.2, 2, depth]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[0, 2, 0]}>
               <boxGeometry args={[0.2, 2, depth]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
          {[1,2,3].map(i => (
             <mesh key={i} position={[0, 0, -halfD + (i * (depth/4))]}>
                <boxGeometry args={[0.2, 2, 1]} />
                <meshStandardMaterial color={wallColor} />
             </mesh>
          ))}
          <mesh position={[0, 0, -halfD]}>
               <boxGeometry args={[0.2, 2, 1]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[0, 0, halfD]}>
               <boxGeometry args={[0.2, 2, 1]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
      </group>

      {/* Right Wall */}
      <group position={[halfW, 0, 0]}>
          <mesh position={[0, 0, 0]}>
               <boxGeometry args={[0.2, 6, depth]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
      </group>

      {/* Front Frame (Open) */}
      <group position={[0, 0, halfD]}>
          <mesh position={[-6, 0, 0]}>
               <boxGeometry args={[width - 12, 6, 0.2]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[6, 0, 0]}>
               <boxGeometry args={[width - 12, 6, 0.2]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[0, 2, 0]}>
               <boxGeometry args={[12, 2, 0.2]} />
               <meshStandardMaterial color={wallColor} />
          </mesh>
      </group>

      {/* --- Interior --- */}

      {/* Chalkboard */}
      <mesh position={[0, 1, -halfD + 0.2]}>
          <boxGeometry args={[10, 2.5, 0.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      
      {/* Chalkboard Text */}
      <group position={[0, 1, -halfD + 0.3]}>
        <Text
            fontSize={0.8}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
        >
            {textOption === 0 ? "2 + 2 = 4" : "Get out your\nLanguage Art"}
        </Text>
      </group>

      {/* Chalk Tray */}
      <mesh position={[0, -0.3, -halfD + 0.25]}>
          <boxGeometry args={[10, 0.1, 0.2]} />
          <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Teacher Desk */}
      <mesh position={[0, -2, -halfD + 3]} castShadow>
          <boxGeometry args={[3, 1, 1.2]} />
          <meshStandardMaterial color="#78350f" />
      </mesh>

      {/* Student Desks (Rows) */}
      {desks.map((pos, idx) => (
          <group key={idx} position={[pos.x, -2.2, pos.z]}>
                {/* Desk */}
                <mesh castShadow>
                    <boxGeometry args={[1.6, 0.8, 0.8]} />
                    <meshStandardMaterial color="#d97706" />
                </mesh>
                {/* Chair */}
                <mesh position={[0, -0.2, 0.6]} castShadow>
                    <boxGeometry args={[0.6, 0.6, 0.6]} />
                    <meshStandardMaterial color="#78350f" />
                </mesh>
            </group>
      ))}

      {/* Exterior Clock */}
      <group position={[0, 3.5, halfD + 0.1]}>
         <mesh>
             <circleGeometry args={[1.5, 16]} />
             <meshStandardMaterial color="white" />
         </mesh>
         <mesh position={[0, 0, 0.05]} rotation={[0, 0, 0.5]}>
             <boxGeometry args={[0.2, 1.1, 0.05]} />
             <meshStandardMaterial color="black" />
         </mesh>
         <mesh position={[0, 0, 0.05]} rotation={[0, 0, -1]}>
             <boxGeometry args={[0.2, 0.8, 0.05]} />
             <meshStandardMaterial color="black" />
         </mesh>
      </group>

      {/* Sign */}
      <mesh position={[0, 2, halfD + 0.1]}>
          <planeGeometry args={[5, 1.2]} />
          <meshStandardMaterial color="#fef08a" />
      </mesh>
    </group>
  );
};
