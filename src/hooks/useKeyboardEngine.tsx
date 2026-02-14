/**
 * @file useKeyboardEngine.ts
 * @description The Unified Command Engine. Handles navigation, shortcuts, and data entry.
 */

import { useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useShortcuts } from '../store/ShortcutContext';

export const useKeyboardEngine = () => {
  const { cursor, setCursor, updateNote, tabSheet, addRow, saveManual } = useTab();
  const { shortcuts } = useShortcuts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

        /** 
       * If the user is focusing on ANY input element (like the shortcut remapper),
       * we immediately exit. This prevents double-triggering.
       */
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.hasAttribute('data-settings-input')) {
        return; 
      }

const key = e.key.toLowerCase();

      // 1. SYSTEM COMMANDS (Ctrl + Key)
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

      // 3. SEMANTIC SHORTCUTS
      const action = shortcuts[key];
      if (action?.startsWith('SELECT_STRING_')) {
        e.preventDefault();
        const stringIdx = parseInt(action.split('_')[2]) - 1;
        setCursor({ ...cursor, stringIndex: stringIdx });
        return;
      }

      // 4. NAVIGATION: ENTER (Flow State)
      if (key === 'enter') {
        e.preventDefault();
        if (cursor.columnIndex === 23) {
          if (cursor.rowIndex < tabSheet.rows.length - 1) {
            setCursor({ rowIndex: cursor.rowIndex + 1, columnIndex: 0, stringIndex: cursor.stringIndex });
          }
        } else {
          setCursor({ ...cursor, columnIndex: cursor.columnIndex + 1 });
        }
        return;
      }

      // 5. MANUAL NAVIGATION (Arrow Keys)
      if (key.startsWith('arrow')) {
        e.preventDefault();
        let { rowIndex, columnIndex, stringIndex } = cursor;
        if (key === 'arrowup') stringIndex = Math.max(0, stringIndex - 1);
        if (key === 'arrowdown') stringIndex = Math.min(5, stringIndex + 1);
        if (key === 'arrowleft') columnIndex = Math.max(0, columnIndex - 1);
        if (key === 'arrowright') columnIndex = Math.min(23, columnIndex + 1);
        setCursor({ rowIndex, columnIndex, stringIndex });
        return;
      }

      // 6. FRET INPUT (0-9)
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        updateNote(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor, shortcuts, tabSheet.rows.length, updateNote, setCursor, addRow, saveManual]);
};