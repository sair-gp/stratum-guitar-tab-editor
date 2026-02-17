/**
 * @file DemoVault.tsx
 * @description Dynamic Stratum Vault with high-priority keyboard navigation and synchronized scrolling.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTab } from '../../store/TabContext';
import { parseAsciiToTab } from '../../utils/asciiImport';
import { usePlayback } from '../../hooks/usePlayback';

interface DemoItem {
  id: string;
  title: string;
  artist: string;
  file: string;
}

export const DemoVault = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [registry, setRegistry] = useState<DemoItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0); // Track keyboard focus

  const { setTabSheet, setCursor } = useTab();
  const { stopPlayback } = usePlayback();

  // Meticulous Refs for high-priority event handling
  const isOpenRef = useRef(isOpen);
  const selectedIndexRef = useRef(selectedIndex);
  const filteredCountRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync refs to prevent stale closures in the window listener
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await fetch('/tabs/manifest.json');
        if (response.ok) {
          const data = await response.json();
          setRegistry(data.demos || []);
        }
      } catch (err) {
        console.warn("VAULT_MANIFEST_MISSING: Ensure public/tabs/manifest.json exists.");
      }
    };
    fetchManifest();
  }, []);

  const filteredDemos = useMemo(() => {
    const f = registry.filter(d => 
      d.title.toLowerCase().includes(query.toLowerCase()) || 
      d.artist.toLowerCase().includes(query.toLowerCase())
    );
    filteredCountRef.current = f.length;
    return f;
  }, [query, registry]);

  // Reset selection when search changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  /**
   * TACTICAL SCROLL ALIGNMENT
   * Ensures the selection stays within the viewport fold.
   */
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex, isOpen]);

  const loadVaultFile = async (filePath: string) => {
    try {
      stopPlayback();
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("FILE_NOT_FOUND");
      const text = await response.text();
      
      const salvaged = parseAsciiToTab(text);
      
      if (salvaged.rows.length > 0) {
        setTabSheet({
          id: crypto.randomUUID(), 
          title: salvaged.title,
          artist: salvaged.artist,
          bpm: salvaged.bpm,
          timeSignature: salvaged.timeSignature,
          rows: salvaged.rows,
          tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
          config: { showMeasureNumbers: false }
        });

        setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
        setIsOpen(false);
        setQuery('');
      }
    } catch (err) {
      console.error("STRATUM_VAULT_LOAD_FAILURE:", err);
    }
  };

  /**
   * HIGH-PRIORITY KEYBOARD INTERCEPTION
   * Traps navigation keys when the Vault is active.
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // ALT + G: Toggle Vault
      if (e.altKey && key === 'g') {
        const target = e.target as HTMLElement;
        // Don't toggle if typing in a non-editor input
        if (target.tagName === 'INPUT' && !target.hasAttribute('data-editor-input')) return;
        
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
        const demo = filteredDemos[selectedIndexRef.current];
        if (demo) loadVaultFile(demo.file);
      }
    };

    // Use Capture Phase (true) to ensure priority over browser/grid defaults
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [filteredDemos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1100 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border border-yellow-500/10 rounded-2xl shadow-2xl overflow-hidden shadow-yellow-500/5">
        
        <div className="p-4 border-b border-zinc-900 flex items-center gap-3 bg-zinc-900/50">
          <span className="text-yellow-500 font-black text-[10px] uppercase tracking-widest">Vault_Archives</span>
          <input 
            autoFocus
            placeholder="Search verified data..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-700 text-sm font-mono"
          />
        </div>
        
        <div 
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto p-2 scrollbar-hide"
        >
          {filteredDemos.length > 0 ? (
            filteredDemos.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => loadVaultFile(demo.file)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group border-l-2 mb-1 ${
                  index === selectedIndex 
                    ? 'bg-yellow-500/10 border-yellow-500' 
                    : 'hover:bg-white/5 border-transparent'
                }`}
              >
                <div>
                  <span className={`block text-sm font-bold transition-colors ${
                    index === selectedIndex ? 'text-yellow-500' : 'text-zinc-200'
                  }`}>
                    {demo.title}
                  </span>
                  <span className="block text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">
                    {demo.artist}
                  </span>
                </div>
                <div className={`text-[10px] font-black uppercase transition-colors ${
                  index === selectedIndex ? 'text-yellow-600' : 'text-zinc-700'
                }`}>
                  Load_Sector
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-zinc-800 font-mono text-xs uppercase tracking-widest">
              Sector_Empty // No_Matches
            </div>
          )}
        </div>

        <div className="p-2 bg-black/40 text-center border-t border-zinc-900">
            <span className="text-[10px] text-zinc-700 font-bold tracking-widest uppercase">
                ↑↓ Navigate • Enter Load • Alt+G Close
            </span>
        </div>
      </div>
    </div>
  );
};