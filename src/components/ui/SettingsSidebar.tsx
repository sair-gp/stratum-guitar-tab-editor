/**
 * @file SettingsSidebar.tsx
 * @description Refined HUD to ensure visual-to-state parity.
 */

import { useShortcuts } from '../../store/ShortcutContext';
import { useMemo } from 'react';

export const SettingsSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { shortcuts, remapKey } = useShortcuts();

  /**
   * ANALYTIC FIX: useMemo ensures that this reverse-lookup table 
   * is re-calculated EVERY time the shortcuts object changes.
   */
  const actionToKeyMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(shortcuts).forEach(([key, action]) => {
      map[action] = key;
    });
    return map;
  }, [shortcuts]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 p-6 z-[100] shadow-2xl animate-in slide-in-from-right">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-yellow-500 font-black uppercase text-xl tracking-tighter">Tactical_Settings</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">×</button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">String_Mapping</h3>
        
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const actionName = `SELECT_STRING_${num}`;
          // Get the current key from our memoized map
          const currentKey = actionToKeyMap[actionName] || '';

          return (
            <div key={num} className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700">
              <span className="text-xs text-zinc-500 font-mono">String {num}</span>
              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  readOnly
                  // METICULOUS: value is tied directly to the memoized state
                  value={currentKey.toUpperCase()} 
                  className="w-10 h-10 bg-zinc-900 border border-yellow-500/20 text-center text-yellow-500 text-sm font-black rounded-lg focus:border-yellow-500 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  onKeyDown={(e) => {
                    e.preventDefault();
                    const key = e.key.toLowerCase();
                    
                    // The Law: Numbers are for Frets
                    if (/^[0-9]$/.test(key)) {
                      return; 
                    }
                    
                    remapKey(key, actionName as any);
                  }}
                  data-settings-input="true"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};