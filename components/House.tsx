
import React, { useMemo } from 'react';
import { HouseData } from '../types';
import { HOUSE_WIDTH, HOUSE_HEIGHT, HOUSE_DEPTH } from '../constants';

interface HouseProps {
  data: HouseData;
  isNight?: boolean;
}

const Bed = ({ color }: { color: string }) => (
    <group>
        {/* Legs */}
        <mesh position={[-0.5, 0.1, -0.9]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.2]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh position={[0.5, 0.1, -0.9]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.2]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh position={[-0.5, 0.1, 0.9]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.2]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh position={[0.5, 0.1, 0.9]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.2]} /><meshStandardMaterial color="#5c3a21" /></mesh>

        {/* Frame */}
        <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.3, 0.15, 2.1]} />
            <meshStandardMaterial color="#78350f" />
        </mesh>

        {/* Mattress */}
        <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.2, 0.2, 2.0]} />
            <meshStandardMaterial color="white" />
        </mesh>

        {/* Pillow */}
        <mesh position={[0, 0.55, -0.75]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[1.0, 0.15, 0.4]} />
            <meshStandardMaterial color="#e2e8f0" />
        </mesh>

        {/* Blanket */}
        <mesh position={[0, 0.46, 0.2]}>
            <boxGeometry args={[1.22, 0.15, 1.6]} />
            <meshStandardMaterial color={color} />
        </mesh>
    </group>
);

const Couch = () => (
    <group>
        {/* Legs */}
        <mesh position={[-0.9, 0.1, -0.3]}><cylinderGeometry args={[0.06, 0.04, 0.2]} /><meshStandardMaterial color="#374151" /></mesh>
        <mesh position={[0.9, 0.1, -0.3]}><cylinderGeometry args={[0.06, 0.04, 0.2]} /><meshStandardMaterial color="#374151" /></mesh>
        <mesh position={[-0.9, 0.1, 0.3]}><cylinderGeometry args={[0.06, 0.04, 0.2]} /><meshStandardMaterial color="#374151" /></mesh>
        <mesh position={[0.9, 0.1, 0.3]}><cylinderGeometry args={[0.06, 0.04, 0.2]} /><meshStandardMaterial color="#374151" /></mesh>

        {/* Base */}
        <mesh position={[0, 0.3, 0]} castShadow>
             <boxGeometry args={[2.0, 0.3, 0.8]} />
             <meshStandardMaterial color="#4b5563" />
        </mesh>

        {/* Seat Cushions */}
        <mesh position={[-0.45, 0.5, 0.1]}>
             <boxGeometry args={[0.85, 0.15, 0.7]} />
             <meshStandardMaterial color="#6b7280" />
        </mesh>
        <mesh position={[0.45, 0.5, 0.1]}>
             <boxGeometry args={[0.85, 0.15, 0.7]} />
             <meshStandardMaterial color="#6b7280" />
        </mesh>

        {/* Backrest */}
        <mesh position={[0, 0.65, -0.3]}>
             <boxGeometry args={[2.0, 0.6, 0.2]} />
             <meshStandardMaterial color="#374151" />
        </mesh>

        {/* Armrests */}
        <mesh position={[0.9, 0.5, 0]}>
             <boxGeometry args={[0.2, 0.4, 0.8]} />
             <meshStandardMaterial color="#374151" />
        </mesh>
        <mesh position={[-0.9, 0.5, 0]}>
             <boxGeometry args={[0.2, 0.4, 0.8]} />
             <meshStandardMaterial color="#374151" />
        </mesh>
    </group>
);

const TV = () => (
    <group>
        {/* Stand */}
        <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.8, 0.4, 0.3]} />
            <meshStandardMaterial color="#1f2937" />
        </mesh>
        <mesh position={[0, 0.4, 0]} castShadow>
             <cylinderGeometry args={[0.05, 0.05, 0.2]} />
             <meshStandardMaterial color="#1f2937" />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[1.5, 0.9, 0.1]} />
            <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Display Area */}
        <mesh position={[0, 0.8, 0.06]}>
            <planeGeometry args={[1.4, 0.8]} />
            <meshStandardMaterial color="black" roughness={0.2} />
        </mesh>
    </group>
);

