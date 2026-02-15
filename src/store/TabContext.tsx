/**
 * @file TabContext.tsx
 * @description Centralized state management for the Stratum editor.
 * Upgraded to handle Multi-Project Cataloging and UUID-based switching.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabSheet, TabRow, TabColumn, CursorPosition } from '../types/tab';
import { loadTabFromLocal, saveTabToLocal, storage } from '../utils/storage';

interface TabContextType {
  tabSheet: TabSheet;
  cursor: CursorPosition;
  updateNote: (value: string) => void;
  setCursor: (pos: CursorPosition) => void;
  addRow: () => void;
  saveManual: () => void;
  updateTuning: (stringIndex: number, newNote: string) => void;
  updateMetadata: (field: keyof TabSheet, value: string | number) => void;
  // CATALOG ACTIONS
  loadProject: (id: string) => void;
  createNewProject: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);
const FIXED_COLS = 16;

const createBlankColumn = (): TabColumn => ({
  id: crypto.randomUUID(),
  notes: Array(6).fill(''),
});

const createBlankRow = (): TabRow => ({
  id: crypto.randomUUID(),
  columns: Array(FIXED_COLS).fill(null).map(createBlankColumn),
});

const DEFAULT_TAB: TabSheet = {
  title: "New Tab",
  artist: "Unknown Artist",
  tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
  rows: [createBlankRow()],
  bpm: 120,          
  timeSignature: 4,
};

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from the last active project in LocalStorage or fall back to Default
  const [tabSheet, setTabSheet] = useState<TabSheet>(DEFAULT_TAB);
  const [cursor, setCursor] = useState<CursorPosition>({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });

  /**
   * PERSISTENCE: Saves current state using the updated ID-aware storage logic.
   */
  const saveManual = useCallback(() => {
    saveTabToLocal(tabSheet);
    console.log("STRATUM_LOG: Project Persisted to Catalog.");
  }, [tabSheet]);

  /**
   * CATALOG: Wipes the current state and initializes a fresh UUID project.
   */
  const createNewProject = useCallback(() => {
    localStorage.removeItem('stratum_active_id'); // Force storage to generate new ID on save
    setTabSheet(DEFAULT_TAB);
    setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
  }, []);

  /**
   * CATALOG: Swaps the entire TabSheet state with data from a specific ID.
   */
  const loadProject = useCallback((id: string) => {
    const project = storage.loadProjectById(id);
    if (project) {
      setTabSheet(project);
      setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 }); // Reset cursor for safety
    }
  }, []);

  const addRow = useCallback(() => {
    setTabSheet(prev => ({ ...prev, rows: [...prev.rows, createBlankRow()] }));
  }, []);

  const updateNote = useCallback((value: string) => {
    setTabSheet(prev => {
      const currentVal = prev.rows[cursor.rowIndex].columns[cursor.columnIndex].notes[cursor.stringIndex];
      let finalValue = value;

      if (value !== "" && !isNaN(parseInt(value))) {
        if (currentVal.length === 1 && currentVal !== "") {
          const combined = currentVal + value;
          const num = parseInt(combined);
          if (num <= 24) finalValue = combined;
        }
      }

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

  const updateTuning = useCallback((stringIdx: number, newNote: string) => {
    setTabSheet(prev => {
      const newTuning = [...prev.tuning];
      newTuning[stringIdx] = newNote.toUpperCase();
      return { ...prev, tuning: newTuning };
    });
  }, []);

  const updateMetadata = useCallback((field: keyof TabSheet, value: string | number) => {
  setTabSheet(prev => {
    let finalValue = value;

    // TACTICAL GUARD: BPM Sanitization
    if (field === 'bpm') {
      // Convert to string to strip leading zeros, then back to number
      const sanitized = parseInt(value.toString().replace(/^0+/, ''));
      
      // If the field is empty or result is NaN (like when backspacing everything)
      // we default to 1 to keep the engine alive, but the UI can show 0
      finalValue = isNaN(sanitized) ? 0 : sanitized;

      // Optional: Enforce a Maximum to prevent scheduling 1,000,000 notes
      if (finalValue > 400) finalValue = 400;
    }

    return {
      ...prev,
      [field]: finalValue
    };
  });
}, []);

  return (
    <TabContext.Provider value={{ 
      tabSheet, cursor, updateNote, setCursor, addRow, saveManual, 
      updateTuning, updateMetadata, loadProject, createNewProject 
    }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("CRITICAL: useTab must be used within a TabProvider.");
  return context;
};