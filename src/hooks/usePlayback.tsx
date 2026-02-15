/**
 * @file usePlayback.ts
 * @description Stratum Playback Engine. 
 * Optimized for 16-column measures and absolute time scheduling.
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
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
    scheduledEvents.current.forEach(id => transport.clear(id));
    scheduledEvents.current = [];
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(async () => {
    const transport = Tone.getTransport();

    // Ensure AudioContext is running before scheduling
    await initAudio();
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }
    await Tone.loaded(); // Wait for acoustic guitar samples

    if (transport.state === 'started') {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    transport.bpm.value = tabSheet.bpm;

    // Calculate seconds per column (assuming 16 columns = 1 measure of 4/4)
    const secondsPerBeat = 60 / tabSheet.bpm;
    const secondsPerColumn = secondsPerBeat / 4; // One sixteenth note

    tabSheet.rows.forEach((row, rowIndex) => {
      row.columns.forEach((col, colIndex) => {
        
        /**
         * ABSOLUTE SCHEDULING:
         * We calculate exactly how many seconds from the start this note should play.
         * This bypasses Tone.js's "16-step bar" restriction entirely.
         */
        const totalColumnOffset = (rowIndex * 16) + colIndex;
        const startTime = totalColumnOffset * secondsPerColumn;

        const eventId = transport.schedule((time) => {
          /**
           * Tone.Draw schedules the React state update to happen 
           * exactly when the audio thread reaches this point.
           */
          Tone.Draw.schedule(() => {
            setCursor({ rowIndex, columnIndex: colIndex, stringIndex: 0 });
          }, time);

          col.notes.forEach((fret, stringIndex) => {
            if (fret !== "" && fret !== "-") {
              // We pass 'time' to playNote for sub-millisecond precision
              playNote(stringIndex, fret, time); 
            }
          });
        }, startTime);

        scheduledEvents.current.push(eventId);
      });
    });

    // Start with a 200ms buffer to ensure first note is caught
    transport.start("+0.2");
  }, [tabSheet, initAudio, playNote, setCursor, stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};