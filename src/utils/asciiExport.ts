/**
 * @file asciiExport.ts
 * @description Enhanced Exporter. Supports mid-song BPM markers and direct download triggers.
 */

import type { TabSheet } from '../types/tab';

export const generateAsciiTab = (tabSheet: TabSheet): string => {
  let output = `${tabSheet.title} - ${tabSheet.artist}\n`;
  output += `Tempo: ${tabSheet.bpm} BPM | Meter: ${tabSheet.timeSignature}/4\n\n`;

  tabSheet.rows.forEach((row, rIdx) => {
    output += `Staff ${rIdx + 1}\n`;
    
    // ANALYTIC: Create a line for BPM markers above the strings
    let tempoLine = "    "; // Initial padding for "E |"

    const stringLines = tabSheet.tuning.map(t => `${t.replace(/\d/, '').padEnd(2, ' ')}|`);

    row.columns.forEach((col, cIdx) => {
      // 1. BPM Marker Logic
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
        tempoLine += " "; // Align tempoLine with structural bar
      }

      // 3. String Content
      col.notes.forEach((note, sIdx) => {
        const val = note === "" ? "-" : note;
        stringLines[sIdx] += val.padEnd(3, '-');
      });
    });

    // Combine tempoLine and staff
    output += tempoLine.trimEnd() + "\n";
    stringLines.forEach(line => output += line + '|\n');
    output += '\n';
  });

  return output;
};

/**
 * TACTICAL: Direct Download Trigger
 * Decouples the file generation from the UI component.
 */
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