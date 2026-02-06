
import React from 'react';
import { GameState, Item, Recipe } from '../types';
import { RECIPES } from '../constants';

interface HUDProps {
  gameState: GameState;
  onCraft: (recipe: Recipe) => void;
  onUseItem: (item: Item) => void;
  activeItem: string | null;
  inventoryOpen: boolean;
  craftingOpen: boolean;
  settingsOpen: boolean;
  onUpdateSetting: (key: string, value: any) => void;
  onCloseUI: () => void;
  currentFps: number;
}

const ItemIcon: React.FC<{ item: Item; isActive?: boolean }> = ({ item, isActive }) => {
  const durabilityPercent = item.durability !== undefined && item.maxDurability 
    ? (item.durability / item.maxDurability) * 100 
    : null;

  const durabilityColor = durabilityPercent !== null
    ? durabilityPercent > 50 ? 'bg-green-500' : durabilityPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
    : null;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <span className="text-3xl filter drop-shadow-lg">{item.icon}</span>
      {item.count > 1 && (
        <span className="absolute bottom-1 right-1.5 text-[10px] font-black text-white bg-orange-600 px-1 rounded-sm shadow-sm border border-orange-800">
          {item.count}
        </span>
      )}
      {item.defense && (
        <span className="absolute top-1 left-1.5 text-[9px] font-black text-white bg-blue-600 px-1 rounded-sm shadow-sm border border-blue-800 flex items-center gap-0.5">
           🛡️{item.defense}
        </span>
      )}
      {durabilityPercent !== null && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40 px-[1px]">
          <div className={`h-[2px] ${durabilityColor} transition-all duration-300`} style={{ width: `${durabilityPercent}%` }} />
        </div>
      )}
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ 
  gameState, onCraft, onUseItem, activeItem, inventoryOpen, craftingOpen, settingsOpen, onUpdateSetting, onCloseUI, currentFps
}) => {
  const timeString = `${Math.floor(gameState.dayTime / 60).toString().padStart(2, '0')}:${Math.floor(gameState.dayTime % 60).toString().padStart(2, '0')}`;

  const crosshairColors = [
    { name: 'Orange', color: '#f97316' },
    { name: 'Green', color: '#22c55e' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'White', color: '#ffffff' },
    { name: 'Red', color: '#ef4444' }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-8" style={{ transform: `scale(${gameState.settings.uiScale})`, transformOrigin: 'center center' }}>
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        <div className="space-y-1">
          {gameState.logs.slice(-5).map((log, i) => (
            <div key={i} className="bg-[#1c1917]/90 text-white/90 px-4 py-1.5 text-xs font-bold border-l-4 border-orange-600 backdrop-blur-md shadow-lg italic">
              {log}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="bg-[#1c1917]/90 px-6 py-2 text-orange-500 font-black text-2xl border border-orange-500/10 backdrop-blur-md italic tracking-tighter shadow-2xl">
            {timeString}
          </div>
          {gameState.settings.showFPS && (
            <div className="text-[10px] text-stone-600 font-bold bg-black/20 px-2 py-0.5">
              FPS: {currentFps}
            </div>
          )}
        </div>
      </div>

      {/* Center UI Modal */}
      {(inventoryOpen || craftingOpen || settingsOpen) && (
        <div className="fixed inset-0 bg-black/80 pointer-events-auto flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-[#0c0a09] border border-stone-800 p-8 rounded-sm w-full max-w-4xl grid grid-cols-12 gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-transparent opacity-50" />
            <button onClick={onCloseUI} className="absolute top-4 right-4 text-stone-500 hover:text-white uppercase text-[10px] font-bold tracking-widest">Close (ESC)</button>
            
            <div className="col-span-3 border-r border-stone-900 pr-6 space-y-2">
              <h2 className="text-3xl font-black text-white italic mb-8 tracking-tighter">PDA v2.1</h2>
              <div onClick={() => !inventoryOpen && onCloseUI()} className={`p-4 text-[12px] font-black cursor-pointer tracking-[0.2em] transition-all border-l-4 ${inventoryOpen ? 'bg-orange-600 text-white border-orange-400' : 'text-stone-500 hover:text-stone-300 border-transparent hover:border-stone-700'}`}>INVENTORY</div>
              <div onClick={() => !craftingOpen && onCloseUI()} className={`p-4 text-[12px] font-black cursor-pointer tracking-[0.2em] transition-all border-l-4 ${craftingOpen ? 'bg-orange-600 text-white border-orange-400' : 'text-stone-500 hover:text-stone-300 border-transparent hover:border-stone-700'}`}>CRAFTING</div>
              <div onClick={() => !settingsOpen && onCloseUI()} className={`p-4 text-[12px] font-black cursor-pointer tracking-[0.2em] transition-all border-l-4 ${settingsOpen ? 'bg-orange-600 text-white border-orange-400' : 'text-stone-500 hover:text-stone-300 border-transparent hover:border-stone-700'}`}>SETTINGS</div>
            </div>

            <div className="col-span-9 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {inventoryOpen && (
                <div className="grid grid-cols-6 gap-3">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const item = gameState.inventory[i];
                    return (
                      <div key={i} onClick={() => item && onUseItem(item)} className={`aspect-square bg-stone-900 border-2 border-stone-800 flex items-center justify-center hover:border-orange-500 transition-all shadow-inner ${item ? 'cursor-pointer active:scale-95' : 'opacity-20'}`}>
                        {item && <ItemIcon item={item} />}
                      </div>
                    );
                  })}
                </div>
              )}
              {craftingOpen && (
                <div className="grid grid-cols-2 gap-4">
                  {RECIPES.map(r => {
                    const can = r.ingredients.every(ing => (gameState.inventory.find(i => i.id.startsWith(ing.type))?.count || 0) >= ing.count);
                    return (
                      <div key={r.id} className="bg-stone-900/50 p-5 border border-stone-800 flex flex-col justify-between hover:bg-stone-900 transition-all group relative">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-3xl">{r.output.icon}</span>
                          <div>
                            <span className="font-black text-white uppercase text-sm tracking-widest block">{r.name}</span>
                            <div className="flex gap-2 mt-1">
                               {r.ingredients.map(ing => (
                                 <span key={ing.type} className={`text-[9px] font-black px-1 ${ (gameState.inventory.find(i => i.id.startsWith(ing.type))?.count || 0) >= ing.count ? 'text-stone-500' : 'text-red-600'}`}>
                                   {ing.count} {ing.type.toUpperCase().replace('_', ' ')}
                                 </span>
                               ))}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => onCraft(r)} disabled={!can} className={`w-full py-3 text-[11px] font-black uppercase tracking-[0.2em] ${can ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-stone-800 text-stone-600 opacity-50'}`}>
                          {can ? 'Construct' : 'Resources Missing'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {settingsOpen && (
                <div className="space-y-8 pb-4">
                  <div className="grid grid-cols-2 gap-12">
                    {/* Visual Settings */}
                    <div className="space-y-6">
                      <h3 className="text-[12px] font-black text-stone-500 uppercase tracking-[0.3em] mb-6 border-b border-stone-800 pb-2 italic">Imaging Engine</h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Post-Processing</label>
                        <select value={gameState.settings.graphicsQuality} onChange={e => onUpdateSetting('graphicsQuality', e.target.value)} className="w-full bg-stone-950 border border-stone-800 p-3 text-white text-xs outline-none focus:border-orange-600 transition-colors">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Ultra</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-stone-950/50 border border-stone-800">
                         <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Performance Mode</span>
                         <input type="checkbox" checked={gameState.settings.performanceMode} onChange={e => onUpdateSetting('performanceMode', e.target.checked)} className="accent-orange-600 w-5 h-5 cursor-pointer" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Draw Distance: {gameState.settings.viewDistance}m</label>
                        <input type="range" min="500" max="5000" step="100" value={gameState.settings.viewDistance} onChange={e => onUpdateSetting('viewDistance', parseInt(e.target.value))} className="w-full accent-orange-600 bg-stone-900 h-2 appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Field of View: {gameState.settings.fov}°</label>
                        <input type="range" min="60" max="140" step="5" value={gameState.settings.fov} onChange={e => onUpdateSetting('fov', parseInt(e.target.value))} className="w-full accent-orange-600 bg-stone-900 h-2 appearance-none cursor-pointer" />
                      </div>
                    </div>

                    {/* Interface Settings */}
                    <div className="space-y-6">
                      <h3 className="text-[12px] font-black text-stone-500 uppercase tracking-[0.3em] mb-6 border-b border-stone-800 pb-2 italic">Tactical HUD</h3>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Crosshair Spectrum</label>
                        <div className="flex gap-3">
                          {crosshairColors.map(c => (
                            <div 
                              key={c.name} 
                              onClick={() => onUpdateSetting('crosshairColor', c.color)}
                              className={`w-8 h-8 rounded-full cursor-pointer border-4 transition-all ${gameState.settings.crosshairColor === c.color ? 'border-orange-500 scale-110' : 'border-stone-900 hover:border-stone-700'}`}
                              style={{ backgroundColor: c.color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Interface Scale: {gameState.settings.uiScale.toFixed(2)}x</label>
                        <input type="range" min="0.75" max="1.25" step="0.05" value={gameState.settings.uiScale} onChange={e => onUpdateSetting('uiScale', parseFloat(e.target.value))} className="w-full accent-orange-600 bg-stone-900 h-2 appearance-none cursor-pointer" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-stone-950/50 border border-stone-800">
                         <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Diagnostics (FPS)</span>
                         <input type="checkbox" checked={gameState.settings.showFPS} onChange={e => onUpdateSetting('showFPS', e.target.checked)} className="accent-orange-600 w-5 h-5 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Interface */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex gap-2.5 pointer-events-auto">
          <div className="w-72 h-3 bg-stone-900 border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${gameState.player.health}%` }} />
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">Vitality</span>
          </div>
          <div className="w-36 h-3 bg-stone-900 border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${gameState.player.hunger}%` }} />
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">Hunger</span>
          </div>
          <div className="w-36 h-3 bg-stone-900 border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${gameState.player.thirst}%` }} />
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">Thirst</span>
          </div>
          <div className="w-56 h-3 bg-stone-900 border border-white/5 relative overflow-hidden group shadow-2xl">
             <div className={`h-full transition-all duration-500 ${gameState.player.isExhausted ? 'bg-red-500 animate-pulse' : 'bg-green-600'}`} style={{ width: `${gameState.player.stamina}%` }} />
             <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">Stamina</span>
          </div>
        </div>

        <div className="flex gap-2 p-2.5 bg-[#1c1917]/90 rounded-sm border-2 border-stone-800 pointer-events-auto shadow-2xl backdrop-blur-xl">
          {Array.from({ length: 6 }).map((_, idx) => {
            const items = gameState.inventory.filter(i => ['tool', 'building', 'consumable', 'armor'].includes(i.type));
            const item = items[idx];
            const active = activeItem === item?.id;
            return (
              <div key={idx} onClick={() => item && onUseItem(item)} className={`w-16 h-16 border-2 flex items-center justify-center relative cursor-pointer transition-all ${active ? 'border-orange-500 bg-orange-600/20 scale-110 shadow-[0_0_20px_rgba(234,88,12,0.3)] z-10' : 'border-stone-800 bg-[#2d2a28]/60 hover:border-stone-600'}`}>
                {item ? <ItemIcon item={item} isActive={active} /> : <div className="w-1.5 h-1.5 bg-stone-800 rounded-full" />}
                <span className="absolute top-1 left-1.5 text-[10px] text-stone-500 font-black">{idx + 1}</span>
              </div>
            );
          })}
        </div>
        
        <div className="text-[10px] font-black text-stone-500 uppercase tracking-[0.5em] flex gap-10 bg-black/60 px-10 py-3 border border-white/10 rounded-full shadow-2xl italic">
          <span className="hover:text-orange-500 transition-colors cursor-default">[TAB] Inventory</span>
          <span className="hover:text-orange-500 transition-colors cursor-default">[C] Crafting</span>
          <span className="hover:text-orange-500 transition-colors cursor-default">[E] Interact / Quick Eat</span>
          <span className="hover:text-orange-500 transition-colors cursor-default">[CTRL] Stealth</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
