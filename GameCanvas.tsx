
import React, { useRef, useEffect } from 'react';
import { GameState, Npc, Entity } from '../types';
import { MAP_SIZE } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  activeItemId: string | null;
  onAction: (x: number, y: number) => void;
  swingProgress: number;
  isSwimming: boolean;
  velocity: number;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, activeItemId, onAction, swingProgress, isSwimming, velocity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainBufferRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const lerpColor = (c1: [number, number, number], c2: [number, number, number], f: number): [number, number, number] => 
    [Math.round(c1[0] + (c2[0] - c1[0]) * f), Math.round(c1[1] + (c2[1] - c1[1]) * f), Math.round(c1[2] + (c2[2] - c1[2]) * f)];

  const getHeightAt = (x: number, y: number) => {
    const dist = Math.sqrt(Math.pow(x - MAP_SIZE/2, 2) + Math.pow(y - MAP_SIZE/2, 2));
    let h = 1.0 - (dist / (MAP_SIZE * 0.48));
    h += Math.sin(x / 1200) * 0.1 + Math.cos(y / 1200) * 0.1;
    h += Math.sin(x / 400 + y / 500) * 0.05;
    h += Math.sin(x / 150) * 0.02;
    return { height: h };
  };

  const getSmoothBiomeColor = (h: number): [number, number, number] => {
    const colors: [number, number, number][] = [
      [20, 18, 55],    // Deep Water
      [45, 75, 140],   // Water
      [170, 140, 100], // Sand
      [215, 185, 135], // Light Grass/Dirt
      [110, 180, 40],  // Grass
      [20, 45, 20],    // Forest
      [65, 80, 100],   // Rock
      [245, 250, 255]  // Snow
    ];
    
    if (h < 0.08) return lerpColor(colors[0], colors[1], h / 0.08);
    if (h < 0.14) return lerpColor(colors[1], colors[2], (h - 0.08) / 0.06);
    if (h < 0.22) return lerpColor(colors[2], colors[3], (h - 0.14) / 0.08);
    if (h < 0.45) return lerpColor(colors[3], colors[4], (h - 0.22) / 0.23);
    if (h < 0.75) return lerpColor(colors[4], colors[5], (h - 0.45) / 0.30);
    return lerpColor(colors[5], colors[7], (h - 0.75) / 0.25);
  };

  const drawHealthBar = (ctx: CanvasRenderingContext2D, x: number, y: number, health: number, maxHealth: number, width: number = 40) => {
    const height = 4;
    const currentWidth = (health / maxHealth) * width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - width / 2, y, width, height);
    const pct = health / maxHealth;
    ctx.fillStyle = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(x - width / 2, y, currentWidth, height);
  };

  const drawFoliageClump = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, highlightColor: string) => {
    // Outline/Shadow
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle inner shade at bottom
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.arc(x, y + r * 0.15, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Upper highlight
    ctx.beginPath();
    ctx.fillStyle = highlightColor;
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawRock = (ctx: CanvasRenderingContext2D, ent: Entity) => {
    const { x, y, variant } = ent;
    const v = parseInt(variant || "0");
    const stats = getHeightAt(x, y);
    const h = stats.height;

    // Determine colors based on biome height
    let rockColor = '#a8a29e'; // light stone default
    let rockShadow = '#78716c'; // dark stone default
    let accentColor = '#65a30d'; // moss default

    if (h < 0.15) { // Beach/Wet Lowlands
         rockColor = '#79716B';
         rockShadow = '#57534E';
         accentColor = '#3f6212'; // Dark moss
    } else if (h > 0.75) { // Mountain/Snow
         rockColor = '#52525b';
         rockShadow = '#27272a';
         accentColor = '#f1f5f9'; // Snow
    }

    ctx.save();
    
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 20, 8, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.translate(x, y);

    // Draw varied rock shapes
    switch (v) {
      case 0: // Tall/Blocky
        // Base main shape (Shadow side)
        ctx.fillStyle = rockShadow;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-12, -25);
        ctx.lineTo(5, -30);
        ctx.lineTo(18, -10);
        ctx.lineTo(15, 5);
        ctx.lineTo(-10, 8);
        ctx.fill();

        // Highlight/Top face
        ctx.fillStyle = rockColor;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-12, -25);
        ctx.lineTo(5, -30);
        ctx.lineTo(2, -10); 
        ctx.lineTo(-5, -5); 
        ctx.fill();

        // Accent (Moss/Snow) top cap
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(-12, -25);
        ctx.lineTo(5, -30);
        ctx.lineTo(2, -15);
        ctx.lineTo(-8, -18);
        ctx.fill();
        break;

      case 1: // Wide/Flat Slab
        ctx.fillStyle = rockShadow;
        ctx.beginPath();
        ctx.moveTo(-20, 5);
        ctx.lineTo(-18, -15);
        ctx.lineTo(0, -20);
        ctx.lineTo(22, -12);
        ctx.lineTo(25, 5);
        ctx.lineTo(0, 10);
        ctx.fill();

        ctx.fillStyle = rockColor;
        ctx.beginPath();
        ctx.moveTo(-20, 5);
        ctx.lineTo(-18, -15);
        ctx.lineTo(0, -20);
        ctx.lineTo(10, -5); 
        ctx.lineTo(-5, 0);
        ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(-18, -15);
        ctx.lineTo(0, -20);
        ctx.lineTo(15, -14);
        ctx.lineTo(5, -8);
        ctx.lineTo(-10, -10);
        ctx.fill();
        break;
        
      case 2: // Round/Boulder
        ctx.fillStyle = rockShadow;
        ctx.beginPath();
        ctx.moveTo(-12, 5);
        ctx.lineTo(-15, -15);
        ctx.lineTo(-5, -25);
        ctx.lineTo(12, -22);
        ctx.lineTo(18, -5);
        ctx.lineTo(10, 8);
        ctx.fill();

        ctx.fillStyle = rockColor;
        ctx.beginPath();
        ctx.moveTo(-12, 5);
        ctx.lineTo(-15, -15);
        ctx.lineTo(-5, -25);
        ctx.lineTo(5, -10);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(-5, -25);
        ctx.lineTo(12, -22);
        ctx.lineTo(8, -15);
        ctx.lineTo(-8, -18);
        ctx.fill();
        break;

      default: // Fallback same as case 0
        ctx.fillStyle = rockShadow;
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-12, -25); ctx.lineTo(5, -30);
        ctx.lineTo(18, -10); ctx.lineTo(15, 5); ctx.lineTo(-10, 8); ctx.fill();
        ctx.fillStyle = rockColor;
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-12, -25); ctx.lineTo(5, -30); ctx.lineTo(2, -10); ctx.lineTo(-5, -5); ctx.fill();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(-12, -25); ctx.lineTo(5, -30); ctx.lineTo(2, -15); ctx.lineTo(-8, -18); ctx.fill();
        break;
    }

    // Surface details (cracks/striations)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -5); ctx.lineTo(5, -8);
    ctx.moveTo(-4, -12); ctx.lineTo(2, -14);
    ctx.stroke();

    ctx.restore();
    
    // Health bar if damaged
    if (ent.health < ent.maxHealth) drawHealthBar(ctx, x, y - 40, ent.health, ent.maxHealth, 35);
  };

  const drawTree = (ctx: CanvasRenderingContext2D, ent: Entity) => {
    const { x, y, variant } = ent;
    const v = parseInt(variant || "0");
    
    // Determine biome context for this tree
    const stats = getHeightAt(x, y);
    const h = stats.height;

    let trunkColor = '#8b5e3c';
    let trunkDark = '#6d4c41';
    let foliageColor = '#7cb342';
    let highlightColor = '#aed581';
    const shadowColor = 'rgba(0,0,0,0.15)';

    // Adjust colors based on biome/variant
    if (v === 2 || v === 5) { 
        // Pine/Highland
        trunkColor = '#4a3728';
        trunkDark = '#3e2723';
        foliageColor = '#2d4a22';
        highlightColor = '#4f7a3d';
    } else if (v === 3 || v === 4) {
        // Coastal/Lowland
        trunkColor = '#8d7b68';
        foliageColor = '#8fa336';
        highlightColor = '#c0ca33';
    }

    // Snow biome override
    if (h > 0.8) {
        foliageColor = '#dcfce7'; // Frosty white/green
        highlightColor = '#ffffff'; // White snow highlight
        if (v !== 2 && v !== 5) {
             foliageColor = '#e2e8f0'; // Dead wood look for non-pines in snow
        }
        trunkColor = '#5d5752'; // Frozen trunk
    }

    ctx.save();
    
    // Shadow base
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trunk
    ctx.fillStyle = trunkColor;
    ctx.strokeStyle = trunkDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    switch (v) {
      case 0: // Basic straight
        ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
        ctx.lineTo(x + 4, y - 45); ctx.lineTo(x - 4, y - 45);
        break;
      case 1: // Basic thick
        ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y);
        ctx.lineTo(x + 7, y - 40); ctx.lineTo(x - 7, y - 40);
        break;
      case 2: // L-shaped branch
        ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
        ctx.lineTo(x + 3, y - 40);
        ctx.lineTo(x - 15, y - 40); ctx.lineTo(x - 15, y - 45);
        ctx.lineTo(x + 8, y - 45); ctx.lineTo(x + 8, y - 40);
        ctx.lineTo(x + 3, y - 40);
        break;
      case 3: // Thin curved
        ctx.moveTo(x - 5, y);
        ctx.quadraticCurveTo(x + 10, y - 25, x - 2, y - 50);
        ctx.lineTo(x + 5, y - 50);
        ctx.quadraticCurveTo(x + 15, y - 25, x + 5, y);
        break;
      case 4: // S-curved trunk
        ctx.moveTo(x - 5, y);
        ctx.bezierCurveTo(x - 10, y - 15, x + 15, y - 35, x - 5, y - 55);
        ctx.lineTo(x + 5, y - 55);
        ctx.bezierCurveTo(x + 25, y - 35, x + 0, y - 15, x + 5, y);
        break;
      case 5: // Simple straight thin
        ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
        ctx.lineTo(x + 3, y - 50); ctx.lineTo(x - 3, y - 50);
        break;
      default:
        ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y);
        ctx.lineTo(x + 4, y - 45); ctx.lineTo(x - 4, y - 45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Foliage
    const fY = y - 45;
    // Foliage variations
    switch (v) {
      case 0:
        drawFoliageClump(ctx, x - 18, fY + 5, 22, foliageColor, highlightColor);
        drawFoliageClump(ctx, x + 18, fY + 5, 22, foliageColor, highlightColor);
        drawFoliageClump(ctx, x, fY - 15, 28, foliageColor, highlightColor);
        break;
      case 1:
        drawFoliageClump(ctx, x, fY + 5, 38, foliageColor, highlightColor);
        drawFoliageClump(ctx, x - 15, fY - 10, 25, foliageColor, highlightColor);
        drawFoliageClump(ctx, x + 15, fY - 10, 25, foliageColor, highlightColor);
        drawFoliageClump(ctx, x, fY - 25, 20, foliageColor, highlightColor);
        break;
      case 2:
        drawFoliageClump(ctx, x + 5, fY - 5, 32, foliageColor, highlightColor);
        drawFoliageClump(ctx, x - 20, fY, 20, foliageColor, highlightColor);
        break;
      case 3:
        drawFoliageClump(ctx, x, fY, 28, foliageColor, highlightColor);
        drawFoliageClump(ctx, x - 12, fY - 10, 20, foliageColor, highlightColor);
        drawFoliageClump(ctx, x + 12, fY + 8, 18, foliageColor, highlightColor);
        break;
      case 4:
        drawFoliageClump(ctx, x - 12, fY - 5, 25, foliageColor, highlightColor);
        drawFoliageClump(ctx, x + 12, fY - 5, 22, foliageColor, highlightColor);
        drawFoliageClump(ctx, x, fY - 30, 30, foliageColor, highlightColor);
        break;
      case 5:
        drawFoliageClump(ctx, x, fY, 32, foliageColor, highlightColor);
        break;
    }

    if (ent.health < ent.maxHealth) drawHealthBar(ctx, x, y - 90, ent.health, ent.maxHealth, 45);

    ctx.restore();
  };

  const drawPlayerModel = (ctx: CanvasRenderingContext2D, p: any, isCrouching: boolean, rotation: number, swing: number = 0, itemIcon?: string, verticalOffset: number = 0, swimming: boolean = false) => {
    ctx.save();
    const immersionY = swimming ? 10 : 0;
    ctx.translate(p.x, p.y + verticalOffset + immersionY);
    ctx.rotate(rotation);
    const skin = '#f1c27d'; 
    const shirt = '#334155';
    const backpack = '#1e293b';

    // Shadow
    if (!swimming) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(0, -verticalOffset, isCrouching ? 16 : 20, 14, 0, 0, Math.PI*2); ctx.fill();
    }

    // Backpack
    ctx.fillStyle = backpack;
    ctx.fillRect(isCrouching ? -14 : -18, -10, 8, 20);

    // Body
    ctx.fillStyle = shirt;
    ctx.beginPath(); 
    const rx = isCrouching ? 22 : 20;
    const ry = isCrouching ? 16 : 18;
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2); ctx.fill();

    const drawArm = (isRight: boolean) => {
      ctx.save();
      const angle = isCrouching ? (isRight ? -0.15 : 0.15) : (isRight ? -0.5 : 0.5);
      const pullIn = isCrouching ? -4 : 0;
      ctx.rotate(angle);
      ctx.fillStyle = skin; 
      ctx.fillRect(16 + pullIn, isRight ? -4 : -8, 12, 8);
      
      if (isRight && itemIcon) {
        ctx.save(); ctx.translate(24 + pullIn, 0); ctx.rotate(swing * 2.5);
        ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(itemIcon, 6, 0);
        ctx.restore();
      }
      ctx.restore();
    };
    drawArm(true); drawArm(false);

    // Head
    ctx.fillStyle = skin; 
    ctx.beginPath(); 
    ctx.arc(isCrouching ? 6 : 0, 0, 12, 0, Math.PI*2); 
    ctx.fill();

    // Eyes and Mouth
    const headX = isCrouching ? 6 : 0;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(headX + 5, -4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(headX + 5, 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(headX + 9, -2); ctx.lineTo(headX + 9, 2); ctx.stroke();

    ctx.restore();
  };

  const drawNpcModel = (ctx: CanvasRenderingContext2D, npc: Npc) => {
    ctx.save();
    ctx.translate(npc.x, npc.y);
    ctx.rotate(npc.rotation);

    if (npc.type === 'bear') {
      ctx.fillStyle = '#451a03'; 
      ctx.beginPath(); ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22, 0, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(22, -10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(22, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d1a0a'; ctx.beginPath(); ctx.arc(32, 0, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillRect(28, -4, 2, 2); ctx.fillRect(28, 2, 2, 2);
    } 
    else if (npc.type === 'wolf') {
      ctx.fillStyle = '#475569'; 
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.rotate(-0.5); ctx.fillRect(-24, -3, 10, 6); ctx.restore();
      ctx.beginPath(); ctx.ellipse(18, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(25, -4); ctx.lineTo(32, 0); ctx.lineTo(25, 4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(20, -6); ctx.lineTo(24, -12); ctx.lineTo(28, -4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(20, 6); ctx.lineTo(24, 12); ctx.lineTo(28, 4); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(22, -3, 2, 2); ctx.fillRect(22, 1, 2, 2);
    } 
    else if (npc.type === 'boar') {
      ctx.fillStyle = '#271b12'; 
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(22, -8); ctx.lineTo(30, -12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, 8); ctx.lineTo(30, 12); ctx.stroke();
    } 
    else if (npc.type === 'chicken') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(7, -5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(14, 0); ctx.lineTo(10, 2); ctx.fill();
    }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); if (!ctx) return;
    const tCtx = terrainBufferRef.current.getContext('2d', { alpha: false }); if (!tCtx) return;

    let animId: number;
    const render = () => {
      const { player, entities, buildingParts, npcs, dayTime, weather, inventory, settings } = gameState;
      const width = canvas.width; const height = canvas.height;
      const now = Date.now();
      
      const zoom = settings.fov / 90;
      let terrainRes = settings.graphicsQuality === 'Low' ? 0.1 : settings.graphicsQuality === 'Ultra' ? 0.5 : 0.25;
      if (settings.performanceMode) terrainRes *= 0.6;

      const bW = Math.ceil(width * terrainRes); const bH = Math.ceil(height * terrainRes);
      if (terrainBufferRef.current.width !== bW) { terrainBufferRef.current.width = bW; terrainBufferRef.current.height = bH; }
      
      const img = tCtx.createImageData(bW, bH);
      for (let j = 0; j < bH; j++) {
        for (let i = 0; i < bW; i++) {
          const worldX = player.x + (i / terrainRes - width / 2) / zoom;
          const worldY = player.y + (j / terrainRes - height / 2) / zoom;
          const stats = getHeightAt(worldX, worldY);
          const c = getSmoothBiomeColor(stats.height);
          const idx = (j * bW + i) * 4;
          img.data[idx] = c[0]; img.data[idx+1] = c[1]; img.data[idx+2] = c[2]; img.data[idx+3] = 255;
        }
      }
      tCtx.putImageData(img, 0, 0);
      ctx.drawImage(terrainBufferRef.current, 0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-player.x, -player.y);

      const viewDistSq = (settings.viewDistance / zoom) ** 2;

      entities.forEach(ent => {
        const dSq = (ent.x - player.x)**2 + (ent.y - player.y)**2;
        if (dSq > viewDistSq) return;
        
        if (ent.type === 'tree') { 
          drawTree(ctx, ent);
        } else if (ent.type === 'rock') { 
          drawRock(ctx, ent);
        } else if (ent.type === 'ground_wood') { 
          ctx.fillStyle = '#3f2b1d'; ctx.save(); ctx.translate(ent.x, ent.y); ctx.rotate(0.5); ctx.fillRect(-12, -3, 24, 6); ctx.restore();
        } else if (ent.type === 'ground_stone') { 
          ctx.fillStyle = '#71717a'; ctx.beginPath(); ctx.arc(ent.x, ent.y, 6, 0, Math.PI*2); ctx.fill(); 
        }
      });

      buildingParts.forEach(bp => {
        const dSq = (bp.x - player.x)**2 + (bp.y - player.y)**2;
        if (dSq > viewDistSq) return;
        ctx.fillStyle = '#3f2b1d';
        ctx.strokeStyle = '#2d1a0a'; ctx.lineWidth = 2;
        if (bp.partType === 'foundation') {
          ctx.fillRect(bp.x-45, bp.y-45, 90, 90);
          ctx.strokeRect(bp.x-45, bp.y-45, 90, 90);
          for(let i=-35; i<45; i+=15) { ctx.beginPath(); ctx.moveTo(bp.x-45, bp.y+i); ctx.lineTo(bp.x+45, bp.y+i); ctx.stroke(); }
        }
        else {
          ctx.fillRect(bp.x-45, bp.y-5, 90, 10);
          ctx.strokeRect(bp.x-45, bp.y-5, 90, 10);
        }
      });

      npcs.forEach(npc => {
        const dSq = (npc.x - player.x)**2 + (npc.y - player.y)**2;
        if (dSq > viewDistSq) return;
        drawNpcModel(ctx, npc);
        let barW = npc.type === 'bear' ? 55 : npc.type === 'chicken' ? 25 : 45;
        let barY = npc.y - (npc.type === 'bear' ? 45 : npc.type === 'chicken' ? 18 : 35);
        drawHealthBar(ctx, npc.x, barY, npc.health, npc.maxHealth, barW);
      });

      if (isSwimming) {
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.4)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const t = (now / 1000 + i * 0.5) % 1.5;
          const r = t * 45; const alpha = 1 - (t / 1.5);
          ctx.strokeStyle = `rgba(200, 240, 255, ${alpha * 0.5})`;
          ctx.beginPath(); ctx.ellipse(player.x, player.y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();

      const activeItem = inventory.find(i => i.id === activeItemId);
      const bobFreq = isSwimming ? 100 : 150; const bobAmp = isSwimming ? 7 : 5;
      const vOffset = (settings.cameraBobEnabled && velocity > 0.1) ? Math.sin(now / bobFreq) * bobAmp : 0;
      drawPlayerModel(ctx, { x: width/2, y: height/2 }, player.isCrouching, player.rotation, swingProgress, activeItem?.icon, vOffset, isSwimming);

      if (player.health < 25 || player.hunger < 15 || player.thirst < 15) {
        const intensity = (player.health < 25 ? 0.35 : 0.2) + (Math.sin(now / 200) + 1) * 0.12;
        const gradient = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width/0.7);
        gradient.addColorStop(0, 'rgba(150, 0, 0, 0)'); gradient.addColorStop(1, `rgba(200, 0, 0, ${intensity})`);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      }

      if (weather.type !== 'clear' && settings.weatherEnabled) {
        const density = settings.graphicsQuality === 'Low' ? 40 : (settings.graphicsQuality === 'Ultra' ? 150 : 80);
        ctx.strokeStyle = `rgba(200, 220, 255, ${0.35 * weather.intensity})`; ctx.lineWidth = 1;
        for (let i = 0; i < density; i++) {
          const rx = (i * 137 + now * 1.5) % width; const ry = (i * 211 + now * 6) % height;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 18); ctx.stroke();
        }
      }
      const dayFactor = Math.pow(Math.abs(dayTime - 720) / 720, 2);
      ctx.fillStyle = `rgba(0, 5, 30, ${dayFactor * 0.5})`; ctx.fillRect(0,0,width,height);
      animId = requestAnimationFrame(render);
    };
    render(); return () => cancelAnimationFrame(animId);
  }, [gameState, activeItemId, swingProgress, velocity, isSwimming]);

  useEffect(() => {
    const res = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
    window.addEventListener('resize', res); res(); return () => window.removeEventListener('resize', res);
  }, []);

  return <canvas ref={canvasRef} onMouseDown={(e) => onAction(e.clientX, e.clientY)} className="block w-full h-full cursor-none bg-[#0f172a]" />;
};
export default GameCanvas;
