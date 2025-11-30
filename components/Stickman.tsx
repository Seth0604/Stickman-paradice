
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, MathUtils, Mesh } from 'three';
import { Html } from '@react-three/drei';
import { ActionState, HouseData, Role, ShopData, SchoolData, ParkData, StoreData, BeachData, ArcadeData, AirportData, TravelState, CoasterState, RollercoasterData, HospitalData } from '../types';
import { getSchoolDeskPosition } from './School';
import { ISLAND_POSITION, HEAVEN_POSITION, VOLCANO_POSITION } from '../constants';

interface StickmanProps {
  id: string;
  role: Role;
  color: string;
  home: HouseData;
  shop: ShopData;
  school: SchoolData;
  park: ParkData;
  store: StoreData;
  beach: BeachData;
  arcade: ArcadeData;
  airport: AirportData;
  hospitalData: HospitalData;
  coasterData: RollercoasterData;
  coasterRef: React.MutableRefObject<CoasterState>;
  isNight: boolean;
  job?: 'TEACHER' | 'CASHIER' | 'DOCTOR';
  travelState: TravelState;
  onLog: (msg: string, type: 'normal' | 'alert' | 'success') => void;
  timeOffset: React.MutableRefObject<number>;
  isDead?: boolean;
  onDie: (homeId: string) => void;
  // Health
  status?: ActionState; 
  hasWheelchair?: boolean;
  missingArms?: boolean;
  daysUntilDeath?: number;
  hospitalBedIndex?: number;
}

const WALK_SPEED_PARENT = 0.05;
const WALK_SPEED_CHILD = 0.12; 

