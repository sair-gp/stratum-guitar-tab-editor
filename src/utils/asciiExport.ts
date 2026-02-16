/**
 * @file asciiExport.ts
 * @description Precision Exporter. Handles variable-width harmonics <12> while maintaining staff alignment.
 */

import type { TabSheet } from '../types/tab';

export const generateAsciiTab = (tabSheet: TabSheet): string => {
  let output = `${tabSheet.title} - ${tabSheet.artist}\n`;
  output += `Tempo: ${tabSheet.bpm} BPM | Meter: ${tabSheet.timeSignature}/4\n\n`;

  tabSheet.rows.forEach((row, rIdx) => {
    output += `Staff ${rIdx + 1}\n`;
    
    // Initial padding for tuning labels (e.g., "E |")
    let tempoLine = "    "; 
    const stringLines = tabSheet.tuning.map(t => `${t.replace(/\d/, '').padEnd(2, ' ')}|`);

    row.columns.forEach((col, cIdx) => {
      /**
       * TACTICAL ALIGNMENT:
       * 1. Calculate the longest note in this specific column.
       * 2. Add 1 for spacing. Minimum width is 3 to keep the classic look.
       */
      const maxNoteLength = Math.max(...col.notes.map(n => n.length));
      const colWidth = Math.max(3, maxNoteLength + 1);

      // 1. BPM Marker Logic
      if (col.bpm) {
        const marker = `[BPM:${col.bpm}]`;
        tempoLine += marker.padEnd(colWidth, ' ');
      } else {
        tempoLine += "".padEnd(colWidth, ' ');
      }

      // 2. Structural Bar Lines (Reactive to Meter)
      const beatsPerMeasure = tabSheet.timeSignature;
      const colsPerMeasure = beatsPerMeasure * 4;
      
      if (cIdx > 0 && cIdx % colsPerMeasure === 0) {
        stringLines.forEach((_, i) => stringLines[i] += '|');
        tempoLine += " "; // Space to account for the bar line '|'
      }

      // 3. String Content with Dynamic Padding
      col.notes.forEach((note, sIdx) => {
        const val = note === "" ? "-" : note;
        // Ensure every string in this column uses the exact same width
        stringLines[sIdx] += val.padEnd(colWidth, '-');
      });
    });

    // Combine tempoLine and staff
    output += tempoLine.trimEnd() + "\n";
    stringLines.forEach(line => output += line + '|\n');
    output += '\n';
  });

  return output;
};

export const triggerAsciiDownload = (tabSheet: TabSheet) => {
  const content = generateAsciiTab(tabSheet);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tabSheet.title.replace(/\s+/g, '_')}_tab.txt`;
  link.click();
  URL.revokeObjectURL(url);
};