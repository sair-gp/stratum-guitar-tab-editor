/**
 * @file Column.tsx
 * @description Decoupled Metadata Alignment. Conditional positioning for Discovery vs Active states.
 */

import { memo } from 'react';
import type { TabColumn } from '../../types/tab';
import { useTab } from '../../store/TabContext';

interface ColumnProps {
  column: TabColumn;
  rowIndex: number;
  colIndex: number;
  isBarLine?: boolean;
}

export const Column = memo(({ column, rowIndex, colIndex, isBarLine }: ColumnProps) => {
  const { cursor, setCursor, tabSheet, updateColumnMetadata, updateMetadata } = useTab();
  
  const isSelectedColumn = cursor.rowIndex === rowIndex && cursor.columnIndex === colIndex;
  const isFirstEver = rowIndex === 0 && colIndex === 0;
  const isAnchor = colIndex === 0 || colIndex === 16;
  const hasOverride = column.bpm !== undefined;

  const displayBpm = hasOverride ? column.bpm : tabSheet.bpm;

  return (
    <div className={`
      flex flex-col items-center group/col relative min-w-[32px]
      ${isBarLine ? 'border-r-2 border-zinc-700/50' : ''} 
      ${isSelectedColumn ? 'bg-yellow-500/5' : ''}
    `}>
      
      {/* TACTICAL DECOUPLING:
          - Active BPM: -top-9 (Tightly bound to the measure numbers)
          - Discovery +: -top-14 (High altitude to avoid grid overlap)
      */}
      {isAnchor && (
        <div className={`absolute left-0 z-50 flex items-center pointer-events-none ${
          (hasOverride || isFirstEver) ? "-top-9" : "-top-14"
        }`}>
          {(hasOverride || isFirstEver) ? (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <span className={`text-[10px] font-black italic ${hasOverride ? 'text-yellow-500' : 'text-zinc-600'}`}>
                ♩
              </span>
              <input 
                type="number"
                value={displayBpm}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : parseInt(e.target.value);
                  if (isFirstEver) updateMetadata('bpm', val || 120);
                  else updateColumnMetadata(rowIndex, colIndex, 'bpm', val);
                }}
                className={`
                  w-10 bg-transparent border-none outline-none focus:ring-0 p-0 font-mono text-[10px] transition-all
                  ${hasOverride ? 'text-yellow-500 font-bold' : 'text-zinc-500 font-medium'}
                  hover:text-zinc-200 focus:text-white
                `}
              />
            </div>
          ) : (
            /* DISCOVERY: High-altitude button ensures it NEVER touches the grid lines */
            <button 
              onClick={() => updateColumnMetadata(rowIndex, colIndex, 'bpm', tabSheet.bpm)}
              className="opacity-0 group-hover/col:opacity-100 pointer-events-auto text-zinc-600 hover:text-yellow-500 transition-opacity p-1"
            >
              <span className="text-[12px] font-black">+♩</span>
            </button>
          )}
        </div>
      )}

      {/* Measure Numbers */}
      <span className="h-8 flex items-center justify-center text-[9px] font-bold text-zinc-800 select-none">
        {tabSheet.config?.showMeasureNumbers ? (colIndex + 1).toString().padStart(2, '0') : ''}
      </span>

      {/* String Grid */}
      {column.notes.map((note: string, stringIdx: number) => {
        const isSelectedCell = isSelectedColumn && cursor.stringIndex === stringIdx;
        const displayValue = note.toUpperCase();

        return (
          <div key={stringIdx} className="relative flex items-center justify-center w-full h-8 px-0.5">
            <div className={`absolute w-full h-px z-0 ${isSelectedCell ? 'bg-yellow-500/60' : 'bg-zinc-800/40'}`}></div>
            <input
              type="text"
              readOnly
              data-editor-input="true"
              value={displayValue}
              onFocus={() => setCursor({ rowIndex, columnIndex: colIndex, stringIndex: stringIdx })}
              className={`
                w-full h-full z-10 text-center bg-transparent border-none outline-none font-mono transition-all cursor-pointer
                ${isSelectedCell ? 'text-yellow-400 font-bold scale-110' : 'text-zinc-400'}
                ${displayValue.length > 2 ? 'text-[10px]' : 'text-xs'}
              `}
              placeholder="-"
            />
          </div>
        );
      })}
    </div>
  );
});