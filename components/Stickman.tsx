
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, MathUtils } from 'three';
import { Html } from '@react-three/drei';
import { ActionState, HouseData, Role, ShopData, SchoolData, ParkData, StoreData, BeachData, ArcadeData, AirportData, TravelState } from '../types';
import { getSchoolDeskPosition } from './School';

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
  isNight: boolean;
  job?: 'TEACHER' | 'CASHIER';
  travelState: TravelState;
  onLog: (msg: string, type: 'normal' | 'alert') => void;
  timeOffset: React.MutableRefObject<number>;
}

const WALK_SPEED_PARENT = 0.05;
const WALK_SPEED_CHILD = 0.12; 

export const Stickman: React.FC<StickmanProps> = ({ role, color, id, home, shop, school, park, store, beach, arcade, airport, isNight, job, travelState, onLog, timeOffset }) => {
  const group = useRef<Group>(null);
  
  // State
  const [state, setState] = useState<ActionState>(ActionState.IDLE);
  const [target, setTarget] = useState<Vector3 | null>(null);
  const [hasIceCream, setHasIceCream] = useState(false);
  const [hasGroceries, setHasGroceries] = useState(false);
  const [hasToy, setHasToy] = useState(false);
  const [waitTimer, setWaitTimer] = useState(0);
  
  // Travel Sub-state
  const [travelStep, setTravelStep] = useState(0);

  // Flags for one-time checks per day/night
  const [checkedNightActivity, setCheckedNightActivity] = useState(false);

  // Position management
  const initialPos = useMemo(() => new Vector3(
    home.position[0] + (Math.random() * 2 - 1),
    0,
    home.position[2] + 4
  ), [home]);
  
  const currentPos = useRef(initialPos.clone());
  const speed = role === 'CHILD' ? WALK_SPEED_CHILD : WALK_SPEED_PARENT;
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
             if (state !== ActionState.FLYING) {
                 setState(ActionState.FLYING);
                 setTarget(null);
             }
        }
        else if (travelState.status === 'RETURNING') {
             if (state === ActionState.FLYING) {
                 // Teleport to Terminal Exit
                 currentPos.current.copy(airport.terminalPos.clone().add(new Vector3(0,0,10)));
                 setState(ActionState.IDLE);
                 // Walk home
                 setTarget(new Vector3(...home.position));
                 setState(ActionState.WALKING);
             }
        }
        else if (travelState.status === 'CRASHED') {
             // Logic handled by Scene unmounting this component, but if we persist:
             setState(ActionState.CRASHED);
        }

        if (state === ActionState.WAITING_FOR_FLIGHT || state === ActionState.FLYING) return;
    }


    // --- PARENT LOGIC ---
    if (role === 'PARENT') {
        
        // JOB LOGIC
        if (job) {
             const isWorkTime = cycleTime >= 60 && cycleTime < 300; // Work all day (Min 2-5)
             
             if (isWorkTime) {
                 if (state !== ActionState.TEACHING && state !== ActionState.WORKING) {
                     if (job === 'TEACHER') {
                        setTarget(school.teacherPos.clone());
                        setState(ActionState.TEACHING);
                     } else if (job === 'CASHIER') {
                        const regIndex = parseInt(id.split('-')[1]) % 2; 
                        const regPos = store.registers[regIndex] || store.registers[0];
                        setTarget(regPos.clone());
                        setState(ActionState.WORKING);
                     }
                 }
                 return; 
             } else {
                 if (state === ActionState.TEACHING || state === ActionState.WORKING) {
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
                else if (rand < 0.06) {
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
        if (state !== ActionState.PLAYING && state !== ActionState.BUILDING_SAND && state !== ActionState.PLAYING_ARCADE) {
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

            if (!target && state !== ActionState.BUYING && state !== ActionState.EATING && state !== ActionState.SHOPPING && state !== ActionState.BROWSING && state !== ActionState.CHECKOUT && state !== ActionState.PLAYING_ARCADE && state !== ActionState.CHEERING) {
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
                // 40% Arcade
                else if (rand < 0.65 && !hasToy) {
                    const machine = arcade.clawMachines[Math.floor(Math.random() * arcade.clawMachines.length)];
                    setTarget(machine.clone().add(new Vector3(1, 0, 0))); 
                    setState(ActionState.PLAYING_ARCADE);
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

    if (state === ActionState.FLYING || state === ActionState.CRASHED) {
        group.current.visible = false;
        return;
    } else {
        group.current.visible = true;
    }

    // Movement
    if (target) {
        const direction = new Vector3().subVectors(target, currentPos.current);
        const dist = direction.length();

        if (dist > 0.2) {
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
        }
    }

    // Apply Position
    group.current.position.copy(currentPos.current);

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

    if (body && lLegPivot && rLegPivot && lArmPivot && rArmPivot && head) {
        // Reset
        lLegPivot.rotation.set(0,0,0);
        rLegPivot.rotation.set(0,0,0);
        lArmPivot.rotation.set(0,0,0);
        rArmPivot.rotation.set(0,0,0);
        head.rotation.set(0,0,0);
        group.current.rotation.x = 0;
        group.current.position.y = 0; 
        
        if(iceCream) iceCream.visible = hasIceCream;
        if(groceryBag) groceryBag.visible = hasGroceries;
        if(sandCastle) sandCastle.visible = state === ActionState.BUILDING_SAND;
        if(toy) toy.visible = hasToy;

        const isMoving = target && currentPos.current.distanceTo(target) > 0.2;

        if (state === ActionState.SLEEPING && !isMoving) {
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

        } else if (state === ActionState.PLAYING && !isMoving) {
             const jump = Math.abs(Math.sin(time * 8)) * 0.5;
             group.current.position.y = jump;
             lArmPivot.rotation.z = 2.5; rArmPivot.rotation.z = -2.5;

        } else if ((state === ActionState.SHOPPING || state === ActionState.CHECKOUT || state === ActionState.TRAVELING) && isMoving) {
             lArmPivot.rotation.x = -0.8;
             rArmPivot.rotation.x = -0.8;
             const walk = Math.sin(time * 10);
             lLegPivot.rotation.x = walk * 0.6;
             rLegPivot.rotation.x = -walk * 0.6;
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
             lLegPivot.rotation.x = walk * 0.6;
             rLegPivot.rotation.x = -walk * 0.6;
             lArmPivot.rotation.x = -walk * 0.6;
             rArmPivot.rotation.x = walk * 0.6;
             const bounce = Math.abs(Math.sin(time * animSpeed)) * 0.1;
             group.current.position.y = bounce;
             if (hasIceCream) { rArmPivot.rotation.x = -1; rArmPivot.rotation.z = 0; }
             if (hasGroceries) { lArmPivot.rotation.x = -0.5; lArmPivot.rotation.z = 0.2; }
             if (hasToy) {
                 lArmPivot.rotation.x = -1.5; lArmPivot.rotation.z = 0.5;
                 rArmPivot.rotation.x = -1.5; rArmPivot.rotation.z = -0.5;
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
        {/* Head */}
        <mesh name="Head" position={[0, 2.3, 0]} castShadow>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color={color} />
            {(job === 'TEACHER' || job === 'CASHIER') && (
                <mesh position={[0, 0.3, 0]}>
                    <coneGeometry args={[0.15, 0.4, 8]} />
                    <meshStandardMaterial color={job === 'TEACHER' ? 'blue' : 'green'} />
                </mesh>
            )}
        </mesh>

        {/* Torso */}
        <mesh name="Body" position={[0, bodyY, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
            <meshStandardMaterial color={color} />
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
