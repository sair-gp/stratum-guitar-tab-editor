/**
 * @file TabRowComponent.tsx
 * @description Clean layout engine. Properly utilizes props to avoid warnings.
 */
import { useEffect, useRef } from 'react';
import type { TabRow } from '../../types/tab';
import { Column } from './Column';
import { TuningLabel } from './TuningLabel';
import { useTab } from '../../store/TabContext';

interface RowProps {
  row: TabRow;
  rowIndex: number;
}

export const TabRowComponent = ({ row, rowIndex }: RowProps) => {
  const { tabSheet, cursor } = useTab();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cursor.rowIndex === rowIndex) {
      requestAnimationFrame(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [cursor.rowIndex, rowIndex]);

  return (
    <div ref={rowRef} className="flex items-start w-full group mb-12 scroll-mt-24 pt-12">
      <div className="flex flex-col gap-0 mt-8 mr-4 bg-zinc-950/60 px-2 py-0 rounded-xl border border-zinc-800/50">
        {tabSheet.tuning.map((note, i) => (
          <TuningLabel key={i} note={note} index={i} />
        ))}
      </div>

      <div className="flex-1 grid grid-cols-32 w-full bg-zinc-900/40 rounded-xl border border-zinc-800 shadow-lg relative">
        {row.columns.map((col, colIndex) => (
          <Column 
            key={col.id} 
            column={col} 
            rowIndex={rowIndex} 
            colIndex={colIndex} 
            isBarLine={colIndex === 15} 
          />
        ))}
      </div>
    </div>
  );
};