/**
 * Game levels for FrankenKiro
 * Three procedurally-themed levels: Lab, Dungeon, Tower
 */

import { LevelMap } from '../types';

/**
 * Level 1: The Laboratory
 * Dr. Frankenstein's abandoned lab where the experiments began
 * Relatively open layout with scattered equipment
 */
export const LEVEL_LAB: LevelMap = {
  width: 16,
  height: 16,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  playerSpawn: { x: 2.5, y: 2.5 },
  enemySpawns: [
    { position: { x: 6.5, y: 6.5 }, enemyType: 'zombie' },
    { position: { x: 10.5, y: 6.5 }, enemyType: 'zombie' },
    { position: { x: 8.5, y: 12.5 }, enemyType: 'zombie' },
  ],
  items: [
    { position: { x: 5.5, y: 2.5 }, itemType: 'ammo', value: 10 },
    { position: { x: 13.5, y: 2.5 }, itemType: 'health', value: 25 },
    { position: { x: 2.5, y: 13.5 }, itemType: 'ammo', value: 10 },
  ],
  exitPoint: { x: 13.5, y: 13.5 },
};


/**
 * Level 2: The Dungeon
 * Underground catacombs with narrow corridors and hidden chambers
 * More maze-like with tighter spaces
 */
export const LEVEL_DUNGEON: LevelMap = {
  width: 20,
  height: 20,
  grid: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  playerSpawn: { x: 1.5, y: 1.5 },
  enemySpawns: [
    { position: { x: 9.5, y: 5.5 }, enemyType: 'zombie' },
    { position: { x: 10.5, y: 5.5 }, enemyType: 'zombie' },
    { position: { x: 5.5, y: 9.5 }, enemyType: 'skeleton' },
    { position: { x: 14.5, y: 9.5 }, enemyType: 'skeleton' },
    { position: { x: 9.5, y: 14.5 }, enemyType: 'zombie' },
  ],
  items: [
    { position: { x: 17.5, y: 1.5 }, itemType: 'health', value: 25 },
    { position: { x: 1.5, y: 9.5 }, itemType: 'ammo', value: 15 },
    { position: { x: 18.5, y: 9.5 }, itemType: 'ammo', value: 15 },
    { position: { x: 9.5, y: 9.5 }, itemType: 'key', value: 1 },
    { position: { x: 1.5, y: 17.5 }, itemType: 'health', value: 50 },
  ],
  exitPoint: { x: 18.5, y: 18.5 },
};
