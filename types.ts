
export type ResourceType = 'wood' | 'stone' | 'metal_ore' | 'cloth' | 'food' | 'animal_hide';
export type NpcType = 'wolf' | 'bear' | 'boar' | 'chicken';
export type WeatherType = 'clear' | 'rain' | 'fog' | 'storm';
export type EntityType = 'tree' | 'rock' | 'berry_bush' | 'animal' | 'building_part' | 'ground_wood' | 'ground_stone';

export interface Item {
  id: string;
  name: string;
  type: 'tool' | 'resource' | 'consumable' | 'building' | 'armor';
  count: number;
  icon: string;
  durability?: number;
  maxDurability?: number;
  defense?: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: { type: ResourceType; count: number }[];
  output: Item;
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  variant?: string;
}

export interface Npc {
  id: string;
  type: NpcType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  rotation: number;
  state: 'idle' | 'chasing' | 'fleeing';
}

export interface BuildingPart extends Entity {
  partType: 'foundation' | 'wall' | 'door';
  ownerId: string;
}

export interface GameSettings {
  viewDistance: number;
  graphicsQuality: 'Low' | 'Medium' | 'High' | 'Ultra';
  performanceMode: boolean;
  fov: number; // Zoom level in top-down
  showFPS: boolean;
  cameraBobEnabled: boolean;
  uiScale: number;
  crosshairColor: string;
  weatherEnabled: boolean;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    health: number;
    hunger: number;
    thirst: number;
    stamina: number;
    rotation: number;
    isExhausted: boolean;
    isCrouching: boolean;
  };
  inventory: Item[];
  entities: Entity[];
  npcs: Npc[];
  buildingParts: BuildingPart[];
  dayTime: number; 
  weather: {
    type: WeatherType;
    intensity: number;
    transition: number;
  };
  logs: string[];
  settings: GameSettings;
}

export type GameStatus = 'menu' | 'playing' | 'dead';
