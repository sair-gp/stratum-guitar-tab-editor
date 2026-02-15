/**
 * @file TabRowComponent.tsx
 * @description The horizontal staff container.
 */

import type { TabRow } from '../../types/tab';
import { Column } from './Column';
import { TuningLabel } from './TuningLabel';
import { useTab } from '../../store/TabContext';

interface RowProps {
  row: TabRow;
  rowIndex: number;
}

export const TabRowComponent = ({ row, rowIndex }: RowProps) => {
  const { tabSheet } = useTab();

  return (
    <div className="flex items-start w-full group mb-12">
      {/* Tuning Sidebar: mt-8 matches the Column measure-number height */}
      <div className="flex flex-col gap-0 mt-8 mr-4 bg-zinc-950/60 px-2 py-0 rounded-xl border border-zinc-800/50">
        {tabSheet.tuning.map((note, i) => (
          <TuningLabel key={i} note={note} index={i} />
        ))}
      </div>

      {/* The 24-Measure Grid */}
      <div className="flex-1 grid grid-cols-16 w-full bg-zinc-900/40 rounded-xl overflow-hidden border border-zinc-800 shadow-lg">
        {row.columns.map((col, colIndex) => (
          <Column 
            key={col.id} 
            column={col} 
            rowIndex={rowIndex} 
            colIndex={colIndex} 
          />
        ))}
      </div>
    </div>
  );
};