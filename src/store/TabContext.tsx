/**
 * @file TabContext.tsx
 * @description Secure Project Lifecycle Management. Fixed ID-Leakage during new project creation.
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
  loadProject: (id: string) => void;
  createNewProject: () => void;
  toggleMeasureNumbers: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);
const FIXED_COLS = 32;

const createBlankColumn = (): TabColumn => ({
  id: crypto.randomUUID(),
  notes: Array(6).fill(''),
});

const createBlankRow = (): TabRow => ({
  id: crypto.randomUUID(),
  columns: Array(FIXED_COLS).fill(null).map(createBlankColumn),
});

const migrateTabSheet = (data: TabSheet): TabSheet => {
  const isOldLayout = data.rows.length > 0 && data.rows[0].columns.length === 16;
  if (!isOldLayout) {
    const config = data.config || { showMeasureNumbers: false };
    return { ...data, config };
  }

  const newRows: TabRow[] = [];
  const oldRows = data.rows;

  for (let i = 0; i < oldRows.length; i += 2) {
    const firstHalf = oldRows[i].columns;
    const secondHalf = oldRows[i + 1] 
      ? oldRows[i + 1].columns 
      : Array(16).fill(null).map(createBlankColumn);

    newRows.push({
      id: crypto.randomUUID(),
      columns: [...firstHalf, ...secondHalf]
    });
  }

  return {
    ...data,
    rows: newRows,
    config: data.config || { showMeasureNumbers: false }
  };
};

const DEFAULT_TAB: TabSheet = {
  title: "New Tab",
  artist: "Unknown Artist",
  tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
  rows: [createBlankRow()],
  bpm: 120,          
  timeSignature: 4,
  config: {
    showMeasureNumbers: false
  }
};

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabSheet, setTabSheet] = useState<TabSheet>(DEFAULT_TAB);
  const [cursor, setCursor] = useState<CursorPosition>({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });

  const saveManual = useCallback(() => {
    saveTabToLocal(tabSheet);
  }, [tabSheet]);

  const toggleMeasureNumbers = useCallback(() => {
    setTabSheet(prev => ({
      ...prev,
      config: { ...prev.config, showMeasureNumbers: !prev.config.showMeasureNumbers }
    }));
  }, []);

  /**
   * NO-NONSENSE PROJECT RESET:
   * Explicitly clears the active project ID to force a fresh save.
   */
  const createNewProject = useCallback(() => {
    // TACTICAL: Clear the session ID before resetting state
    localStorage.removeItem('stratum_active_id'); 
    setTabSheet(DEFAULT_TAB);
    setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
    console.log("STRATUM_LOG: Workspace Cleared. Next save will create a new entry.");
  }, []);

  const loadProject = useCallback((id: string) => {
    const project = storage.loadProjectById(id);
    if (project) {
      setTabSheet(migrateTabSheet(project));
      setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
    }
  }, []);

  const addRow = useCallback(() => {
    setTabSheet(prev => ({ ...prev, rows: [...prev.rows, createBlankRow()] }));
  }, []);

  const updateNote = useCallback((value: string) => {
    setTabSheet(prev => {
      const currentVal = prev.rows[cursor.rowIndex].columns[cursor.columnIndex].notes[cursor.stringIndex];
      let finalValue = value;

      const techSymbols = ['h', 'p', '/', '~', 'm', 'x', 'v', 's'];
      const isTechnique = techSymbols.includes(value.toLowerCase());

      if (isTechnique) {
        let techToApply = value.toLowerCase();
        if (techToApply === 'v') techToApply = '~';
        if (techToApply === 's') techToApply = '/';

        // TACTICAL GUARD: Techniques usually need a preceding note.
        if (currentVal === "" && techToApply !== 'x') return prev;

        // TOGGLE LOGIC: If the cell ends with this exact tech, remove it.
        if (currentVal.endsWith(techToApply)) {
          finalValue = currentVal.slice(0, -1);
        } else {
          // NO-NONSENSE: Append the tech to the current sequence (e.g., "3" -> "3p")
          finalValue = currentVal + techToApply;
        }
      } else if (value !== "" && !isNaN(parseInt(value))) {
        /**
         * LEGATO SEQUENCE LOGIC:
         * 1. If the current value ends with a technique (e.g., "3p"), 
         * we append the new digit to start the next note (e.g., "3p0").
         * 2. If it's just a number, we use existing multi-digit logic (e.g., "1" -> "12").
         */
        const lastChar = currentVal.slice(-1);
        const endsWithTech = techSymbols.includes(lastChar.toLowerCase());

        if (endsWithTech) {
          // APPEND: Start of the second note in the legato chain
          finalValue = currentVal + value;
        } else {
          // STANDARD: Multi-digit fret logic for the current note
          // We find the last "block" of numbers and see if we can append
          const matches = currentVal.match(/\d+$/);
          const currentDigits = matches ? matches[0] : "";
          
          if (currentDigits.length === 1 && currentDigits !== "") {
            const combined = currentDigits + value;
            if (parseInt(combined) <= 24) {
              finalValue = currentVal.slice(0, -currentDigits.length) + combined;
            } else {
              finalValue = value; // Reset if over 24
            }
          } else {
            finalValue = value; // Default to new number if block is full or empty
          }
        }
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
      if (field === 'bpm') {
        const sanitized = parseInt(value.toString().replace(/^0+/, ''));
        finalValue = isNaN(sanitized) ? 0 : sanitized;
        if (finalValue > 400) finalValue = 400;
      }
      return { ...prev, [field]: finalValue };
    });
  }, []);

  return (
    <TabContext.Provider value={{ 
      tabSheet, cursor, updateNote, setCursor, addRow, saveManual, 
      updateTuning, updateMetadata, loadProject, createNewProject,
      toggleMeasureNumbers
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