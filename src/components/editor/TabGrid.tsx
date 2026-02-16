/**
 * @file TabGrid.tsx
 * @description The Unified Command Center. 
 * Integrated transport controls, metadata editing, and staff management.
 */

import { useTab } from '../../store/TabContext';
import { useKeyboardEngine } from '../../hooks/useKeyboardEngine';
import { usePlayback } from '../../hooks/usePlayback';
import { TabRowComponent } from './TabRowComponent';

export const TabGrid = () => {
  const { tabSheet, saveManual, updateMetadata, addRow } = useTab();
  const { startPlayback, isPlaying } = usePlayback();
  
  useKeyboardEngine();

  return (
    <div className="w-full h-full flex flex-col gap-12">
      {/* HUD: Metadata & Tactical Controls */}
      <div className="flex justify-between items-end px-4 border-b border-zinc-800 pb-6">
        
        {/* Left Section: Metadata */}
        <div className="flex flex-col gap-2 w-1/3">
          <input 
            type="text"
            value={tabSheet.title}
            onChange={(e) => updateMetadata('title', e.target.value)}
            className="bg-transparent border-none outline-none text-2xl font-black uppercase tracking-tighter text-yellow-500 placeholder-zinc-800 focus:ring-0"
            placeholder="SONG_TITLE"
          />
          <input 
            type="text"
            value={tabSheet.artist}
            onChange={(e) => updateMetadata('artist', e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 placeholder-zinc-800 focus:ring-0"
            placeholder="ARTIST_NAME"
          />
        </div>

        {/* Center/Right Section: Transport & Settings */}
        <div className="flex items-center gap-6">
          
          {/* BPM & Meter Tuning Station */}
          <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">BPM</span>
              <input 
    type="number"
    value={tabSheet.bpm === 0 ? '' : tabSheet.bpm} // Allows user to clear field without seeing a '0'
    onChange={(e) => updateMetadata('bpm', e.target.value)}
    onBlur={() => {
      // If user leaves field empty or at zero, reset to safe default
      if (tabSheet.bpm < 40) updateMetadata('bpm', 120);
    }}
    className="w-12 bg-transparent text-yellow-500 font-mono text-xs border-none outline-none focus:ring-0"
    min="40"
    max="400"
  />
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">METER</span>
              <select 
                value={tabSheet.timeSignature}
                onChange={(e) => updateMetadata('timeSignature', parseInt(e.target.value))}
                className="bg-transparent text-zinc-400 font-mono text-xs outline-none cursor-pointer hover:text-white appearance-none"
              >
                <option value="4">4/4</option>
                <option value="3">3/4</option>
                <option value="6">6/8</option>
              </select>
            </div>
          </div>

          {/* Master Transport Button */}
          <button 
            onClick={startPlayback}
            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
              isPlaying 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30'
            }`}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>

          {/* Action Row */}
          <div className="flex gap-2">
            <button 
              onClick={addRow}
              className="group flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-lg transition-all font-mono text-[10px] uppercase"
            >
              <span>+</span> ADD_STAFF
            </button>
            <button 
              onClick={saveManual} 
              className="bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 px-6 rounded-lg uppercase text-[10px] transition-all"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>

      {/* Staff Rendering */}
      <div className="flex flex-col gap-16 pb-32">
        {tabSheet.rows.map((row, idx) => (
          <div key={row.id} className="relative">
             <div className="absolute -top-8 left-0 w-full flex items-center gap-4 px-2">
              <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">STAFF_{idx + 1}</span>
              <div className="h-px flex-1 bg-zinc-900/50"></div>
            </div>
            <TabRowComponent row={row} rowIndex={idx} />
          </div>
        ))}
      </div>
    </div>
  );
};