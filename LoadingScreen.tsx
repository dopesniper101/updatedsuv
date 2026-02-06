
import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Engine...');

  const statuses = [
    'Mapping Wasteland...',
    'Calibrating Atmospheric Density...',
    'Spawning Wildlife Populations...',
    'Generating Resource Nodes...',
    'Simulating Radiation Decay...',
    'Synchronizing World Clock...',
    'Ready for Deployment.'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        setStatus(statuses[Math.floor((next / 100) * statuses.length)]);
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0c0a09] z-[1000] flex flex-col items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#f97316_0%,_transparent_70%)]" />
      
      <div className="w-full max-w-2xl relative">
        <div className="flex justify-between items-end mb-4">
          <div className="space-y-1">
            <h2 className="text-orange-600 font-black text-xs tracking-[0.4em] uppercase">System Status</h2>
            <p className="text-white font-bold text-lg game-font italic">{status}</p>
          </div>
          <div className="text-stone-500 font-black text-4xl italic tracking-tighter">
            {Math.floor(progress)}%
          </div>
        </div>

        <div className="h-1.5 w-full bg-stone-900 overflow-hidden rounded-full border border-white/5">
          <div 
            className="h-full bg-orange-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(234,88,12,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 opacity-40">
           <div className="border-t border-stone-800 pt-4">
              <span className="text-[10px] text-stone-600 font-black uppercase block mb-1">Sector</span>
              <span className="text-stone-300 font-bold text-xs uppercase">B-12 Waste</span>
           </div>
           <div className="border-t border-stone-800 pt-4 text-center">
              <span className="text-[10px] text-stone-600 font-black uppercase block mb-1">Uptime</span>
              <span className="text-stone-300 font-bold text-xs uppercase">4,122 Hours</span>
           </div>
           <div className="border-t border-stone-800 pt-4 text-right">
              <span className="text-[10px] text-stone-600 font-black uppercase block mb-1">Signal</span>
              <span className="text-stone-300 font-bold text-xs uppercase">Weak</span>
           </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-[9px] text-stone-700 font-black uppercase tracking-[0.5em] animate-pulse">
        Establishing Secure Uplink...
      </div>
    </div>
  );
};

export default LoadingScreen;
