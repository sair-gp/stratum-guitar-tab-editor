/**
 * @file TabRowComponent.tsx
 * @description The horizontal staff container with FUNCTIONAL auto-scroll.
 */
import React, { useEffect, useRef } from 'react';
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

  /**
   * TACTICAL AUTO-SCROLL:
   * Triggers on BOTH playback and manual staff jumps (Alt+Arrows).
   */
  useEffect(() => {
    if (cursor.rowIndex === rowIndex) {
      // requestAnimationFrame ensures the DOM is painted before scrolling
      requestAnimationFrame(() => {
        rowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Keeps active staff in the sweet spot of the screen
        });
      });
    }
  }, [cursor.rowIndex, rowIndex]);

  return (
    // THE CRITICAL FIX: Attach the rowRef to this outer container
    <div ref={rowRef} className="flex items-start w-full group mb-12 scroll-mt-20">
      {/* Tuning Sidebar */}
      <div className="flex flex-col gap-0 mt-8 mr-4 bg-zinc-950/60 px-2 py-0 rounded-xl border border-zinc-800/50">
        {tabSheet.tuning.map((note, i) => (
          <TuningLabel key={i} note={note} index={i} />
        ))}
      </div>

      {/* The 16-Measure Grid (Responsive) */}
      <div className="flex-1 grid grid-cols-32 w-full bg-zinc-900/40 rounded-xl overflow-hidden border border-zinc-800 shadow-lg transition-all duration-300">
        {row.columns.map((col, colIndex) => (
  <Column 
    key={col.id} 
    column={col} 
    rowIndex={rowIndex} 
    colIndex={colIndex} 
    // METICULOUS: This is the vertical divider between Measure 1 and Measure 2
    isBarLine={colIndex === 15} 
  />
))}
      </div>
    </div>
  );
};