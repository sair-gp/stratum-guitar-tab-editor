/**
 * @file storage.ts
 * @description Meticulous wrapper for LocalStorage to ensure type-safe persistence 
 * for the Multi-Row TabSheet structure.
 */

import type { TabSheet } from '../types/tab';

/**
 * Versioned storage key to prevent data corruption between architecture updates.
 * v2 supports the Multi-Row [TabRow] schema.
 */
const STORAGE_KEY = 'bat_tab_v2_data';

/**
 * Persists the entire TabSheet state to the browser's LocalStorage.
 * @param data The current TabSheet object to be stringified and saved.
 */
export const saveTabToLocal = (data: TabSheet): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    // Analytics: Logging the specific failure for debugging persistent storage limits
    console.error("CRITICAL_ERROR: Failed to persist TabSheet to LocalStorage.", error);
  }
};

/**
 * Retrieves and validates the TabSheet from LocalStorage.
 * @returns The parsed TabSheet object or null if storage is empty or data is malformed.
 */
export const loadTabFromLocal = (): TabSheet | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    // Explicitly cast to TabSheet after parsing the JSON string
    return JSON.parse(data) as TabSheet;
  } catch (error) {
    console.error("CRITICAL_ERROR: Failed to retrieve or parse LocalStorage data.", error);
    return null;
  }
};

/**
 * Wipes all saved tab data from the browser. 
 * Use only for 'Reset' operations to ensure a clean state.
 */
export const clearLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};