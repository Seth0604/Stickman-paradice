
import React, { useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { LogEntry } from './types';

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeData, setTimeData] = useState({ time: "Minute 1", task: "Free Time" });

  const addLog = useCallback((message: string, type: 'normal' | 'alert' = 'normal') => {
    setLogs(prev => [
      { id: Math.random().toString(36), timestamp: Date.now(), message, type },
      ...prev.slice(0, 9) // Keep last 10
    ]);
  }, []);

  const handleTimeUpdate = useCallback((time: string, task: string) => {
      setTimeData({ time, task });
  }, []);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden font-sans">
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Scene onLog={addLog} onTimeUpdate={handleTimeUpdate} />
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

      {/* Event Feed (Right Side) */}
      <div className="absolute top-4 right-4 z-10 w-80 flex flex-col gap-2 pointer-events-none">
        {logs.map(log => (
            <div 
                key={log.id} 
                className={`
                    p-3 rounded-lg shadow-lg backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right
                    ${log.type === 'alert' ? 'bg-red-500/90 text-white' : 'bg-white/80 text-gray-800'}
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