export const House: React.FC<HouseProps> = ({ data, isNight }) => {
  const { position, color, furniture } = data;
  const [x, y, z] = position;

  // Wall configuration
  const wallThickness = 0.2;
  const halfWidth = HOUSE_WIDTH / 2;
  const halfDepth = HOUSE_DEPTH / 2;
  const halfHeight = HOUSE_HEIGHT / 2;
  
  // Floor Y level
  // Local floor top is -halfHeight + 0.2. 
  const floorY = -halfHeight + 0.2; 

  // Door Configuration
  const doorWidth = 1.0;
  // Calculate wall panel widths to leave exactly `doorWidth` gap in the middle
  const sidePanelWidth = (HOUSE_WIDTH - doorWidth) / 2; 
  // Center of left panel
  const leftPanelX = -halfWidth + (sidePanelWidth / 2);
  // Center of right panel
  const rightPanelX = halfWidth - (sidePanelWidth / 2);
  
  const windowMaterial = isNight 
    ? <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={0.5} />
    : <meshStandardMaterial color="#bfdbfe" opacity={0.3} transparent />;

  return (
    <group position={[x, y + halfHeight, z]}>
      {/* Floor */}
      <mesh position={[0, -halfHeight + 0.1, 0]} receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, 0.2, HOUSE_DEPTH]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Roof - Hip Roof */}
      <mesh position={[0, halfHeight + 1.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0, HOUSE_WIDTH * 0.85, 2.5, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* --- WALLS --- */}
      
      {/* Back Wall (Solid) */}
      <mesh position={[0, 0, -halfDepth + wallThickness/2]} receiveShadow castShadow>
          <boxGeometry args={[HOUSE_WIDTH, HOUSE_HEIGHT, wallThickness]} />
          <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Left Wall (With Window) */}
      <group position={[-halfWidth + wallThickness/2, 0, 0]}>
          {/* Frame */}
          <group>
            <mesh position={[0, -1.25, 0]}>
                <boxGeometry args={[wallThickness, HOUSE_HEIGHT/2, HOUSE_DEPTH]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <mesh position={[0, 1.25, 0]}>
                <boxGeometry args={[wallThickness, HOUSE_HEIGHT/2 - 1, HOUSE_DEPTH]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <mesh position={[0, 0, -1.5]}>
                <boxGeometry args={[wallThickness, 1, HOUSE_DEPTH/2 + 0.5]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
            <mesh position={[0, 0, 1.5]}>
                <boxGeometry args={[wallThickness, 1, HOUSE_DEPTH/2 + 0.5]} />
                <meshStandardMaterial color="#f3f4f6" />
            </mesh>
          </group>
          {/* Glass/Window Pane */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[wallThickness/2, 1.5, 2]} />
            {windowMaterial}
          </mesh>
      </group>

      {/* Right Wall (Solid) */}
       <mesh position={[halfWidth - wallThickness/2, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallThickness, HOUSE_HEIGHT, HOUSE_DEPTH]} />
          <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Front Wall (With Door Gap) */}
      <group position={[0, 0, halfDepth - wallThickness/2]}>
          {/* Left Panel */}
          <mesh position={[leftPanelX, 0, 0]}>
              <boxGeometry args={[sidePanelWidth, HOUSE_HEIGHT, wallThickness]} />
              <meshStandardMaterial color="#f3f4f6" />
          </mesh>
          {/* Right Panel */}
          <mesh position={[rightPanelX, 0, 0]}>
              <boxGeometry args={[sidePanelWidth, HOUSE_HEIGHT, wallThickness]} />
              <meshStandardMaterial color="#f3f4f6" />
          </mesh>
          {/* Top Panel (Lintel) */}
          <mesh position={[0, 1, 0]}>
              <boxGeometry args={[doorWidth, HOUSE_HEIGHT - 2, wallThickness]} />
              <meshStandardMaterial color="#f3f4f6" />
          </mesh>
      </group>

      {/* Door (Open) - Hinged at the left side of the gap */}
      <group position={[-0.5, -halfHeight + 1.05, halfDepth - 0.1]} rotation={[0, -Math.PI / 2.5, 0]}>
          {/* Door Mesh offset so it rotates around the hinge group */}
          <mesh position={[0.5, 0, 0]}>
              <boxGeometry args={[1.0, 1.9, 0.1]} />
              <meshStandardMaterial color="#78350f" />
              <mesh position={[0.3, 0, 0.1]}>
                  <sphereGeometry args={[0.05]} />
                  <meshStandardMaterial color="gold" />
              </mesh>
          </mesh>
      </group>

      {/* Corner Pillars */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map((corner, i) => (
          <mesh key={i} position={[corner[0] * (HOUSE_WIDTH/2 - 0.1), 0, corner[1] * (HOUSE_DEPTH/2 - 0.1)]}>
              <boxGeometry args={[0.4, HOUSE_HEIGHT + 0.1, 0.4]} />
              <meshStandardMaterial color="#374151" />
          </mesh>
      ))}

      {/* Furniture */}
      {furniture.map((item, idx) => {
        const localX = item.position.x - x;
        const localZ = item.position.z - z;
        const rot = item.rotation || 0;

        if (item.type === 'BED') {
            return (
                <group key={idx} position={[localX, floorY, localZ]} rotation={[0, rot, 0]}>
                    <Bed color={color} />
                </group>
            )
        }
        if (item.type === 'COUCH') {
            return (
                <group key={idx} position={[localX, floorY, localZ]} rotation={[0, rot, 0]}>
                    <Couch />
                </group>
            )
        }
        if (item.type === 'TV') {
            return (
                <group key={idx} position={[localX, floorY, localZ]} rotation={[0, rot, 0]}>
                    <TV />
                </group>
            )
        }
        return null;
      })}
    </group>
  );
};
