/**
 * @file storage.ts
 * @description Master Project Management for the Stratum Catalog.
 * Restored original exports to ensure compatibility with existing Context logic.
 */

import type { TabSheet } from '../types/tab';

/**
 * Key definitions for the Stratum v3 Architecture.
 */
const CATALOG_INDEX_KEY = 'stratum_catalog_index_v3';
const PROJECT_PREFIX = 'stratum_project_v3_';
const CURRENT_PROJECT_ID_KEY = 'stratum_active_id';

// Legacy key - used to detect if we need to migrate or clear old 24-column data
const LEGACY_STORAGE_KEY = 'bat_tab_v2_data';

export interface ProjectMetadata {
  id: string;
  title: string;
  artist: string;
  lastModified: number;
}

/**
 * COMPATIBILITY EXPORT: Persists the active tab to local storage.
 * Automatically updates the master catalog index.
 */
export const saveTabToLocal = (data: TabSheet): void => {
  try {
    const activeId = localStorage.getItem(CURRENT_PROJECT_ID_KEY) || crypto.randomUUID();
    
    // Save the actual tab data under a unique project key
    localStorage.setItem(`${PROJECT_PREFIX}${activeId}`, JSON.stringify(data));
    localStorage.setItem(CURRENT_PROJECT_ID_KEY, activeId);
    
    // Update the index metadata for the catalog
    updateCatalogIndex(activeId, data);
  } catch (error) {
    console.error("SAVE_ERROR: Persistent storage failed.", error);
  }
};

/**
 * COMPATIBILITY EXPORT: Retrieves the last active tab.
 */
export const loadTabFromLocal = (): TabSheet | null => {
  try {
    const activeId = localStorage.getItem(CURRENT_PROJECT_ID_KEY);
    if (!activeId) return null;
    
    const data = localStorage.getItem(`${PROJECT_PREFIX}${activeId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("LOAD_ERROR: Failed to retrieve project.", error);
    return null;
  }
};

/**
 * Internal logic to sync the Project Metadata with the Index.
 */
const updateCatalogIndex = (id: string, data: TabSheet) => {
  const index: ProjectMetadata[] = JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
  const existingIdx = index.findIndex(p => p.id === id);
  
  const metadata: ProjectMetadata = {
    id,
    title: data.title,
    artist: data.artist,
    lastModified: Date.now()
  };

  if (existingIdx !== -1) {
    index[existingIdx] = metadata;
  } else {
    index.push(metadata);
  }

  localStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(index));
};

/**
 * THE CATALOG API: Exposed for use in the UI components.
 */
export const storage = {
  getIndex: (): ProjectMetadata[] => {
    const data = localStorage.getItem(CATALOG_INDEX_KEY);
    return data ? JSON.parse(data) : [];
  },

  loadProjectById: (id: string): TabSheet | null => {
    const data = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
    if (data) {
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, id);
      return JSON.parse(data);
    }
    return null;
  },

  deleteProject: (id: string): void => {
    localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
    const index = JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
    const newIndex = index.filter((p: ProjectMetadata) => p.id !== id);
    localStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(newIndex));
    
    if (localStorage.getItem(CURRENT_PROJECT_ID_KEY) === id) {
      localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
    }
  },

  clearLegacyData: () => {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  },

  clearAll: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('stratum_') || key.includes('bat_tab_')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  }



};