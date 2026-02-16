/**
 * @file usePlayback.ts
 * @description Variable BPM Transport with Context-Aware Start & Global Shortcuts.
 */

import * as Tone from 'tone';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useAudioEngine } from './useAudioEngine';

export const usePlayback = () => {
  const { tabSheet, setCursor, cursor } = useTab();
  const { playNote, initAudio, resumeContext } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const sequenceRef = useRef<Tone.Part | null>(null);

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /**
   * BAT-START: Context-Aware Playback
   * @param fromBeginning If true, ignores cursor and starts at Row 0, Col 0.
   */
  const startPlayback = useCallback((fromBeginning = false) => {
    resumeContext();

    if (Tone.Transport.state === 'started') {
      stopPlayback();
      return;
    }

    const execute = async () => {
      await initAudio();
      await Tone.loaded();
      setIsPlaying(true);

      const events: { time: number; col: any; rIdx: number; cIdx: number }[] = [];
      let accumulatedTime = 0;
      let currentRunningBpm = tabSheet.bpm;

      // 1. TACTICAL TIMELINE MAPPING
      tabSheet.rows.forEach((row, rIdx) => {
        row.columns.forEach((col, cIdx) => {
          if (col.bpm) currentRunningBpm = col.bpm;

          const secondsPerBeat = 60 / currentRunningBpm;
          const secondsPerColumn = secondsPerBeat / 4; 

          events.push({ time: accumulatedTime, col, rIdx, cIdx });
          accumulatedTime += secondsPerColumn;
        });
      });

      // 2. CALCULATE ENTRY POINT
      // If fromBeginning is true, index is 0. Otherwise, calculate based on cursor.
      const startGlobalIdx = fromBeginning ? 0 : (cursor.rowIndex * 32) + cursor.columnIndex;
      
      if (!events[startGlobalIdx]) {
        setIsPlaying(false);
        return;
      }

      const startTimeOffset = events[startGlobalIdx].time;
      const playbackEvents = events.slice(startGlobalIdx).map(e => ({
        ...e,
        time: e.time - startTimeOffset 
      }));

      // 3. SCHEDULING
      sequenceRef.current = new Tone.Part((time, event) => {
        Tone.Draw.schedule(() => {
          setCursor({ rowIndex: event.rIdx, columnIndex: event.cIdx, stringIndex: 0 });
        }, time);

        event.col.notes.forEach((fret: string, sIdx: number) => {
          if (fret !== "" && fret !== "-") {
            playNote(sIdx, fret, time);
          }
        });
      }, playbackEvents).start(0);

      Tone.Transport.start("+0.1");
    };

    execute();
  }, [tabSheet, cursor, initAudio, resumeContext, playNote, setCursor, stopPlayback]);

  /**
   * BAT-SHORTCUTS: Spacebar & Shift+Spacebar
   * - Space: Play/Stop from cursor.
   * - Shift + Space: Play/Stop from start.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const active = document.activeElement;
        // METICULOUS SHIELD: Don't trigger if user is typing in Title/Artist inputs
        const isEditingTab = active?.getAttribute('data-editor-input') === 'true' || active === document.body;

        if (isEditingTab) {
          e.preventDefault(); // Stop page scrolling
          
          if (Tone.Transport.state === 'started') {
            stopPlayback();
          } else {
            // Shift + Space triggers the fromBeginning flag
            startPlayback(e.shiftKey);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startPlayback, stopPlayback]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};