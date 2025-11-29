
import React, { useMemo } from 'react';

export const Store: React.FC = () => {
  // Store Dimensions
  const width = 24;
  const depth = 20;
  const height = 6;

  // Generate Aisles (Shelves)
  const shelves = useMemo(() => {
      const items = [];
      // 3 Rows of shelves
      for (let x = -6; x <= 6; x += 6) {
          // Shelves run along Z
          items.push({ x, z: -2 });
          items.push({ x, z: 2 });
          items.push({ x, z: 6 });
      }
      return items;
  }, []);

  // Generate Shopping Carts
  const carts = useMemo(() => {
      const items = [];
      for(let i=0; i<5; i++) {
          items.push({ x: -8 + i*1.5, z: -8 });
      }
      return items;
  }, []);

  return (
    <group position={[0, height/2, 0]}>
      {/* Floor */}
      <mesh position={[0, -height/2 + 0.1, 0]} receiveShadow>
         <boxGeometry args={[width, 0.2, depth]} />
         <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Roof */}
      <mesh position={[0, height/2 + 0.1, 0]} castShadow>
         <boxGeometry args={[width + 1, 0.5, depth + 1]} />
         <meshStandardMaterial color="#374151" />
      </mesh>

      {/* --- Walls --- */}
      {/* Back */}
      <mesh position={[0, 0, -depth/2]}>
          <boxGeometry args={[width, height, 0.5]} />
          <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {/* Left */}
      <mesh position={[-width/2, 0, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {/* Right */}
      <mesh position={[width/2, 0, 0]}>
          <boxGeometry args={[0.5, height, depth]} />
          <meshStandardMaterial color="#9ca3af" />
      </mesh>
      {/* Front (Glass) */}
      <mesh position={[0, 0, depth/2]}>
          <boxGeometry args={[width, height, 0.1]} />
          <meshStandardMaterial color="#bfdbfe" opacity={0.3} transparent />
      </mesh>
      
      {/* Sign */}
      <mesh position={[0, height/2 + 1.5, depth/2]} rotation={[0,0,0]}>
           <boxGeometry args={[10, 2, 0.5]} />
           <meshStandardMaterial color="#dc2626" />
      </mesh>
      
      {/* Shelves */}
      {shelves.map((pos, idx) => (
          <group key={idx} position={[pos.x, -height/2 + 1.5, pos.z]}>
              <mesh castShadow>
                  <boxGeometry args={[1, 3, 6]} />
                  <meshStandardMaterial color="#4b5563" />
              </mesh>
              {/* Products */}
              {Array.from({length: 10}).map((_, i) => (
                  <mesh key={i} position={[Math.random() > 0.5 ? 0.55 : -0.55, (Math.random()-0.5)*2, (Math.random()-0.5)*5]}>
                      <boxGeometry args={[0.1, 0.3, 0.3]} />
                      <meshStandardMaterial color={`hsl(${Math.random()*360}, 70%, 50%)`} />
                  </mesh>
              ))}
          </group>
      ))}

      {/* Registers */}
      <group position={[8, -height/2 + 1, -6]}>
           {/* Counter 1 */}
           <mesh position={[0, 0, 0]} castShadow>
               <boxGeometry args={[2, 1.2, 4]} />
               <meshStandardMaterial color="#1f2937" />
           </mesh>
           {/* Register 1 */}
           <mesh position={[0, 0.7, 0]}>
               <boxGeometry args={[0.5, 0.4, 0.5]} />
               <meshStandardMaterial color="white" />
           </mesh>
      </group>
      <group position={[4, -height/2 + 1, -6]}>
           <mesh position={[0, 0, 0]} castShadow>
               <boxGeometry args={[2, 1.2, 4]} />
               <meshStandardMaterial color="#1f2937" />
           </mesh>
           <mesh position={[0, 0.7, 0]}>
               <boxGeometry args={[0.5, 0.4, 0.5]} />
               <meshStandardMaterial color="white" />
           </mesh>
      </group>

      {/* Shopping Carts */}
      {carts.map((pos, idx) => (
          <group key={`cart-${idx}`} position={[pos.x, -height/2 + 0.5, pos.z]}>
              <mesh castShadow>
                  <boxGeometry args={[0.8, 0.6, 1.2]} />
                  <meshStandardMaterial color="silver" wireframe />
              </mesh>
              <mesh position={[0, -0.4, 0.5]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.2]} />
                  <meshStandardMaterial color="black" />
              </mesh>
               <mesh position={[0, -0.4, -0.5]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.2]} />
                  <meshStandardMaterial color="black" />
              </mesh>
          </group>
      ))}
    </group>
  );
};
