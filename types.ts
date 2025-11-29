
import { Vector3 } from 'three';

export enum ActionState {
  IDLE = 'IDLE',
  WALKING = 'WALKING',
  EATING = 'EATING',
  SLEEPING = 'SLEEPING',
  GROUNDED = 'GROUNDED',
  BUYING = 'BUYING', // Buying ice cream
  LEARNING = 'LEARNING', // At School
  PLAYING = 'PLAYING', // At Park
  WATCHING_TV = 'WATCHING_TV',
  TEACHING = 'TEACHING',
  SHOPPING = 'SHOPPING', // Walking to shelf
  BROWSING = 'BROWSING', // Picking item
  CHECKOUT = 'CHECKOUT', // Walking to register
  WORKING = 'WORKING',
  SWIMMING = 'SWIMMING',
  BUILDING_SAND = 'BUILDING_SAND',
  PLAYING_ARCADE = 'PLAYING_ARCADE',
  CHEERING = 'CHEERING',
  TRAVELING = 'TRAVELING',
  WAITING_FOR_FLIGHT = 'WAITING_FOR_FLIGHT',
  FLYING = 'FLYING',
  CRASHED = 'CRASHED'
}

export type Role = 'PARENT' | 'CHILD';

export interface FurniturePosition {
  type: 'BED' | 'COUCH' | 'CORNER' | 'TV';
  position: Vector3; // World position
  rotation?: number; // Y-axis rotation in radians
}

export interface HouseData {
  id: string;
  position: [number, number, number];
  color: string;
  furniture: FurniturePosition[];
}

export interface ShopData {
  position: Vector3;
  entryPoint: Vector3;
}

export interface SchoolData {
  position: Vector3;
  entryPoint: Vector3;
  teacherPos: Vector3;
}

export interface ParkData {
  position: Vector3;
  entryPoint: Vector3;
}

export interface StoreData {
  position: Vector3;
  entryPoint: Vector3;
  registers: Vector3[];
}

export interface BeachData {
  position: Vector3;
  entryPoint: Vector3;
  buildingSpots: Vector3[]; // 9x9 grid
}

export interface ArcadeData {
  position: Vector3;
  entryPoint: Vector3;
  clawMachines: Vector3[];
  gameCabinets: Vector3[];
}

export interface AirportData {
  position: Vector3;
  terminalPos: Vector3;
  checkInPos: Vector3;
  securityPos: Vector3;
  gatePos: Vector3;
  runwayStart: Vector3;
}

export interface StickmanData {
  id: string;
  role: Role;
  color: string;
  homeId: string;
  job?: 'TEACHER' | 'CASHIER';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'normal' | 'alert';
}

export interface TravelState {
    status: 'IDLE' | 'BOARDING' | 'AWAY' | 'RETURNING' | 'CRASHED';
    travelerHouseId: string | null;
    flightProgress: number; // 0 to 1 for animation
    daysAway: number;
}
