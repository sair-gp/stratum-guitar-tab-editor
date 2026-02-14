/**
 * @file ShortcutHUD.tsx
 * @description A persistent visual guide for the editor's core navigation and input logic.
 */

import { useShortcuts } from '../../store/ShortcutContext';

export const ShortcutHUD = () => {
  const { shortcuts } = useShortcuts();

  // Helper to find key for specific actions
  const findKey = (action: string) => 
    Object.keys(shortcuts).find(k => shortcuts[k] === action)?.toUpperCase() || '?';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-6 py-3 rounded-2xl shadow-2xl flex gap-8 items-center">
        
        {/* String Select Group */}
        <div className="flex gap-3 border-r border-zinc-800 pr-8">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest self-center">Strings:</span>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className="flex flex-col items-center gap-1">
              <kbd className="min-w-[20px] h-5 px-1 bg-zinc-800 rounded text-[10px] font-black text-yellow-500 flex items-center justify-center border border-zinc-700">
                {findKey(`SELECT_STRING_${s}`)}
              </kbd>
            </div>
          ))}
        </div>

        {/* Navigation Group */}
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Fast_Jump</span>
            <span className="text-[10px] text-zinc-300 font-mono italic">SHIFT + ← →</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Next_Col</span>
            <kbd className="bg-zinc-800 px-2 py-0.5 rounded text-[9px] font-black text-zinc-400 border border-zinc-700">ENTER</kbd>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Save</span>
            <span className="text-[10px] text-zinc-300 font-mono italic">CTRL + S</span>
          </div>
        </div>

      </div>
    </div>
  );
};