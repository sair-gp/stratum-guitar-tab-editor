/**
 * @file asciiImport.ts
 * @description Advanced Salvage Engine. Now supports Bracketed Harmonics < > and multi-char techniques.
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
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('E |')) {
      const tempoLine = lines[i - 1] || "";
      const staffLines = lines.slice(i, i + 6);
      
      const rhythmicSlots: TabColumn[] = Array.from({ length: 32 }, () => ({
        id: crypto.randomUUID(),
        notes: Array(6).fill(''),
        bpm: undefined
      }));

      // A. Parse BPM Markers
      const bpmRegex = /\[BPM:(\d+)\]/g;
      let match;
      while ((match = bpmRegex.exec(tempoLine)) !== null) {
        const charIdx = match.index - 4; 
        const slotIdx = Math.round(charIdx / 3);
        if (slotIdx >= 0 && slotIdx < 32) {
          rhythmicSlots[slotIdx].bpm = parseInt(match[1]);
        }
      }

      // B. Parse Strings (REFINED FOR HARMONICS)
      const layers = staffLines.map(line => {
        const start = line.indexOf('|') + 1;
        const end = line.lastIndexOf('|');
        return line.substring(start, end);
      });

      for (let sIdx = 0; sIdx < 6; sIdx++) {
        const layer = layers[sIdx];
        let x = 0;
        while (x < layer.length) {
          // Skip empty space and vertical bar dividers
          if (layer[x] === '-' || layer[x] === ' ' || layer[x] === '|') { 
            x++; 
            continue; 
          }

          let noteUnit = "";
          const startPos = x;

          /**
           * TACTICAL UNIT COLLECTION:
           * If we encounter a harmonic bracket, we collect everything until the closing bracket.
           * Otherwise, we collect until the next dash, space, or bar.
           */
          if (layer[x] === '<') {
            while (x < layer.length && layer[x] !== '>') {
              noteUnit += layer[x];
              x++;
            }
            if (layer[x] === '>') {
              noteUnit += '>';
              x++;
            }
          } else {
            while (x < layer.length && layer[x] !== '-' && layer[x] !== ' ' && layer[x] !== '|') {
              noteUnit += layer[x];
              x++;
            }
          }

          const slotIdx = Math.round(startPos / 3);
          if (slotIdx >= 0 && slotIdx < 32) {
            rhythmicSlots[slotIdx].notes[sIdx] = noteUnit;
          }
        }
      }

      resultRows.push({ id: crypto.randomUUID(), columns: rhythmicSlots });
      i += 5; 
    }
  }

  return { title, artist, bpm, timeSignature, rows: resultRows };
};