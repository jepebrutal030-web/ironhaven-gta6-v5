// IRONHAVEN — tuning, city layout and story data. All numbers live here so
// the simulation modules stay free of magic constants.
export const WORLD = {
  size: 392,
  half: 196,
  roads: [-168, -112, -56, 0, 56, 112, 168],
  roadWidth: 10,
  block: 46,
};

export const SAVE_KEY = 'ironhaven.save.v5';

export const PLAYER = {
  walkSpeed: 5.2,
  sprintSpeed: 8.4,
  radius: 0.5,
  height: 1.8,
  health: 100,
  jumpSpeed: 7.5,
  gravity: 22,
};

export const CAR = {
  accel: 15,
  brake: 26,
  reverseMax: 9,
  topSpeed: 27,
  cruiseSpeed: 8, // staged screenshot driving: ~18 mph on the speedometer
  steerRate: 1.9,
  radius: 1.7,
};

export const COMBAT = {
  magazine: 12,
  damage: 34,
  pedHp: 100,
  copHp: 100,
  range: 60,
  reloadSeconds: 1.2,
};

export const WANTED = {
  max: 5,
  spawnInterval: 1.2, // game-seconds between police spawns
  decaySeconds: 15,
  ramPush: 3, // m/s shove on the player while a police car touches them
  ramDamage: 6, // hp per second while a police car touches them
  arrestDistance: 1.3,
  arrestSeconds: 1.2,
  latchDistance: 1.8,
};

// The player starts on the x=0 road, facing north (-Z).
export const SPAWN = { x: 0, z: 10 };
// The hideout the first mission ends at.
export const HIDEOUT = { x: -56, z: -140, r: 7 };
// The golden car for the final mission, on the harbor dock road.
export const GOLDEN = { x: 172, z: 28 };
// A warehouse that must never occlude the mission screenshot camera.
export const WAREHOUSE = { x: 140, z: 28 };

// Blocks with no buildings in them: open plazas so mission targets are
// always reachable on foot or by car.
export const PLAZAS = [
  { x: 28, z: 84 },
  { x: -140, z: 112 },
  { x: 84, z: -112 },
];

export const MISSIONS = [
  {
    name: 'Homecoming',
    reward: 300,
    steps: [
      { text: 'Steal a car', kind: 'steal' },
      { text: 'Drive to the hideout', kind: 'goto', target: [-56, -140, 7] },
    ],
  },
  {
    name: 'Pickup',
    reward: 500,
    steps: [
      { text: 'Pick up Dario at the plaza', kind: 'goto', target: [40, 84, 6] },
      { text: 'Drive Dario to the club', kind: 'goto', target: [-112, 56, 7] },
    ],
  },
  {
    name: 'Getaway',
    reward: 700,
    steps: [
      { text: 'Steal the getaway car', kind: 'stealAt', target: [112, -56, 6] },
      { text: 'Reach the north docks', kind: 'goto', target: [-168, 140, 8] },
    ],
  },
  {
    name: 'Shakedown',
    reward: 1000,
    steps: [
      { text: 'Collect from the corner shop', kind: 'goto', target: [-140, 112, 6] },
      { text: 'Collect from the diner', kind: 'goto', target: [84, -112, 6] },
      { text: 'Return to the hideout', kind: 'goto', target: [-56, -140, 7] },
    ],
  },
  {
    name: 'Harbor Job',
    reward: 1500,
    steps: [
      { text: 'Steal the golden Manta at the harbor', kind: 'stealAt', target: [172, 28, 6] },
      { text: 'Drive the Manta to the warehouse', kind: 'goto', target: [140, 44, 8] },
    ],
  },
];

export const CAR_MODELS = [
  { name: 'Manta', len: 4.6, wid: 1.9, roof: 'sport' },
  { name: 'Cortez', len: 4.4, wid: 1.85, roof: 'sedan' },
  { name: 'Bison', len: 5.2, wid: 2.0, roof: 'truck' },
  { name: 'Vesper', len: 4.2, wid: 1.8, roof: 'hatch' },
  { name: 'Regal', len: 4.9, wid: 1.95, roof: 'sedan' },
  { name: 'Hauler', len: 5.6, wid: 2.1, roof: 'van' },
  { name: 'Comet', len: 4.3, wid: 1.85, roof: 'sport' },
  { name: 'Patriot', len: 4.8, wid: 2.0, roof: 'suv' },
];

export const PALETTE = {
  sky: 0x8fc3e8,
  fog: 0xa8c8de,
  sun: 0xfff2d8,
  hemiSky: 0xbfd9ff,
  hemiGround: 0x8a7a5f,
  asphalt: '#45484e',
  grass: '#5d8a4a',
  sidewalk: '#9a9a92',
  downtown: ['#7fa8c9', '#a8b8c8', '#c9a86a', '#8fa8b8'],
  residential: ['#b87a5a', '#c9a06a', '#9a6a5a', '#7a8a6a'],
  harbor: ['#6a7a8a', '#8a7a6a', '#5a6a7a'],
};
