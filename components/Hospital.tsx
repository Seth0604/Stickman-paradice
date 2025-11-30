
import React from 'react';
import { HospitalData } from '../types';

export const Hospital: React.FC<{ data: HospitalData }> = ({ data }) => {
  const { position } = data;
  const width = 16;
  const depth = 12;
  const height = 6;
  
  return (
    <group position={position}>
      {/* Floor - Checkered */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
         <boxGeometry args={[width, 0.2, depth]} />
         <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      {/* Checkered Tiles Visual */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[width-1, depth-1]} />
          <meshStandardMaterial color="#f3f4f6" opacity={0.5} transparent />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height + 0.1, 0]} castShadow>
          <boxGeometry args={[width + 1, 0.5, depth + 1]} />
          <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      
      {/* Sign */}
      <group position={[0, height + 1.5, depth/2]}>
           <mesh>
               <boxGeometry args={[10, 2, 0.2]} />
               <meshStandardMaterial color="white" />
           </mesh>
           <mesh position={[0, 0, 0.15]}>
                <boxGeometry args={[1, 1.4, 0.1]} />
                <meshStandardMaterial color="red" />
           </mesh>
           <mesh position={[0, 0, 0.15]}>
                <boxGeometry args={[1.4, 1, 0.1]} />
                <meshStandardMaterial color="red" />
           </mesh>
      </group>

      {/* Walls */}
      {/* Back Wall */}
      <mesh position={[0, height/2, -depth/2]}>
          <boxGeometry args={[width, height, 0.5]} />
          <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-width/2, height/2, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {/* Right Wall */}
      <mesh position={[width/2, height/2, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      {/* Front Frame (Glass Center) */}
      <group position={[0, height/2, depth/2]}>
          <mesh position={[-width/4 - 2, 0, 0]}>
              <boxGeometry args={[width/2 - 4, height, 0.5]} />
              <meshStandardMaterial color="#f1f5f9" />
          </mesh>
          <mesh position={[width/4 + 2, 0, 0]}>
              <boxGeometry args={[width/2 - 4, height, 0.5]} />
              <meshStandardMaterial color="#f1f5f9" />
          </mesh>
          <mesh position={[0, height/2 - 1, 0]}>
              <boxGeometry args={[8, 2, 0.5]} />
              <meshStandardMaterial color="#f1f5f9" />
          </mesh>
          {/* Glass */}
          <mesh position={[0, -1, 0]}>
              <boxGeometry args={[8, 4, 0.1]} />
              <meshStandardMaterial color="#bfdbfe" opacity={0.3} transparent />
          </mesh>
      </group>

      {/* Reception Desk */}
      <group position={[-4, 0, 3]}>
          <mesh position={[0, 1, 0]}>
              <boxGeometry args={[2, 1.2, 1]} />
              <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[2.2, 0.1, 1.2]} />
              <meshStandardMaterial color="white" />
          </mesh>
          {/* Computer */}
          <mesh position={[0, 1.8, 0.2]}>
              <boxGeometry args={[0.6, 0.5, 0.1]} />
              <meshStandardMaterial color="black" />
          </mesh>
      </group>

      {/* Interior Beds (Matches Scene Data logic roughly) */}
      {data.beds.map((bedPos, i) => (
          // Rotate 0 so Headboard (at local -0.9) faces -Z (Back Wall)
          <group key={i} position={[bedPos.x - position.x, 0.5, bedPos.z - position.z]} rotation={[0, 0, 0]}>
              {/* Bed Frame */}
              <mesh castShadow>
                  <boxGeometry args={[1.5, 0.5, 2.5]} />
                  <meshStandardMaterial color="white" />
              </mesh>
              {/* Pillow */}
              <mesh position={[0, 0.35, -0.9]}>
                   <boxGeometry args={[1.2, 0.2, 0.5]} />
                   <meshStandardMaterial color="#bae6fd" />
              </mesh>
              {/* Medical Monitor */}
              <group position={[1.2, 0.5, -0.5]} rotation={[0, -0.5, 0]}>
                   <mesh position={[0, 1, 0]}>
                        <boxGeometry args={[0.1, 2, 0.1]} />
                        <meshStandardMaterial color="silver" />
                   </mesh>
                   <mesh position={[0, 1.5, 0.2]}>
                        <boxGeometry args={[0.6, 0.5, 0.2]} />
                        <meshStandardMaterial color="#1e293b" />
                   </mesh>
                   <mesh position={[0, 1.5, 0.31]}>
                        <planeGeometry args={[0.5, 0.4]} />
                        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
                   </mesh>
              </group>
          </group>
      ))}
    </group>
  );
};
