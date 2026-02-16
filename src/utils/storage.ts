/**
 * @file storage.ts
 * @description Stabilized Project Management. Fixed ID collisions and export errors.
 */

import type { TabSheet } from '../types/tab';

const CATALOG_INDEX_KEY = 'stratum_catalog_index_v3';
const PROJECT_PREFIX = 'stratum_project_v3_';
const CURRENT_PROJECT_ID_KEY = 'stratum_active_id';

export interface ProjectMetadata {
  id: string;
  title: string;
  artist: string;
  lastModified: number;
}

/**
 * RESTORED EXPORT: Matches the existing TabContext expectations.
 * Includes a safety check to generate a new ID if one isn't active.
 */
export const saveTabToLocal = (data: TabSheet): void => {
  try {
    let activeId = localStorage.getItem(CURRENT_PROJECT_ID_KEY);
    
    if (!activeId) {
      activeId = crypto.randomUUID();
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, activeId);
    }
    
    localStorage.setItem(`${PROJECT_PREFIX}${activeId}`, JSON.stringify(data));
    
    // Sync Metadata with the Index
    const index: ProjectMetadata[] = JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
    const existingIdx = index.findIndex(p => p.id === activeId);
    const metadata: ProjectMetadata = {
      id: activeId,
      title: data.title || "Untitled",
      artist: data.artist || "Unknown",
      lastModified: Date.now()
    };

    if (existingIdx !== -1) {
      index[existingIdx] = metadata;
    } else {
      index.push(metadata);
    }
    localStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(index));

  } catch (error) {
    console.error("SAVE_ERROR: Persistent storage failed.", error);
  }
};

/**
 * RESTORED EXPORT: Legacy support for initial load.
 */
export const loadTabFromLocal = (): TabSheet | null => {
  const activeId = localStorage.getItem(CURRENT_PROJECT_ID_KEY);
  if (!activeId) return null;
  const data = localStorage.getItem(`${PROJECT_PREFIX}${activeId}`);
  return data ? JSON.parse(data) : null;
};

export const storage = {
  getIndex: (): ProjectMetadata[] => {
    return JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
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
    const index = storage.getIndex();
    const newIndex = index.filter(p => p.id !== id);
    localStorage.setItem(CATALOG_INDEX_KEY, JSON.stringify(newIndex));
    
    if (localStorage.getItem(CURRENT_PROJECT_ID_KEY) === id) {
      localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
    }
  },

  clearAll: (): void => {
    localStorage.clear();
    window.location.reload();
  }
};