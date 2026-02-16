/**
 * @file SettingsSidebar.tsx
 * @description Pro-Staff Dashboard. Added Global Config toggles.
 */

import { useTab } from '../../store/TabContext';
import { useShortcuts } from '../../store/ShortcutContext';
import { storage } from '../../utils/storage';
import type { ProjectMetadata } from '../../utils/storage';
import { useMemo, useState, useEffect } from 'react';

export const SettingsSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { loadProject, createNewProject, saveManual, tabSheet, toggleMeasureNumbers } = useTab();
  const { shortcuts, remapKey } = useShortcuts();
  
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

  const renderShortcutRow = (label: string, actionName: string) => {
    const currentKey = actionToKeyMap[actionName] || '';
    return (
      <div key={actionName} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">{label}</span>
        <input 
          type="text" readOnly value={currentKey.toUpperCase()} 
          className="w-8 h-8 bg-zinc-900 border border-yellow-500/20 text-center text-yellow-500 text-[10px] font-black rounded-lg focus:border-yellow-500 outline-none"
          onKeyDown={(e) => { 
            e.preventDefault(); 
            const key = e.key.toLowerCase(); 
            if (!/^[0-9]$/.test(key)) remapKey(key, actionName as any); 
          }}
          data-settings-input="true"
        />
      </div>
    );
  };

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

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
          <div className="space-y-6">
            {/* TACTICAL: Global UI Configuration */}
            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Staff_Configuration</h3>
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Show Measure Numbers</span>
                <button 
                  onClick={toggleMeasureNumbers}
                  className={`w-12 h-6 rounded-full transition-all relative ${tabSheet.config.showMeasureNumbers ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${tabSheet.config.showMeasureNumbers ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">String_Selection</h3>
              {[1, 2, 3, 4, 5, 6].map((num) => renderShortcutRow(`String ${num}`, `SELECT_STRING_${num}`))}
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] border-b border-zinc-800 pb-2">Musical_Techniques</h3>
              {renderShortcutRow("Hammer-on", "TOGGLE_H")}
              {renderShortcutRow("Pull-off", "TOGGLE_P")}
              {renderShortcutRow("Slide ( / )", "TOGGLE_/")}
              {renderShortcutRow("Vibrato ( ~ )", "TOGGLE_V")}
              {renderShortcutRow("Palm Mute", "TOGGLE_M")}
              {renderShortcutRow("Dead Note ( X )", "TOGGLE_X")}
            </div>
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