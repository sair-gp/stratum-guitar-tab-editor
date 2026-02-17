/**
 * @file asciiImport.ts
 * @description Precision Scanner. Character-by-character synchronization to prevent dropped notes.
 */

import type { TabRow, TabColumn } from '../types/tab';
import { washDirtyAscii } from './universalWash';

export const parseAsciiToTab = (text: string): { 
  title: string, artist: string, bpm: number, timeSignature: number, rows: TabRow[] 
} => {


  const isStratum = text.includes("# STRATUM_PROTOCOL_V1");
  
  if (!isStratum) {
    const washedRows = washDirtyAscii(text);
    return {
      title: "Washed Import",
      artist: "Universal Salvage",
      bpm: 120,
      timeSignature: 4,
      rows: washedRows
    };
  }

  const lines = text.replace(/\r/g, '').split('\n');
  const resultRows: TabRow[] = [];
  
  // 1. HEADER PARSING
  let title = "Salvaged Tab", artist = "Unknown Artist", bpm = 120, timeSignature = 4;
  if (lines[1]?.includes(' - ')) {
    const parts = lines[1].split(' - ');
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
    const currentLine = lines[i].trim();
    
    if (currentLine.startsWith('E |') || currentLine.includes('E |')) {
      const staffLines = lines.slice(i, i + 6);
      const tempoLine = lines[i-1] || "";
      const columns: TabColumn[] = [];
      
      const layers = staffLines.map(l => {
        const start = l.indexOf('|') + 1;
        const end = l.lastIndexOf('|');
        return (start === 0 || end === -1) ? "" : l.substring(start, end);
      });

      const maxLength = Math.max(...layers.map(l => l.length));
      let x = 0;
      let slotCount = 0;

      while (x < maxLength && slotCount < 32) {
        // Find if any string has a note at this X position
        const hasData = layers.some(l => l[x] && l[x] !== '-' && l[x] !== ' ' && l[x] !== '|');

        if (hasData) {
          const currentNotes = Array(6).fill('');
          let maxJump = 1;

          for (let sIdx = 0; sIdx < 6; sIdx++) {
            const char = layers[sIdx][x];
            if (char && char !== '-' && char !== ' ' && char !== '|') {
              let note = "";
              let tempX = x;
              
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

          let foundBpm: number | undefined;
          const bpmMatch = tempoLine.substring(x + 4, x + 24).match(/\[BPM:(\d+)\]/);
          if (bpmMatch) foundBpm = parseInt(bpmMatch[1]);

          columns.push({ id: crypto.randomUUID(), notes: currentNotes, bpm: foundBpm });
          x += maxJump;
          slotCount++;
        } else {
          /**
           * TACTICAL STEPPING:
           * Instead of jumping by 3, we check if this position is likely the start 
           * of a blank slot. We jump by 3 only if we are sure it's an empty "dash-block".
           * Otherwise, we step by 1 to re-sync.
           */
          const isBlankThree = layers.every(l => {
            const chunk = l.substring(x, x + 3);
            return chunk === '---' || chunk === '   ';
          });

          if (isBlankThree) {
            columns.push({ id: crypto.randomUUID(), notes: Array(6).fill(''), bpm: undefined });
            x += 3;
            slotCount++;
          } else {
            // STEP BY STEP re-alignment
            x++;
          }
        }
      }

      while (columns.length < 32) columns.push({ id: crypto.randomUUID(), notes: Array(6).fill(''), bpm: undefined });
      resultRows.push({ id: crypto.randomUUID(), columns: columns.slice(0, 32) });
      i += 5;
    }
  }
  return { title, artist, bpm, timeSignature, rows: resultRows };
};