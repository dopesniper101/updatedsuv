
import { Recipe, Item } from './types';

export const MAP_SIZE = 12000;
export const PLAYER_SPEED = 5.5;
export const MAX_RESOURCES = 500;
export const TICK_RATE = 1000 / 60;

export const RECIPES: Recipe[] = [
  {
    id: 'craft_rock',
    name: 'Starter Rock',
    ingredients: [{ type: 'stone', count: 10 }],
    output: { id: 'rock_tool', name: 'Rock', type: 'tool', count: 1, icon: '🪨', durability: 50, maxDurability: 50 }
  },
  {
    id: 'stone_hatchet',
    name: 'Stone Hatchet',
    ingredients: [{ type: 'wood', count: 15 }, { type: 'stone', count: 10 }],
    output: { id: 'hatchet', name: 'Stone Hatchet', type: 'tool', count: 1, icon: '🪓', durability: 100, maxDurability: 100 }
  },
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    ingredients: [{ type: 'wood', count: 15 }, { type: 'stone', count: 15 }],
    output: { id: 'pickaxe', name: 'Stone Pickaxe', type: 'tool', count: 1, icon: '⛏️', durability: 100, maxDurability: 100 }
  },
  {
    id: 'metal_hatchet',
    name: 'Metal Hatchet',
    ingredients: [{ type: 'wood', count: 25 }, { type: 'metal_ore', count: 5 }],
    output: { id: 'metal_hatchet', name: 'Metal Hatchet', type: 'tool', count: 1, icon: '🪓', durability: 250, maxDurability: 250 }
  },
  {
    id: 'metal_pickaxe',
    name: 'Metal Pickaxe',
    ingredients: [{ type: 'wood', count: 25 }, { type: 'metal_ore', count: 5 }],
    output: { id: 'metal_pickaxe', name: 'Metal Pickaxe', type: 'tool', count: 1, icon: '⚒️', durability: 250, maxDurability: 250 }
  },
  {
    id: 'leather_vest',
    name: 'Leather Vest',
    ingredients: [{ type: 'animal_hide', count: 8 }, { type: 'cloth', count: 5 }],
    output: { id: 'leather_vest', name: 'Leather Vest', type: 'armor', count: 1, icon: '🦺', defense: 15, durability: 200, maxDurability: 200 }
  },
  {
    id: 'metal_chestplate',
    name: 'Metal Chestplate',
    ingredients: [{ type: 'metal_ore', count: 20 }, { type: 'animal_hide', count: 5 }],
    output: { id: 'metal_chestplate', name: 'Metal Plate', type: 'armor', count: 1, icon: '🛡️', defense: 35, durability: 300, maxDurability: 300 }
  },
  {
    id: 'wood_foundation',
    name: 'Wood Foundation',
    ingredients: [{ type: 'wood', count: 40 }],
    output: { id: 'foundation', name: 'Wood Foundation', type: 'building', count: 1, icon: '🧱' }
  },
  {
    id: 'wood_wall',
    name: 'Wood Wall',
    ingredients: [{ type: 'wood', count: 25 }],
    output: { id: 'wall', name: 'Wood Wall', type: 'building', count: 1, icon: '🚪' }
  }
];

export const INITIAL_INVENTORY: Item[] = [
  { id: 'rock_tool', name: 'Rock', type: 'tool', count: 1, icon: '🪨', durability: 50, maxDurability: 50 },
  { id: 'torch', name: 'Torch', type: 'tool', count: 1, icon: '🔦', durability: 80, maxDurability: 80 }
];
