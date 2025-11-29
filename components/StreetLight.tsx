
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight, MeshBasicMaterial, Mesh, Object3D } from 'three';

interface StreetLightProps {
    isNight: boolean;
}

export const StreetLight: React.FC<StreetLightProps> = ({ isNight }) => {
  const lightRef = useRef<SpotLight>(null);
  const beamRef = useRef<Mesh>(null);

  // Create a target object for the spotlight to point at
  const target = useMemo(() => {
      const obj = new Object3D();
      obj.position.set(1.5, 0, 0); // Directly below the bulb (which is at x=1.5)
      return obj;
  }, []);

  useFrame(() => {
    // Smooth intensity transition for light
    if (lightRef.current) {
        const targetIntensity = isNight ? 40 : 0;
        lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * 0.1;
    }
    
    // Smooth opacity transition for beam visual
    if (beamRef.current) {
        const material = beamRef.current.material as MeshBasicMaterial;
        const targetOpacity = isNight ? 0.3 : 0;
        material.opacity += (targetOpacity - material.opacity) * 0.1;
        beamRef.current.visible = material.opacity > 0.01;
    }
  });

  return (
    <group>
        {/* Add target to the scene graph so the light can track it */}
        <primitive object={target} />

        {/* Pole */}
        <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 6]} />
            <meshStandardMaterial color="#1f2937" />
        </mesh>
        
        {/* Base */}
        <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 0.4]} />
            <meshStandardMaterial color="#111827" />
        </mesh>
        
        {/* Arm */}
        <mesh position={[0.8, 5.5, 0]} rotation={[0, 0, -Math.PI/4]}>
            <cylinderGeometry args={[0.15, 0.15, 2.5]} />
            <meshStandardMaterial color="#1f2937" />
        </mesh>

        {/* Bulb Housing */}
        <mesh position={[1.5, 6.0, 0]}>
            <coneGeometry args={[0.5, 0.6, 8, 1, true]} />
            <meshStandardMaterial color="#374151" side={2} />
        </mesh>

        {/* Bulb (Emissive) */}
        <mesh position={[1.5, 5.9, 0]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial 
                color={isNight ? "#fef3c7" : "#4b5563"} 
                emissive={isNight ? "#f59e0b" : "black"}
                emissiveIntensity={isNight ? 5 : 0}
            />
        </mesh>

        {/* Volumetric Light Beam Visual */}
        <mesh ref={beamRef} position={[1.5, 3.0, 0]}>
            <coneGeometry args={[1.5, 6, 32, 1, true]} />
            <meshBasicMaterial color="#fffbeb" transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Real Light Source */}
        <spotLight
            ref={lightRef}
            position={[1.5, 5.8, 0]}
            target={target}
            angle={0.8}
            penumbra={0.5}
            distance={30}
            decay={1}
            color="#fff7ed"
            castShadow={false} // Keeping false to prevent WebGL max texture error
        />

        {/* Fake Ground Light Patch (Ensures visibility) */}
        {isNight && (
            <mesh position={[1.5, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <circleGeometry args={[4, 32]} />
                <meshBasicMaterial color="#fff7ed" transparent opacity={0.15} depthWrite={false} />
            </mesh>
        )}
    </group>
  );
};
