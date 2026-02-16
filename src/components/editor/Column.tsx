/**
 * @file Column.tsx
 * @description Pro-Staff cell with Legato-Aware text scaling.
 */

import type { TabColumn } from '../../types/tab';
import { useTab } from '../../store/TabContext';

interface ColumnProps {
  column: TabColumn;
  rowIndex: number;
  colIndex: number;
  isBarLine?: boolean;
}

export const Column = ({ column, rowIndex, colIndex, isBarLine }: ColumnProps) => {
  const { cursor, setCursor, tabSheet } = useTab();
  
  /**
   * NO-NONSENSE CONFIGURATION:
   * State-driven measure numbering visibility.
   */
  const showNumbers = tabSheet.config?.showMeasureNumbers ?? false;

  return (
    <div className={`
      flex flex-col items-center group relative min-w-0 transition-all
      ${isBarLine ? 'border-r-2 border-zinc-700/50' : ''} 
      ${cursor.rowIndex === rowIndex && cursor.columnIndex === colIndex ? 'bg-yellow-500/5' : ''}
    `}>
      <span className="h-8 flex items-center justify-center text-[9px] font-bold text-zinc-700">
        {showNumbers ? (colIndex + 1).toString().padStart(2, '0') : ''}
      </span>

      {column.notes.map((note: string, stringIdx: number) => {
        const isSelectedCell = 
          cursor.rowIndex === rowIndex && 
          cursor.columnIndex === colIndex && 
          cursor.stringIndex === stringIdx;

        /**
         * AUTHENTIC RENDERING:
         * Standardizes casing for techniques and ensures sequences look professional.
         */
        const displayValue = note.toUpperCase();

        /**
         * TACTICAL FONT SCALING:
         * We adjust the size based on the character count to prevent overflow.
         */
        const getFontSize = () => {
          if (displayValue.length > 4) return 'text-[8px] tracking-tighter'; // e.g., 10H12
          if (displayValue.length > 2) return 'text-[10px] tracking-tight';  // e.g., 3P0
          return 'text-xs'; // e.g., 12
        };

        return (
          <div key={stringIdx} className="relative flex items-center justify-center w-full h-8 px-0.5">
            {/* Horizontal String Line */}
            <div className={`absolute w-full h-[1px] z-0 transition-colors ${
              isSelectedCell ? 'bg-yellow-500/60' : 'bg-zinc-800/40'
            }`}></div>
            
            <input
              type="text"
              readOnly
              data-editor-input="true"
              value={displayValue}
              onFocus={() => setCursor({ rowIndex, columnIndex: colIndex, stringIndex: stringIdx })}
              className={`
                w-full h-full z-10 text-center bg-transparent border-none outline-none font-mono transition-all cursor-pointer
                ${isSelectedCell ? 'text-yellow-400 font-bold scale-110' : 'text-zinc-400'}
                ${getFontSize()}
                ${displayValue.includes('/') ? 'italic' : ''}
              `}
              placeholder="-"
            />
          </div>
        );
      })}
    </div>
  );
};