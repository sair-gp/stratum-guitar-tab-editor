/**
 * @file ShortcutContext.tsx
 * @description State management for customizable keyboard shortcuts.
 * This provider manages the mapping between physical keystrokes and editor actions,
 * ensuring persistence across sessions and preventing key conflicts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ShortcutMap, ShortcutAction } from '../types/shortcuts';

/**
 * Versioned storage key to ensure schema compatibility.
 */
const STORAGE_KEY = 'guitar_tab_shortcut_registry_v2';

/**
 * Standard factory defaults for the editor.
 * Includes string selection, navigation, and document management.
 */
const DEFAULT_SHORTCUTS: ShortcutMap = {
  'q': 'SELECT_STRING_1',
  'b': 'SELECT_STRING_2', 
  'g': 'SELECT_STRING_3',
  'd': 'SELECT_STRING_4',
  'a': 'SELECT_STRING_5',
  'e': 'SELECT_STRING_6',
  'enter': 'NAV_NEXT_COL',
  'backspace': 'CLEAR_CELL',
  's': 'SAVE_TAB', 
  'n': 'ADD_ROW',  
};

interface ShortcutContextType {
  shortcuts: ShortcutMap;
  remapKey: (key: string, action: ShortcutAction) => void;
  resetShortcuts: () => void;
}

const ShortcutContext = createContext<ShortcutContextType | undefined>(undefined);

/**
 * Manages the shortcut lifecycle, including input validation and storage synchronization.
 */
export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Initializes state by attempting to parse local storage.
   * Falls back to defaults if data is missing or malformed.
   */
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
    } catch (error) {
      console.error("Storage Error: Failed to load shortcuts. Reverting to defaults.");
      return DEFAULT_SHORTCUTS;
    }
  });

  /**
   * Synchronizes the internal shortcut state with LocalStorage.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  /**
   * Reassigns a physical key to a logical editor action.
   * * Implementation Details:
   * 1. Rejects numeric inputs (0-9) to protect the fret-entry layer.
   * 2. Removes any existing keys currently mapped to the target action (Ghost Prevention).
   * 3. Immutably updates the shortcut map.
   * * @param key - The physical keyboard character.
   * @param action - The semantic action to trigger.
   */
  const remapKey = useCallback((key: string, action: ShortcutAction) => {
    const lowerKey = key.toLowerCase();

    // Validation: Numeric keys are reserved for data entry and cannot be remapped.
    if (/^[0-9]$/.test(lowerKey)) {
      console.warn("Input Blocked: Numbers 0-9 are reserved for fret entry.");
      return;
    }

    setShortcuts(prev => {
      const updatedMap = { ...prev };

      // Conflict Resolution: Remove existing key-mappings for this specific action.
      // This ensures that an action like 'SELECT_STRING_2' is only tied to one key.
      Object.keys(updatedMap).forEach(existingKey => {
        if (updatedMap[existingKey] === action) {
          delete updatedMap[existingKey];
        }
      });

      // Assign the new key to the action.
      updatedMap[lowerKey] = action;
      return updatedMap;
    });
  }, []);

  /**
   * Clears all custom user mappings and restores the default configuration.
   */
  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
  }, []);

  return (
    <ShortcutContext.Provider value={{ shortcuts, remapKey, resetShortcuts }}>
      {children}
    </ShortcutContext.Provider>
  );
};

/**
 * Hook to access the shortcut registry. 
 * Must be used within a ShortcutProvider.
 */
export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts hook must be used within a ShortcutProvider.");
  }
  return context;
};