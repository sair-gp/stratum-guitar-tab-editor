/**
 * @file TabContext.tsx
 * @description The Central Intelligence Hub. Manages multi-row state, 
 * coordinate-based navigation, and explicit data persistence.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabSheet, TabRow, TabColumn, CursorPosition } from '../types/tab';
import { loadTabFromLocal, saveTabToLocal } from '../utils/storage';

/**
 * Interface defining the API exposed by the TabStore.
 */
interface TabContextType {
  tabSheet: TabSheet;
  cursor: CursorPosition;
  updateNote: (value: string) => void;
  setCursor: (pos: CursorPosition) => void;
  addRow: () => void;
  saveManual: () => void;
  updateTuning: (stringIndex: number, newNote: string) => void;
  updateMetadata: (field: 'title' | 'artist', value: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// The law of the editor: 24 measures per horizontal staff
const FIXED_COLS = 24;

/**
 * Factory function to create a standardized 6-string tab column.
 */
const createBlankColumn = (): TabColumn => ({
  id: crypto.randomUUID(),
  notes: Array(6).fill(''),
});

/**
 * Factory function to create a new horizontal staff (row) containing 24 measures.
 */
const createBlankRow = (): TabRow => ({
  id: crypto.randomUUID(),
  columns: Array(FIXED_COLS).fill(null).map(createBlankColumn),
});

/**
 * Default starting state for a new tab project.
 */
const DEFAULT_TAB: TabSheet = {
  title: "New Tab",
  artist: "Unknown Artist",
  tuning: ["E", "B", "G", "D", "A", "E"],
  rows: [createBlankRow()],
};

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state: Priority 1 is LocalStorage, Priority 2 is DEFAULT_TAB
  const [tabSheet, setTabSheet] = useState<TabSheet>(() => loadTabFromLocal() || DEFAULT_TAB);
  
  // Coordinate-based cursor tracking for Row, Column, and String
  const [cursor, setCursor] = useState<CursorPosition>({ 
    rowIndex: 0, 
    columnIndex: 0, 
    stringIndex: 0 
  });

  /**
   * Manual Persistence Protocol. 
   * Data is only written to disk when this function is explicitly invoked.
   */
  const saveManual = useCallback(() => {
    saveTabToLocal(tabSheet);
    // Note: Future versions can replace this with a subtle UI toast
    console.log("BATMAN_LOG: Manual Save Executed Successfully.");
  }, [tabSheet]);

  /**
   * Appends a new 24-measure staff to the bottom of the TabSheet.
   */
  const addRow = useCallback(() => {
    setTabSheet(prev => ({
      ...prev,
      rows: [...prev.rows, createBlankRow()]
    }));
  }, []);

 /**
   * Immutably updates the fret value. 
   * Logic: 
   * 1. If empty, set value.
   * 2. If existing digit exists, try to append the new digit.
   * 3. Cap at 24.
   */
  const updateNote = useCallback((value: string) => {
    setTabSheet(prev => {
      const currentVal = prev.rows[cursor.rowIndex].columns[cursor.columnIndex].notes[cursor.stringIndex];
      let finalValue = value;

      // ANALYTIC: Handle digit appending
      if (value !== "" && !isNaN(parseInt(value))) {
        // If we already have a digit and the user types another
        if (currentVal.length === 1 && currentVal !== "-") {
          const combined = currentVal + value;
          const num = parseInt(combined);
          // Only append if it's 24 or less
          if (num <= 24) finalValue = combined;
        }
      }

      // Validating the final result before commit
      if (finalValue !== "") {
        const checkNum = parseInt(finalValue);
        if (isNaN(checkNum) || checkNum < 0 || checkNum > 24) return prev;
      }

      const newRows = [...prev.rows];
      const targetRow = { ...newRows[cursor.rowIndex] };
      const newCols = [...targetRow.columns];
      const targetCol = { ...newCols[cursor.columnIndex] };
      const newNotes = [...targetCol.notes];

      newNotes[cursor.stringIndex] = finalValue;
      targetCol.notes = newNotes;
      newCols[cursor.columnIndex] = targetCol;
      targetRow.columns = newCols;
      newRows[cursor.rowIndex] = targetRow;

      return { ...prev, rows: newRows };
    });
  }, [cursor]);

  /**
   * Updates the global tuning for a specific string.
   */
  const updateTuning = useCallback((stringIdx: number, newNote: string) => {
    setTabSheet(prev => {
      const newTuning = [...prev.tuning];
      newTuning[stringIdx] = newNote.toUpperCase();
      return { ...prev, tuning: newTuning };
    });
  }, []);

  /**
   * Updates song title or artist name.
   */
  const updateMetadata = useCallback((field: 'title' | 'artist', value: string) => {
    setTabSheet(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return (
    <TabContext.Provider value={{ 
      tabSheet, cursor, updateNote, setCursor, addRow, saveManual, updateTuning, updateMetadata
    }}>
      {children}
    </TabContext.Provider>
  );
};

/**
 * Custom hook to access the TabStore.
 * Ensures usage within a valid Provider to prevent runtime null-reference errors.
 */
export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("CRITICAL: useTab must be used within a TabProvider.");
  return context;
};