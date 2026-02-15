/**
 * @file usePlayback.ts
 * @description Refined playback engine to ensure all 6 strings are triggered.
 */

import * as Tone from 'tone';
import { useState, useCallback, useRef } from 'react';
import { useTab } from '../store/TabContext';
import { useAudioEngine } from './useAudioEngine';

export const usePlayback = () => {
  const { tabSheet, setCursor } = useTab();
  const { playNote, initAudio } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const scheduledEvents = useRef<number[]>([]);

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    scheduledEvents.current.forEach(id => Tone.Transport.clear(id));
    scheduledEvents.current = [];
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(async () => {
    await initAudio(); //
    
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    Tone.Transport.bpm.value = tabSheet.bpm;

    // Calculate how many columns exist per 'measure' based on time signature
    // Stratum uses 24 columns per staff. In 4/4, that's 6 measures of 4 beats.
    tabSheet.rows.forEach((row, rowIndex) => {
      row.columns.forEach((col, colIndex) => {
        
        // Tone.js Time format: "Bars:Beats:Sixteenths"
        // We map our 24 columns to this grid.
        const time = `${rowIndex}:0:${colIndex}`; 

        const eventId = Tone.Transport.schedule((t) => {
          // Visual Sync: Update cursor to current playback position
          setCursor({ rowIndex, columnIndex: colIndex, stringIndex: 0 });

          /**
           * TACTICAL FIX:
           * We must iterate through ALL 6 strings in the column.
           * Before, this was likely only hitting index [0].
           */
          col.notes.forEach((fret, stringIndex) => {
            if (fret !== "" && fret !== "-") {
              // Trigger the note on the specific string
              playNote(stringIndex, fret);
            }
          });
        }, time);

        scheduledEvents.current.push(eventId);
      });
    });

    Tone.Transport.start();
  }, [tabSheet, isPlaying, initAudio, playNote, setCursor, stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};