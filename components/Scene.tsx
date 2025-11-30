
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
import { Island } from './Island';
import { Heaven } from './Heaven';
import { Rollercoaster } from './Rollercoaster';
import { Hospital } from './Hospital';
import { Ambulance } from './Ambulance';
import { Volcano } from './Volcano';
import { HouseData, StickmanData, FurniturePosition, ShopData, SchoolData, ParkData, StoreData, BeachData, ArcadeData, AirportData, TravelState, CoasterState, RollercoasterData, HospitalData, ActionState, AmbulanceState } from '../types';
import { Vector3, DirectionalLight, AmbientLight, Fog, Matrix4 } from 'three';
import { HOUSE_WIDTH, HOUSE_DEPTH, GRID_ROWS, GRID_COLS, GRID_SPACING, COLORS, SHOP_POSITION, AIRPORT_POSITION, ISLAND_POSITION, HEAVEN_POSITION, VOLCANO_POSITION } from '../constants';

interface SceneProps {
  onLog: (msg: string, type: 'normal' | 'alert' | 'success') => void;
  onTimeUpdate: (time: string, task: string) => void;
  warpTrigger: { minute: number, id: number } | null;
  teleportTarget: Vector3 | null;
}

// --- WASD + QE + Drag-to-Look Camera Control ---
const CameraRig = ({ teleportTarget }: { teleportTarget: Vector3 | null }) => {
    const { camera, gl } = useThree();
    const keys = useRef({ w: false, a: false, s: false, d: false, q: false, e: false });
    const isDragging = useRef(false);

    // Handle Teleportation
    useEffect(() => {
        if (teleportTarget) {
            camera.position.set(teleportTarget.x, teleportTarget.y + 60, teleportTarget.z + 80);
            camera.rotation.set(0, 0, 0); // Reset rotation to look somewhat down/forward
        }
    }, [teleportTarget, camera]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keys.current) keys.current[key as keyof typeof keys.current] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keys.current) keys.current[key as keyof typeof keys.current] = false;
        };
        
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

