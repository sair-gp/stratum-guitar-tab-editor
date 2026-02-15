/**
 * @file tab.ts
 * @description Master type definitions for the Multi-Row Guitar Tab Editor.
 * This architecture supports vertical staff flow and precise coordinate tracking.
 */

/**
 * Represents the content of a single cell on the tab.
 * Uses string to support fret numbers (0-24) and techniques (h, p, /, x).
 */
export type FretValue = string;

/**
 * A vertical slice of the guitar staff.
 * Contains an array of 6 FretValues representing the 6 guitar strings.
 * Index 0 = High E (String 1), Index 5 = Low E (String 6).
 */
export interface TabColumn {
  id: string; // Unique UUID for React reconciliation and drag/drop stability
  notes: FretValue[];
}

/**
 * A horizontal staff section.
 * In this system, a row is a fixed container of 24 measures (columns).
 */
export interface TabRow {
  id: string; // Unique identifier for the row
  columns: TabColumn[];
}

/**
 * The root data object for a guitar tab document.
 * Contains song metadata and the collection of horizontal rows.
 */
export interface TabSheet {
  title: string;
  artist: string;
  tuning: string[]; // e.g., ["E", "B", "G", "D", "A", "E"]
  rows: TabRow[];   // Vertical collection of staves
  bpm: number;            // Beats Per Minute
  timeSignature: number;  // Top number (e.g., 4 for 4/4)
}

/**
 * The 3D coordinate system for the editor's focus.
 * Maps exactly where the user is currently editing.
 */
export interface CursorPosition {
  rowIndex: number;    // Which horizontal staff
  columnIndex: number; // Which vertical measure (0-23)
  stringIndex: number; // Which guitar string (0-5)
}