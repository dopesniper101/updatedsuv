
import React, { useState } from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [view, setView] = useState<'main' | 'manual' | 'comms' | 'settings'>('main');

  const servers = [
    { name: "OFFICIAL US EAST - SECTOR 7G", players: "84/100", ping: "24ms", type: "Official" },
    { name: "MODDED 5x | LOOT+ | KITS", players: "12/50", ping: "45ms", type: "Modded" },
    { name: "COMMUNITY VANILLA SOLO/DUO", players: "41/60", ping: "38ms", type: "Community" },
    { name: "WASTELAND BATTLEDOME [PVP]", players: "98/100", ping: "12ms", type: "Official" },
  ];

  const renderContent = () => {
    switch (view) {
      case 'manual':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 bg-stone-900/90 p-10 border border-white/5 backdrop-blur-md max-w-2xl">
            <h2 className="text-orange-500 font-black text-2xl italic tracking-tighter mb-6 underline decoration-orange-900 underline-offset-8">FIELD MANUAL v1.0</h2>
            <div className="space-y-6 text-stone-300 text-sm font-bold leading-relaxed uppercase tracking-widest">
              <p><span className="text-white bg-orange-700 px-2 mr-2">Movement</span> W/A/S/D to navigate. SHIFT to sprint. Sprinting consumes stamina rapidly.</p>
              <p><span className="text-white bg-orange-700 px-2 mr-2">Harvesting</span> Approach trees or rocks and use [LMB] or [E] to gather. Stone tools yield more resources than fists.</p>
              <p><span className="text-white bg-orange-700 px-2 mr-2">Survival</span> Hunger and thirst are killers. At critical levels (15%), they drain health and halve stamina regen.</p>
              <p><span className="text-white bg-orange-700 px-2 mr-2">Combat</span> Craft weapons to defend against wildlife. Crouching [CTRL] reduces noise and visibility.</p>
            </div>
            <button onClick={() => setView('main')} className="mt-10 text-orange-600 font-black text-xs tracking-[0.4em] hover:text-white transition-colors border-2 border-orange-900/30 px-6 py-3 hover:bg-orange-600/10">BACK TO TERMINAL</button>
          </div>
        );
      case 'comms':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 bg-black/80 p-10 border-l-4 border-green-600/30 max-w-2xl">
            <h2 className="text-green-500 font-black text-xl italic tracking-tighter flex items-center gap-3">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              SECURE COMMS INTERFACE
            </h2>
            <div className="space-y-3 text-green-700 text-xs font-mono leading-relaxed bg-black p-4 border border-green-900/20">
              <p>[14:22:01] SECURE UPLINK ESTABLISHED: SECTOR 7G</p>
              <p>[14:23:45] ADVISORY: RADIATION LEVELS STABILIZING IN LOWLANDS</p>
              <p>[14:25:12] INTEL: ANOMALOUS BIOMETRIC SIGNATURES DETECTED NEAR CRATER</p>
              <p className="text-red-900/80 bg-red-900/10 px-2">[14:28:99] WARNING: OUTPOST 12 SILENT. INVESTIGATION REQUIRED.</p>
              <p>[14:30:00] STANDBY FOR FURTHER NEURAL SYNC...</p>
              <p className="animate-pulse">_</p>
            </div>
            <button onClick={() => setView('main')} className="mt-8 text-green-900 font-black text-[10px] tracking-[0.4em] hover:text-green-400 transition-colors uppercase">Disconnect Link</button>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 bg-stone-900/90 p-10 border border-white/5 backdrop-blur-md max-w-xl">
            <h2 className="text-orange-500 font-black text-xl italic tracking-tighter mb-6">BIOMETRIC CONFIG</h2>
            <div className="space-y-6">
               <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Neural Volume</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className={`w-3 h-4 ${i < 6 ? 'bg-orange-600' : 'bg-stone-800'}`} />)}
                  </div>
               </div>
               <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Atmospheric Sync</span>
                  <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">Enabled</span>
               </div>
               <div className="flex justify-between items-center border-b border-stone-800 pb-3 opacity-40">
                  <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest">PVP Flag Override</span>
                  <span className="text-stone-600 text-[10px] font-black uppercase tracking-widest">Locked</span>
               </div>
            </div>
            <button onClick={() => setView('main')} className="mt-8 text-orange-600 font-black text-[10px] tracking-[0.4em] hover:text-white transition-colors">RETURN TO MAIN</button>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-12 gap-12 w-full max-w-7xl mx-auto px-4">
            {/* Sidebar Controls */}
            <div className="col-span-3 flex flex-col gap-3 mt-12">
              <button onClick={() => setView('manual')} className="group text-left p-4 bg-stone-900/40 hover:bg-orange-600/10 border-l-2 border-stone-800 hover:border-orange-600 transition-all">
                <span className="text-stone-500 group-hover:text-white font-black text-xs uppercase tracking-[0.3em]">Field Manual</span>
              </button>
              <button onClick={() => setView('comms')} className="group text-left p-4 bg-stone-900/40 hover:bg-orange-600/10 border-l-2 border-stone-800 hover:border-orange-600 transition-all">
                <span className="text-stone-500 group-hover:text-white font-black text-xs uppercase tracking-[0.3em]">Secure Comms</span>
              </button>
              <button onClick={() => setView('settings')} className="group text-left p-4 bg-stone-900/40 hover:bg-orange-600/10 border-l-2 border-stone-800 hover:border-orange-600 transition-all">
                <span className="text-stone-500 group-hover:text-white font-black text-xs uppercase tracking-[0.3em]">Settings</span>
              </button>
              <button onClick={() => window.close()} className="group text-left p-4 bg-stone-900/40 hover:bg-red-900/10 border-l-2 border-stone-800 hover:border-red-600 transition-all mt-8">
                <span className="text-red-900/40 group-hover:text-red-600 font-black text-xs uppercase tracking-[0.3em]">Exit Client</span>
              </button>
            </div>

            {/* Server Browser Section */}
            <div className="col-span-9 space-y-4">
              <div className="flex justify-between items-end border-b-2 border-stone-800 pb-4">
                 <h2 className="text-white font-black text-2xl italic tracking-tighter">SERVER BROWSER</h2>
                 <span className="text-stone-500 font-black text-[10px] tracking-widest uppercase">4 ACTIVE RELAYS FOUND</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {servers.map((s, i) => (
                  <div key={i} className="group relative flex items-center justify-between bg-stone-900/60 hover:bg-white p-4 transition-all cursor-pointer border-l-4 border-orange-600/30 hover:border-orange-600" onClick={onStart}>
                     <div className="flex flex-col">
                        <span className="text-white group-hover:text-black font-black text-sm uppercase tracking-wider">{s.name}</span>
                        <div className="flex gap-4 mt-1">
                           <span className="text-[10px] font-bold text-stone-500 group-hover:text-stone-600 uppercase">{s.type}</span>
                           <span className="text-[10px] font-bold text-green-600 uppercase">{s.ping}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <span className="text-stone-500 group-hover:text-black font-black text-xs">{s.players}</span>
                        <span className="text-orange-600 font-black text-xl opacity-0 group-hover:opacity-100 transition-opacity">JOIN →</span>
                     </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-12">
                <button 
                  onClick={onStart}
                  className="group relative flex items-center justify-between bg-orange-600 hover:bg-white text-white hover:text-orange-600 font-black py-8 px-12 rounded-sm transition-all hover:-translate-y-2 border-b-8 border-orange-950 active:translate-y-1 active:border-b-0 shadow-2xl"
                >
                  <span className="text-4xl italic tracking-tighter uppercase mr-12">JOIN SECTOR 7G</span>
                  <span className="text-4xl transition-transform group-hover:translate-x-4">→</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0c0a09] flex flex-col justify-between p-16 overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none scale-110">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09] via-transparent to-[#0c0a09] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a09] via-transparent to-[#0c0a09] z-10" />
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center grayscale contrast-[1.2] brightness-50" />
        {/* Procedural Noise Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay animate-pulse" />
      </div>

      {/* Header Area */}
      <div className="z-20">
        <div className="flex items-center gap-6">
          <h1 className="text-[12rem] font-black text-white game-font tracking-[-0.05em] uppercase drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)] leading-none italic select-none">
            RUSTED
          </h1>
          <div className="h-24 w-1.5 bg-orange-600 mt-8" />
        </div>
        <div className="flex items-center gap-4 mt-2 ml-4">
           <p className="text-orange-600 font-black tracking-[0.8em] text-sm uppercase opacity-80">Wasteland Survival Simulation • v0.2.8 Alpha</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="z-20 flex flex-1 items-center justify-center">
        {renderContent()}
      </div>

      {/* Footer Info */}
      <div className="z-20 flex justify-between items-end">
        <div className="max-w-md bg-black/40 p-8 backdrop-blur-3xl border-l-8 border-orange-600 shadow-2xl">
          <h3 className="text-orange-500 font-black mb-3 uppercase text-[10px] tracking-[0.4em] flex items-center gap-3">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping" />
            LIVE TRANSMISSION: QUADRANT DELTA
          </h3>
          <p className="text-stone-400 text-xs font-bold leading-relaxed italic opacity-90">
            "The concrete is cold. The air is poison. Trust the rock in your hand more than the man in your shadow."
          </p>
        </div>
        <div className="text-right space-y-4">
          <div className="flex gap-2 justify-end">
             {[1,2,3,4,5].map(i => <div key={i} className={`w-8 h-1 ${i === 3 ? 'bg-orange-600' : 'bg-stone-800'}`} />)}
          </div>
          <p className="text-stone-700 text-[10px] game-font uppercase tracking-[0.6em] font-black italic">
            © 2024 WASTETECH BIOMETRICS • SECTOR 7G • PDX-01
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