const EnvironmentController = ({ 
    onTimeChange, 
    onTimeUpdate,
    onMinuteChange,
    warpTrigger,
    timeOffset
}: { 
    onTimeChange: (isNight: boolean) => void,
    onTimeUpdate: (time: string, task: string) => void,
    onMinuteChange: (minute: number) => void,
    warpTrigger: { minute: number, id: number } | null,
    timeOffset: React.MutableRefObject<number>
}) => {
    const { scene } = useThree();
    const sunRef = useRef<DirectionalLight>(null);
    const ambientRef = useRef<AmbientLight>(null);
    const [sunPos, setSunPos] = useState(new Vector3(100, 20, 100));
    const [starsFade, setStarsFade] = useState(true);
    const lastMinute = useRef(0);
    const lastWarpId = useRef(0);

    useFrame(({ clock }) => {
        if (warpTrigger && warpTrigger.id !== lastWarpId.current) {
            lastWarpId.current = warpTrigger.id;
            const currentRaw = clock.getElapsedTime() + timeOffset.current;
            const currentCycle = currentRaw % 360;
            const targetCycle = (warpTrigger.minute - 1) * 60 + 1; // +1s buffer
            
            const diff = targetCycle - currentCycle;
            timeOffset.current += diff;
            lastMinute.current = -1; 
        }

        const totalSeconds = clock.getElapsedTime() + timeOffset.current;
        const cycleTime = ((totalSeconds % 360) + 360) % 360; 
        const currentMinute = Math.floor(cycleTime / 60) + 1;

        let isNight = false;
        let sunY = 50;
        let fogColor = "#87ceeb"; 

        if (cycleTime < 60 || cycleTime >= 300) {
            isNight = true;
            sunY = -20;
            fogColor = "#0f172a"; 
        } else if (cycleTime >= 60 && cycleTime < 90) {
            fogColor = "#fb923c";
            sunY = 10;
        } else if (cycleTime >= 270 && cycleTime < 300) {
            fogColor = "#c084fc"; 
            sunY = 10;
        } else {
            isNight = false;
            sunY = 50;
        }

        const radius = 100;
        const dayProgress = (cycleTime - 60) / 240; 
        const sunX = Math.cos(dayProgress * Math.PI) * radius;
        const sunZ = Math.sin(dayProgress * Math.PI) * 20;

        if (Math.floor(totalSeconds) % 2 === 0 || lastMinute.current === -1) {
            setSunPos(new Vector3(sunX, sunY, sunZ));
            if (sunRef.current) sunRef.current.position.set(sunX, sunY, sunZ);
        }

        if (currentMinute !== lastMinute.current) {
            onTimeChange(isNight);
            setStarsFade(!isNight);
            
            scene.fog = new Fog(fogColor, 20, 250);

            if (sunRef.current && ambientRef.current) {
                sunRef.current.intensity = isNight ? 0 : 1.5; 
                const ambientColor = isNight ? "#1e293b" : "#ffffff";
                ambientRef.current.color.set(ambientColor);
                ambientRef.current.intensity = isNight ? 0.2 : 0.6;
            }

            let task = "Free Time";
            if (currentMinute === 1) task = "HOSPITAL CHECK / WAKING UP";
            else if (currentMinute === 2) task = "FREE / ARCADE / BEACH / SHOP";
            else if (currentMinute === 3) task = "SCHOOL / WORK / TRAVEL";
            else if (currentMinute === 4) task = "FREE TIME";
            else if (currentMinute === 5) task = "PARK / BEACH / SHOP";
            else if (currentMinute === 6) task = "SLEEP";

            const timeString = `Minute ${currentMinute}`;
            
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

const CityTerrain: React.FC = () => {
    const roadWidth = 8;
    const blockSize = GRID_SPACING - roadWidth;
    
    return (
        <group position={[0, -0.05, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>

            {Array.from({ length: GRID_ROWS }).map((_, r) => (
                Array.from({ length: GRID_COLS }).map((_, c) => {
                    const x = -((GRID_COLS - 1) * GRID_SPACING) / 2 + c * GRID_SPACING;
                    const z = -((GRID_ROWS - 1) * GRID_SPACING) / 2 + r * GRID_SPACING;
                    const sidewalkSize = blockSize + 2; 
                    
                    return (
                        <group key={`${r}-${c}`} position={[x, 0.01, z]}>
                             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                                <planeGeometry args={[sidewalkSize, sidewalkSize]} />
                                <meshStandardMaterial color="#94a3b8" roughness={0.6} /> 
                             </mesh>
                             <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                                <planeGeometry args={[blockSize, blockSize]} />
                                <meshStandardMaterial color="#4ade80" roughness={1} /> 
                             </mesh>
                        </group>
                    )
                })
            ))}
        </group>
    )
}

// Internal component that runs inside Canvas
const SceneInner: React.FC<SceneProps & { timeOffset: React.MutableRefObject<number> }> = ({ onLog, onTimeUpdate, warpTrigger, timeOffset, teleportTarget }) => {
  const [isNight, setIsNight] = useState(false);
  const [deadHouseIds, setDeadHouseIds] = useState<Set<string>>(new Set());
  
  // World State
  const [houses, setHouses] = useState<HouseData[]>([]);
  const [stickmen, setStickmen] = useState<StickmanData[]>([]);

  // Coaster Shared Ref
  const coasterRef = useRef<CoasterState>({
      status: 'BOARDING',
      riderIds: [],
      cartPosition: new Vector3(0,0,0),
      cartRotation: 0,
      matrix: new Matrix4()
  });

  // Ambulance State
  const [ambulanceState, setAmbulanceState] = useState<AmbulanceState>({
      status: 'IDLE',
      targetPos: null,
      patientIds: []
  });
  
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
      const terminalPos = new Vector3(airportPosVec.x + 15, 0, airportPosVec.z + 10);
      const checkInPos = terminalPos.clone().add(new Vector3(-4, 0, 6)); 
      const securityPos = terminalPos.clone().add(new Vector3(4, 0, 4)); 
      const gatePos = terminalPos.clone().add(new Vector3(0, 0, -4)); 
      const runwayStart = new Vector3(airportPosVec.x, 0, airportPosVec.z - 20);

      return {
        position: airportPosVec,
        terminalPos,
        checkInPos,
        securityPos,
        gatePos,
        runwayStart
      }
  }, []);

  const coasterData = useMemo<RollercoasterData>(() => {
      const pos = new Vector3(0, 0, -100); 
      // Reset to 0 rotation offset
      const offset = new Vector3(30, 0, 30);
      return {
          position: pos,
          entryPoint: pos.clone().add(offset)
      }
  }, []);

  const hospitalData = useMemo<HospitalData>(() => {
      // Position near Store but offset
      const pos = new Vector3(-60, 0, 30);
      const beds = [];
      const receptionPos = pos.clone().add(new Vector3(-4, 0, 3));
      
      // Grid of 8 beds
      const startX = -4.5;
      const bedZOffset = -3.5; // Adjusted to avoid wall clipping
      
      for(let r=0; r<2; r++) {
          for(let c=0; c<4; c++) {
              const z = r === 0 ? bedZOffset : -0.5; 
              beds.push(pos.clone().add(new Vector3(startX + c*3, 0, z)));
          }
      }

      return {
          position: pos,
          entryPoint: pos.clone().add(new Vector3(0, 0, 6)), // X offset by +6 for ambulance
          beds,
          receptionPos
      }
  }, []);

  // Initial World Generation
  useEffect(() => {
    const _houses: HouseData[] = [];
    const _stickmen: StickmanData[] = [];

    const startX = -((GRID_COLS - 1) * GRID_SPACING) / 2;
    const startZ = -((GRID_ROWS - 1) * GRID_SPACING) / 2;

    const teacherHouseIndex = Math.floor(Math.random() * 25);
    const cashierIndexes = [(teacherHouseIndex + 1) % 25, (teacherHouseIndex + 2) % 25];
    const doctorIndexes = [(teacherHouseIndex + 3) % 25, (teacherHouseIndex + 4) % 25];

    let houseCount = 0;
    
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            
            const x = startX + c * GRID_SPACING;
            const z = startZ + r * GRID_SPACING;

            if (r === 2 && c === 2) continue; // Shop
            if (r === 0 && c === 0) continue; // School
            if (r === 4 && c === 4) continue; // Park
            if (r === 0 && c === 4) continue; // Store
            if (r === 4 && c === 0) continue; // Arcade

            const houseId = `house-${houseCount}`;
            const color = COLORS[houseCount % COLORS.length];

            // Beds flushed against back wall (Z - Depth/2 + 1.4 for center)
            const bedZ = z - HOUSE_DEPTH/2 + 1.4;
            const bedPos1 = new Vector3(x - HOUSE_WIDTH/2 + 2, 1, bedZ);
            const bedPos2 = new Vector3(x + HOUSE_WIDTH/2 - 2, 1, bedZ);
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

            let parentJob: 'TEACHER' | 'CASHIER' | 'DOCTOR' | undefined = undefined;
            if (houseCount === teacherHouseIndex) parentJob = 'TEACHER';
            if (cashierIndexes.includes(houseCount)) parentJob = 'CASHIER';
            if (doctorIndexes.includes(houseCount)) parentJob = 'DOCTOR';

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

  const streetLights = useMemo(() => {
    const lights: Vector3[] = [];
    const startX = -((GRID_COLS - 1) * GRID_SPACING) / 2;
    const startZ = -((GRID_ROWS - 1) * GRID_SPACING) / 2;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const x = startX + c * GRID_SPACING;
            const z = startZ + r * GRID_SPACING;
            lights.push(new Vector3(x + GRID_SPACING/2, 0, z + GRID_SPACING/2));
        }
    }
    return lights;
  }, []);

  const [travelState, setTravelState] = useState<TravelState>({
      status: 'IDLE',
      travelerHouseId: null,
      flightProgress: 0,
      daysAway: 0
  });

  // Plane Respawn Logic
  useEffect(() => {
    if (travelState.status === 'CRASHED') {
        const timer = setTimeout(() => {
            onLog("Airport Crews have cleared the wreckage. Plane respawned.", "normal");
            setTravelState({
                status: 'IDLE',
                travelerHouseId: null,
                flightProgress: 0,
                daysAway: 0
            });
        }, 30000); // 30 seconds
        return () => clearTimeout(timer);
    }
  }, [travelState.status, onLog]);

  const handleCoasterCrash = (victimIds: string[]) => {
      onLog("ROLLERCOASTER CRASH! Survivors being rushed to hospital...", "alert");
      
      const victims = stickmen.filter(s => victimIds.includes(s.id));
      const dead: string[] = [];
      const waiting: string[] = [];

      setStickmen(prev => prev.map(s => {
          if (victimIds.includes(s.id)) {
               // 50% Survival Chance
               if (Math.random() < 0.5) {
                   waiting.push(s.id);
                   return { ...s, status: ActionState.WAITING_FOR_AMBULANCE };
               } else {
                   dead.push(s.homeId);
                   return s; 
               }
          }
          return s;
      }));

      // Update death registry
      setDeadHouseIds(prev => {
          const next = new Set(prev);
          dead.forEach(id => next.add(id));
          return next;
      });

      if (waiting.length > 0) {
          onLog(`${waiting.length} survivors found. Dispatching Ambulance!`, "normal");
          // Dispatch Ambulance
          setAmbulanceState({
              status: 'DISPATCHED',
              targetPos: coasterData.entryPoint.clone(),
              patientIds: waiting
          });
      }
  };

  // Ambulance Arrival Handlers
  const handleAmbulanceArriveAtScene = () => {
       if (ambulanceState.status !== 'DISPATCHED') return;
       
       onLog("Ambulance arrived at crash site. Loading patients...", "normal");
       
       // Hide stickmen (put in ambulance)
       setStickmen(prev => prev.map(s => {
           if (ambulanceState.patientIds.includes(s.id)) {
               return { ...s, status: ActionState.IN_AMBULANCE };
           }
           return s;
       }));

       setAmbulanceState(prev => ({ ...prev, status: 'LOADING' }));

       // Wait then return
       setTimeout(() => {
           setAmbulanceState(prev => ({ ...prev, status: 'RETURNING' }));
           onLog("Ambulance returning to Hospital.", "normal");
       }, 2000);
  };

  const handleAmbulanceArriveAtHospital = () => {
      if (ambulanceState.status !== 'RETURNING') return;
      
      onLog("Ambulance arriving at Hospital Admission...", "normal");
      
      // Calculate Capacity
      const currentlyOccupiedBeds = new Set<number>();
      stickmen.forEach(s => {
          if(s.status === ActionState.IN_HOSPITAL && !deadHouseIds.has(s.homeId) && s.hospitalBedIndex !== undefined) {
              currentlyOccupiedBeds.add(s.hospitalBedIndex);
          }
      });
      
      const capacity = hospitalData.beds.length;
      const incomingPatients = ambulanceState.patientIds;
      const availableBedsCount = capacity - currentlyOccupiedBeds.size;
      
      let admitted: string[] = [];
      let sacrificed: string[] = [];

      if (availableBedsCount > 0) {
          admitted = incomingPatients.slice(0, availableBedsCount);
          sacrificed = incomingPatients.slice(availableBedsCount);
      } else {
          sacrificed = incomingPatients;
      }

      if (admitted.length > 0) {
          onLog(`${admitted.length} patients admitted to Hospital.`, "success");
      }
      
      if (sacrificed.length > 0) {
          onLog(`HOSPITAL FULL! ${sacrificed.length} patients being sacrificed to the Volcano.`, "alert");
      }

      // Determine available bed indices
      const availableIndices: number[] = [];
      for(let i=0; i<capacity; i++) {
          if (!currentlyOccupiedBeds.has(i)) availableIndices.push(i);
      }

      // Move stickmen to hospital beds or Volcano
      setStickmen(prev => prev.map((s, idx) => {
          if (admitted.includes(s.id)) {
              // Get the next available bed index
              const myBedIndex = availableIndices.shift() ?? 0;
              
              return { 
                  ...s, 
                  status: ActionState.IN_HOSPITAL,
                  hospitalBedIndex: myBedIndex 
              };
          }
          if (sacrificed.includes(s.id)) {
              return { ...s, status: ActionState.BURNING };
          }
          return s;
      }));

      setAmbulanceState({
          status: 'IDLE',
          targetPos: null,
          patientIds: []
      });
  };

  const handleStickmanDeath = (homeId: string) => {
      setDeadHouseIds(prev => new Set(prev).add(homeId));
  }

  const handleMinuteChange = (minute: number) => {
      // Minute 1: Hospital Morning Rounds + Travel Return
      if (minute === 1) {
          // HOSPITAL LOGIC
          const patients = stickmen.filter(s => s.status === ActionState.IN_HOSPITAL && !deadHouseIds.has(s.homeId));
          if (patients.length > 0) {
              onLog(`Doctors are checking on ${patients.length} patients...`, 'normal');
              
              setStickmen(prev => prev.map(s => {
                  if (s.status === ActionState.IN_HOSPITAL) {
                      // Check for Delayed Death outcome
                      if (s.daysUntilDeath !== undefined) {
                          if (s.daysUntilDeath <= 0) {
                              onLog(`Patient ${s.id} has succumbed to their injuries.`, 'alert');
                              handleStickmanDeath(s.homeId);
                              return s;
                          } else {
                              return { ...s, daysUntilDeath: s.daysUntilDeath - 1 };
                          }
                      }

                      // Treatment Outcome (75% Survival)
                      if (Math.random() < 0.75) {
                           // Survived
                           const updates: Partial<StickmanData> = { status: ActionState.IDLE, hospitalBedIndex: undefined }; // Discharge
                           const outcomeRoll = Math.random();
                           
                           if (outcomeRoll < 0.25) {
                               updates.hasWheelchair = true;
                               onLog(`Patient ${s.id} discharged with a wheelchair.`, 'normal');
                           } else if (outcomeRoll < 0.40) { // 25 + 15
                               updates.missingArms = true;
                               onLog(`Patient ${s.id} discharged but lost their arms.`, 'alert');
                           } else if (outcomeRoll < 0.45) { // 25 + 15 + 5
                               // Delayed Death in 2 days
                               onLog(`Patient ${s.id} remains in critical condition...`, 'alert');
                               updates.status = ActionState.IN_HOSPITAL;
                               updates.daysUntilDeath = 2;
                               // Keep bed assignment if staying
                               updates.hospitalBedIndex = s.hospitalBedIndex;
                           } else {
                               onLog(`Patient ${s.id} made a full recovery!`, 'success');
                           }
                           
                           return { ...s, ...updates };
                      } else {
                          // Died in Hospital
                          onLog(`Patient ${s.id} didn't make it.`, 'alert');
                          handleStickmanDeath(s.homeId);
                          return s;
                      }
                  }
                  return s;
              }));
          }

          // TRAVEL RETURN
          if (travelState.status === 'AWAY') {
              const newDays = travelState.daysAway + 1;
              if (newDays >= 2) {
                  onLog("Flight 747 has landed. Welcome home!", "normal");
                  setTravelState(prev => ({ ...prev, status: 'RETURNING', daysAway: newDays }));
                  setTimeout(() => {
                      setTravelState({ status: 'IDLE', travelerHouseId: null, flightProgress: 0, daysAway: 0 });
                  }, 10000);
              } else {
                  setTravelState(prev => ({ ...prev, daysAway: newDays }));
                  onLog(`Travel Update: Family is enjoying day ${newDays} of vacation.`, 'normal');
              }
          }
      }

      // Minute 2: Travel Departure
      if (minute === 2) {
          if (travelState.status === 'IDLE') {
             const validHouses = houses.filter(h => !deadHouseIds.has(h.id));
             if (validHouses.length > 0) {
                 const randomHouse = validHouses[Math.floor(Math.random() * validHouses.length)];
                 onLog(`Family from ${randomHouse.id} is heading to the airport!`, 'normal');
                 
                 const travelerParent = stickmen.find(s => s.homeId === randomHouse.id && s.role === 'PARENT');
                 if (travelerParent && travelerParent.job) {
                     const jobToReassign = travelerParent.job;
                     onLog(`Alert: ${travelerParent.job} is going on vacation. Finding replacement...`, 'alert');

                     const candidates = stickmen.filter(s => 
                        s.role === 'PARENT' && 
                        !s.job && 
                        s.homeId !== randomHouse.id && 
                        !deadHouseIds.has(s.homeId)
                     );

                     if (candidates.length > 0) {
                         const replacement = candidates[Math.floor(Math.random() * candidates.length)];
                         onLog(`Hired ${replacement.id} as new ${jobToReassign}.`, 'normal');
                         
                         setStickmen(prev => prev.map(s => {
                             if (s.id === travelerParent.id) return { ...s, job: undefined };
                             if (s.id === replacement.id) return { ...s, job: jobToReassign };
                             return s;
                         }));
                     } else {
                         onLog("No replacements found! Store/School/Hospital might be closed.", "alert");
                          setStickmen(prev => prev.map(s => {
                             if (s.id === travelerParent.id) return { ...s, job: undefined };
                             return s;
                         }));
                     }
                 }

                 setTravelState({
                     status: 'BOARDING',
                     travelerHouseId: randomHouse.id,
                     flightProgress: 0,
                     daysAway: 0
                 });
             }
          }
      }
      
      // Minute 3: Flight & Crash Check
      if (minute === 3) {
          if (travelState.status === 'BOARDING') {
              const crashed = Math.random() < 0.75; // 75% Crash Chance
              if (crashed) {
                  onLog("BREAKING NEWS: A plane has crashed!", "alert");
                  setTravelState(prev => ({ ...prev, status: 'CRASHED' }));
                  
                  // Handle Survival Logic for Traveling Family
                  const familyMembers = stickmen.filter(s => s.homeId === travelState.travelerHouseId);
                  const dead: string[] = [];
                  const waiting: string[] = [];

                  setStickmen(prev => prev.map(s => {
                      if (s.homeId === travelState.travelerHouseId) {
                          // 90% Survival Chance (Increased from 80%)
                          if (Math.random() < 0.9) {
                               waiting.push(s.id);
                               return { ...s, status: ActionState.WAITING_FOR_AMBULANCE };
                          } else {
                              dead.push(s.homeId); 
                              return s; 
                          }
                      }
                      return s;
                  }));

                  if (waiting.length > 0) {
                       onLog(`${waiting.length} miracle survivors found! Dispatching Ambulance.`, "success");
                       setTravelState(prev => ({ ...prev, travelerHouseId: null })); 
                       // Dispatch Ambulance to Airport
                       setAmbulanceState({
                          status: 'DISPATCHED',
                          targetPos: airportData.runwayStart.clone().add(new Vector3(0,0,-40)), // Crash site approx
                          patientIds: waiting
                       });
                  } else {
                      onLog("There were no survivors.", "alert");
                      if (travelState.travelerHouseId) handleStickmanDeath(travelState.travelerHouseId);
                  }

              } else {
                  onLog("Flight 747 has departed safely.", "normal");
                  setTravelState(prev => ({ ...prev, status: 'AWAY' }));
              }
          }
      }
  };

  return (
    <>
      <EnvironmentController 
        onTimeChange={setIsNight} 
        onTimeUpdate={onTimeUpdate} 
        onMinuteChange={handleMinuteChange}
        warpTrigger={warpTrigger}
        timeOffset={timeOffset}
      />
      <CameraRig teleportTarget={teleportTarget} />

      <CityTerrain />

      {streetLights.map((pos, i) => (
          <group key={`sl-${i}`} position={[pos.x, 0, pos.z]}>
              <StreetLight isNight={isNight} />
          </group>
      ))}

      <Ambulance 
        state={ambulanceState} 
        hospitalPos={hospitalData.entryPoint.clone().add(new Vector3(6,0,0))} 
        onArriveAtScene={handleAmbulanceArriveAtScene}
        onArriveAtHospital={handleAmbulanceArriveAtHospital}
      />

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
      <group position={[hospitalData.position.x, 0, hospitalData.position.z]}>
         <Hospital data={hospitalData} />
      </group>
      <group position={[airportData.position.x, 0, airportData.position.z]}>
         <Airport travelState={travelState} />
      </group>

      <group position={[coasterData.position.x, 0, coasterData.position.z]}>
          <Rollercoaster coasterRef={coasterRef} onCrash={handleCoasterCrash} />
      </group>

      <group position={ISLAND_POSITION}>
          <Island />
      </group>

      <group position={HEAVEN_POSITION}>
          <Heaven />
      </group>

      <group position={VOLCANO_POSITION}>
          <Volcano />
      </group>

      {houses.map(house => (
        <House key={house.id} data={house} isNight={isNight} />
      ))}

      {stickmen.map(sm => {
         const isDead = deadHouseIds.has(sm.homeId);
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
                coasterData={coasterData}
                hospitalData={hospitalData}
                coasterRef={coasterRef}
                isNight={isNight}
                travelState={travelState}
                onLog={onLog} 
                timeOffset={timeOffset}
                isDead={isDead}
                onDie={handleStickmanDeath}
            />
         );
      })}
    </>
  );
};

// --- MAIN WRAPPER ---
export const Scene: React.FC<SceneProps> = (props) => {
    // We lift the ref up here to ensure it persists across Canvas remounts if any
    const timeOffset = useRef(0);
    
    return (
        <Canvas shadows camera={{ position: [0, 60, 80], fov: 45 }}>
            <SceneInner {...props} timeOffset={timeOffset} />
        </Canvas>
    );
}
