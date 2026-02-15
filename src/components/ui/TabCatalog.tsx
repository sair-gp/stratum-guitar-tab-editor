/**
 * @file TabCatalog.tsx
 * @description User-friendly interface for managing multiple Stratum projects.
 */

import { storage, ProjectMetadata } from '../../utils/storage';
import { useTab } from '../../store/TabContext';
import { useState, useEffect } from 'react';

export const TabCatalog = () => {
  const { loadProject, createNewProject } = useTab(); // You'll need to add these to Context
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);

  useEffect(() => {
    setProjects(storage.getIndex());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("CRITICAL: This will permanently delete this tab. Proceed?")) {
      storage.deleteProject(id);
      setProjects(storage.getIndex());
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-md w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-yellow-500 font-black tracking-tighter uppercase text-sm">Project_Catalog</h3>
        <button onClick={createNewProject} className="text-[10px] bg-yellow-600 text-black px-3 py-1 rounded font-bold">NEW_TAB</button>
      </div>

      <div className="flex flex-col gap-2">
        {projects.length === 0 && <span className="text-zinc-600 text-[10px] italic">Empty_Archives...</span>}
        {projects.map(p => (
          <div key={p.id} className="group flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-900 hover:border-zinc-700 transition-all">
            <button onClick={() => loadProject(p.id)} className="text-left">
              <span className="block text-xs font-bold text-zinc-300 group-hover:text-yellow-500">{p.title || "Untitled"}</span>
              <span className="block text-[8px] text-zinc-600 font-mono italic">ID: {p.id.slice(0, 8)}</span>
            </button>
            <button 
              onClick={() => handleDelete(p.id)}
              className="opacity-0 group-hover:opacity-100 text-red-900 hover:text-red-500 text-[10px] font-black tracking-widest transition-all"
            >
              DELETE_DATA
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};