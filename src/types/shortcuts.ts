/**
 * @file shortcuts.ts
 * @description Definitions for the Semantic Shortcut System.
 */

/**
 * Valid actions that can be triggered by a keyboard shortcut.
 */
export type ShortcutAction = 
  | 'SELECT_STRING_1' // Jumps cursor to High E
  | 'SELECT_STRING_2' 
  | 'SELECT_STRING_3' 
  | 'SELECT_STRING_4' 
  | 'SELECT_STRING_5' 
  | 'SELECT_STRING_6' // Jumps cursor to Low E
  | 'NAV_NEXT_COL'    // Moves cursor right
  | 'NAV_PREV_COL'    // Moves cursor left
  | 'ADD_ROW'         // Appends a new 24-column staff
  | 'SAVE_TAB'        // Triggers manual LocalStorage persistence
  | 'CLEAR_CELL';     // Deletes value at current cursor

/**
 * User-defined mapping of keyboard characters to actions.
 * Example: { 'q': 'SELECT_STRING_1', 'enter': 'NAV_NEXT_COL' }
 */
export interface ShortcutMap {
  [key: string]: ShortcutAction;
}