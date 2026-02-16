/**
 * @file asciiExport.ts
 * @description Enhanced Exporter. Supports mid-song Tempo/BPM markers.
 */

import type { TabSheet } from '../types/tab';

export const generateAsciiTab = (tabSheet: TabSheet): string => {
  let output = `${tabSheet.title} - ${tabSheet.artist}\n`;
  output += `Tempo: ${tabSheet.bpm} BPM | Meter: ${tabSheet.timeSignature}/4\n\n`;

  tabSheet.rows.forEach((row, rIdx) => {
    output += `Staff ${rIdx + 1}\n`;
    
    // ANALYTIC: Create a line for BPM markers above the strings
    let tempoLine = "    "; // Padding for the tuning letters "E |"

    const stringLines = tabSheet.tuning.map(t => `${t.replace(/\d/, '').padEnd(2, ' ')}|`);

    row.columns.forEach((col, cIdx) => {
      // 1. Check for BPM changes
      if (col.bpm) {
        const marker = `[BPM:${col.bpm}]`;
        tempoLine += marker.padEnd(3, ' ');
      } else {
        tempoLine += "   ";
      }

      // 2. Structural Bar Lines (Reactive to Meter)
      const beatsPerMeasure = tabSheet.timeSignature;
      const colsPerMeasure = beatsPerMeasure * 4;
      
      if (cIdx > 0 && cIdx % colsPerMeasure === 0) {
        stringLines.forEach((_, i) => stringLines[i] += '|');
        tempoLine += " "; // Space for the bar line
      }

      // 3. Note Content
      col.notes.forEach((note, sIdx) => {
        const val = note === "" ? "-" : note;
        stringLines[sIdx] += val.padEnd(3, '-');
      });
    });

    // Combine everything
    output += tempoLine.trimEnd() + "\n";
    stringLines.forEach(line => output += line + '|\n');
    output += '\n';
  });

  return output;
};