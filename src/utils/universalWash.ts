/**
 * @file universalWash.ts
 * @description The Universal Launderer. Quantizes any raw ASCII into the 32-column Stratum Grid.
 */

import type { TabRow, TabColumn } from '../types/tab';

export const washDirtyAscii = (text: string): TabRow[] => {
  // 1. SANITIZE & FILTER
  const lines = text.replace(/\r/g, '').split('\n')
    .map(l => l.trimEnd())
    // TACTICAL FILTER: Remove rhythmic guides (1 2 3 4) and metadata legends
    .filter(l => {
      const trimmed = l.trim();
      if (!trimmed) return false;
      if (trimmed.match(/^[0-9\s|]+$/)) return false; // Kills "1 2 3 4" lines
      if (trimmed.startsWith('PM') || trimmed.startsWith('PH')) return false; // Kills markers
      return true;
    });

  const rows: TabRow[] = [];
  
  /** * REGEX: IDENTIFY STRING LINES
   * Looks for: Start of line (optional tuning letter) -> optional pipe -> at least 10 dashes/numbers
   */
  const stringRegex = /^[a-gA-G#b]?\s*\|?[-0-9\s|/\\hpm<>()~t.]{10,}/;
  
  const rawStaffLines: string[] = [];
  lines.forEach(line => {
    if (stringRegex.test(line)) rawStaffLines.push(line);
  });

  // 2. GROUP INTO 6-STRING BLOCKS (The "Staff")
  for (let i = 0; i <= rawStaffLines.length - 6; i += 6) {
    const block = rawStaffLines.slice(i, i + 6);
    
    // Normalize: Strip prefixes (e.g., "e|", "Eb|", "1|")
    const layers = block.map(l => {
      const firstSignificantChar = l.search(/[|-]/);
      let content = firstSignificantChar !== -1 ? l.substring(firstSignificantChar + 1) : l;
      
      // Strip trailing pipes to prevent "double-bar" sync issues
      if (content.endsWith('|')) content = content.slice(0, -1);
      return content;
    });

    const maxLength = Math.max(...layers.map(l => l.length));
    if (maxLength < 10) continue; 

    const columns: TabColumn[] = Array.from({ length: 32 }, () => ({
      id: crypto.randomUUID(),
      notes: Array(6).fill('')
    }));

    // 3. RHYTHMIC SNAPPING (Relative Quantization)
    for (let sIdx = 0; sIdx < 6; sIdx++) {
      const line = layers[sIdx];
      let x = 0;
      
      while (x < line.length) {
        const char = line[x];
        
        // DETECTION: Numbers or technique markers
        if (/[0-9<xXhpm/~t]/.test(char)) {
          // SNAP: Map text position to 0-31 grid based on line percentage
          const slotIndex = Math.min(31, Math.floor((x / maxLength) * 32));
          
          let note = char;
          let tempX = x + 1;

          // CAPTURE UNIT: Multi-digits (12), Harmonics (<7>), or Techniques (7h9)
          if (char === '<') {
             while (tempX < line.length && line[tempX] !== '>') { note += line[tempX]; tempX++; }
             note += '>'; tempX++;
          } else {
             while (tempX < line.length && /[0-9hpm/~t.xX]/.test(line[tempX])) { 
               note += line[tempX]; tempX++; 
             }
          }

          columns[slotIndex].notes[sIdx] = note;
          x = tempX;
        } else {
          x++;
        }
      }
    }

    rows.push({ id: crypto.randomUUID(), columns });
  }

  return rows;
};