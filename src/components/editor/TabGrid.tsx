/**
 * @file TabGrid.tsx
 * @description Streamlined Command Center. Focuses on Workspace and Transport.
 */

import { useTab } from '../../store/TabContext';
import { useKeyboardEngine } from '../../hooks/useKeyboardEngine';
import { usePlayback } from '../../hooks/usePlayback';
import { TabRowComponent } from './TabRowComponent';
import { generateAsciiTab } from '../../utils/asciiExport';

export const TabGrid = () => {
  const { tabSheet, saveManual, updateMetadata, addRow } = useTab();
  const { startPlayback, stopPlayback, isPlaying } = usePlayback();
  
  useKeyboardEngine();

  const handleExportAscii = () => {
    const content = generateAsciiTab(tabSheet);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tabSheet.title.replace(/\s+/g, '_')}_tab.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col gap-12">
      <div className="flex justify-between items-end px-4 border-b border-zinc-800 pb-6">
        
        {/* Metadata Block */}
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

        {/* Transport & Primary Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">BPM</span>
              <input 
                type="number"
                value={tabSheet.bpm === 0 ? '' : tabSheet.bpm} 
                onChange={(e) => updateMetadata('bpm', parseInt(e.target.value) || 0)}
                onBlur={() => { if (tabSheet.bpm < 10) updateMetadata('bpm', 120); }}
                className="w-12 bg-transparent text-yellow-500 font-mono text-xs border-none outline-none focus:ring-0"
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

          <button 
            onClick={() => isPlaying ? stopPlayback() : startPlayback(false)}
            className={`px-8 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
              isPlaying 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30'
            }`}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>

          <div className="flex gap-2">
            <button 
              onClick={handleExportAscii}
              className="bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white px-4 py-2 rounded-lg transition-all font-mono text-[9px] uppercase tracking-widest"
            >
              EXPORT_ASCII
            </button>
            <button 
              onClick={addRow}
              className="group flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2 rounded-lg transition-all font-mono text-[10px] uppercase hover:border-zinc-700 hover:text-zinc-200"
            >
              <span>+</span> STAFF
            </button>
            <button 
              onClick={saveManual} 
              className="bg-yellow-600 hover:bg-yellow-500 text-black font-black py-2 px-6 rounded-lg uppercase text-[10px] transition-all active:scale-95 shadow-lg"
            >
              SAVE
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16 pb-32">
        {tabSheet.rows.map((row, idx) => (
          <div key={row.id} className="relative group/staff">
             <div className="absolute -top-8 left-0 w-full flex items-center gap-4 px-2 opacity-30 group-hover/staff:opacity-100 transition-opacity">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em]">STAFF_{idx + 1}</span>
              <div className="h-px flex-1 bg-zinc-800"></div>
            </div>
            <TabRowComponent row={row} rowIndex={idx} />
          </div>
        ))}
      </div>
    </div>
  );
};