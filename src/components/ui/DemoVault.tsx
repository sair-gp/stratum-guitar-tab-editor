/**
 * @file DemoVault.tsx
 * @description Dynamic Stratum Vault. Diagnostic logging added to track import failures.
 */

import { useState, useEffect, useMemo } from 'react';
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
  const { setTabSheet, setCursor } = useTab();
  const { stopPlayback } = usePlayback();

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

  const filteredDemos = useMemo(() => 
    registry.filter(d => 
      d.title.toLowerCase().includes(query.toLowerCase()) || 
      d.artist.toLowerCase().includes(query.toLowerCase())
    ), [query, registry]);

  const loadVaultFile = async (filePath: string) => {
    try {
      stopPlayback();
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("FILE_NOT_FOUND");
      const text = await response.text();
      
      // TACTICAL SCAN
      const salvaged = parseAsciiToTab(text);
      
      console.log("VAULT_SCANNER_RESULTS:", {
        title: salvaged.title,
        rowsFound: salvaged.rows.length,
        bpm: salvaged.bpm
      });

      if (salvaged.rows.length > 0) {
        // NO-NONSENSE STATE SWAP
        // We ensure a fresh ID so storage/context treats it as a new entity
        setTabSheet({
          id: crypto.randomUUID(), 
          title: salvaged.title,
          artist: salvaged.artist,
          bpm: salvaged.bpm,
          timeSignature: salvaged.timeSignature,
          rows: salvaged.rows,
          tuning: ["E4", "B3", "G3", "D3", "A2", "E2"], // Fallback to standard
          config: { showMeasureNumbers: false }
        });

        setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
        setIsOpen(false);
        setQuery('');
      } else {
        alert("VAULT_ERROR: Scanner found no valid staff markers (E |). Check file format.");
      }
    } catch (err) {
      console.error("STRATUM_VAULT_LOAD_FAILURE:", err);
      alert(`ERROR: Could not load ${filePath}. Check Console.`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'g') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' && !target.hasAttribute('data-editor-input')) return;
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
    <div className="fixed inset-0 z-110 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60">
      <div className="w-full max-w-xl bg-zinc-950 border border-yellow-500/10 rounded-2xl shadow-2xl overflow-hidden">
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
        
        <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
          {filteredDemos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => loadVaultFile(demo.file)}
              className="w-full flex items-center justify-between p-4 hover:bg-yellow-500/10 rounded-xl transition-all group border border-transparent hover:border-yellow-500/20 mb-1"
            >
              <div>
                <span className="block text-zinc-200 text-sm font-bold group-hover:text-yellow-500">{demo.title}</span>
                <span className="block text-[10px] text-zinc-600 font-mono uppercase tracking-tighter">{demo.artist}</span>
              </div>
              <div className="text-[10px] text-zinc-700 font-black group-hover:text-yellow-600 uppercase">Load_Sector</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};