export const Stickman: React.FC<StickmanProps> = ({ role, color, id, home, shop, school, park, store, beach, arcade, airport, hospitalData, coasterData, coasterRef, isNight, job, travelState, onLog, timeOffset, isDead, onDie, status: overrideStatus, hasWheelchair, missingArms, daysUntilDeath, hospitalBedIndex }) => {
  const group = useRef<Group>(null);
  // Wheel Refs
  const wheelL = useRef<Mesh>(null);
  const wheelR = useRef<Mesh>(null);
  
  // State
  const [state, setState] = useState<ActionState>(ActionState.IDLE);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [hasIceCream, setHasIceCream] = useState(false);
  const [hasGroceries, setHasGroceries] = useState(false);
  const [hasToy, setHasToy] = useState(false);
  const [waitTimer, setWaitTimer] = useState(0);
  
  // Apply override status (like IN_HOSPITAL) from parent if present
  useEffect(() => {
      if (overrideStatus) {
          setState(overrideStatus);
          setTarget(null);
      }
  }, [overrideStatus]);

  // Travel Sub-state
  const [travelStep, setTravelStep] = useState(0);

  // Flags for one-time checks per day/night
  const [checkedNightActivity, setCheckedNightActivity] = useState(false);

  // Position management
  const initialPos = useMemo(() => {
      if (isDead) return new Vector3(...HEAVEN_POSITION).add(new Vector3((Math.random()-0.5)*20, 5, (Math.random()-0.5)*20));
      return new Vector3(
        home.position[0] + (Math.random() * 2 - 1),
        0,
        home.position[2] + 4
      )
  }, [home, isDead]);
  
  const currentPos = useRef(initialPos.clone());
  // Slower speed if wheelchair
  const speed = hasWheelchair ? 0.03 : (role === 'CHILD' ? WALK_SPEED_CHILD : WALK_SPEED_PARENT);
  const scale = role === 'CHILD' ? 0.6 : 1.0;

  // Helper to find the correct bed
  const getMyBed = () => {
      const beds = home.furniture.filter(f => f.type === 'BED');
      if (role === 'PARENT') return beds[0];
      return beds[1] || beds[0];
  };

  // Get Child Index for School Desk
  const childIndex = useMemo(() => {
     if (role !== 'CHILD') return 0;
     const num = parseInt(id.split('-')[1]);
     return isNaN(num) ? 0 : num % 25; 
  }, [id, role]);

  useFrame(({ clock }, delta) => {
    // Shared Schedule Logic - Use Offset for Warping
    const totalSeconds = clock.getElapsedTime() + timeOffset.current;
    // Ensure positive cycle time
    const cycleTime = ((totalSeconds % 360) + 360) % 360; 

    // Handle Timers
    if (waitTimer > 0) {
        setWaitTimer(prev => Math.max(0, prev - delta));
        return; 
    }

    // --- DEAD LOGIC ---
    if (isDead) {
        if (state !== ActionState.FLOATING) {
            setState(ActionState.FLOATING);
            setTarget(null);
            // Teleport to heaven range
            const heavenBase = new Vector3(...HEAVEN_POSITION);
            currentPos.current.copy(heavenBase.add(new Vector3((Math.random()-0.5)*30, 5 + Math.random()*5, (Math.random()-0.5)*30)));
        }
        return;
    }

    // --- BURNING LOGIC ---
    if (state === ActionState.BURNING) {
        // Sacrifice to volcano
        if (!target) {
            const volcanoBase = new Vector3(...VOLCANO_POSITION);
            currentPos.current.copy(volcanoBase.add(new Vector3(0, 15, 0))); // Top of volcano
            setTarget(null);
            
            // Die after 3 seconds
            setTimeout(() => {
                onDie(home.id);
            }, 3000);
        }
        return;
    }

    if (state === ActionState.IN_AMBULANCE) {
        return; // Handled by Ambulance component (invisible)
    }

    if (state === ActionState.WAITING_FOR_AMBULANCE) {
        // Just lie there
        return;
    }
    
    // --- HOSPITALIZED LOGIC ---
    if (state === ActionState.IN_HOSPITAL) {
        // Go to hospital bed and stay there
        // Pick specific bed based on ID or index
        const bedIndex = (hospitalBedIndex !== undefined) ? hospitalBedIndex : 0;
        const safeBedIndex = bedIndex % hospitalData.beds.length;
        const bed = hospitalData.beds[safeBedIndex];
        
        // Snap to position
        if (bed) {
            const targetPos = bed.clone();
            // Adjust for visual alignment (beds are centered, stickman pivot is feet)
            // Set X to bed position. 
            // Z needs +1.4 offset to align head with pillow (since bed center is at feet approx)
            currentPos.current.x = targetPos.x;
            currentPos.current.z = targetPos.z + 1.4;
        }
        
        return; // Do nothing else
    }

    // --- RIDE CRASH CHECK ---
    if (state === ActionState.RIDING_COASTER || state === ActionState.WAITING_FOR_RIDE) {
        if (coasterRef.current.status === 'CRASHED' && coasterRef.current.riderIds.includes(id)) {
            // Logic handled by parent callback, which sets overrideStatus/isDead
            return;
        }
    }

    // --- TRAVEL LOGIC (Override everything if selected) ---
    if (travelState.travelerHouseId === home.id) {
        if (travelState.status === 'BOARDING') {
            if (state !== ActionState.TRAVELING && state !== ActionState.WAITING_FOR_FLIGHT) {
                // Initialize Travel Sequence
                setTravelStep(0);
                setState(ActionState.TRAVELING);
                setTarget(airport.checkInPos.clone().add(new Vector3((Math.random()-0.5), 0, (Math.random()-0.5))));
            }
            else if (state === ActionState.TRAVELING && !target && waitTimer === 0) {
                // Determine next step
                if (travelStep === 0) { // Finished Check-in
                    setWaitTimer(1.5); // Wait at desk
                    setTravelStep(1);
                    setTarget(airport.securityPos.clone().add(new Vector3((Math.random()-0.5), 0, (Math.random()-0.5))));
                } 
                else if (travelStep === 1) { // Finished Security
                    setWaitTimer(1.5); // Wait at security
                    setTravelStep(2);
                    setTarget(airport.gatePos.clone().add(new Vector3((Math.random()-0.5)*3, 0, (Math.random()-0.5))));
                }
                else if (travelStep === 2) { // Finished Gate Walk
                    setState(ActionState.WAITING_FOR_FLIGHT);
                }
            }
        }
        else if (travelState.status === 'AWAY') {
             if (state !== ActionState.RELAXING) {
                 setState(ActionState.RELAXING);
                 setTarget(null);
                 // Teleport to Island
                 const islandBase = new Vector3(...ISLAND_POSITION);
                 // Random spot on island
                 currentPos.current.copy(islandBase.add(new Vector3((Math.random()-0.5)*30, 1.5, (Math.random()-0.5)*30)));
             }
        }
        else if (travelState.status === 'RETURNING') {
             if (state === ActionState.RELAXING || state === ActionState.FLYING) {
                 // Teleport to Terminal Exit
                 currentPos.current.copy(airport.terminalPos.clone().add(new Vector3(0,0,10)));
                 setState(ActionState.IDLE);
                 // Walk home
                 setTarget(new Vector3(...home.position));
                 setState(ActionState.WALKING);
             }
        }
        
        if (state === ActionState.WAITING_FOR_FLIGHT || state === ActionState.FLYING || state === ActionState.RELAXING) return;
    }


    // --- PARENT LOGIC ---
    if (role === 'PARENT') {
        
        // JOB LOGIC (Only if not incapacitated)
        if (job) {
             const isWorkTime = cycleTime >= 60 && cycleTime < 300; // Work all day (Min 2-5)
             
             if (isWorkTime) {
                 if (state !== ActionState.TEACHING && state !== ActionState.WORKING && state !== ActionState.TREATING_PATIENT) {
                     if (job === 'TEACHER') {
                        setTarget(school.teacherPos.clone());
                        setState(ActionState.TEACHING);
                     } else if (job === 'CASHIER') {
                        const regIndex = parseInt(id.split('-')[1]) % 2; 
                        const regPos = store.registers[regIndex] || store.registers[0];
                        setTarget(regPos.clone());
                        setState(ActionState.WORKING);
                     } else if (job === 'DOCTOR') {
                        setTarget(hospitalData.receptionPos.clone());
                        setState(ActionState.TREATING_PATIENT);
                     }
                 }
                 // Doctor wander logic
                 if (job === 'DOCTOR' && state === ActionState.TREATING_PATIENT && !target && Math.random() < 0.005) {
                     // Check on a random bed or return to desk
                     if (Math.random() < 0.5) {
                         const randomBed = hospitalData.beds[Math.floor(Math.random() * hospitalData.beds.length)];
                         setTarget(randomBed.clone().add(new Vector3(0,0,1.5)));
                     } else {
                         setTarget(hospitalData.receptionPos.clone());
                     }
                 }

                 return; 
             } else {
                 if (state === ActionState.TEACHING || state === ActionState.WORKING || state === ActionState.TREATING_PATIENT) {
                     setState(ActionState.IDLE);
                     setTarget(null);
                 }
             }
        }

        // Night / Sleep Logic
        const isSleepTime = cycleTime >= 300 || cycleTime < 60;
        
        if (!isSleepTime && checkedNightActivity) {
            setCheckedNightActivity(false);
            if (hasToy) setHasToy(false);
        }

        if (isSleepTime) {
            // ARCADE CHECK
            if (!checkedNightActivity && state !== ActionState.SLEEPING && state !== ActionState.PLAYING_ARCADE && state !== ActionState.CHEERING) {
                setCheckedNightActivity(true);
                // 25% chance to go to arcade
                if (Math.random() < 0.25) {
                    const machine = arcade.clawMachines[Math.floor(Math.random() * arcade.clawMachines.length)];
                    setTarget(machine.clone().add(new Vector3(1, 0, 0))); 
                    setState(ActionState.PLAYING_ARCADE);
                    return; 
                }
            }

            if (state === ActionState.PLAYING_ARCADE || state === ActionState.CHEERING) {
                // Logic handled in transitions below
            } 
            else if (state !== ActionState.SLEEPING) {
                const bed = getMyBed();
                if (bed) {
                    setTarget(bed.position.clone());
                    setState(ActionState.SLEEPING);
                    setHasGroceries(false); 
                }
            }
        } else {
            if (state === ActionState.SLEEPING) {
                setState(ActionState.IDLE);
                setTarget(null);
            }

            if (state === ActionState.BROWSING && waitTimer === 0) {
                 setHasGroceries(true);
                 const regIndex = Math.floor(Math.random() * store.registers.length);
                 setTarget(store.registers[regIndex].clone());
                 setState(ActionState.CHECKOUT);
            }
            if (state === ActionState.CHECKOUT && waitTimer === 0 && !target) {
                 setState(ActionState.IDLE);
            }
            
            if (state === ActionState.PLAYING_ARCADE && waitTimer === 0) {
                 setState(ActionState.CHEERING);
                 setWaitTimer(2.0); 
            }
            if (state === ActionState.CHEERING && waitTimer === 0) {
                 setHasToy(true); 
                 setState(ActionState.IDLE);
                 setTarget(null);
            }

            if (state === ActionState.IDLE && !target) {
                const rand = Math.random();
                
                if (rand < 0.01) { 
                    const couch = home.furniture.find(f => f.type === 'COUCH');
                    if (couch) {
                         const offset = new Vector3(0.5, 0, 0);
                         offset.applyAxisAngle(new Vector3(0,1,0), couch.rotation || 0);
                         setTarget(couch.position.clone().add(offset));
                         setState(ActionState.WATCHING_TV);
                    }
                } 
                else if (rand < 0.015 && !hasGroceries) {
                     const aisleX = (Math.random() - 0.5) * 12;
                     const aisleZ = (Math.random() - 0.5) * 12;
                     setTarget(store.position.clone().add(new Vector3(aisleX, 0, aisleZ)));
                     setState(ActionState.SHOPPING);
                }
                else if (rand < 0.05 && !hasToy) { 
                     const machine = arcade.clawMachines[Math.floor(Math.random() * arcade.clawMachines.length)];
                     setTarget(machine.clone().add(new Vector3(1, 0, 0))); 
                     setState(ActionState.PLAYING_ARCADE);
                }
                // Coaster Logic
                else if (rand < 0.06 && coasterRef.current.status === 'BOARDING' && coasterRef.current.riderIds.length < 4 && !hasWheelchair) {
                     // Queue Spot: Offset from entry point
                     const qX = (Math.random() - 0.5) * 2 + 4; // Right of platform
                     const qZ = (Math.random()) * 4; 
                     setTarget(coasterData.entryPoint.clone().add(new Vector3(qX, 0, qZ)));
                     setState(ActionState.WAITING_FOR_RIDE);
                }
                else if (rand < 0.07) {
                    const wanderX = home.position[0] + (Math.random() * 8 - 4);
                    const wanderZ = home.position[2] + (Math.random() * 8 - 4);
                    setTarget(new Vector3(wanderX, 0, wanderZ));
                    setState(ActionState.WALKING);
                }
            }
        }
        return;
    }

    // --- CHILD LOGIC ---
    let phase = 'FREE';
    if (cycleTime >= 300 || cycleTime < 60) phase = 'SLEEP';
    else if (cycleTime >= 240 && cycleTime < 300) phase = 'PARK';
    else if (cycleTime >= 120 && cycleTime < 180) phase = 'SCHOOL';
    else phase = 'FREE';

    if (phase === 'SCHOOL') {
        if (state !== ActionState.LEARNING) {
            setHasIceCream(false); 
            const deskPos = getSchoolDeskPosition(school.position, childIndex);
            setTarget(deskPos);
            setState(ActionState.LEARNING);
        }
    } 
    else if (phase === 'PARK') {
        if (state !== ActionState.PLAYING && state !== ActionState.BUILDING_SAND && state !== ActionState.PLAYING_ARCADE && state !== ActionState.RIDING_COASTER && state !== ActionState.WAITING_FOR_RIDE) {
             const rand = Math.random();
             // 10% Beach
             if (rand < 0.1) {
                 const spotIndex = Math.floor(Math.random() * beach.buildingSpots.length);
                 const spot = beach.buildingSpots[spotIndex];
                 setTarget(spot.clone());
                 setState(ActionState.BUILDING_SAND);
             } 
             // 50% Arcade
             else if (rand < 0.6) {
                 const machine = arcade.clawMachines[Math.floor(Math.random() * arcade.clawMachines.length)];
                 setTarget(machine.clone().add(new Vector3(1, 0, 0))); 
                 setState(ActionState.PLAYING_ARCADE);
             }
             // 40% Park
             else {
                 const parkOffsetX = (Math.random() - 0.5) * 8;
                 const parkOffsetZ = (Math.random() - 0.5) * 8;
                 setTarget(park.position.clone().add(new Vector3(parkOffsetX, 0, parkOffsetZ)));
                 setState(ActionState.PLAYING);
             }
        }
    }
    else if (phase === 'SLEEP') {
            if (state !== ActionState.SLEEPING) {
                const bed = getMyBed();
                if (bed) {
                    setTarget(bed.position.clone());
                    setState(ActionState.SLEEPING);
                    setHasToy(false); 
                }
            }
    }
    else if (phase === 'FREE') {
            if ([ActionState.LEARNING, ActionState.PLAYING, ActionState.SLEEPING, ActionState.BUILDING_SAND].includes(state)) {
                setState(ActionState.IDLE);
                setTarget(null); 
            }

            if (state === ActionState.BROWSING && waitTimer === 0) {
                 setHasGroceries(true);
                 const regIndex = Math.floor(Math.random() * store.registers.length);
                 setTarget(store.registers[regIndex].clone());
                 setState(ActionState.CHECKOUT);
            }
            if (state === ActionState.CHECKOUT && waitTimer === 0 && !target) {
                 setState(ActionState.IDLE);
            }

            if (state === ActionState.PLAYING_ARCADE && waitTimer === 0) {
                 setState(ActionState.CHEERING);
                 setWaitTimer(2.0); 
            }
            if (state === ActionState.CHEERING && waitTimer === 0) {
                 setHasToy(true);
                 setState(ActionState.IDLE);
                 setTarget(null);
            }

            if (!target && state !== ActionState.BUYING && state !== ActionState.EATING && state !== ActionState.SHOPPING && state !== ActionState.BROWSING && state !== ActionState.CHECKOUT && state !== ActionState.PLAYING_ARCADE && state !== ActionState.CHEERING && state !== ActionState.WAITING_FOR_RIDE && state !== ActionState.RIDING_COASTER) {
                const rand = Math.random();
                
                // 5% Buy Ice Cream
                if (!hasIceCream && rand < 0.05) { 
                    setTarget(shop.entryPoint.clone());
                    setState(ActionState.BUYING);
                } 
                // 10% Go Shopping
                else if (rand < 0.15 && !hasGroceries) {
                     const aisleX = (Math.random() - 0.5) * 12;
                     const aisleZ = (Math.random() - 0.5) * 12;
                     setTarget(store.position.clone().add(new Vector3(aisleX, 0, aisleZ)));
                     setState(ActionState.SHOPPING);
                }
                // 10% Beach Sand
                else if (rand < 0.25) {
                     const spotIndex = Math.floor(Math.random() * beach.buildingSpots.length);
                     const spot = beach.buildingSpots[spotIndex];
                     setTarget(spot.clone());
                     setState(ActionState.BUILDING_SAND);
                }
                // 30% Arcade
                else if (rand < 0.55 && !hasToy) {
                    const machine = arcade.clawMachines[Math.floor(Math.random() * arcade.clawMachines.length)];
                    setTarget(machine.clone().add(new Vector3(1, 0, 0))); 
                    setState(ActionState.PLAYING_ARCADE);
                }
                // 5% Coaster
                else if (rand < 0.60 && coasterRef.current.status === 'BOARDING' && coasterRef.current.riderIds.length < 4 && !hasWheelchair) {
                     // Queue Position
                     const qX = (Math.random() - 0.5) * 2 + 4; 
                     const qZ = (Math.random()) * 4; 
                     setTarget(coasterData.entryPoint.clone().add(new Vector3(qX, 0, qZ)));
                     setState(ActionState.WAITING_FOR_RIDE);
                }
                // Eat Ice Cream
                else if (hasIceCream) {
                    const couch = home.furniture.find(f => f.type === 'COUCH');
                    if (couch) {
                         const offset = new Vector3(-0.5, 0, 0);
                         offset.applyAxisAngle(new Vector3(0,1,0), couch.rotation || 0);
                         setTarget(couch.position.clone().add(offset));
                        setState(ActionState.EATING);
                    }
                } 
                // Wander
                else if (state === ActionState.IDLE) {
                    const wanderRadius = 25;
                    const wanderX = home.position[0] + (Math.random() * wanderRadius - wanderRadius/2);
                    const wanderZ = home.position[2] + (Math.random() * wanderRadius - wanderRadius/2);
                    setTarget(new Vector3(wanderX, 0, wanderZ));
                    setState(ActionState.WALKING);
                }
            }
    }
  });

  useFrame((stateThree) => {
    if (!group.current) return;
    const time = stateThree.clock.getElapsedTime();
    let isMoving = false;

    if (state === ActionState.FLYING || state === ActionState.IN_AMBULANCE) {
        group.current.visible = false;
        return;
    } else {
        group.current.visible = true;
    }

    // --- COASTER MOVEMENT OVERRIDE (MATRIX ALIGNMENT) ---
    if (state === ActionState.RIDING_COASTER) {
        // Reset local transforms first
        group.current.position.set(0,0,0);
        group.current.rotation.set(0,0,0);
        group.current.scale.set(scale, scale, scale);
        
        // 1. Position at Cart Origin (World Space)
        group.current.position.setFromMatrixPosition(coasterRef.current.matrix);
        
        // 2. Match Cart Rotation
        group.current.setRotationFromMatrix(coasterRef.current.matrix);
        
        // 3. Apply Local Offsets (Relative to Cart)
        // Move stickman to specific seat
        const myIndex = coasterRef.current.riderIds.indexOf(id);
        const seatZ = -1.5 + (myIndex * 1.0);
        
        // Translate local to cart
        group.current.translateZ(seatZ);
        group.current.translateY(0.5); // Sit height
        
        // Rotate 180 to face forward (Cart Z is backwards or tangential?)
        // If they are misaligned, this flips them
        group.current.rotateY(Math.PI);
    }

    // Movement
    else if (target) {
        const direction = new Vector3().subVectors(target, currentPos.current);
        const dist = direction.length();

        if (dist > 0.2) {
            isMoving = true;
            direction.normalize().multiplyScalar(speed);
            currentPos.current.add(direction);
            
            const angle = Math.atan2(direction.x, direction.z);
            const currentRotation = group.current.rotation.y;
            let delta = angle - currentRotation;
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;

            group.current.rotation.y = currentRotation + delta * 0.1;

        } else {
            currentPos.current.copy(target);
            
            if (state === ActionState.BUYING) {
                 setHasIceCream(true);
                 setTarget(null); 
                 setState(ActionState.WALKING);
            }
            if (state === ActionState.SHOPPING) {
                 setTarget(null);
                 setState(ActionState.BROWSING);
                 setWaitTimer(2.0); 
            }
            if (state === ActionState.CHECKOUT) {
                 setTarget(null);
                 setWaitTimer(1.0); 
            }
            if (state === ActionState.PLAYING_ARCADE) {
                 setTarget(null);
                 setWaitTimer(3.0); 
            }
            if (state === ActionState.WALKING) {
                 // Stop walking
                 setTarget(null);
                 setState(ActionState.IDLE);
            }
            if (state === ActionState.TRAVELING) {
                // Multi-step logic handled in useFrame loop logic above via setWaitTimer/setTravelStep
                setTarget(null);
            }
            // Coaster Arrival
            if (state === ActionState.WAITING_FOR_RIDE) {
                setTarget(null);
                // Try to join
                if (coasterRef.current.riderIds.length < 4 && coasterRef.current.status === 'BOARDING') {
                     coasterRef.current.riderIds.push(id);
                     setState(ActionState.RIDING_COASTER);
                } else {
                     // Full or left, abort
                     setState(ActionState.IDLE);
                }
            }
        }
    }

    // Apply Position (Unless Riding)
    if (state !== ActionState.RIDING_COASTER) {
        group.current.position.copy(currentPos.current);
    }

    // Animation Logic
    const body = group.current.getObjectByName('Body');
    const head = group.current.getObjectByName('Head');
    const lLegPivot = group.current.getObjectByName('LLegPivot');
    const rLegPivot = group.current.getObjectByName('RLegPivot');
    const lArmPivot = group.current.getObjectByName('LArmPivot');
    const rArmPivot = group.current.getObjectByName('RArmPivot');
    const iceCream = group.current.getObjectByName('IceCream');
    const groceryBag = group.current.getObjectByName('GroceryBag');
    const sandCastle = group.current.getObjectByName('SandCastle');
    const toy = group.current.getObjectByName('Toy');
    const wheelchair = group.current.getObjectByName('Wheelchair');

    if (body && lLegPivot && rLegPivot && lArmPivot && rArmPivot && head && wheelchair) {
        // Visibility toggles
        if (missingArms) {
            lArmPivot.visible = false;
            rArmPivot.visible = false;
        } else {
            lArmPivot.visible = true;
            rArmPivot.visible = true;
        }
        wheelchair.visible = !!hasWheelchair;

        // Reset
        lLegPivot.rotation.set(0,0,0);
        rLegPivot.rotation.set(0,0,0);
        lArmPivot.rotation.set(0,0,0);
        rArmPivot.rotation.set(0,0,0);
        head.rotation.set(0,0,0);
        // Only reset rotation if not riding (Riding logic handles rotation manually)
        if(state !== ActionState.RIDING_COASTER) {
            group.current.rotation.x = 0;
            group.current.rotation.z = 0;
        }

        if(state !== ActionState.RIDING_COASTER && !hasWheelchair) group.current.position.y = 0; 
        if(hasWheelchair) group.current.position.y = 0.5; // Sit in chair

        if(iceCream) iceCream.visible = hasIceCream;
        if(groceryBag) groceryBag.visible = hasGroceries;
        if(sandCastle) sandCastle.visible = state === ActionState.BUILDING_SAND;
        if(toy) toy.visible = hasToy;

        if (state === ActionState.FLOATING) {
             // Dead / Heaven animation
             group.current.position.y = currentPos.current.y + Math.sin(time * 2) * 0.5;
             lArmPivot.rotation.z = 2.5; rArmPivot.rotation.z = -2.5;
             lLegPivot.rotation.x = 0.2; rLegPivot.rotation.x = 0.2;
        } else if (state === ActionState.BURNING) {
             // Sacrifice Flail
             lArmPivot.rotation.z = Math.sin(time * 20) * 2;
             rArmPivot.rotation.z = Math.cos(time * 20) * 2;
             group.current.position.y = currentPos.current.y + Math.sin(time * 10) * 0.5;
        } else if (state === ActionState.IN_HOSPITAL) {
             // Laying in bed - Ensure position overrides
             group.current.position.copy(currentPos.current); 
             
             group.current.rotation.x = -Math.PI / 2;
             group.current.position.y = 1.1; // Rest on top of mattress (0.95 high)
             lArmPivot.rotation.z = 0.2; rArmPivot.rotation.z = -0.2;
        } else if (state === ActionState.WAITING_FOR_AMBULANCE) {
             // Laying on ground injured
             group.current.rotation.x = -Math.PI / 2;
             group.current.rotation.z = Math.PI / 4;
             group.current.position.y = 0.2;
             lArmPivot.rotation.z = 2.5; rArmPivot.rotation.z = -2.5;
        } else if (state === ActionState.RELAXING) {
             // Island chilling
             group.current.rotation.x = -Math.PI / 2;
             group.current.position.y = 0.5;
             lArmPivot.rotation.z = 2.8; rArmPivot.rotation.z = -2.8; 
             lLegPivot.rotation.x = 0.1; rLegPivot.rotation.x = 0.1;
        }
        else if (state === ActionState.SLEEPING && !isMoving) {
             const bed = getMyBed();
             const bedRot = bed?.rotation || 0;
             group.current.rotation.y = bedRot;
             group.current.rotation.x = -Math.PI / 2;
             const headToPillowOffset = (2.3 * scale) - 0.75;
             group.current.position.x = currentPos.current.x + Math.sin(bedRot) * headToPillowOffset;
             group.current.position.z = currentPos.current.z + Math.cos(bedRot) * headToPillowOffset;
             group.current.position.y = 0.75; 
             lArmPivot.rotation.z = 0.2; lArmPivot.rotation.x = -0.2; 
             rArmPivot.rotation.z = -0.2; rArmPivot.rotation.x = -0.2;
             
             if (hasToy) {
                 lArmPivot.rotation.x = -0.5; lArmPivot.rotation.z = 0.5;
                 rArmPivot.rotation.x = -0.5; rArmPivot.rotation.z = -0.5;
             }

        } else if ((state === ActionState.EATING || state === ActionState.WATCHING_TV || state === ActionState.LEARNING || state === ActionState.WAITING_FOR_FLIGHT) && !isMoving) {
             // Sitting
             if (state === ActionState.EATING || state === ActionState.WATCHING_TV) {
                const couch = home.furniture.find(f => f.type === 'COUCH');
                if (couch) group.current.rotation.y = couch.rotation || 0;
             }
             if (state === ActionState.LEARNING) {
                 group.current.rotation.y = Math.PI;
             }
             
             // Sit on floor if waiting for flight
             if (state === ActionState.WAITING_FOR_FLIGHT) {
                 group.current.position.y = 0;
             } else {
                 group.current.position.y = 0.55 - (0.8 * scale);
             }

             lLegPivot.rotation.x = -Math.PI / 2;
             rLegPivot.rotation.x = -Math.PI / 2;
             lArmPivot.rotation.x = -Math.PI / 3;
             rArmPivot.rotation.x = -Math.PI / 3;

             if (state === ActionState.WATCHING_TV) head.rotation.x = -0.2; 
             if (hasIceCream && state === ActionState.EATING) {
                rArmPivot.rotation.x = -Math.PI / 2.5 + Math.sin(time * 5) * 0.2;
                rArmPivot.rotation.y = -0.5;
             }
             if (hasToy) {
                 lArmPivot.rotation.x = -1; lArmPivot.rotation.z = 0.5;
                 rArmPivot.rotation.x = -1; rArmPivot.rotation.z = -0.5;
             }

        } else if (state === ActionState.RIDING_COASTER) {
             // Sitting hands up
             lLegPivot.rotation.x = -Math.PI / 2;
             rLegPivot.rotation.x = -Math.PI / 2;
             // Hands up cheering!
             lArmPivot.rotation.z = 2.5;
             rArmPivot.rotation.z = -2.5;

        } else if ((state === ActionState.TEACHING || state === ActionState.WORKING) && !isMoving) {
             if(job === 'TEACHER') group.current.rotation.y = Math.PI; 
             if(job === 'CASHIER') group.current.rotation.y = Math.PI; 
             
             const gesture = Math.sin(time * 3) * 0.5;
             rArmPivot.rotation.z = Math.PI / 4 + gesture * 0.2;
             rArmPivot.rotation.x = -Math.PI / 4;

        } else if (state === ActionState.SWIMMING) {
             group.current.rotation.x = Math.PI / 2; 
             const bob = Math.sin(time * 3) * 0.1;
             group.current.position.y = 0.2 + bob;
             lArmPivot.rotation.x = Math.sin(time * 5) * 2;
             rArmPivot.rotation.x = Math.cos(time * 5) * 2;
             lLegPivot.rotation.x = Math.sin(time * 8) * 0.5;
             rLegPivot.rotation.x = -Math.sin(time * 8) * 0.5;

        } else if (state === ActionState.BUILDING_SAND && !isMoving) {
             group.current.position.y = -0.3; 
             lLegPivot.rotation.x = -1.5; lLegPivot.rotation.z = -0.5;
             rLegPivot.rotation.x = -1.5; rLegPivot.rotation.z = 0.5;
             lArmPivot.rotation.x = Math.sin(time * 8) * 0.5 - 0.5;
             rArmPivot.rotation.x = Math.cos(time * 8) * 0.5 - 0.5;

        } else if (state === ActionState.PLAYING_ARCADE && !isMoving) {
             rArmPivot.rotation.x = -1.2;
             rArmPivot.rotation.z = -0.2 + Math.sin(time * 20) * 0.1;
             lArmPivot.rotation.x = -0.5; 

        } else if (state === ActionState.CHEERING && !isMoving) {
             const jump = Math.abs(Math.sin(time * 15)) * 0.5;
             group.current.position.y = jump;
             const wave = Math.sin(time * 20) * 0.5;
             lArmPivot.rotation.z = 2.5 + wave * 0.2; 
             rArmPivot.rotation.z = -2.5 - wave * 0.2;
             lArmPivot.rotation.x = 0;
             rArmPivot.rotation.x = 0;

        } else if ((state === ActionState.SHOPPING || state === ActionState.CHECKOUT || state === ActionState.TRAVELING) && isMoving) {
             lArmPivot.rotation.x = -0.8;
             rArmPivot.rotation.x = -0.8;
             const walk = Math.sin(time * 10);
             if (!hasWheelchair) {
                 lLegPivot.rotation.x = walk * 0.6;
                 rLegPivot.rotation.x = -walk * 0.6;
             }
             if (hasGroceries) {
                 lArmPivot.rotation.x = -0.5; 
                 lArmPivot.rotation.z = 0.2;
             }
             if (state === ActionState.TRAVELING) {
                 // Waving goodbye while walking
                 rArmPivot.rotation.z = -2.5 + Math.sin(time * 10) * 0.5;
             }

        } else if (isMoving) {
             const animSpeed = role === 'CHILD' ? 15 : 10;
             const walk = Math.sin(time * animSpeed);
             if (!hasWheelchair) {
                 lLegPivot.rotation.x = walk * 0.6;
                 rLegPivot.rotation.x = -walk * 0.6;
             }
             lArmPivot.rotation.x = -walk * 0.6;
             rArmPivot.rotation.x = walk * 0.6;
             const bounce = Math.abs(Math.sin(time * animSpeed)) * 0.1;
             if (state !== ActionState.RIDING_COASTER && !hasWheelchair) group.current.position.y = bounce;
             if (hasIceCream) { rArmPivot.rotation.x = -1; rArmPivot.rotation.z = 0; }
             if (hasGroceries) { lArmPivot.rotation.x = -0.5; lArmPivot.rotation.z = 0.2; }
             if (hasToy) {
                 lArmPivot.rotation.x = -1.5; lArmPivot.rotation.z = 0.5;
                 rArmPivot.rotation.x = -1.5; rArmPivot.rotation.z = -0.5;
             }
        }
        
        // Wheelchair posture
        if (hasWheelchair) {
             lLegPivot.rotation.x = -Math.PI / 2.2;
             rLegPivot.rotation.x = -Math.PI / 2.2;
             
             // Animate Wheels
             if (isMoving && wheelL.current && wheelR.current) {
                 wheelL.current.rotation.x -= speed * 20; 
                 wheelR.current.rotation.x -= speed * 20;
             }
        }
    }
  });

  const bodyY = 1.4; 
  const shoulderY = 1.95; 
  const hipY = 0.8; 
  const armLength = 1.0;
  const legLength = 1.2;

  return (
    <group ref={group} scale={[scale, scale, scale]}>
        {/* Wheelchair Mesh */}
        <group name="Wheelchair" visible={false} position={[0, -0.5, 0]}>
             <mesh position={[0, 0.5, 0]}>
                 <boxGeometry args={[0.8, 0.1, 0.8]} />
                 <meshStandardMaterial color="#333" />
             </mesh>
             <mesh position={[0, 0.8, -0.4]}>
                 <boxGeometry args={[0.8, 0.8, 0.1]} />
                 <meshStandardMaterial color="#333" />
             </mesh>
             
             {/* Big Wheels Group */}
             <group>
                 <mesh ref={wheelL} position={[0.45, 0.4, 0]}>
                     <group rotation={[0, 0, Math.PI/2]}>
                        <torusGeometry args={[0.4, 0.05, 8, 16]} />
                        <meshStandardMaterial color="silver" />
                        {/* Spokes for visibility of rotation */}
                        <mesh rotation={[0,0,Math.PI/2]}>
                            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                        <mesh>
                            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                     </group>
                 </mesh>
                 
                 <mesh ref={wheelR} position={[-0.45, 0.4, 0]}>
                     <group rotation={[0, 0, Math.PI/2]}>
                        <torusGeometry args={[0.4, 0.05, 8, 16]} />
                        <meshStandardMaterial color="silver" />
                        {/* Spokes */}
                        <mesh rotation={[0,0,Math.PI/2]}>
                            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                        <mesh>
                            <cylinderGeometry args={[0.02, 0.02, 0.8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                     </group>
                 </mesh>
             </group>
        </group>

        {/* Head */}
        <mesh name="Head" position={[0, 2.3, 0]} castShadow>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={color} />
            {(job === 'TEACHER' || job === 'CASHIER' || job === 'DOCTOR') && (
                <mesh position={[0, 0.3, 0]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshStandardMaterial color={job === 'TEACHER' ? 'blue' : (job === 'DOCTOR' ? 'white' : 'green')} />
                </mesh>
            )}
            {/* Sunglasses for Relaxing */}
            {state === ActionState.RELAXING && (
                <mesh position={[0, 0, 0.2]}>
                    <boxGeometry args={[0.3, 0.08, 0.1]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            )}
            {/* Halo for Dead */}
            {isDead && (
                <mesh position={[0, 0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <torusGeometry args={[0.3, 0.05, 8, 16]} />
                    <meshStandardMaterial color="gold" emissive="gold" emissiveIntensity={1} />
                </mesh>
            )}
        </mesh>

        {/* Torso */}
        <mesh name="Body" position={[0, bodyY, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
            <meshStandardMaterial color={color} />
            {/* Wings for Dead */}
            {isDead && (
                <group position={[0, 0.5, -0.1]}>
                    <mesh position={[-0.4, 0, 0]} rotation={[0, -0.5, 0]}>
                        <boxGeometry args={[0.6, 0.8, 0.05]} />
                        <meshStandardMaterial color="white" transparent opacity={0.8} />
                    </mesh>
                    <mesh position={[0.4, 0, 0]} rotation={[0, 0.5, 0]}>
                        <boxGeometry args={[0.6, 0.8, 0.05]} />
                        <meshStandardMaterial color="white" transparent opacity={0.8} />
                    </mesh>
                </group>
            )}
            {/* Red Cross for Doctor */}
            {job === 'DOCTOR' && (
                <mesh position={[0, 0, 0.06]}>
                     <boxGeometry args={[0.3, 0.1, 0.02]} />
                     <meshStandardMaterial color="red" />
                     <mesh>
                         <boxGeometry args={[0.1, 0.3, 0.02]} />
                         <meshStandardMaterial color="red" />
                     </mesh>
                </mesh>
            )}
        </mesh>

        <group name="LArmPivot" position={[-0.25, shoulderY, 0]}>
            <mesh name="LArm" position={[0, -armLength / 2, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, armLength, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Grocery Bag */}
            <mesh name="GroceryBag" position={[0, -armLength, 0]} visible={false}>
                <boxGeometry args={[0.4, 0.5, 0.2]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
        </group>

        <group name="RArmPivot" position={[0.25, shoulderY, 0]}>
             <mesh name="RArm" position={[0, -armLength / 2, 0]} castShadow>
                 <cylinderGeometry args={[0.05, 0.05, armLength, 8]} />
                 <meshStandardMaterial color={color} />
             </mesh>
             <group name="IceCream" position={[0, -armLength, 0]} visible={false}>
                 <mesh rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.1, 0.3, 8]} />
                    <meshStandardMaterial color="#d4a373" />
                 </mesh>
                 <mesh position={[0, 0.2, 0]}>
                    <sphereGeometry args={[0.12, 8, 8]} />
                    <meshStandardMaterial color="pink" />
                 </mesh>
             </group>
        </group>

        <group name="LLegPivot" position={[-0.15, hipY, 0]}>
            <mesh name="LLeg" position={[0, -legLength / 2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, legLength, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>

        <group name="RLegPivot" position={[0.15, hipY, 0]}>
            <mesh name="RLeg" position={[0, -legLength / 2, 0]} castShadow>
                <cylinderGeometry args={[0.06, 0.06, legLength, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>

        {/* Toy Bear */}
        <group name="Toy" position={[0, 1.5, 0.5]} visible={false}>
             <mesh position={[0, 0.3, 0]}>
                 <sphereGeometry args={[0.15]} />
                 <meshStandardMaterial color="#d97706" />
             </mesh>
             <mesh position={[0, 0, 0]}>
                 <sphereGeometry args={[0.2]} />
                 <meshStandardMaterial color="#d97706" />
             </mesh>
             <mesh position={[-0.12, 0.4, 0]}>
                 <sphereGeometry args={[0.05]} />
                 <meshStandardMaterial color="#d97706" />
             </mesh>
             <mesh position={[0.12, 0.4, 0]}>
                 <sphereGeometry args={[0.05]} />
                 <meshStandardMaterial color="#d97706" />
             </mesh>
        </group>

        <mesh name="SandCastle" position={[0.5, 0, 0]} visible={false}>
            <coneGeometry args={[0.4, 0.6, 8]} />
            <meshStandardMaterial color="#fcd34d" />
        </mesh>
    </group>
  );
};
