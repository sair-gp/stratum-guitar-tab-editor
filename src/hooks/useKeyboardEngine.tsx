/**
 * @file useKeyboardEngine.ts
 * @description The Unified Command Engine. 
 * Handles coordinate-based navigation, semantic shortcuts, and multi-digit fret entry.
 */

import { useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useShortcuts } from '../store/ShortcutContext';

/**
 * Hook that listens for global keyboard events and dispatches actions to the TabStore.
 * Implements 'Measure Snapping' for rapid traversal of the 24-measure grid.
 */
export const useKeyboardEngine = () => {
  const { cursor, setCursor, updateNote, tabSheet, addRow, saveManual } = useTab();
  const { shortcuts } = useShortcuts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      /**
       * Input focus gate: If the user is typing in a metadata field or 
       * the shortcut remapper, the editor engine is muted to prevent input collisions.
       */
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.hasAttribute('data-settings-input')) {
        return; 
      }

      const key = e.key.toLowerCase();

      // 1. SYSTEM COMMANDS (CTRL + KEY)
      if (e.ctrlKey) {
        if (key === 's') { e.preventDefault(); saveManual(); return; }
        if (key === 'n') { e.preventDefault(); addRow(); return; }
      }

      // 2. ERASER PROTOCOL (BACKSPACE / DELETE)
      if (key === 'backspace' || key === 'delete') {
        e.preventDefault();
        updateNote('');
        return;
      }

      // 3. SEMANTIC SHORTCUTS (Mapped via ShortcutContext)
      const action = shortcuts[key];
      if (action?.startsWith('SELECT_STRING_')) {
        e.preventDefault();
        // Extract string index from action name (e.g., SELECT_STRING_1 -> index 0)
        const stringIdx = parseInt(action.split('_')[2]) - 1;
        setCursor({ ...cursor, stringIndex: stringIdx });
        return;
      }

      // 4. RAPID TRAVERSAL: MEASURE SNAPPING (SHIFT + ARROWS)
      // Jumps 4 columns at a time to allow quick movement across the 24-column grid.
      if (e.shiftKey && (key === 'arrowleft' || key === 'arrowright')) {
        e.preventDefault();
        const direction = key === 'arrowright' ? 1 : -1;
        const jumpSize = 4;
        
        const newCol = Math.max(0, Math.min(23, cursor.columnIndex + (direction * jumpSize)));
        setCursor({ ...cursor, columnIndex: newCol });
        return;
      }

      // 5. STANDARD NAVIGATION (ARROW KEYS)
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

      // 6. COLUMN ITERATION: ENTER (FLOW STATE)
      // Automatically advances to the next column or jumps to the next row at the grid's edge.
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

      // 7. FRET DATA ENTRY (NUMBERS 0-9)
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        updateNote(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursor, shortcuts, tabSheet.rows, updateNote, setCursor, addRow, saveManual]);
};