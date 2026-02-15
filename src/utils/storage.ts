/**
 * @file storage.ts
 * @description Advanced Project Management for the Stratum Catalog.
 */

import type { TabSheet } from '../types/tab';

const STORAGE_KEY_V2 = 'bat_tab_v2_data'; // Your existing key
const CATALOG_INDEX_KEY = 'stratum_catalog_index_v3';
const PROJECT_PREFIX = 'stratum_project_';

export interface ProjectMetadata {
  id: string;
  title: string;
  lastModified: number;
}

/**
 * Persists a single tab to local storage.
 */
export const saveTabToLocal = (data: TabSheet): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY_V2, serializedData);
    
    // Meticulous: Also update the catalog index
    updateCatalogIndex(data);
  } catch (error) {
    console.error("CRITICAL_ERROR: Failed to persist TabSheet.", error);
  }
};

/**
 * Loads the current tab from local storage.
 */
export const loadTabFromLocal = (): TabSheet | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_V2);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Catalog Internal: Updates the list of available projects.
 */
const updateCatalogIndex = (data: TabSheet) => {
  const index: ProjectMetadata[] = JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
  const existing = index.find(p => p.title === data.title);
  
  if (!existing) {
    index.push({ id: crypto.randomUUID(), title: data.title, lastModified: Date.now() });
    localStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(index));
  }
};

export const clearLocalStorage = (): void => {
  localStorage.clear(); // Complete wipe to handle 24 -> 16 column transition
};