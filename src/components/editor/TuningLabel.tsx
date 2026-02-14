/**
 * @file TuningLabel.tsx
 * @description Interactive label for changing string tuning.
 */

import { useState } from 'react';
import { useTab } from '../../store/TabContext';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TuningLabelProps {
  note: string;
  index: number;
}

export const TuningLabel = ({ note, index }: TuningLabelProps) => {
  const { updateTuning } = useTab();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative h-8 flex items-center justify-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-8 h-6 rounded flex items-center justify-center font-black text-xs transition-all
          ${isOpen ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-yellow-600 hover:text-yellow-400 hover:bg-white/5'}
        `}
      >
        {note}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          {/* Modern Selector Overlay */}
          <div className="absolute left-10 z-50 bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1 w-48 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
            {NOTES.map((n) => (
              <button
                key={n}
                onClick={() => {
                  updateTuning(index, n);
                  setIsOpen(false);
                }}
                className={`
                  p-2 text-[10px] font-bold rounded hover:bg-yellow-500 hover:text-black transition-colors
                  ${note === n ? 'bg-zinc-800 text-yellow-500' : 'text-zinc-500'}
                `}
              >
                {n}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};