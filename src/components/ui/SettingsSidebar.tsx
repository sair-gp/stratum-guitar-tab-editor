/**
 * @file SettingsSidebar.tsx
 * @description Dual-mode HUD with a clean toggle between Projects and Shortcuts.
 */

import { useTab } from '../../store/TabContext';
import { useShortcuts } from '../../store/ShortcutContext';
import { storage } from '../../utils/storage';
import type { ProjectMetadata } from '../../utils/storage';
import { useMemo, useState, useEffect } from 'react';

export const SettingsSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { loadProject, createNewProject, saveManual } = useTab();
  const { shortcuts, remapKey } = useShortcuts();
  
  // TACTICAL STATE: Toggle between catalog and shortcuts
  const [view, setView] = useState<'catalog' | 'shortcuts'>('catalog');
  const [catalog, setCatalog] = useState<ProjectMetadata[]>([]);

  useEffect(() => {
    if (isOpen) setCatalog(storage.getIndex());
  }, [isOpen]);

  const actionToKeyMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(shortcuts).forEach(([key, action]) => { map[action] = key; });
    return map;
  }, [shortcuts]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-zinc-900 border-l border-zinc-800 z-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
      
      {/* TACTICAL NAVIGATION */}
      <div className="flex bg-zinc-950 border-b border-zinc-800">
        <button 
          onClick={() => setView('catalog')}
          className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-all ${
            view === 'catalog' ? 'text-yellow-500 bg-zinc-900' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          PROJECTS
        </button>
        <button 
          onClick={() => setView('shortcuts')}
          className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-all ${
            view === 'shortcuts' ? 'text-yellow-500 bg-zinc-900' : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          SHORTCUTS
        </button>
        <button onClick={onClose} className="px-6 text-zinc-600 hover:text-white text-xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {view === 'catalog' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Saved_Archives</h3>
              <button onClick={() => { saveManual(); createNewProject(); onClose(); }} className="bg-yellow-600 text-black px-3 py-1 rounded-md text-[9px] font-black uppercase">New_Project</button>
            </div>
            {catalog.map(p => (
              <div 
                key={p.id}
                onClick={() => { loadProject(p.id); onClose(); }}
                className="group flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 hover:border-yellow-500/50 cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold text-zinc-300 group-hover:text-yellow-500">{p.title}</span>
                  <span className="block text-[8px] text-zinc-600 font-mono italic">{new Date(p.lastModified).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm("Nuke project?")) { storage.deleteProject(p.id); setCatalog(storage.getIndex()); }}}
                  className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-500 text-[10px] font-black"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-6">Tactical_Remapping</h3>
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const actionName = `SELECT_STRING_${num}`;
              const currentKey = actionToKeyMap[actionName] || '';
              return (
                <div key={num} className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 font-mono">STR_{num}</span>
                  <input 
                    type="text" readOnly value={currentKey.toUpperCase()} 
                    className="w-10 h-10 bg-zinc-900 border border-yellow-500/20 text-center text-yellow-500 text-sm font-black rounded-lg focus:border-yellow-500 outline-none"
                    onKeyDown={(e) => { e.preventDefault(); const key = e.key.toLowerCase(); if (!/^[0-9]$/.test(key)) remapKey(key, actionName as any); }}
                    data-settings-input="true"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
        <button onClick={() => storage.clearAll()} className="w-full py-3 text-red-900 border border-red-900/20 rounded-xl text-[9px] font-black tracking-tighter hover:bg-red-900 hover:text-white transition-all uppercase">
          Wipe_All_Local_Data
        </button>
      </div>
    </div>
  );
};