/**
 * @file usePlayback.ts
 * @description Updated for 32-column Pro Staff playback synchronization.
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

    await initAudio();
    if (Tone.getContext().state !== 'running') {
      await Tone.getContext().resume();
    }
    await Tone.loaded();

    if (transport.state === 'started') {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    transport.bpm.value = tabSheet.bpm;

    const secondsPerBeat = 60 / tabSheet.bpm;
    const secondsPerColumn = secondsPerBeat / 4; 

    tabSheet.rows.forEach((row, rowIndex) => {
      row.columns.forEach((col, colIndex) => {
        
        // NO-NONSENSE: Math updated for 32 columns
        const totalColumnOffset = (rowIndex * 32) + colIndex;
        const startTime = totalColumnOffset * secondsPerColumn;

        const eventId = transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            setCursor({ rowIndex, columnIndex: colIndex, stringIndex: 0 });
          }, time);

          col.notes.forEach((fret, stringIndex) => {
            if (fret !== "" && fret !== "-") {
              playNote(stringIndex, fret, time); 
            }
          });
        }, startTime);

        scheduledEvents.current.push(eventId);
      });
    });

    transport.start("+0.2");
  }, [tabSheet, initAudio, playNote, setCursor, stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};