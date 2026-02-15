/**
 * @file PlaybackToolbar.tsx
 * @description Integrated control for BPM, Time Signature, and Transport.
 */

import { useTab } from '../../store/TabContext';
import { usePlayback } from '../../hooks/usePlayback';

export const PlaybackToolbar = () => {
  const { tabSheet, updateMetadata } = useTab();
  const { startPlayback, isPlaying } = usePlayback();

  return (
    <div className="flex items-center gap-6 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 shadow-inner">
      
      {/* BPM Input */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">BPM</span>
        <input 
          type="number"
          min="40"
          max="280"
          value={tabSheet.bpm}
          onChange={(e) => updateMetadata('bpm', parseInt(e.target.value) || 120)}
          className="w-12 bg-transparent text-yellow-500 font-mono text-sm border-b border-zinc-800 focus:border-yellow-500 outline-none transition-colors"
        />
      </div>

      {/* Time Signature Select */}
      <div className="flex items-center gap-3 border-l border-zinc-800 pl-6">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">METER</span>
        <select 
          value={tabSheet.timeSignature}
          onChange={(e) => updateMetadata('timeSignature', parseInt(e.target.value))}
          className="bg-transparent text-zinc-300 font-mono text-sm outline-none cursor-pointer hover:text-white"
        >
          <option value="4" className="bg-zinc-900">4 / 4</option>
          <option value="3" className="bg-zinc-900">3 / 4</option>
          <option value="6" className="bg-zinc-900">6 / 8</option>
        </select>
      </div>

      {/* Playback Toggle */}
      <button 
        onClick={startPlayback}
        className={`ml-4 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border transition-all ${
          isPlaying 
            ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse' 
            : 'bg-green-500/10 border-green-500 text-green-500 hover:bg-green-500/20'
        }`}
      >
        {isPlaying ? 'STOP' : 'PLAY'}
      </button>
    </div>
  );
};