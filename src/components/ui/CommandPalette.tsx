/**
 * @file CommandPalette.tsx
 * @description Command Registry with synchronized keyboard scrolling.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTab } from '../../store/TabContext';
import { usePlayback } from '../../hooks/usePlayback';
import { generateAsciiTab } from '../../utils/asciiExport';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { tabSheet, addRow, saveManual, undo, redo } = useTab();
  const { startPlayback } = usePlayback();

  // Meticulous Refs
  const isOpenRef = useRef(isOpen);
  const selectedIndexRef = useRef(selectedIndex);
  const filteredCountRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

  const commands = useMemo(() => [
    { id: 'play', title: 'Play / Stop', shortcut: 'Space', action: () => startPlayback(false) },
    { id: 'play-start', title: 'Play from Beginning', shortcut: 'Shift + Space', action: () => startPlayback(true) },
    { id: 'save', title: 'Save Project', shortcut: 'Ctrl + S', action: saveManual },
    { id: 'undo', title: 'Undo Action', shortcut: 'Ctrl + Z', action: undo },
    { id: 'redo', title: 'Redo Action', shortcut: 'Ctrl + Y', action: redo },
    { id: 'add-staff', title: 'Add New Staff', shortcut: 'Alt + N', action: addRow },
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

  const filteredCommands = useMemo(() => {
    const f = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
    filteredCountRef.current = f.length;
    return f;
  }, [commands, query]);

  // RESET INDEX ON SEARCH
  useEffect(() => { setSelectedIndex(0); }, [query]);

  /**
   * TACTICAL SCROLL ALIGNMENT
   * Ensures the DOM element follows the state index.
   */
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest', // Only scrolls if out of view
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isCtrlK = (e.ctrlKey || e.metaKey) && key === 'k';

      if (isCtrlK) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
        setQuery('');
        return;
      }

      if (!isOpenRef.current) return;

      if (key === 'escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (key === 'arrowdown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCountRef.current);
      } else if (key === 'arrowup') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCountRef.current) % filteredCountRef.current);
      } else if (key === 'enter') {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndexRef.current];
        if (cmd) {
          cmd.action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden shadow-yellow-500/5">
        
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <span className="text-yellow-500 font-black text-lg">⌘</span>
          <input 
            autoFocus
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-sm"
          />
        </div>
        
        {/* SCROLLABLE LIST WITH REF */}
        <div 
          ref={listRef} 
          className="max-h-[40vh] overflow-y-auto p-2 scrollbar-hide"
        >
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); setIsOpen(false); }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group text-left border-l-2 ${
                index === selectedIndex 
                  ? 'bg-yellow-500/10 border-yellow-500' 
                  : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <span className={`text-sm font-medium transition-colors ${
                index === selectedIndex ? 'text-yellow-500' : 'text-zinc-300'
              }`}>
                {cmd.title}
              </span>
              <span className="text-[10px] font-mono text-zinc-600 bg-black/20 px-2 py-1 rounded border border-zinc-800">
                {cmd.shortcut}
              </span>
            </button>
          ))}
        </div>

        <div className="p-2 bg-black/10 text-center border-t border-zinc-800">
            <span className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
                Arrows to navigate • Enter to execute • Esc to close
            </span>
        </div>
      </div>
    </div>
  );
};