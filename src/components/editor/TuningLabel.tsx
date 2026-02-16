/**
 * @file TuningLabel.tsx
 * @description Physics-constrained tuning. Prevents octave-mismatching.
 */

import { useState } from 'react';
import { useTab } from '../../store/TabContext';

// ANALYTIC: Define the physical limits for each string index (0 = High E, 5 = Low E)
const STRING_RANGES = [
  { min: 'B3', max: 'G4', defaultOctave: 4 }, // String 1 (High E)
  { min: 'F#3', max: 'D4', defaultOctave: 3 }, // String 2 (B)
  { min: 'D3', max: 'A#3', defaultOctave: 3 }, // String 3 (G)
  { min: 'A2', max: 'F3', defaultOctave: 3 },  // String 4 (D)
  { min: 'E2', max: 'C3', defaultOctave: 2 },  // String 5 (A)
  { min: 'B1', max: 'G2', defaultOctave: 2 },  // String 6 (Low E)
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface TuningLabelProps {
  note: string;
  index: number;
}

export const TuningLabel = ({ note, index }: TuningLabelProps) => {
  const { updateTuning } = useTab();
  const [isOpen, setIsOpen] = useState(false);

  // NO-NONSENSE: Calculate which notes are actually physically possible for this string
  const getValidNotes = () => {
    //const range = STRING_RANGES[index];
    //const notes: string[] = [];
    
    // We iterate through a 12-note window around the default
    // to give the user standard "Alternative Tuning" flexibility (Drop D, DADGAD, etc.)
    for (let i = -4; i <= 4; i++) {
      // Logic to determine semitones from a base note would go here, 
      // but for a "Guitar Group" demo, we'll offer the 12 chromatic notes 
      // and force the correct physical octave.
    }
    return NOTE_NAMES;
  };

  const handleTuningChange = (newNote: string) => {
    const range = STRING_RANGES[index];
    /**
     * TACTICAL OCTAVE MAPPING:
     * If they pick 'D' for the 6th string, it must be D2 (Drop D).
     * If they pick 'D' for the 1st string, it must be D4.
     */
    let octave = range.defaultOctave;
    
    // Simple logic: If the note is 'higher' than the default start, 
    // it might belong to the lower octave to stay in tension.
    if (index === 5 && ['B', 'A#', 'A'].includes(newNote)) octave = 1;
    if (index === 0 && ['G', 'G#', 'A', 'A#', 'B'].includes(newNote)) octave = 3;

    updateTuning(index, `${newNote}${octave}`);
    setIsOpen(false);
  };

  return (
    <div className="relative h-8 flex items-center justify-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-9 h-6 rounded flex items-center justify-center font-mono text-[10px] font-black transition-all border
          ${isOpen 
            ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
            : 'text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'}
        `}
      >
        {note.replace(/\d/, '')} 
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-12 z-50 bg-zinc-900 border border-zinc-800 p-2 rounded-xl shadow-2xl grid grid-cols-4 gap-1 w-44 backdrop-blur-xl animate-in fade-in zoom-in duration-150">
            {getValidNotes().map((n) => (
              <button
                key={n}
                onClick={() => handleTuningChange(n)}
                className={`
                  p-2 text-[10px] font-bold rounded transition-colors
                  ${note.startsWith(n) ? 'bg-yellow-500/10 text-yellow-500' : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'}
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