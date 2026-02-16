/**
 * @file usePlayback.ts
 * @description High-Performance Transport. Uses Windowed Scheduling to kill INP lag.
 */

import * as Tone from 'tone';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useAudioEngine } from './useAudioEngine';

export const usePlayback = () => {
  const { tabSheet, setCursor, cursor } = useTab();
  const { playNote, initAudio, resumeContext } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // TACTICAL: Use a single Sequence instead of thousands of individual events
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    // 1. SYNC HANDSHAKE: Zero-latency hardware wake-up
    resumeContext();

    if (Tone.Transport.state === 'started') {
      stopPlayback();
      return;
    }

    const execute = async () => {
      // 2. BUFFER CHECK
      await initAudio();
      await Tone.loaded();

      setIsPlaying(true);
      Tone.Transport.bpm.value = tabSheet.bpm;

      // 3. ANALYTIC WINDOWING: Flatten columns for the sequence
      const allCols = tabSheet.rows.flatMap((row, rIdx) => 
        row.columns.map(col => ({ ...col, rIdx }))
      );

      const startIndex = (cursor.rowIndex * 32) + cursor.columnIndex;
      const playbackSlice = allCols.slice(startIndex);

      // 4. THE SEQUENCE: Only schedules the NEXT note in the buffer
      sequenceRef.current = new Tone.Sequence(
        (time, colData) => {
          // Identify global position for UI sync
          const globalIdx = allCols.indexOf(colData);
          const rIdx = Math.floor(globalIdx / 32);
          const cIdx = globalIdx % 32;

          Tone.Draw.schedule(() => {
            setCursor({ rowIndex: rIdx, columnIndex: cIdx, stringIndex: 0 });
          }, time);

          // Trigger notes for this column
          colData.notes.forEach((fret, sIdx) => {
            if (fret !== "" && fret !== "-") {
              playNote(sIdx, fret, time);
            }
          });
        },
        playbackSlice,
        "16n" // Tactical resolution: 16th notes
      );

      // 5. START: Small offset to prevent first-note jitter
      sequenceRef.current.start(0);
      Tone.Transport.start("+0.1");
    };

    execute();
  }, [tabSheet, cursor, initAudio, resumeContext, playNote, setCursor, stopPlayback]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};