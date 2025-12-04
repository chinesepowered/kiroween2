/**
 * GameItem module for FrankenKiro
 * Handles item types, collection detection, and item effects on player
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { Vector2 } from '@/engine/types';
import { distance } from '@/engine/vector2';
import { GameItem, ItemType, Player } from './types';
import { heal, addAmmunition, addKey } from './player';

/**
 * Collection radius - how close the player needs to be to collect an item
 */
export const COLLECTION_RADIUS = 0.5;

/**
 * Generate a unique item ID
 */
let itemIdCounter = 0;
export function generateItemId(): string {
  return `item_${++itemIdCounter}`;
}

/**
 * Reset the item ID counter (useful for testing)
 */
export function resetItemIdCounter(): void {
  itemIdCounter = 0;
}

/**
 * Create a new game item
 */
export function createItem(
  type: ItemType,
  position: Vector2,
  value: number,
  spriteId?: string
): GameItem {
  return {
    id: generateItemId(),
    type,
    position: { ...position },
    value,
    collected: false,
    spriteId: spriteId ?? getDefaultSpriteId(type),
  };
}

/**
 * Create a health item
 * Requirements: 5.1
 */
export function createHealthItem(position: Vector2, healAmount: number = 25): GameItem {
  return createItem('health', position, healAmount, 'health_pack');
}

/**
 * Create an ammo item
 * Requirements: 5.2
 */
export function createAmmoItem(position: Vector2, ammoAmount: number = 10): GameItem {
  return createItem('ammo', position, ammoAmount, 'ammo_box');
}

/**
 * Create a key item
 * Requirements: 5.4
 */
export function createKeyItem(position: Vector2, keyId: number = 1): GameItem {
  return createItem('key', position, keyId, `key_${keyId}`);
}


/**
 * Get the default sprite ID for an item type
 */
export function getDefaultSpriteId(type: ItemType): string {
  switch (type) {
    case 'health':
      return 'health_pack';
    case 'ammo':
      return 'ammo_box';
    case 'key':
      return 'key_default';
  }
}

/**
 * Check if a player is within collection range of an item
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function isInCollectionRange(
  playerPosition: Vector2,
  itemPosition: Vector2,
  collectionRadius: number = COLLECTION_RADIUS
): boolean {
  return distance(playerPosition, itemPosition) <= collectionRadius;
}

/**
 * Check if an item can be collected
 * An item can be collected if it hasn't been collected yet and the player is in range
 * Requirements: 5.3
 */
export function canCollectItem(
  item: GameItem,
  playerPosition: Vector2,
  collectionRadius: number = COLLECTION_RADIUS
): boolean {
  if (item.collected) {
    return false;
  }
  return isInCollectionRange(playerPosition, item.position, collectionRadius);
}

/**
 * Result of collecting an item
 */
export interface CollectionResult {
  collected: boolean;
  player: Player;
  item: GameItem;
}

/**
 * Apply item effect to player based on item type
 * Requirements: 5.1, 5.2, 5.4
 */
export function applyItemEffect(player: Player, item: GameItem): Player {
  switch (item.type) {
    case 'health':
      // Requirements: 5.1 - increase player health up to maximum value
      return heal(player, item.value);
    case 'ammo':
      // Requirements: 5.2 - increase ammunition count
      return addAmmunition(player, item.value);
    case 'key':
      // Requirements: 5.4 - add key to player inventory
      return addKey(player, `key_${item.value}`);
  }
}

/**
 * Mark an item as collected
 * Requirements: 5.3
 */
export function markAsCollected(item: GameItem): GameItem {
  return {
    ...item,
    collected: true,
  };
}

/**
 * Attempt to collect an item
 * Returns the updated player and item if collection was successful
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function collectItem(
  player: Player,
  item: GameItem,
  collectionRadius: number = COLLECTION_RADIUS
): CollectionResult {
  // Check if item can be collected
  if (!canCollectItem(item, player.position, collectionRadius)) {
    return {
      collected: false,
      player,
      item,
    };
  }

  // Apply item effect to player
  const updatedPlayer = applyItemEffect(player, item);
  
  // Mark item as collected (Requirements: 5.3)
  const updatedItem = markAsCollected(item);

  return {
    collected: true,
    player: updatedPlayer,
    item: updatedItem,
  };
}


/**
 * Result of processing multiple items
 */
export interface ItemsProcessResult {
  player: Player;
  items: GameItem[];
  collectedCount: number;
}

/**
 * Process all items in a level, collecting any that the player is in range of
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function processItems(
  player: Player,
  items: GameItem[],
  collectionRadius: number = COLLECTION_RADIUS
): ItemsProcessResult {
  let currentPlayer = player;
  let collectedCount = 0;
  
  const updatedItems = items.map((item) => {
    const result = collectItem(currentPlayer, item, collectionRadius);
    if (result.collected) {
      currentPlayer = result.player;
      collectedCount++;
      return result.item;
    }
    return item;
  });

  return {
    player: currentPlayer,
    items: updatedItems,
    collectedCount,
  };
}

/**
 * Get all uncollected items from a list
 */
export function getUncollectedItems(items: GameItem[]): GameItem[] {
  return items.filter((item) => !item.collected);
}

/**
 * Get all collected items from a list
 */
export function getCollectedItems(items: GameItem[]): GameItem[] {
  return items.filter((item) => item.collected);
}

/**
 * Find the nearest uncollected item to a position
 */
export function findNearestItem(
  position: Vector2,
  items: GameItem[]
): GameItem | null {
  const uncollected = getUncollectedItems(items);
  if (uncollected.length === 0) {
    return null;
  }

  let nearest: GameItem | null = null;
  let nearestDistance = Infinity;

  for (const item of uncollected) {
    const dist = distance(position, item.position);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearest = item;
    }
  }

  return nearest;
}

/**
 * Create items from spawn data (used when loading levels)
 */
export function createItemsFromSpawns(
  spawns: Array<{ position: Vector2; itemType: ItemType; value: number }>
): GameItem[] {
  return spawns.map((spawn) => createItem(spawn.itemType, spawn.position, spawn.value));
}
