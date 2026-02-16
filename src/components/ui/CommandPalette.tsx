/**
 * @file CommandPalette.tsx
 * @description Corrected Command Registry. No browser collisions.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTab } from '../../store/TabContext';
import { usePlayback } from '../../hooks/usePlayback';
import { generateAsciiTab } from '../../utils/asciiExport';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { tabSheet, addRow, saveManual, undo, redo, shiftNotes } = useTab();
  const { startPlayback } = usePlayback();

  const commands = useMemo(() => [
    { id: 'play', title: 'Play / Stop', shortcut: 'Space', action: () => startPlayback(false) },
    { id: 'play-start', title: 'Play from Beginning', shortcut: 'Shift + Space', action: () => startPlayback(true) },
    { id: 'save', title: 'Save Project', shortcut: 'Ctrl + S', action: saveManual },
    { id: 'undo', title: 'Undo Action', shortcut: 'Ctrl + Z', action: undo },
    { id: 'redo', title: 'Redo Action', shortcut: 'Ctrl + Y', action: redo },
    { id: 'add-staff', title: 'Add New Staff', shortcut: 'Alt + N', action: addRow }, // Fixed shortcut
    { id: 'export-ascii', title: 'Export ASCII', shortcut: 'Alt + E', action: () => {
      const content = generateAsciiTab(tabSheet);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabSheet.title.replace(/\s+/g, '_')}_tab.txt`;
      a.click();
    }},
    { id: 'jump-staff', title: 'Jump Staff Up/Down', shortcut: 'Alt + ↑/↓', action: () => {} },
    { id: 'snap-measure', title: 'Snap 4 Columns', shortcut: 'Shift + ←/→', action: () => {} },
    { id: 'shift-notes', title: 'Time-Shift Notes', shortcut: 'Alt + ←/→', action: () => {} },
  ], [tabSheet, addRow, saveManual, undo, redo, startPlayback]);

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden shadow-yellow-500/5">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <span className="text-yellow-500 font-black text-lg">⌘</span>
          <input 
            autoFocus
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm"
          />
        </div>
        
        <div className="max-h-[40vh] overflow-y-auto p-2">
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); setIsOpen(false); }}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group text-left"
            >
              <span className="text-zinc-300 text-sm font-medium group-hover:text-yellow-500 transition-colors">
                {cmd.title}
              </span>
              <span className="text-[10px] font-mono text-zinc-600 bg-black/20 px-2 py-1 rounded border border-zinc-800">
                {cmd.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};