
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import { House } from './House';
import { Stickman } from './Stickman';
import { IceCreamShop } from './IceCreamShop';
import { School } from './School';
import { Park } from './Park';
import { Store } from './Store';
import { Beach } from './Beach'; 
import { Arcade } from './Arcade';
import { Airport } from './Airport';
import { StreetLight } from './StreetLight';
import { HouseData, StickmanData, FurniturePosition, ShopData, SchoolData, ParkData, StoreData, BeachData, ArcadeData, AirportData, TravelState } from '../types';
import { Vector3, DirectionalLight, AmbientLight, Fog } from 'three';
import { HOUSE_WIDTH, HOUSE_DEPTH, GRID_ROWS, GRID_COLS, GRID_SPACING, COLORS, SHOP_POSITION, AIRPORT_POSITION } from '../constants';

interface SceneProps {
  onLog: (msg: string, type: 'normal' | 'alert') => void;
  onTimeUpdate: (time: string, task: string) => void;
}

// --- WASD + QE + Drag-to-Look Camera Control ---
const CameraRig = () => {
    const { camera, gl } = useThree();
    const keys = useRef({ w: false, a: false, s: false, d: false, q: false, e: false });
    const isDragging = useRef(false);

    useEffect(() => {
        // Key Listeners
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keys.current) keys.current[key as keyof typeof keys.current] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keys.current) keys.current[key as keyof typeof keys.current] = false;
        };
        
        // Mouse/Pointer Listeners for "Drag to Look"
        const canvas = gl.domElement;
        
        const handlePointerDown = (e: PointerEvent) => {
            if (e.button === 0) {
                isDragging.current = true;
                canvas.setPointerCapture(e.pointerId);
                canvas.style.cursor = 'grabbing';
            }
        };
        
        const handlePointerUp = (e: PointerEvent) => {
            isDragging.current = false;
            canvas.releasePointerCapture(e.pointerId);
            canvas.style.cursor = 'grab';
        };
        
        const handlePointerMove = (e: PointerEvent) => {
            if (!isDragging.current) return;
            
            const sensitivity = 0.003;
            camera.rotation.y -= e.movementX * sensitivity;
            camera.rotation.x -= e.movementY * sensitivity;
            
            const maxPitch = Math.PI / 2 - 0.1;
            camera.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, camera.rotation.x));
            camera.rotation.z = 0;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointermove', handlePointerMove);
        
        camera.rotation.order = 'YXZ';
        canvas.style.cursor = 'grab';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.style.cursor = 'auto';
        };
    }, [camera, gl]);

    useFrame((state, delta) => {
        const moveSpeed = 25 * delta; 
        
        const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        const up = new Vector3(0, 1, 0);

        const moveVec = new Vector3(0, 0, 0);

        if (keys.current.w) moveVec.add(forward);
        if (keys.current.s) moveVec.sub(forward);
        if (keys.current.d) moveVec.add(right);
        if (keys.current.a) moveVec.sub(right);
        if (keys.current.e) moveVec.add(up); 
        if (keys.current.q) moveVec.sub(up); 

        if (moveVec.length() > 0) {
            moveVec.normalize().multiplyScalar(moveSpeed);
            camera.position.add(moveVec);
        }
    });

    return null;
}

