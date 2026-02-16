/**
 * @file tab.ts
 * @description Master type definitions for the Stratum Pro Editor.
 * Upgraded for 32-column staves (2 measures of 16 columns).
 */

/**
 * Represents the content of a single cell on the tab.
 * Uses string to support fret numbers (0-24) and techniques (h, p, /, x).
 */
export type FretValue = string;

/**
 * A vertical slice of the guitar staff.
 * Contains an array of 6 FretValues representing the 6 guitar strings.
 */
export interface TabColumn {
  id: string; // Unique UUID for React reconciliation
  notes: FretValue[];
  bpm?: number;
  timeSignature?: number;
}

/**
 * A horizontal staff section.
 * IN 2.0: A row is a container for 2 measures (32 columns total).
 */
export interface TabRow {
  id: string; 
  columns: TabColumn[];
}

/**
 * The root data object for a guitar tab document.
 */
export interface TabSheet {
  title: string;
  artist: string;
  tuning: string[]; 
  rows: TabRow[];   
  bpm: number;            
  timeSignature: number;
  // UI Configuration persistence
  config: {
    showMeasureNumbers: boolean;
  };
}

/**
 * The 3D coordinate system for the editor's focus.
 * Maps exactly where the user is currently editing.
 */
export interface CursorPosition {
  rowIndex: number;    
  columnIndex: number; // Range: 0-31 (For a 32-column row)
  stringIndex: number; // Range: 0-5
}