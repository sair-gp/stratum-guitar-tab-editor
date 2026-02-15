/**
 * @file TabContext.tsx
 * @description Centralized state management for the Stratum editor.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabSheet, TabRow, TabColumn, CursorPosition } from '../types/tab';
import { loadTabFromLocal, saveTabToLocal } from '../utils/storage';

interface TabContextType {
  tabSheet: TabSheet;
  cursor: CursorPosition;
  updateNote: (value: string) => void;
  setCursor: (pos: CursorPosition) => void;
  addRow: () => void;
  saveManual: () => void;
  updateTuning: (stringIndex: number, newNote: string) => void;
  // Professional Metadata Update: Supports title, artist, bpm, and timeSignature
  updateMetadata: (field: keyof TabSheet, value: string | number) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);
const FIXED_COLS = 24;

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
  const [tabSheet, setTabSheet] = useState<TabSheet>(() => loadTabFromLocal() || DEFAULT_TAB);
  const [cursor, setCursor] = useState<CursorPosition>({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });

  const saveManual = useCallback(() => {
    saveTabToLocal(tabSheet);
    console.log("STRATUM_LOG: Manual Save Executed.");
  }, [tabSheet]);

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

  /**
   * Unified metadata update logic. Handles both string and numeric inputs.
   */
  const updateMetadata = useCallback((field: keyof TabSheet, value: string | number) => {
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

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("CRITICAL: useTab must be used within a TabProvider.");
  return context;
};