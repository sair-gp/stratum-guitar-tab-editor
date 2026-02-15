/**
 * @file Column.tsx
 * @description A vertical measure component representing a slice of 6 strings.
 * This component is "dumb"—it renders what it's told and reports focus back to the Brain.
 */

import type { TabColumn } from '../../types/tab';
import { useTab } from '../../store/TabContext';

/**
 * Coordination Contract:
 * @param column - The data for this specific measure (6 strings).
 * @param rowIndex - The vertical index of the staff this column belongs to.
 * @param colIndex - The horizontal index of this measure within its staff (0-23).
 */
interface ColumnProps {
  column: TabColumn;
  rowIndex: number;
  colIndex: number;
}

export const Column = ({ column, rowIndex, colIndex }: ColumnProps) => {
  const { cursor, setCursor } = useTab();

  return (
    <div className="flex flex-col items-center group relative border-r border-zinc-800/30 last:border-r-0 min-w-0">
      {/* Measure Header: Displays the 1-24 numbering */}
      <span className="h-8 flex items-center justify-center text-[9px] font-bold text-zinc-700 group-hover:text-yellow-500 transition-colors">
        {(colIndex + 1).toString().padStart(2, '0')}
      </span>

      {column.notes.map((note, stringIdx) => {
       // High-precision active check
        const isSelectedCell = 
          cursor.rowIndex === rowIndex && 
          cursor.columnIndex === colIndex && 
          cursor.stringIndex === stringIdx;

        // NEW: Column-wide highlight during playback
        const isCurrentBeat = 
          cursor.rowIndex === rowIndex && 
          cursor.columnIndex === colIndex;

        return (
          <div key={stringIdx} className="relative flex items-center justify-center w-full h-8">
            <div className={`absolute w-full h-[1px] z-0 transition-colors ${
              isSelectedCell ? 'bg-yellow-500/60' : isCurrentBeat ? 'bg-yellow-500/20' : 'bg-zinc-800'
            }`}></div>
            
            <input
              type="text"
              readOnly
              value={note}
              // METICULOUS: Ensure clicking a cell doesn't kill the Keyboard Engine focus
              onFocus={() => setCursor({ rowIndex, columnIndex: colIndex, stringIndex: stringIdx })}
              className={`
                w-full h-full z-10 text-center bg-transparent border-none outline-none font-mono text-sm transition-all cursor-pointer
                ${isSelectedCell ? 'text-yellow-400 font-bold scale-110' : isCurrentBeat ? 'text-yellow-200/50' : 'text-zinc-500'}
              `}
              placeholder="-"
            />
          </div>
        );
      })}
    </div>
  );
};