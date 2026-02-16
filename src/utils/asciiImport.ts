/**
 * @file asciiImport.ts
 * @description Scanner-Based Salvage. Detects variable-width columns and harmonic brackets.
 */

import type { TabRow, TabColumn } from '../types/tab';

export const parseAsciiToTab = (text: string): { 
  title: string, artist: string, bpm: number, timeSignature: number, rows: TabRow[] 
} => {
  const lines = text.split('\n');
  const resultRows: TabRow[] = [];
  
  // 1. HEADER PARSING (Stable)
  let title = "Salvaged Tab", artist = "Unknown Artist", bpm = 120, timeSignature = 4;
  if (lines[0]?.includes(' - ')) {
    const parts = lines[0].split(' - ');
    title = parts[0].trim(); artist = parts[1].trim();
  }
  const meta = lines.find(l => l.includes('Tempo:'));
  if (meta) {
    const b = meta.match(/Tempo:\s*(\d+)/);
    const m = meta.match(/Meter:\s*(\d+)/);
    if (b) bpm = parseInt(b[1]);
    if (m) timeSignature = parseInt(m[1]);
  }

  // 2. SCANNING ENGINE
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('E |')) {
      const staffLines = lines.slice(i, i + 6);
      const tempoLine = lines[i-1] || "";
      
      const columns: TabColumn[] = [];
      
      // Clean the layers: remove "E |" and trailing "|"
      const layers = staffLines.map(l => {
        const start = l.indexOf('|') + 1;
        const end = l.lastIndexOf('|');
        return l.substring(start, end);
      });

      const maxLength = Math.max(...layers.map(l => l.length));
      let x = 0;
      let slotCount = 0;

      /**
       * TACTICAL HORIZONTAL SCAN:
       * We move through the staff character by character. 
       * When we find a note on ANY string, we capture that "Column Slice".
       */
      while (x < maxLength && slotCount < 32) {
        // Find if any string has a note at this X position
        const hasData = layers.some(l => l[x] && l[x] !== '-' && l[x] !== ' ' && l[x] !== '|');

        if (hasData) {
          const currentNotes = Array(6).fill('');
          let maxJump = 1;

          for (let sIdx = 0; sIdx < 6; sIdx++) {
            const char = layers[sIdx][x];
            if (char && char !== '-' && char !== ' ' && char !== '|') {
              // Capture the full note (e.g., <12> or 7h9)
              let note = "";
              let tempX = x;
              
              // Bracket Logic
              if (char === '<') {
                while (tempX < layers[sIdx].length && layers[sIdx][tempX] !== '>') {
                  note += layers[sIdx][tempX]; tempX++;
                }
                note += '>'; tempX++;
              } else {
                while (tempX < layers[sIdx].length && !['-',' ','|'].includes(layers[sIdx][tempX])) {
                  note += layers[sIdx][tempX]; tempX++;
                }
              }
              currentNotes[sIdx] = note;
              maxJump = Math.max(maxJump, tempX - x);
            }
          }

          // Check for mid-song BPM
          let foundBpm: number | undefined;
          const bpmMatch = tempoLine.substring(x + 4, x + 20).match(/\[BPM:(\d+)\]/);
          if (bpmMatch) foundBpm = parseInt(bpmMatch[1]);

          columns.push({ id: crypto.randomUUID(), notes: currentNotes, bpm: foundBpm });
          x += maxJump; // Jump past the widest note in this column
          slotCount++;
        } else {
          // If 3 dashes/spaces in a row and no data, it's a blank rhythmic slot
          const slice = layers.map(l => l.substring(x, x + 3)).join('');
          if (slice.replace(/[- |]/g, '') === '') {
             columns.push({ id: crypto.randomUUID(), notes: Array(6).fill(''), bpm: undefined });
             x += 3;
             slotCount++;
          } else {
             x++;
          }
        }
      }

      // Pad to 32
      while (columns.length < 32) columns.push({ id: crypto.randomUUID(), notes: Array(6).fill(''), bpm: undefined });
      resultRows.push({ id: crypto.randomUUID(), columns: columns.slice(0, 32) });
      i += 5;
    }
  }
  return { title, artist, bpm, timeSignature, rows: resultRows };
};