// --- Environment & Time ---
const EnvironmentController = ({ 
    onTimeChange, 
    onTimeUpdate,
    onMinuteChange
}: { 
    onTimeChange: (isNight: boolean) => void,
    onTimeUpdate: (time: string, task: string) => void,
    onMinuteChange: (minute: number) => void
}) => {
    const { scene } = useThree();
    const sunRef = useRef<DirectionalLight>(null);
    const ambientRef = useRef<AmbientLight>(null);
    const [sunPos, setSunPos] = useState(new Vector3(100, 20, 100));
    const [starsFade, setStarsFade] = useState(true);
    const lastMinute = useRef(0);

    useFrame(({ clock }) => {
        const totalSeconds = clock.getElapsedTime();
        const cycleTime = totalSeconds % 360; 
        const currentMinute = Math.floor(cycleTime / 60) + 1;

        // Custom Sun Cycle:
        let isNight = false;
        let sunY = 50;
        let fogColor = "#87ceeb"; // Sky blue

        if (cycleTime < 60 || cycleTime >= 300) {
            // Night
            isNight = true;
            sunY = -20;
            fogColor = "#0f172a"; // Dark slate
        } else if (cycleTime >= 60 && cycleTime < 90) {
            // Dawn
            fogColor = "#fb923c"; // Orange
            sunY = 10;
        } else if (cycleTime >= 270 && cycleTime < 300) {
            // Dusk
            fogColor = "#c084fc"; // Purple
            sunY = 10;
        } else {
            // Day
            isNight = false;
            sunY = 50;
        }

        const radius = 100;
        const dayProgress = (cycleTime - 60) / 240; 
        const sunX = Math.cos(dayProgress * Math.PI) * radius;
        const sunZ = Math.sin(dayProgress * Math.PI) * 20;

        if (Math.floor(totalSeconds) % 2 === 0) {
            setSunPos(new Vector3(sunX, sunY, sunZ));
        }

        onTimeChange(isNight);
        setStarsFade(!isNight);

        // Update Fog
        scene.fog = new Fog(fogColor, 20, 150);

        if (sunRef.current && ambientRef.current) {
            sunRef.current.position.set(sunX, sunY, sunZ);
            sunRef.current.intensity = isNight ? 0 : 1.5; // Brighter sun
            // Change ambient light color based on time
            const ambientColor = isNight ? "#1e293b" : "#ffffff";
            ambientRef.current.color.set(ambientColor);
            ambientRef.current.intensity = isNight ? 0.2 : 0.6;
        }

        // --- Tasks ---
        let task = "Free Time";
        
        if (currentMinute === 1) {
            task = "SLEEPING / WAKING UP";
        } else if (currentMinute === 2) {
            task = "FREE / ARCADE / BEACH / SHOP";
        } else if (currentMinute === 3) {
            task = "SCHOOL / WORK / TRAVEL";
        } else if (currentMinute === 4) {
            task = "FREE TIME";
        } else if (currentMinute === 5) {
            task = "PARK / BEACH / SHOP";
        } else if (currentMinute === 6) {
             task = "SLEEP";
        }

        const timeString = `Minute ${currentMinute}`;
        
        if (currentMinute !== lastMinute.current) {
            lastMinute.current = currentMinute;
            onTimeUpdate(timeString, task);
            onMinuteChange(currentMinute);
        }
    });

    return (
        <>
            <Sky sunPosition={sunPos} inclination={0} azimuth={0.25} turbidity={10} rayleigh={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade={starsFade} />
            
            <ambientLight ref={ambientRef} intensity={0.5} />
            <directionalLight 
                ref={sunRef}
                position={[50, 50, 25]} 
                intensity={1.2} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            >
                <orthographicCamera attach="shadow-camera" args={[-150, 150, 150, -150]} />
            </directionalLight>
        </>
    );
};

// Generates Asphalt Roads and Concrete Sidewalks between grid cells
const CityTerrain: React.FC = () => {
    const roadWidth = 8;
    const blockSize = GRID_SPACING - roadWidth; // Size of the green patch
    const totalWidth = GRID_COLS * GRID_SPACING;
    const totalDepth = GRID_ROWS * GRID_SPACING;

    // We render one massive road plane underneath everything, then small grass squares on top
    return (
        <group position={[0, -0.05, 0]}>
            {/* Main Asphalt Base (The Roads) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#334155" roughness={0.8} /> {/* Slate-700 Asphalt */}
            </mesh>

            {/* Grass Blocks (The Properties) */}
            {Array.from({ length: GRID_ROWS }).map((_, r) => (
                Array.from({ length: GRID_COLS }).map((_, c) => {
                    const x = -((GRID_COLS - 1) * GRID_SPACING) / 2 + c * GRID_SPACING;
                    const z = -((GRID_ROWS - 1) * GRID_SPACING) / 2 + r * GRID_SPACING;
                    
                    // Sidewalk (Concrete)
                    const sidewalkSize = blockSize + 2; 
                    
                    return (
                        <group key={`${r}-${c}`} position={[x, 0.01, z]}>
                             {/* Sidewalk */}
                             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                                <planeGeometry args={[sidewalkSize, sidewalkSize]} />
                                <meshStandardMaterial color="#94a3b8" roughness={0.6} /> {/* Light Gray Concrete */}
                             </mesh>
                             {/* Grass */}
                             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                                <planeGeometry args={[blockSize, blockSize]} />
                                <meshStandardMaterial color="#4ade80" roughness={1} /> {/* Vibrant Grass */}
                             </mesh>
                        </group>
                    )
                })
            ))}
        </group>
    )
}

export const Scene: React.FC<SceneProps> = ({ onLog, onTimeUpdate }) => {
  const [isNight, setIsNight] = useState(false);
  const [deadHouseIds, setDeadHouseIds] = useState<Set<string>>(new Set());
  
  // World State (Using State now to support Job Reassignment)
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [stickmen, setStickmen] = useState<StickmanData[]>([]);
  
  // Static Buildings
  const shopData = useMemo<ShopData>(() => ({
    position: new Vector3(...SHOP_POSITION),
    entryPoint: new Vector3(SHOP_POSITION[0], 0, SHOP_POSITION[2] + 4)
  }), []);

  const schoolData = useMemo<SchoolData>(() => ({
      position: new Vector3(-((GRID_COLS - 1) * GRID_SPACING) / 2, 0, -((GRID_ROWS - 1) * GRID_SPACING) / 2),
      entryPoint: new Vector3(-((GRID_COLS - 1) * GRID_SPACING) / 2, 0, -((GRID_ROWS - 1) * GRID_SPACING) / 2),
      teacherPos: new Vector3(-((GRID_COLS - 1) * GRID_SPACING) / 2, 0, -((GRID_ROWS - 1) * GRID_SPACING) / 2 - 7)
  }), []);

  const parkData = useMemo<ParkData>(() => ({
      position: new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING),
      entryPoint: new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING - 4)
  }), []);

  const storeData = useMemo<StoreData>(() => ({
      position: new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2)),
      entryPoint: new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) + 10),
      registers: [
          new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING + 8, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) - 5),
          new Vector3((-((GRID_COLS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING + 4, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) - 5)
      ]
  }), []);

  const beachData = useMemo<BeachData>(() => {
      const beachPosVec = new Vector3(-((GRID_COLS - 1) * GRID_SPACING) / 2 - 30, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING + 30);
      const buildingSpots: Vector3[] = [];
      const spotStartX = beachPosVec.x - 10;
      const spotStartZ = beachPosVec.z - 10;
      for(let r=0; r<9; r++) {
          for(let c=0; c<9; c++) {
              buildingSpots.push(new Vector3(spotStartX + c * 2.5, 0, spotStartZ + r * 2.5));
          }
      }
      return {
          position: beachPosVec,
          entryPoint: new Vector3(beachPosVec.x, 0, beachPosVec.z),
          buildingSpots
      };
  }, []);

  const arcadeData = useMemo<ArcadeData>(() => {
      const arcadePosVec = new Vector3(-((GRID_COLS - 1) * GRID_SPACING) / 2, 0, (-((GRID_ROWS - 1) * GRID_SPACING) / 2) + 4 * GRID_SPACING);
      return {
        position: arcadePosVec,
        entryPoint: new Vector3(arcadePosVec.x, 0, arcadePosVec.z + 6),
        clawMachines: [
            new Vector3(arcadePosVec.x - 6, 0, arcadePosVec.z - 4),
            new Vector3(arcadePosVec.x - 6, 0, arcadePosVec.z),
            new Vector3(arcadePosVec.x - 6, 0, arcadePosVec.z + 4)
        ],
        gameCabinets: [
            new Vector3(arcadePosVec.x + 5, 0, arcadePosVec.z - 4),
            new Vector3(arcadePosVec.x + 5, 0, arcadePosVec.z),
            new Vector3(arcadePosVec.x + 5, 0, arcadePosVec.z + 4)
        ]
      };
  }, []);

  const airportData = useMemo<AirportData>(() => {
      const airportPosVec = new Vector3(...AIRPORT_POSITION);
      return {
        position: airportPosVec,
        terminalPos: new Vector3(airportPosVec.x + 15, 0, airportPosVec.z + 10),
        runwayStart: new Vector3(airportPosVec.x, 0, airportPosVec.z - 20)
      }
  }, []);


  // Initial World Generation
  useEffect(() => {
    const _houses: HouseData[] = [];
    const _stickmen: StickmanData[] = [];

    const startX = -((GRID_COLS - 1) * GRID_SPACING) / 2;
    const startZ = -((GRID_ROWS - 1) * GRID_SPACING) / 2;

    const teacherHouseIndex = Math.floor(Math.random() * 25);
    const cashierIndexes = [
        (teacherHouseIndex + 1) % 25,
        (teacherHouseIndex + 2) % 25
    ];

    let houseCount = 0;
    
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            
            const x = startX + c * GRID_SPACING;
            const z = startZ + r * GRID_SPACING;

            // Reserve spots for special buildings
            if (r === 2 && c === 2) continue; // Shop
            if (r === 0 && c === 0) continue; // School
            if (r === 4 && c === 4) continue; // Park
            if (r === 0 && c === 4) continue; // Store
            if (r === 4 && c === 0) continue; // Arcade

            const houseId = `house-${houseCount}`;
            const color = COLORS[houseCount % COLORS.length];

            const bedPos1 = new Vector3(x - HOUSE_WIDTH/2 + 2, 1, z - HOUSE_DEPTH/2 + 2);
            const bedPos2 = new Vector3(x + HOUSE_WIDTH/2 - 2, 1, z - HOUSE_DEPTH/2 + 2);
            const couchPos = new Vector3(x + HOUSE_WIDTH/2 - 1.5, 1, z);
            const couchRot = -Math.PI / 2;
            const tvPos = new Vector3(x - HOUSE_WIDTH/2 + 0.8, 1, z);
            const tvRot = Math.PI / 2;
            const cornerPos = new Vector3(x - HOUSE_WIDTH/2 + 1, 0, z - HOUSE_DEPTH/2 + 1);

            const furniture: FurniturePosition[] = [
                { type: 'BED', position: bedPos1 },
                { type: 'BED', position: bedPos2 }, 
                { type: 'COUCH', position: couchPos, rotation: couchRot },
                { type: 'TV', position: tvPos, rotation: tvRot },
                { type: 'CORNER', position: cornerPos }
            ];

            _houses.push({
                id: houseId,
                position: [x, 0, z],
                color,
                furniture
            });

            let parentJob: 'TEACHER' | 'CASHIER' | undefined = undefined;
            if (houseCount === teacherHouseIndex) parentJob = 'TEACHER';
            if (cashierIndexes.includes(houseCount)) parentJob = 'CASHIER';

            _stickmen.push({
                id: `parent-${houseCount}`,
                role: 'PARENT',
                color: '#333333', 
                homeId: houseId,
                job: parentJob
            });

            _stickmen.push({
                id: `child-${houseCount}`,
                role: 'CHILD',
                color: color, 
                homeId: houseId
            });

            houseCount++;
        }
    }
    setHouses(_houses);
    setStickmen(_stickmen);
  }, []);

  // Street Lights Generation
  const streetLights = useMemo(() => {
    const lights: Vector3[] = [];
    const startX = -((GRID_COLS - 1) * GRID_SPACING) / 2;
    const startZ = -((GRID_ROWS - 1) * GRID_SPACING) / 2;
    
    // Add lights at intersections but offset slightly
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const x = startX + c * GRID_SPACING;
            const z = startZ + r * GRID_SPACING;
            // Place light at street corner (approx midway between grid centers)
            lights.push(new Vector3(x + GRID_SPACING/2, 0, z + GRID_SPACING/2));
        }
    }
    return lights;
  }, []);

  
  // Travel State
  const [travelState, setTravelState] = useState<TravelState>({
      status: 'IDLE',
      travelerHouseId: null,
      flightProgress: 0
  });

  const handleMinuteChange = (minute: number) => {
      // TRAVEL LOGIC
      // Minute 2: Boarding Call (Select Family)
      if (minute === 2) {
          if (travelState.status === 'IDLE' || travelState.status === 'RETURNING' || travelState.status === 'CRASHED') {
             // Find valid houses (not dead)
             const validHouses = houses.filter(h => !deadHouseIds.has(h.id));
             if (validHouses.length > 0) {
                 const randomHouse = validHouses[Math.floor(Math.random() * validHouses.length)];
                 onLog(`Family from ${randomHouse.id} is heading to the airport!`, 'normal');
                 
                 // --- JOB REASSIGNMENT LOGIC ---
                 const travelerParent = stickmen.find(s => s.homeId === randomHouse.id && s.role === 'PARENT');
                 if (travelerParent && travelerParent.job) {
                     const jobToReassign = travelerParent.job;
                     onLog(`Alert: ${travelerParent.job} is going on vacation. Finding replacement...`, 'alert');

                     // Find replacement (Parent, no job, not traveling, not dead)
                     const candidates = stickmen.filter(s => 
                        s.role === 'PARENT' && 
                        !s.job && 
                        s.homeId !== randomHouse.id && 
                        !deadHouseIds.has(s.homeId)
                     );

                     if (candidates.length > 0) {
                         const replacement = candidates[Math.floor(Math.random() * candidates.length)];
                         onLog(`Hired ${replacement.id} as new ${jobToReassign}.`, 'normal');
                         
                         // Update Stickmen State
                         setStickmen(prev => prev.map(s => {
                             if (s.id === travelerParent.id) return { ...s, job: undefined };
                             if (s.id === replacement.id) return { ...s, job: jobToReassign };
                             return s;
                         }));
                     } else {
                         onLog("No replacements found! Store/School might be closed.", "alert");
                          setStickmen(prev => prev.map(s => {
                             if (s.id === travelerParent.id) return { ...s, job: undefined };
                             return s;
                         }));
                     }
                 }
                 // -----------------------------

                 setTravelState({
                     status: 'BOARDING',
                     travelerHouseId: randomHouse.id,
                     flightProgress: 0
                 });
             }
          }
      }
      
      // Minute 3: Take Off
      if (minute === 3) {
          if (travelState.status === 'BOARDING') {
              // 5% Crash Chance
              const crashed = Math.random() < 0.05;
              if (crashed) {
                  onLog("BREAKING NEWS: A plane has crashed! There are no survivors.", "alert");
                  setTravelState(prev => ({ ...prev, status: 'CRASHED' }));
                  setDeadHouseIds(prev => new Set(prev).add(travelState.travelerHouseId!));
              } else {
                  onLog("Flight 747 has departed safely.", "normal");
                  setTravelState(prev => ({ ...prev, status: 'AWAY' }));
              }
          }
      }

      // Minute 1: Landing (Return)
      if (minute === 1) {
          if (travelState.status === 'AWAY') {
              onLog("Flight 747 has landed. Welcome home!", "normal");
              setTravelState(prev => ({ ...prev, status: 'RETURNING' }));
              
              // After a delay, reset to IDLE so they are picked up next time or logic resets
              setTimeout(() => {
                  setTravelState({ status: 'IDLE', travelerHouseId: null, flightProgress: 0 });
              }, 10000); 
          }
      }
  };

  return (
    <Canvas shadows camera={{ position: [0, 60, 80], fov: 45 }}>
      <EnvironmentController 
        onTimeChange={setIsNight} 
        onTimeUpdate={onTimeUpdate} 
        onMinuteChange={handleMinuteChange}
      />
      <CameraRig />

      {/* City Terrain (Roads and Grass) */}
      <CityTerrain />

      {/* Street Lights */}
      {streetLights.map((pos, i) => (
          <group key={`sl-${i}`} position={[pos.x, 0, pos.z]}>
              <StreetLight isNight={isNight} />
          </group>
      ))}

      {/* Buildings */}
      <IceCreamShop />
      <group position={[schoolData.position.x, 0, schoolData.position.z]}>
         <School />
      </group>
      <group position={[parkData.position.x, 0, parkData.position.z]}>
         <Park />
      </group>
      <group position={[storeData.position.x, 0, storeData.position.z]}>
         <Store />
      </group>
      <group position={[beachData.position.x, 0, beachData.position.z]}>
         <Beach />
      </group>
      <group position={[arcadeData.position.x, 0, arcadeData.position.z]}>
         <Arcade />
      </group>
      <group position={[airportData.position.x, 0, airportData.position.z]}>
         <Airport travelState={travelState} />
      </group>

      {houses.map(house => (
        <House key={house.id} data={house} isNight={isNight} />
      ))}

      {stickmen.map(sm => {
         // Filter out dead stickmen
         if (deadHouseIds.has(sm.homeId)) return null;

         const home = houses.find(h => h.id === sm.homeId)!;
         return (
            <Stickman 
                key={sm.id} 
                {...sm} 
                home={home} 
                shop={shopData} 
                school={schoolData}
                park={parkData}
                store={storeData}
                beach={beachData}
                arcade={arcadeData}
                airport={airportData}
                isNight={isNight}
                travelState={travelState}
                onLog={onLog} 
            />
         );
      })}
    </Canvas>
  );
};
