/**
 * @file TabGrid.tsx
 * @description The Command Center. Integrated metadata editing and staff management.
 */

import { useTab } from '../../store/TabContext';
import { useKeyboardEngine } from '../../hooks/useKeyboardEngine';
import { TabRowComponent } from './TabRowComponent';

export const TabGrid = () => {
  const { tabSheet, saveManual, updateMetadata, addRow } = useTab();
  useKeyboardEngine();

  return (
    <div className="w-full h-full flex flex-col gap-12">
      {/* HUD: Metadata & Master Controls */}
      <div className="flex justify-between items-end px-4 border-b border-zinc-800 pb-6">
        <div className="flex flex-col gap-2 w-1/2">
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
        
        <div className="flex gap-4">
          <button 
            onClick={addRow}
            className="group flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-yellow-500/50 text-zinc-400 hover:text-yellow-500 px-4 py-2 rounded-lg transition-all font-mono text-[10px] uppercase tracking-widest"
          >
            <span className="text-lg group-hover:scale-125 transition-transform">+</span>
            Add_Staff
          </button>
          
          <button 
            onClick={saveManual}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 px-6 rounded-lg transition-all uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.2)]"
          >
            Persist_to_Disk
          </button>
        </div>
      </div>

      {/* Staff Rendering Logic remains the same... */}
      <div className="flex flex-col gap-16 pb-32">
        {tabSheet.rows.map((row, idx) => (
          <div key={row.id} className="relative">
             <div className="absolute -top-8 left-0 w-full flex items-center gap-4 px-2">
              <span className="text-[10px] font-black text-zinc-800 uppercase tracking-[0.5em]">STAFF_{idx + 1}</span>
              <div className="h-[1px] flex-1 bg-zinc-900/50"></div>
            </div>
            <TabRowComponent row={row} rowIndex={idx} />
          </div>
        ))}
      </div>
    </div>
  );
};