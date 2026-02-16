/**
 * @file storage.ts
 * @description Secure Persistence Engine. Prevents project overwriting via ID-Data coupling.
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
 * TACTICAL: Save with Identity Verification
 * - If data has an ID, we update that specific project.
 * - If no ID exists, we create a new unique entry.
 * @returns The ID used for saving (to be locked into state).
 */
export const saveTabToLocal = (data: TabSheet): string => {
  try {
    // ANALYTIC: The ID must come from the data itself to prevent "Ghost Overwrites"
    const activeId = data.id || crypto.randomUUID();
    
    // Lock this as the "Last Viewed" for the next refresh
    localStorage.setItem(CURRENT_PROJECT_ID_KEY, activeId);
    
    // Save the full payload (now ensuring ID is included)
    const payload = { ...data, id: activeId };
    localStorage.setItem(`${PROJECT_PREFIX}${activeId}`, JSON.stringify(payload));
    
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
    
    console.log(`STRATUM_VAULT: Project [${metadata.title}] secured.`);
    return activeId;

  } catch (error) {
    console.error("SAVE_ERROR: Persistent storage failed.", error);
    return data.id || "";
  }
};

export const storage = {
  getIndex: (): ProjectMetadata[] => {
    try {
      return JSON.parse(localStorage.getItem(CATALOG_INDEX_KEY) || '[]');
    } catch {
      return [];
    }
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