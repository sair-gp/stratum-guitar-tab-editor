/**
 * @file TabContext.tsx
 * @description Master State Controller. Fixed Interface/Value mismatch.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TabSheet, TabRow, TabColumn, CursorPosition } from '../types/tab';
import { saveTabToLocal, storage } from '../utils/storage';

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
  // NO-NONSENSE NEW ACTIONS
  undo: () => void;
  redo: () => void;
  shiftNotes: (direction: 'left' | 'right') => void;
  loadDemo: () => void;
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

const DEFAULT_TAB: TabSheet = {
  title: "New Tab",
  artist: "Unknown Artist",
  tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
  rows: [createBlankRow()],
  bpm: 120,          
  timeSignature: 4,
  config: { showMeasureNumbers: false }
};

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabSheet, setTabSheet] = useState<TabSheet>(DEFAULT_TAB);
  const [cursor, setCursor] = useState<CursorPosition>({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
  
  // METICULOUS HISTORY STACKS
  const [history, setHistory] = useState<TabSheet[]>([]);
  const [future, setFuture] = useState<TabSheet[]>([]);

  const updateTabSheet = useCallback((newSheet: TabSheet | ((prev: TabSheet) => TabSheet), track = true) => {
    setTabSheet(prev => {
      const next = typeof newSheet === 'function' ? newSheet(prev) : newSheet;
      if (track) {
        setHistory(h => [...h, prev].slice(-50));
        setFuture([]);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [tabSheet, ...f]);
    setHistory(h => h.slice(0, -1));
    setTabSheet(prev);
  }, [history, tabSheet]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, tabSheet]);
    setFuture(f => f.slice(1));
    setTabSheet(next);
  }, [future, tabSheet]);

  const shiftNotes = useCallback((direction: 'left' | 'right') => {
    updateTabSheet(prev => {
      const newRows = [...prev.rows];
      const row = { ...newRows[cursor.rowIndex] };
      const cols = [...row.columns];
      if (direction === 'right') {
        cols.splice(cursor.columnIndex, 0, createBlankColumn());
        cols.pop();
      } else {
        cols.splice(cursor.columnIndex, 1);
        cols.push(createBlankColumn());
      }
      row.columns = cols;
      newRows[cursor.rowIndex] = row;
      return { ...prev, rows: newRows };
    });
  }, [cursor, updateTabSheet]);

  const updateNote = useCallback((value: string) => {
    updateTabSheet(prev => {
      const currentVal = prev.rows[cursor.rowIndex].columns[cursor.columnIndex].notes[cursor.stringIndex];
      let finalValue = value;
      const techSymbols = ['h', 'p', '/', '~', 'm', 'x', 'v', 's'];
      const isTechnique = techSymbols.includes(value.toLowerCase());

      if (isTechnique) {
        let techToApply = value.toLowerCase();
        if (techToApply === 'v') techToApply = '~';
        if (techToApply === 's') techToApply = '/';
        if (currentVal === "" && techToApply !== 'x') return prev;
        if (currentVal.endsWith(techToApply)) {
          finalValue = currentVal.slice(0, -1);
        } else {
          finalValue = currentVal + techToApply;
        }
      } else if (value !== "" && !isNaN(parseInt(value))) {
        const lastChar = currentVal.slice(-1);
        const endsWithTech = techSymbols.includes(lastChar.toLowerCase());
        if (endsWithTech) {
          finalValue = currentVal + value;
        } else {
          const matches = currentVal.match(/\d+$/);
          const currentDigits = matches ? matches[0] : "";
          if (currentDigits.length === 1 && currentDigits !== "") {
            const combined = currentDigits + value;
            if (parseInt(combined) <= 24) {
              finalValue = currentVal.slice(0, -currentDigits.length) + combined;
            } else {
              finalValue = value;
            }
          } else {
            finalValue = value;
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
  }, [cursor, updateTabSheet]);

  const updateTuning = useCallback((stringIdx: number, newNote: string) => {
    updateTabSheet(prev => {
      const newTuning = [...prev.tuning];
      const currentPitch = newTuning[stringIdx];
      const octaveMatch = currentPitch.match(/\d+$/);
      const hasNewOctave = /\d+$/.test(newNote);
      const finalNote = hasNewOctave ? newNote.toUpperCase() : `${newNote.toUpperCase()}${octaveMatch ? octaveMatch[0] : '3'}`;
      newTuning[stringIdx] = finalNote;
      return { ...prev, tuning: newTuning };
    });
  }, [updateTabSheet]);

  const loadDemo = useCallback(() => {
    const demo: TabSheet = {
      ...DEFAULT_TAB,
      title: "Stratum Demo Lick",
      artist: "Batman",
      rows: [
        {
          id: crypto.randomUUID(),
          columns: Array(32).fill(null).map((_, i) => {
            const col = createBlankColumn();
            if (i === 0) col.notes[5] = "0";
            if (i === 1) col.notes[5] = "3";
            if (i === 2) col.notes[4] = "0";
            if (i === 3) col.notes[4] = "2";
            return col;
          })
        }
      ]
    };
    updateTabSheet(demo);
  }, [updateTabSheet]);

  const loadProject = useCallback((id: string) => {
    const project = storage.loadProjectById(id);
    if (project) {
      updateTabSheet(project, false); // Loading shouldn't wipe future history
      setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
    }
  }, [updateTabSheet]);

  const createNewProject = useCallback(() => {
    localStorage.removeItem('stratum_active_id'); 
    updateTabSheet(DEFAULT_TAB);
    setCursor({ rowIndex: 0, columnIndex: 0, stringIndex: 0 });
  }, [updateTabSheet]);

  const addRow = useCallback(() => {
    updateTabSheet(prev => ({ ...prev, rows: [...prev.rows, createBlankRow()] }));
  }, [updateTabSheet]);

  const toggleMeasureNumbers = useCallback(() => {
    updateTabSheet(prev => ({
      ...prev,
      config: { ...prev.config, showMeasureNumbers: !prev.config.showMeasureNumbers }
    }));
  }, [updateTabSheet]);

  return (
    <TabContext.Provider value={{ 
      tabSheet, cursor, updateNote, setCursor, addRow, saveManual: () => saveTabToLocal(tabSheet), 
      updateTuning, updateMetadata: (f, v) => updateTabSheet(p => ({...p, [f]: v})), 
      loadProject, createNewProject, toggleMeasureNumbers,
      undo, redo, shiftNotes, loadDemo // THE REPAIR: Added missing actions
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