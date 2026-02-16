/**
 * @file asciiImport.ts
 * @description Intelligent Salvage. Reconstructs mid-song BPM changes from markers.
 */

import type { TabRow, TabColumn } from '../types/tab';

export const parseAsciiToTab = (text: string): { 
  title: string, artist: string, bpm: number, timeSignature: number, rows: TabRow[] 
} => {
  const lines = text.split('\n').map(l => l.trimEnd());
  const resultRows: TabRow[] = [];
  
  // 1. HEADER PARSING (Stable)
  let title = "Salvaged Tab", artist = "Unknown Artist", bpm = 120, timeSignature = 4;
  if (lines[0]?.includes(' - ')) {
    const parts = lines[0].split(' - ');
    title = parts[0].trim();
    artist = parts[1].trim();
  }
  const globalMeta = lines.find(l => l.includes('Tempo:'));
  if (globalMeta) {
    const bMatch = globalMeta.match(/Tempo:\s*(\d+)/);
    const mMatch = globalMeta.match(/Meter:\s*(\d+)/);
    if (bMatch) bpm = parseInt(bMatch[1]);
    if (mMatch) timeSignature = parseInt(mMatch[1]);
  }

  // 2. STAFF & TEMPO GROUPING
  // We look for the Tempo Line followed by the 6-string staff
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('E |')) {
      const tempoLine = lines[i - 1] || ""; // The line immediately above the staff
      const staffLines = lines.slice(i, i + 6);
      
      const rhythmicSlots: TabColumn[] = Array.from({ length: 32 }, () => ({
        id: crypto.randomUUID(),
        notes: Array(6).fill(''),
        bpm: undefined // Default
      }));

      // A. Parse BPM Markers from tempoLine
      // Matches [BPM:120]
      const bpmRegex = /\[BPM:(\d+)\]/g;
      let match;
      while ((match = bpmRegex.exec(tempoLine)) !== null) {
        const charIdx = match.index - 4; // Adjustment for "E |" padding
        const slotIdx = Math.round(charIdx / 3);
        if (slotIdx >= 0 && slotIdx < 32) {
          rhythmicSlots[slotIdx].bpm = parseInt(match[1]);
        }
      }

      // B. Parse Strings (Existing Logic)
      const layers = staffLines.map(line => {
        const start = line.indexOf('|') + 1;
        const end = line.lastIndexOf('|');
        return line.substring(start, end);
      });

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const layer = layers[sIdx];
        let x = 0;
        while (x < layer.length) {
          if (layer[x] === '-' || layer[x] === ' ' || layer[x] === '|') { x++; continue; }
          let noteUnit = "";
          const startPos = x;
          while (x < layer.length && layer[x] !== '-' && layer[x] !== ' ' && layer[x] !== '|') {
            noteUnit += layer[x];
            x++;
          }
          const slotIdx = Math.round(startPos / 3);
          if (slotIdx >= 0 && slotIdx < 32) {
            rhythmicSlots[slotIdx].notes[sIdx] = noteUnit;
          }
        }
      }

      resultRows.push({ id: crypto.randomUUID(), columns: rhythmicSlots });
      i += 5; // Skip the staff block
    }
  }

  return { title, artist, bpm, timeSignature, rows: resultRows };
};