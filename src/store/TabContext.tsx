/**
 * @file TabContext.tsx
 * @description Master State Controller. Upgraded for Granular Column Metadata.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
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
  // NO-NONSENSE: New granular metadata action
  updateColumnMetadata: (rowIndex: number, colIndex: number, field: 'bpm' | 'timeSignature', value: number | undefined) => void;
  loadProject: (id: string) => void;
  createNewProject: () => void;
  toggleMeasureNumbers: () => void;
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

  /**
   * TACTICAL: Granular Column Update
   * Allows us to set BPM or Meter on a specific beat.
   */
  const updateColumnMetadata = useCallback((rowIndex: number, colIndex: number, field: 'bpm' | 'timeSignature', value: number | undefined) => {
    updateTabSheet(prev => {
      const newRows = [...prev.rows];
      const newCols = [...newRows[rowIndex].columns];
      newCols[colIndex] = { ...newCols[colIndex], [field]: value };
      newRows[rowIndex] = { ...newRows[rowIndex], columns: newCols };
      return { ...prev, rows: newRows };
    });
  }, [updateTabSheet]);

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
      const { rowIndex, columnIndex, stringIndex } = cursor;
      const currentVal = prev.rows[rowIndex].columns[columnIndex].notes[stringIndex];
      let finalValue = value;
      const techSymbols = ['h', 'p', '/', '~', 'm', 'x', 'v', 's'];
      const isTechnique = techSymbols.includes(value.toLowerCase());

      if (isTechnique) {
        let tech = value.toLowerCase() === 'v' ? '~' : (value.toLowerCase() === 's' ? '/' : value.toLowerCase());
        if (currentVal === "" && tech !== 'x') return prev;
        finalValue = currentVal.endsWith(tech) ? currentVal.slice(0, -1) : currentVal + tech;
      } else if (value !== "" && !isNaN(parseInt(value))) {
        const lastChar = currentVal.slice(-1);
        if (techSymbols.includes(lastChar.toLowerCase())) {
          finalValue = currentVal + value;
        } else {
          const digits = currentVal.match(/\d+$/)?.[0] || "";
          if (digits.length === 1 && digits !== "") {
            const combined = digits + value;
            finalValue = parseInt(combined) <= 24 ? currentVal.slice(0, -1) + combined : value;
          } else finalValue = value;
        }
      }

      const newRows = [...prev.rows];
      const targetRow = { ...newRows[rowIndex] };
      const newCols = [...targetRow.columns];
      const targetCol = { ...newCols[columnIndex] };
      const newNotes = [...targetCol.notes];
      newNotes[stringIndex] = finalValue;
      targetCol.notes = newNotes;
      newCols[columnIndex] = targetCol;
      targetRow.columns = newCols;
      newRows[rowIndex] = targetRow;
      return { ...prev, rows: newRows };
    });
  }, [cursor, updateTabSheet]);

  const updateTuning = useCallback((stringIdx: number, newNote: string) => {
    updateTabSheet(prev => {
      const newTuning = [...prev.tuning];
      const oct = newTuning[stringIdx].match(/\d+$/)?.[0] || '3';
      newTuning[stringIdx] = /\d+$/.test(newNote) ? newNote.toUpperCase() : `${newNote.toUpperCase()}${oct}`;
      return { ...prev, tuning: newTuning };
    });
  }, [updateTabSheet]);

  const loadDemo = useCallback(() => {
    const demo: TabSheet = {
      ...DEFAULT_TAB,
      title: "Stratum Demo Lick",
      artist: "Batman",
      rows: [{
        id: crypto.randomUUID(),
        columns: Array(32).fill(null).map((_, i) => {
          const col = createBlankColumn();
          if (i === 0) col.notes[5] = "0";
          if (i === 1) col.notes[5] = "3";
          if (i === 2) col.notes[4] = "0";
          if (i === 3) col.notes[4] = "2";
          return col;
        })
      }]
    };
    updateTabSheet(demo);
  }, [updateTabSheet]);

  const loadProject = useCallback((id: string) => {
    const project = storage.loadProjectById(id);
    if (project) {
      updateTabSheet(project, false);
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
    updateTabSheet(prev => ({ ...prev, config: { ...prev.config, showMeasureNumbers: !prev.config.showMeasureNumbers } }));
  }, [updateTabSheet]);

  // GOATED MEMO: Prevents the 600ms lag by stabilizing the object reference
  const value = useMemo(() => ({ 
    tabSheet, cursor, updateNote, setCursor, addRow, saveManual: () => saveTabToLocal(tabSheet), 
    updateTuning, updateMetadata: (f: keyof TabSheet, v: string | number) => updateTabSheet(p => ({...p, [f]: v})), 
    updateColumnMetadata, loadProject, createNewProject, toggleMeasureNumbers,
    undo, redo, shiftNotes, loadDemo 
  }), [tabSheet, cursor, updateNote, addRow, updateTuning, updateTabSheet, updateColumnMetadata, loadProject, createNewProject, toggleMeasureNumbers, undo, redo, shiftNotes, loadDemo]);

  return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("CRITICAL: useTab must be used within a TabProvider.");
  return context;
};