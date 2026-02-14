/**
 * @file App.tsx
 * @description The application entry point. 
 * Meticulously updated to provide both Tab and Shortcut context.
 */

import { TabProvider } from './store/TabContext';
import { ShortcutProvider } from './store/ShortcutContext'; // ADD THIS
import { TabGrid } from './components/editor/TabGrid';
import { useState } from 'react';
import { SettingsSidebar } from './components/ui/SettingsSidebar';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <TabProvider>
      <ShortcutProvider> {/* WRAP EVERYTHING IN THIS */}
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-yellow-500/30 overflow-x-hidden">
          <header className="w-full p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="w-full px-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter text-yellow-500">
                  BAT-TAB <span className="text-zinc-500 text-sm font-normal ml-2">v1.0 MVP</span>
                </h1>
              </div>
              <div className="flex gap-4">
                {/* Settings Trigger */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-2 bg-zinc-800/50 rounded border border-zinc-700/50 text-[10px] font-mono text-zinc-400 hover:text-yellow-500 hover:border-yellow-500/50 transition-all"
                >
                  CONFIG_SHORTCUTS
                </button>
              </div>
            </div>
          </header>

          <main className="w-full h-[calc(100vh-100px)] p-4 lg:p-8">
            <TabGrid />
          </main>

          <SettingsSidebar 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
          />
        </div>
      </ShortcutProvider>
    </TabProvider>
  );
}

export default App;