
import React, { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { Scene } from './components/Scene';
import { LogEntry } from './types';
import { ISLAND_POSITION, HEAVEN_POSITION } from './constants';

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeData, setTimeData] = useState({ time: "Minute 1", task: "Free Time" });
  const [warpTrigger, setWarpTrigger] = useState<{ minute: number, id: number } | null>(null);
  const [teleportTarget, setTeleportTarget] = useState<Vector3 | null>(null);
  const [logsExpanded, setLogsExpanded] = useState(true);

  const addLog = useCallback((message: string, type: 'normal' | 'alert' | 'success' = 'normal') => {
    setLogs(prev => [
      { id: Math.random().toString(36), timestamp: Date.now(), message, type },
      ...prev.slice(0, 15) // Keep last 15
    ]);
  }, []);

  const handleTimeUpdate = useCallback((time: string, task: string) => {
      setTimeData({ time, task });
  }, []);

  const handleWarp = (minute: number) => {
      setWarpTrigger({ minute, id: Date.now() });
      addLog(`Warping to Minute ${minute}...`, 'normal');
  };

  const handleTeleport = (target: string) => {
      if (target === 'CITY') setTeleportTarget(new Vector3(0, 0, 0));
      if (target === 'ISLAND') setTeleportTarget(new Vector3(...ISLAND_POSITION));
      if (target === 'HEAVEN') setTeleportTarget(new Vector3(...HEAVEN_POSITION));
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden font-sans">
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Scene onLog={addLog} onTimeUpdate={handleTimeUpdate} warpTrigger={warpTrigger} teleportTarget={teleportTarget} />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
         <h1 className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tighter">
            STICKMAN PARADISE 3D
         </h1>
         <p className="text-white/80 text-sm drop-shadow-md">A simulation of 50 lives.</p>
      </div>

      {/* Clock Widget */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-2">
        <div className="bg-black/40 backdrop-blur-md text-white px-8 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4 min-w-[300px] justify-center">
             <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
             <span className="font-mono text-3xl font-bold tracking-widest tabular-nums">
                {timeData.time}
             </span>
        </div>
        <div className="bg-white/90 text-black font-bold px-4 py-1 rounded-lg shadow-lg text-sm uppercase tracking-wider animate-in fade-in zoom-in duration-300">
            Current Task: {timeData.task}
        </div>
      </div>

      {/* Controls / Info */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-xl max-w-xs">
           <h2 className="font-bold mb-2 text-gray-800">Controls & Stats</h2>
           <ul className="text-sm space-y-1 text-gray-700">
             <li className="font-bold text-blue-600">🖱️ Drag to Look Around</li>
             <li className="font-bold text-blue-600">🎮 WASD to Move</li>
             <li className="font-bold text-blue-600">↕️ Q/E to Fly Up/Down</li>
             <li>🏠 Houses: 25 Blocks (Expanded)</li>
             <li>👨‍👩‍👦 Population: 50 Residents</li>
           </ul>
        </div>
      </div>

      {/* Teleport Controls */}
      <div className="absolute top-4 right-1/2 translate-x-1/2 z-10 pointer-events-auto flex gap-2">
         <button onClick={() => handleTeleport('CITY')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-4 rounded-full text-sm shadow-lg border border-white/20">
            CITY
         </button>
         <button onClick={() => handleTeleport('ISLAND')} className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-1 px-4 rounded-full text-sm shadow-lg border border-white/20">
            ISLAND
         </button>
         <button onClick={() => handleTeleport('HEAVEN')} className="bg-white/90 hover:bg-white text-yellow-600 font-bold py-1 px-4 rounded-full text-sm shadow-lg border border-white/20">
            HEAVEN
         </button>
      </div>

      {/* Time Warp Controls */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-white/10">
              <h3 className="text-white font-bold mb-3 text-center text-sm uppercase tracking-wider">Time Warp</h3>
              <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(m => (
                      <button 
                        key={m}
                        onClick={() => handleWarp(m)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded shadow transition-transform active:scale-95 text-xs"
                      >
                          Min {m}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Event Feed (Right Side) */}
      <div className={`absolute top-16 right-4 z-10 flex flex-col items-end pointer-events-auto transition-all duration-300 ${logsExpanded ? 'w-80' : 'w-10'}`}>
        <button 
            onClick={() => setLogsExpanded(!logsExpanded)}
            className="mb-2 bg-white/20 hover:bg-white/40 text-white font-bold p-2 rounded-full backdrop-blur-md shadow-lg"
        >
            {logsExpanded ? '👉' : '👈'}
        </button>
        
        {logsExpanded && logs.map(log => (
            <div 
                key={log.id} 
                className={`
                    w-full mb-2 p-3 rounded-lg shadow-lg backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right
                    ${log.type === 'alert' ? 'bg-red-500/90 text-white' : (log.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-white/80 text-gray-800')}
                `}
            >
                <div className="text-xs opacity-70 mb-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="font-medium text-sm leading-tight">
                    {log.message}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default App;
