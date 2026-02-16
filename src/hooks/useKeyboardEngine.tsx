/**
 * @file useKeyboardEngine.ts
 * @description Streamlined for Legato Sequence entry (e.g., 3p0).
 */

import { useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useShortcuts } from '../store/ShortcutContext';
import { useAudioEngine } from './useAudioEngine';

export const useKeyboardEngine = () => {
  const { cursor, setCursor, updateNote, tabSheet, addRow, saveManual } = useTab();
  const { shortcuts } = useShortcuts();
  const { playNote, initAudio } = useAudioEngine();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isGridCell = target.hasAttribute('data-editor-input');
      const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

      if (isInput && !isGridCell) return; 

      const key = e.key.toLowerCase();

      // 0. ALT-COMMANDS: STAFF TELEPORTATION
      if (e.altKey && (key === 'arrowup' || key === 'arrowdown')) {
        e.preventDefault();
        const direction = key === 'arrowdown' ? 1 : -1;
        const newRow = Math.max(0, Math.min(tabSheet.rows.length - 1, cursor.rowIndex + direction));
        setCursor({ ...cursor, rowIndex: newRow });
        return;
      }

      // 1. SYSTEM COMMANDS
      if (e.ctrlKey) {
        if (key === 's') { e.preventDefault(); saveManual(); return; }
        if (key === 'n') { e.preventDefault(); addRow(); return; }
      }

      // 2. ERASER
      if (key === 'backspace' || key === 'delete') {
        e.preventDefault();
        updateNote('');
        return;
      }

      // 3. SHORTCUTS & ARTICULATIONS
      const action = shortcuts[key];

      if (action?.startsWith('TOGGLE_')) {
        e.preventDefault();
        const tech = action.split('_')[1].toLowerCase();
        updateNote(tech);
        return;
      }

      if (action?.startsWith('SELECT_STRING_')) {
        e.preventDefault();
        const stringIdx = parseInt(action.split('_')[2]) - 1;
        setCursor({ ...cursor, stringIndex: stringIdx });
        return;
      }

      // 4. SHIFT-COMMANDS: MEASURE SNAPPING
      if (e.shiftKey && (key === 'arrowleft' || key === 'arrowright')) {
        e.preventDefault();
        const direction = key === 'arrowright' ? 1 : -1;
        const newCol = Math.max(0, Math.min(31, cursor.columnIndex + (direction * 4)));
        setCursor({ ...cursor, columnIndex: newCol });
        return;
      }

      // 5. STANDARD NAVIGATION
      if (key.startsWith('arrow')) {
        e.preventDefault();
        let { rowIndex, columnIndex, stringIndex } = cursor;
        if (key === 'arrowup') stringIndex = Math.max(0, stringIndex - 1);
        if (key === 'arrowdown') stringIndex = Math.min(5, stringIndex + 1);
        if (key === 'arrowleft') columnIndex = Math.max(0, columnIndex - 1);
        if (key === 'arrowright') columnIndex = Math.min(31, columnIndex + 1);
        setCursor({ rowIndex, columnIndex, stringIndex });
        return;
      }

      // 6. ENTER: FLOW STATE
      if (key === 'enter') {
        e.preventDefault();
        if (cursor.columnIndex === 31) {
          if (cursor.rowIndex < tabSheet.rows.length - 1) {
            setCursor({ rowIndex: cursor.rowIndex + 1, columnIndex: 0, stringIndex: cursor.stringIndex });
          }
        } else {
          setCursor({ ...cursor, columnIndex: cursor.columnIndex + 1 });
        }
        return;
      }

      // 7. DIRECT TECHNIQUE FALLBACK
      if (/^[hps\/~mx]$/i.test(key)) {
        e.preventDefault();
        updateNote(key);
        return;
      }

      /**
       * 8. FRET DATA ENTRY: NO-NONSENSE
       * We pass the key directly to updateNote and let the Context's 
       * new Legato Sequence Logic handle the building.
       */
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        initAudio(); 
        updateNote(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor, shortcuts, tabSheet.rows, updateNote, setCursor, addRow, saveManual, playNote, initAudio]);
};