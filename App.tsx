
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import LandingPage from './components/LandingPage';
import LoadingScreen from './components/LoadingScreen';
import { GameState, Item, Recipe, Entity, ResourceType, GameStatus, Npc, NpcType, WeatherType } from './types';
import { MAP_SIZE, PLAYER_SPEED, INITIAL_INVENTORY, RECIPES, TICK_RATE } from './constants';
import { getSurvivalTips } from './services/geminiService';
import { soundManager } from './services/soundService';

const SPRINT_MULTIPLIER = 1.6;
const CROUCH_MULTIPLIER = 0.5;
const STAMINA_DECAY = 0.45;
const STAMINA_REGEN = 0.25;
const COLLISION_RADIUS = 8;
const HAND_HARVEST_DAMAGE = 2;
const NPC_SAFE_DISTANCE = 55; 
const WATER_THRESHOLD = 0.1; 
const CRITICAL_STAT_THRESHOLD = 15;
const STARVATION_DRAIN = 0.04;

// Height function moved outside to be accessible for initialization
const getHeightAt = (x: number, y: number) => {
  const centerX = MAP_SIZE / 2;
  const centerY = MAP_SIZE / 2;
  const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  let h = 1.0 - (dist / (MAP_SIZE * 0.48));
  h += Math.sin(x / 1200) * 0.1 + Math.cos(y / 1200) * 0.1;
  h += Math.sin(x / 400 + y / 500) * 0.05;
  h += Math.sin(x / 150) * 0.02;
  return h;
};

