/**
 * @file usePlayback.ts
 * @description High-Performance Transport Engine. 
 * Implements a "Kill-First" toggle logic to eliminate spacebar lag.
 */

import * as Tone from 'tone';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTab } from '../store/TabContext';
import { useAudioEngine } from './useAudioEngine';

export const usePlayback = () => {
  const { tabSheet, setCursor, cursor } = useTab();
  const { playNote, initAudio, resumeContext } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ref for the Tone.Part to allow clean disposal and prevent memory leaks
  const sequenceRef = useRef<Tone.Part | null>(null);

  /**
   * TACTICAL KILL SWITCH
   * Immediately silences the transport and clears the schedule.
   */
  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clears all scheduled events
    
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    
    setIsPlaying(false);
    console.log("STRATUM_TRANSPORT: Emergency Stop Executed.");
  }, []);

  /**
   * BAT-START: Context-Aware Playback
   * @param fromBeginning If true, ignores cursor and starts at Row 0, Col 0.
   */
  const startPlayback = useCallback((fromBeginning = false) => {
    // 1. Ensure the AudioContext is running (Browser Security)
    resumeContext();

    /**
     * TACTICAL DECISION: 
     * We check the transport state SYNCHRONOUSLY.
     * If we are already playing, we stop immediately and exit.
     * This fixes the "3-press" bug by avoiding the async 'execute' block entirely.
     */
    if (Tone.Transport.state === 'started') {
      stopPlayback();
      return;
    }

    const execute = async () => {
      // 2. Prepare the buffers
      await initAudio();
      await Tone.loaded();

      // Safety check: Did the user stop while we were loading?
      if (Tone.Transport.state === 'started') return;

      setIsPlaying(true);

      const events: { time: number; col: any; rIdx: number; cIdx: number }[] = [];
      let accumulatedTime = 0;
      let currentRunningBpm = tabSheet.bpm;

      // 3. ANALYTIC TIMELINE MAPPING
      // We map the entire 2D grid into a 1D timeline of seconds
      tabSheet.rows.forEach((row, rIdx) => {
        row.columns.forEach((col, cIdx) => {
          // Support for mid-track BPM changes
          if (col.bpm) currentRunningBpm = col.bpm;

          const secondsPerBeat = 60 / currentRunningBpm;
          const secondsPerColumn = secondsPerBeat / 4; // Assuming 16th note grid

          events.push({ time: accumulatedTime, col, rIdx, cIdx });
          accumulatedTime += secondsPerColumn;
        });
      });

      // 4. ENTRY POINT CALCULATION
      const startGlobalIdx = fromBeginning ? 0 : (cursor.rowIndex * 32) + cursor.columnIndex;
      
      if (!events[startGlobalIdx]) {
        setIsPlaying(false);
        return;
      }

      // Offset the entire timeline so '0' is our starting column
      const startTimeOffset = events[startGlobalIdx].time;
      const playbackEvents = events.slice(startGlobalIdx).map(e => ({
        ...e,
        time: e.time - startTimeOffset 
      }));

      // 5. SCHEDULING & DRAW SYNC
      sequenceRef.current = new Tone.Part((time, event) => {
        // UI Sync: Move the cursor as the music plays
        Tone.Draw.schedule(() => {
          setCursor({ rowIndex: event.rIdx, columnIndex: event.cIdx, stringIndex: 0 });
        }, time);

        // Audio Trigger: Play all notes in the current column
        event.col.notes.forEach((fret: string, sIdx: number) => {
          if (fret !== "" && fret !== "-") {
            playNote(sIdx, fret, time);
          }
        });
      }, playbackEvents).start(0);

      // Start the engine with a small look-ahead for timing stability
      Tone.Transport.start("+0.1");
    };

    execute();
  }, [tabSheet, cursor, initAudio, resumeContext, playNote, setCursor, stopPlayback]);

  /**
   * GLOBAL LISTENER: Spacebar Logic
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const active = document.activeElement;
        
        // Meticulous Shield: Ensure we only trigger if focus is on the editor
        const isEditingTab = active?.getAttribute('data-editor-input') === 'true' || active === document.body;

        if (isEditingTab) {
          e.preventDefault(); // Prevent page jumping
          
          /**
           * NO-NONSENSE TOGGLE:
           * Direct call to start/stop. The 'started' check inside startPlayback
           * now handles the stop command instantly.
           */
          startPlayback(e.shiftKey);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startPlayback]); // Simplified dependency array

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  return { startPlayback, stopPlayback, isPlaying };
};