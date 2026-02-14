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
        // High-precision active check across 3D coordinates (Row, Col, String)
        const isActive = 
          cursor.rowIndex === rowIndex && 
          cursor.columnIndex === colIndex && 
          cursor.stringIndex === stringIdx;

        return (
          <div key={stringIdx} className="relative flex items-center justify-center w-full h-8">
            {/* The Physical Guitar String Visual */}
            <div className={`absolute w-full h-[1px] z-0 ${isActive ? 'bg-yellow-500/40' : 'bg-zinc-800'}`}></div>
            
            <input
              type="text"
              readOnly // Managed strictly by the Keyboard Engine to prevent browser conflicts
              value={note}
              onFocus={() => setCursor({ rowIndex, columnIndex: colIndex, stringIndex: stringIdx })}
              className={`
                w-full h-full z-10 text-center bg-transparent border-none outline-none font-mono text-sm transition-all cursor-pointer
                ${isActive ? 'text-yellow-400 font-bold bg-yellow-500/10' : 'text-zinc-500'}
              `}
              placeholder="-"
            />
          </div>
        );
      })}
    </div>
  );
};