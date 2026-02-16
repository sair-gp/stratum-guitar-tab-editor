/**
 * @file asciiExport.ts
 * @description Grid-Lock Exporter. Maintains strict vertical alignment for variable-width data.
 */

import type { TabSheet } from '../types/tab';

export const generateAsciiTab = (tabSheet: TabSheet): string => {
  let output = `${tabSheet.title} - ${tabSheet.artist}\n`;
  output += `Tempo: ${tabSheet.bpm} BPM | Meter: ${tabSheet.timeSignature}/4\n\n`;

  tabSheet.rows.forEach((row, rIdx) => {
    output += `Staff ${rIdx + 1}\n`;
    let tempoLine = "    "; 
    const stringLines = tabSheet.tuning.map(t => `${t.replace(/\d/, '').padEnd(2, ' ')}|`);

    row.columns.forEach((col, cIdx) => {
      // 1. CALCULATE WIDTH
      const maxNoteLen = Math.max(...col.notes.map(n => n.length));
      const colWidth = Math.max(3, maxNoteLen + 1);

      // 2. TEMPO LINE ALIGNMENT
      if (col.bpm) {
        const marker = `[BPM:${col.bpm}]`;
        tempoLine += marker.padEnd(colWidth, ' ');
      } else {
        tempoLine += "".padEnd(colWidth, ' ');
      }

      // 3. BAR LINES
      const colsPerMeasure = tabSheet.timeSignature * 4;
      if (cIdx > 0 && cIdx % colsPerMeasure === 0) {
        stringLines.forEach((_, i) => stringLines[i] += '|');
        tempoLine += " "; 
      }

      // 4. NOTE PLACEMENT
      col.notes.forEach((note, sIdx) => {
        const val = note === "" ? "-" : note;
        stringLines[sIdx] += val.padEnd(colWidth, '-');
      });
    });

    output += tempoLine.trimEnd() + "\n";
    stringLines.forEach(line => output += line + '|\n');
    output += '\n';
  });

  return output;
};

// ... triggerAsciiDownload stays the same

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