const getSpawnPoint = () => {
  let attempts = 0;
  // Try to find a valid beach spot
  while (attempts < 200) {
    const angle = Math.random() * Math.PI * 2;
    // Estimate radius for beach (height ~0.12-0.18). 
    // Height drops linearly with distance roughly.
    const dist = 4800 + Math.random() * 1000; 
    const x = (MAP_SIZE / 2) + Math.cos(angle) * dist;
    const y = (MAP_SIZE / 2) + Math.sin(angle) * dist;
    const h = getHeightAt(x, y);
    
    // Valid beach zone: Just above water threshold (0.1)
    if (h > 0.11 && h < 0.16) {
      return { x, y };
    }
    attempts++;
  }
  // Fallback if random gen fails (unlikely)
  return { x: MAP_SIZE / 2 + 5000, y: MAP_SIZE / 2 };
};

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [uiState, setUiState] = useState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false });
  const [swingProgress, setSwingProgress] = useState(0);
  const [isSwimming, setIsSwimming] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fps, setFps] = useState(0);

  const [gameState, setGameState] = useState<GameState>(() => {
    const spawn = getSpawnPoint();
    return {
      player: { x: spawn.x, y: spawn.y, health: 100, hunger: 100, thirst: 100, stamina: 100, rotation: 0, isExhausted: false, isCrouching: false },
      inventory: INITIAL_INVENTORY,
      entities: [],
      npcs: [],
      buildingParts: [],
      dayTime: 720, 
      weather: { type: 'clear', intensity: 0, transition: 1 },
      logs: ['Welcome to RUSTED.', 'Survival is the only objective.'],
      settings: {
        viewDistance: 2500,
        graphicsQuality: 'High',
        performanceMode: false,
        fov: 60,
        showFPS: true,
        cameraBobEnabled: true,
        uiScale: 1.0,
        crosshairColor: '#f97316',
        weatherEnabled: true
      }
    };
  });

  const [activeItemId, setActiveItemId] = useState<string | null>('rock_tool');
  const [isGameOver, setIsGameOver] = useState(false);
  
  const keysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lastTickRef = useRef<number>(0);
  const geminiTickRef = useRef<number>(0);
  const weatherChangeTickRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(gameState);
  const isSwingingRef = useRef(false);
  const frameTimes = useRef<number[]>([]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const initialEntities: Entity[] = [];
    const SPAWN_PADDING = 40; 
    let count = 0;
    let attempts = 0;
    
    while (count < 1200 && attempts < 50000) {
      attempts++;
      const rx = Math.random() * MAP_SIZE;
      const ry = Math.random() * MAP_SIZE;
      
      let overlaps = false;
      for (const ent of initialEntities) {
        const dx = ent.x - rx;
        const dy = ent.y - ry;
        if ((dx * dx + dy * dy) < SPAWN_PADDING * SPAWN_PADDING) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      const h = getHeightAt(rx, ry);
      if (h > WATER_THRESHOLD + 0.08) {
        const rand = Math.random();
        let type: any = 'tree';
        if (rand < 0.2) type = 'ground_wood';
        else if (rand < 0.4) type = 'ground_stone';
        else if (rand < 0.7) type = 'tree';
        else type = 'rock';

        let variant = "0";
        if (type === 'tree') {
             if (h < 0.32) {
                variant = Math.random() < 0.5 ? "3" : "4";
             } else if (h > 0.72) {
                variant = Math.random() < 0.5 ? "2" : "5";
             } else {
                variant = Math.random() < 0.5 ? "0" : "1";
             }
        } else if (type === 'rock') {
             variant = Math.floor(Math.random() * 3).toString();
        }

        initialEntities.push({
          id: `ent-${count}`, 
          type, 
          x: rx, 
          y: ry,
          health: type.includes('ground') ? 1 : 100,
          maxHealth: type.includes('ground') ? 1 : 100,
          variant: type === 'tree' || type === 'rock' ? variant : undefined
        });
        count++;
      }
    }

    const initialNpcs: Npc[] = [];
    const npcTypes: NpcType[] = ['wolf', 'bear', 'boar', 'chicken'];
    let npcCount = 0;
    let npcAttempts = 0;

    while (npcCount < 80 && npcAttempts < 20000) {
      npcAttempts++;
      const rx = Math.random() * MAP_SIZE;
      const ry = Math.random() * MAP_SIZE;
      
      let overlaps = false;
      for (const ent of initialEntities) {
        const dx = ent.x - rx;
        const dy = ent.y - ry;
        if ((dx * dx + dy * dy) < SPAWN_PADDING * SPAWN_PADDING) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        for (const npc of initialNpcs) {
          const dx = npc.x - rx;
          const dy = npc.y - ry;
          if ((dx * dx + dy * dy) < SPAWN_PADDING * SPAWN_PADDING) {
            overlaps = true;
            break;
          }
        }
      }

      if (overlaps) continue;

      const h = getHeightAt(rx, ry);
      if (h > WATER_THRESHOLD + 0.05) {
        const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
        let mH = 100;
        if (type === 'bear') mH = 300;
        if (type === 'wolf') mH = 120;
        if (type === 'boar') mH = 80;
        if (type === 'chicken') mH = 20;

        initialNpcs.push({
          id: `npc-${npcCount}`,
          type,
          x: rx, y: ry, health: mH, maxHealth: mH, rotation: Math.random() * Math.PI * 2, state: 'idle'
        });
        npcCount++;
      }
    }
    setGameState(prev => ({ ...prev, entities: initialEntities, npcs: initialNpcs }));
  }, []);

  const checkCollision = (newX: number, newY: number, state: GameState): boolean => {
    for (const ent of state.entities) {
      if (ent.type.includes('ground')) continue; 
      const radius = ent.type === 'tree' ? 8 : 6;
      if ((newX - ent.x)**2 + (newY - ent.y)**2 < (radius + COLLISION_RADIUS)**2) return true;
    }
    for (const bp of state.buildingParts) {
      const radius = bp.partType === 'foundation' ? 35 : 10;
      if ((newX - bp.x)**2 + (newY - bp.y)**2 < (radius + COLLISION_RADIUS)**2) return true;
    }
    return false;
  };

  const performAction = useCallback((screenX: number, screenY: number) => {
    if (isSwingingRef.current) return;
    isSwingingRef.current = true;
    setSwingProgress(0);

    const currentState = gameStateRef.current;
    const zoom = currentState.settings.fov / 90;
    const worldX = currentState.player.x + (screenX - window.innerWidth / 2) / zoom;
    const worldY = currentState.player.y + (screenY - window.innerHeight / 2) / zoom;
    const activeItem = currentState.inventory.find(i => i.id === activeItemId);

    // Calculate Tool/Weapon Power
    let toolTier = 0; // 0=Hand, 1=Rock, 2=Stone, 3=Metal
    if (activeItem?.id.startsWith('metal')) toolTier = 3;
    else if (activeItem?.id.startsWith('hatchet') || activeItem?.id.startsWith('pickaxe')) toolTier = 2;
    else if (activeItem?.id.startsWith('rock')) toolTier = 1;

    const clickedNpc = currentState.npcs.find(n => Math.sqrt((n.x - worldX)**2 + (n.y - worldY)**2) < 40);
    if (clickedNpc && Math.sqrt((clickedNpc.x - currentState.player.x)**2 + (clickedNpc.y - currentState.player.y)**2) < 160) {
      const damage = toolTier === 3 ? 55 : toolTier === 2 ? 34 : toolTier === 1 ? 15 : 5;
      const isFatal = clickedNpc.health - damage <= 0;
      soundManager.playHitNpc();

      setGameState(prev => {
        let newHealth = prev.player.health;
        // Hit-back damage only if hand/torch
        if (!activeItem || activeItem.id === 'torch') newHealth = Math.max(0, newHealth - HAND_HARVEST_DAMAGE);
        const newInv = [...prev.inventory];
        const addLoot = (lootItem: Partial<Item>) => {
          const existing = newInv.findIndex(i => i.id === lootItem.id);
          if (existing > -1) newInv[existing].count += (lootItem.count || 1);
          else newInv.push({ id: lootItem.id || 'unknown', name: lootItem.name || 'Loot', type: lootItem.type as any || 'resource', count: lootItem.count || 1, icon: lootItem.icon || '📦' });
        };
        if (isFatal) {
          switch(clickedNpc.type) {
            case 'wolf': 
                addLoot({ id: 'meat_wolf', name: 'Wolf Meat', icon: '🍖', count: 2, type: 'consumable' }); 
                addLoot({ id: 'cloth', name: 'Cloth', icon: '🧵', count: 5, type: 'resource' }); 
                addLoot({ id: 'animal_hide', name: 'Animal Hide', icon: '🐃', count: 3, type: 'resource' });
                break;
            case 'bear': 
                addLoot({ id: 'meat_bear', name: 'Bear Meat', icon: '🥩', count: 6, type: 'consumable' }); 
                addLoot({ id: 'cloth', name: 'Cloth', icon: '🧵', count: 12, type: 'resource' }); 
                addLoot({ id: 'animal_hide', name: 'Animal Hide', icon: '🐃', count: 8, type: 'resource' });
                break;
            case 'boar': 
                addLoot({ id: 'meat_boar', name: 'Boar Meat', icon: '🥓', count: 4, type: 'consumable' }); 
                addLoot({ id: 'cloth', name: 'Cloth', icon: '🧵', count: 3, type: 'resource' }); 
                addLoot({ id: 'animal_hide', name: 'Animal Hide', icon: '🐃', count: 2, type: 'resource' });
                break;
            case 'chicken': 
                addLoot({ id: 'meat_chicken', name: 'Raw Chicken', icon: '🍗', count: 1, type: 'consumable' }); 
                break;
          }
        }
        return { ...prev, npcs: prev.npcs.map(n => n.id === clickedNpc.id ? { ...n, health: n.health - damage } : n), player: { ...prev.player, health: newHealth }, inventory: newInv, logs: [...prev.logs.slice(-8), isFatal ? `KILLED: ${clickedNpc.type.toUpperCase()}` : `HIT: ${clickedNpc.type.toUpperCase()}`] };
      });
      return; 
    }

    const clickedEntity = currentState.entities.find(e => Math.sqrt((e.x - worldX)**2 + (e.y - worldY)**2) < 50);
    if (clickedEntity && Math.sqrt((clickedEntity.x - currentState.player.x)**2 + (clickedEntity.y - currentState.player.y)**2) < 160) {
      const isGround = clickedEntity.type.includes('ground');
      const resType: ResourceType = (clickedEntity.type.includes('wood')) ? 'wood' : 'stone';
      
      const isCorrectTool = (activeItem?.id.includes('hatchet') && resType === 'wood') || (activeItem?.id.includes('pickaxe') && resType === 'stone');
      const isRock = activeItem?.id.startsWith('rock_tool');
      const isPunching = !isCorrectTool && !isRock && !isGround;
      
      if (resType === 'wood') soundManager.playWoodHit(); else soundManager.playStoneHit();
      
      setGameState(prev => {
        const damage = isGround ? 100 : (toolTier === 3 && isCorrectTool ? 50 : (isCorrectTool ? 34 : (isRock ? 15 : 5)));
        const gain = isGround ? 5 : (toolTier === 3 && isCorrectTool ? 18 : (isCorrectTool ? 12 : (isRock ? 3 : 1)));
        
        let newHealth = prev.player.health;
        if (isPunching) newHealth = Math.max(0, newHealth - HAND_HARVEST_DAMAGE);
        
        let newInv = [...prev.inventory];
        const addLoot = (id: string, name: string, count: number, icon: string, type: 'resource') => {
             const existing = newInv.findIndex(i => i.id === id);
             if (existing > -1) newInv[existing].count += count;
             else newInv.push({ id, name, type, count, icon });
        };

        addLoot(resType, resType.toUpperCase(), gain, resType === 'wood' ? '🪵' : '🪨', 'resource');

        // Chance for Metal Ore when mining Stone
        if (resType === 'stone' && !isGround && Math.random() < 0.15) {
             addLoot('metal_ore', 'Metal Ore', toolTier >= 2 ? 3 : 1, '🔩', 'resource');
        }

        return { ...prev, entities: prev.entities.map(e => e.id === clickedEntity.id ? { ...e, health: e.health - damage } : e).filter(e => e.health > 0), inventory: newInv, player: { ...prev.player, health: newHealth }, logs: [...prev.logs.slice(-8), `RESOURCES: +${gain} ${resType}`] };
      });
    }
  }, [activeItemId]);

  const consumeActiveItem = useCallback(() => {
    const currentState = gameStateRef.current;
    const activeItem = currentState.inventory.find(i => i.id === activeItemId);
    if (activeItem && activeItem.type === 'consumable') {
      soundManager.playEat();
      setGameState(prev => {
        const newInv = [...prev.inventory];
        const idx = newInv.findIndex(i => i.id === activeItemId);
        newInv[idx].count -= 1;
        return { ...prev, player: { ...prev.player, health: Math.min(100, prev.player.health + 15), hunger: Math.min(100, prev.player.hunger + 25) }, inventory: newInv.filter(i => i.count > 0), logs: [...prev.logs.slice(-8), `CONSUMED: ${activeItem.name.toUpperCase()}`] };
      });
    } else {
      performAction(mousePosRef.current.x, mousePosRef.current.y);
    }
  }, [activeItemId, performAction]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      if (gameStatus === 'playing') {
        if (key === 'tab') { e.preventDefault(); setUiState(prev => ({ ...prev, inventoryOpen: !prev.inventoryOpen, craftingOpen: false, settingsOpen: false })); }
        if (key === 'c') { setUiState(prev => ({ ...prev, craftingOpen: !prev.craftingOpen, inventoryOpen: false, settingsOpen: false })); }
        if (key === 'x') { setUiState(prev => ({ ...prev, settingsOpen: !prev.settingsOpen, inventoryOpen: false, craftingOpen: false })); }
        if (key === 'e') { consumeActiveItem(); }
        if (key === 'escape') { setUiState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false }); }
        if (['1','2','3','4','5','6'].includes(key)) {
          const idx = parseInt(key) - 1;
          const hotbarItems = gameStateRef.current.inventory.filter(i => ['tool', 'building', 'consumable', 'armor'].includes(i.type));
          if (hotbarItems[idx]) setActiveItemId(hotbarItems[idx].id);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousemove', handleMouseMove); };
  }, [gameStatus, consumeActiveItem]);

  useEffect(() => {
    if (gameStatus !== 'playing' || isGameOver) return;
    const gameLoop = (time: number) => {
      frameTimes.current.push(time);
      if (frameTimes.current.length > 60) {
        const delta = frameTimes.current[frameTimes.current.length - 1] - frameTimes.current[0];
        setFps(Math.round(60 / (delta / 1000)));
        frameTimes.current.shift();
      }

      const targetFpsInterval = uiState.settingsOpen ? 33.33 : TICK_RATE;
      const delta = time - lastTickRef.current;
      
      if (delta >= targetFpsInterval) {
        lastTickRef.current = time;
        const keys = keysRef.current;
        const mouse = mousePosRef.current;
        if (isSwingingRef.current) {
          setSwingProgress(prev => {
            const next = prev + 0.18;
            if (next >= 1) { isSwingingRef.current = false; return 0; }
            return next;
          });
        }
        setGameState(prev => {
          let { x, y, stamina, isExhausted, health, hunger, thirst } = prev.player;
          const rotation = Math.atan2(mouse.y - window.innerHeight / 2, mouse.x - window.innerWidth / 2);
          let moveX = 0; let moveY = 0;
          const isCrouching = keys.has('control');
          if (stamina <= 0) isExhausted = true;
          if (stamina >= 20) isExhausted = false;
          const isSprinting = keys.has('shift') && stamina > 0 && !isExhausted && !isCrouching;

          hunger = Math.max(0, hunger - 0.003);
          thirst = Math.max(0, thirst - 0.005);

          let healthDrain = 0;
          if (hunger < CRITICAL_STAT_THRESHOLD) healthDrain += STARVATION_DRAIN;
          if (thirst < CRITICAL_STAT_THRESHOLD) healthDrain += STARVATION_DRAIN;
          health = Math.max(0, health - healthDrain);

          let staminaRegenPenalty = (hunger < CRITICAL_STAT_THRESHOLD || thirst < CRITICAL_STAT_THRESHOLD) ? 0.5 : 1.0;

          // Calculate Armor Defense
          const totalDefense = prev.inventory
            .filter(i => i.type === 'armor')
            .reduce((sum, item) => sum + (item.defense || 0), 0);
          
          const damageMultiplier = Math.max(0.1, 1 - (totalDefense / 100));

          if (!uiState.inventoryOpen && !uiState.craftingOpen && !uiState.settingsOpen) {
            if (keys.has('w')) { moveX += Math.cos(rotation); moveY += Math.sin(rotation); }
            if (keys.has('s')) { moveX -= Math.cos(rotation); moveY -= Math.sin(rotation); }
            if (keys.has('a')) { moveX += Math.cos(rotation - Math.PI / 2); moveY += Math.sin(rotation - Math.PI / 2); }
            if (keys.has('d')) { moveX += Math.cos(rotation + Math.PI / 2); moveY += Math.sin(rotation + Math.PI / 2); }
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            setVelocity(length);
            if (length > 0) {
              const h = getHeightAt(x, y);
              const currentlySwimming = h < 0.08; setIsSwimming(currentlySwimming);
              const swimPenalty = currentlySwimming ? 0.35 : 1.0;
              const sprintBonus = isSprinting ? SPRINT_MULTIPLIER : 1.0;
              const crouchPenalty = isCrouching ? CROUCH_MULTIPLIER : 1.0;
              const stepX = (moveX / length) * PLAYER_SPEED * swimPenalty * sprintBonus * crouchPenalty;
              const stepY = (moveY / length) * PLAYER_SPEED * swimPenalty * sprintBonus * crouchPenalty;
              if (!checkCollision(x + stepX, y, prev)) x += stepX;
              if (!checkCollision(x, y + stepY, prev)) y += stepY;
              if (isSprinting) stamina = Math.max(0, stamina - STAMINA_DECAY);
              else stamina = Math.min(100, stamina + STAMINA_REGEN * staminaRegenPenalty);
            } else { stamina = Math.min(100, stamina + STAMINA_REGEN * staminaRegenPenalty); }
          } else { setVelocity(0); stamina = Math.min(100, stamina + STAMINA_REGEN * staminaRegenPenalty); }

          const updatedNpcs = prev.npcs.map(npc => {
            let nx = npc.x; let ny = npc.y; let nRot = npc.rotation; let nState = npc.state;
            const dist = Math.sqrt((nx - x)**2 + (ny - y)**2);

            const isLowHealth = npc.health < npc.maxHealth * 0.3;
            if (isLowHealth) {
                nState = 'fleeing';
            } else {
                if (npc.type === 'bear' || npc.type === 'wolf') { 
                    if (dist < 350) nState = 'chasing'; else nState = 'idle'; 
                }
                else if (npc.type === 'boar' || npc.type === 'chicken') { 
                    if (dist < 150) nState = 'fleeing'; else nState = 'idle'; 
                }
            }

            let nextX = nx; let nextY = ny;
            if (nState === 'chasing') {
              nRot = Math.atan2(y - ny, x - nx);
              if (dist > NPC_SAFE_DISTANCE) { const moveSpeed = npc.type === 'wolf' ? 4 : 2; nextX += Math.cos(nRot) * moveSpeed; nextY += Math.sin(nRot) * moveSpeed; }
              // Apply damage to player with armor reduction
              if (dist < NPC_SAFE_DISTANCE + 15) { 
                  const rawDmg = npc.type === 'wolf' ? 0.15 : 0.3;
                  health -= (rawDmg * damageMultiplier); 
              }
            } else if (nState === 'fleeing') { 
                nRot = Math.atan2(ny - y, nx - x); 
                const speed = isLowHealth ? (npc.type === 'wolf' || npc.type === 'bear' ? 5 : 4.5) : 4;
                nextX += Math.cos(nRot) * speed; 
                nextY += Math.sin(nRot) * speed; 
            }
            else { 
                nextX += Math.cos(nRot) * 0.5; nextY += Math.sin(nRot) * 0.5; 
                if (Math.random() < 0.02) nRot += (Math.random() - 0.5) * 1; 
            }
            const nextH = getHeightAt(nextX, nextY);
            if (nextH > WATER_THRESHOLD) { nx = nextX; ny = nextY; }
            else { nRot += Math.PI; }
            return { ...npc, x: nx, y: ny, rotation: nRot, state: nState };
          }).filter(npc => npc.health > 0);

          if (health <= 0) { setIsGameOver(true); setGameStatus('dead'); }
          return { ...prev, player: { ...prev.player, x, y, rotation, hunger, thirst, health, stamina, isExhausted, isCrouching }, npcs: updatedNpcs, dayTime: (prev.dayTime + 0.01) % 1440 };
        });

        if (time - geminiTickRef.current > 60000) { 
          geminiTickRef.current = time;
          getSurvivalTips(gameStateRef.current).then(tip => { setGameState(prev => ({ ...prev, logs: [...prev.logs.slice(-5), `WORLD: ${tip}`] })); });
        }
      }
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }, [gameStatus, isGameOver, uiState]);

  const handleCraft = (recipe: Recipe) => {
    setGameState(prev => {
      const newInv = [...prev.inventory];
      if (!recipe.ingredients.every(ing => (newInv.find(i => i.id.startsWith(ing.type))?.count || 0) >= ing.count)) return prev;
      recipe.ingredients.forEach(ing => { const idx = newInv.findIndex(i => i.id.startsWith(ing.type)); newInv[idx].count -= ing.count; });
      const out = { ...recipe.output };
      if (out.type === 'tool' || out.type === 'armor') out.id = `${out.id}-${Date.now()}`;
      const existing = newInv.findIndex(i => i.id === out.id);
      if (existing > -1 && out.type !== 'tool' && out.type !== 'armor') newInv[existing].count += out.count;
      else newInv.push(out);
      return { ...prev, inventory: newInv.filter(i => i.count > 0), logs: [...prev.logs.slice(-8), `CRAFTED: ${recipe.name.toUpperCase()}`] };
    });
  };

  const handleRespawn = () => {
    const spawn = getSpawnPoint();
    setGameState(prev => ({
        ...prev,
        player: { 
            x: spawn.x, 
            y: spawn.y, 
            health: 100, 
            hunger: 100, 
            thirst: 100, 
            stamina: 100, 
            rotation: 0,
            isExhausted: false, 
            isCrouching: false 
        },
        inventory: INITIAL_INVENTORY,
        logs: [...prev.logs, "RESPAWN: Waking up on the beach..."]
    }));
    setIsGameOver(false);
    setGameStatus('playing');
  };

  const updateSetting = (key: string, value: any) => setGameState(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  if (gameStatus === 'menu') {
    if (isLoading) return <LoadingScreen onComplete={() => { setIsLoading(false); setGameStatus('playing'); }} />;
    return <LandingPage onStart={() => setIsLoading(true)} />;
  }

  if (gameStatus === 'dead') return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0c0a09] text-white">
      <h1 className="text-8xl font-black text-red-700 mb-8 tracking-tighter italic text-center">WIPE<br/><span className="text-xl text-stone-600 not-italic tracking-widest font-bold">GAME OVER</span></h1>
      <button onClick={handleRespawn} className="px-12 py-4 bg-orange-700 font-black rounded-sm border-b-8 border-orange-950 active:translate-y-2 active:border-b-0 transition-all uppercase tracking-widest">Respawn</button>
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0a09]">
      <GameCanvas gameState={gameState} activeItemId={activeItemId} onAction={performAction} swingProgress={swingProgress} isSwimming={isSwimming} velocity={velocity} />
      <HUD 
        gameState={gameState} 
        onCraft={handleCraft} 
        onUseItem={(item) => setActiveItemId(item.id)} 
        activeItem={activeItemId} 
        inventoryOpen={uiState.inventoryOpen} 
        craftingOpen={uiState.craftingOpen} 
        settingsOpen={uiState.settingsOpen} 
        onUpdateSetting={updateSetting} 
        onCloseUI={() => setUiState({ inventoryOpen: false, craftingOpen: false, settingsOpen: false })} 
        currentFps={fps}
      />
      <div className="fixed pointer-events-none z-[100] w-8 h-8 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-75" style={{ left: mousePosition.x, top: mousePosition.y }}>
        <div className="w-[2px] h-[70%] absolute" style={{ backgroundColor: `${gameState.settings.crosshairColor}66` }}></div>
        <div className="h-[2px] w-[70%] absolute" style={{ backgroundColor: `${gameState.settings.crosshairColor}66` }}></div>
        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: gameState.settings.crosshairColor }}></div>
      </div>
    </div>
  );
};

export default App;
