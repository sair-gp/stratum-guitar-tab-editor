/**
 * @file useKeyboardEngine.ts
 * @description Command Engine: Harmonic Toggle & Direct Input Refinement.
 */

import { useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useShortcuts } from '../store/ShortcutContext';
import { useAudioEngine } from './useAudioEngine';
import { triggerAsciiDownload } from '../utils/asciiExport';

export const useKeyboardEngine = () => {
  const { 
    cursor, setCursor, updateNote, tabSheet, addRow, saveManual,
    undo, redo, shiftNotes 
  } = useTab();
  const { shortcuts } = useShortcuts();
  const { playNote, initAudio } = useAudioEngine();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isGridCell = target.hasAttribute('data-editor-input');
      const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

      if (isInput && !isGridCell) return; 

      const key = e.key.toLowerCase();

      /**
       * 0. ALT-COMMANDS: STAFF NAVIGATION & SYSTEM ACTIONS
       */
      if (e.altKey) {
        e.preventDefault();
        if (key === 'arrowup' || key === 'arrowdown') {
          const direction = key === 'arrowdown' ? 1 : -1;
          const newRow = Math.max(0, Math.min(tabSheet.rows.length - 1, cursor.rowIndex + direction));
          setCursor({ ...cursor, rowIndex: newRow });
          return;
        }
        if (key === 'arrowright') { shiftNotes('right'); return; }
        if (key === 'arrowleft') { shiftNotes('left'); return; }
        if (key === 'n') { addRow(); return; } 
        if (key === 'e') { triggerAsciiDownload(tabSheet); return; }
        return;
      }

      /**
       * 1. SYSTEM COMMANDS (CTRL/CMD)
       */
      if (e.ctrlKey || e.metaKey) {
        if (key === 's') { e.preventDefault(); saveManual(); return; }
        if (key === 'z') { 
          e.preventDefault(); 
          if (e.shiftKey) redo(); else undo();
          return; 
        }
        if (key === 'y') { e.preventDefault(); redo(); return; }
      }

      // 2. ERASER
      if (key === 'backspace' || key === 'delete') {
        e.preventDefault();
        updateNote('');
        return;
      }

      /**
       * 3. SHORTCUTS & ARTICULATIONS
       * TACTICAL: This handles remappable techniques like TOGGLE_HARMONIC.
       */
      const action = shortcuts[key];
      if (action?.startsWith('TOGGLE_')) {
        e.preventDefault();
        const tech = action.split('_')[1].toLowerCase();
        // This will send 'harmonic' if the action is TOGGLE_HARMONIC
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

      /**
       * 7. ARTICULATION DIRECT INPUT
       * TACTICAL: Removed '*' to enforce the new Bracket < > standard.
       */
      if (/^[hps\/~mx]$/i.test(key)) {
        e.preventDefault();
        updateNote(key);
        return;
      }

      // 8. FRET DATA ENTRY
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        initAudio(); 
        updateNote(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor, shortcuts, tabSheet, updateNote, setCursor, addRow, saveManual, playNote, initAudio, undo, redo, shiftNotes]);
};