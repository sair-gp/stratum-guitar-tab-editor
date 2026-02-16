/**
 * @file useAudioEngine.ts
 * @description Master Audio Controller. Fixed click-latency, added Harmonics & Selective Playback prep.
 */

import * as Tone from 'tone';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  const { tabSheet } = useTab();
  const [isLoaded, setIsLoaded] = useState(false);
  const sampler = useRef<Tone.Sampler | null>(null);
  const vibrato = useRef<Tone.Vibrato | null>(null);
  const filter = useRef<Tone.Filter | null>(null);

  /**
   * NO-NONSENSE PRIMING:
   * We initialize the audio context once the component mounts to kill the double-click bug.
   */
  const initAudio = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
      console.log("STRATUM_AUDIO: Context Resumed.");
    }
    
    if (sampler.current) return;

    // 1. TACTICAL EFFECTS CHAIN: Filter -> Vibrato -> Destination
    filter.current = new Tone.Filter(1000, "highpass").toDestination();
    vibrato.current = new Tone.Vibrato(5, 0.1).connect(filter.current);

    sampler.current = new Tone.Sampler({
      urls: {
        "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3",
        "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3",
        "E2": "E2.mp3", "E3": "E3.mp3", "E4": "E4.mp3",
        "G2": "G2.mp3", "G3": "G3.mp3", "G4": "G4.mp3"
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
      onload: () => {
        console.log("STRATUM_AUDIO: Acoustic Samples Ready.");
        setIsLoaded(true);
      }
    }).connect(vibrato.current);
  }, []);

  const playNote = useCallback((stringIndex: number, fret: string, time?: number) => {
    if (!sampler.current || !isLoaded || fret === "") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const lowerFret = fret.toLowerCase();
    const triggerTime = time || Tone.now();
    
    // 1. DEAD NOTE: (X)
    if (lowerFret.includes('x')) {
      sampler.current.triggerAttackRelease("E1", "32n", triggerTime, 0.3);
      return;
    }

    // 2. SEQUENCE PARSING
    const noteSequence = fret.split(/[hp\/~m\*]/i).filter(n => n !== "");
    if (noteSequence.length === 0) return;

    // 3. ARTICULATION MODIFIERS
    const isHarmonic = lowerFret.includes('*');
    const isMuted = lowerFret.includes('m');

    const triggerNote = (fretVal: string, delay = 0, vel = 0.7) => {
      const fretNum = parseInt(fretVal);
      if (isNaN(fretNum)) return;

      let freq = Tone.Frequency(baseNote).transpose(fretNum);
      
      /**
       * ANALYTIC HARMONICS:
       * Natural harmonics on the 12th fret double the frequency (1 octave up).
       * We simulate this by transposing +12 and engaging the highpass filter.
       */
      if (isHarmonic) {
        freq = freq.transpose(12);
        filter.current?.frequency.setValueAtTime(2000, triggerTime + delay);
      } else {
        // Reset filter for standard notes
        filter.current?.frequency.setValueAtTime(10, triggerTime + delay);
      }

      const pitch = freq.toNote();
      const duration = isMuted ? "64n" : "4n";
      const finalVel = isMuted ? 0.4 : vel;

      sampler.current?.triggerAttackRelease(pitch, duration, triggerTime + delay, finalVel);
    };

    // Play primary note
    triggerNote(noteSequence[0]);

    // Play legato note if exists
    if (noteSequence.length > 1) {
      const legatoDelay = Tone.Time("16n").toSeconds();
      triggerNote(noteSequence[1], legatoDelay, 0.5);
    }

    // Vibrato logic
    if (lowerFret.includes('~')) {
      vibrato.current?.depth.setValueAtTime(0.4, triggerTime);
      vibrato.current?.depth.linearRampToValueAtTime(0, triggerTime + 0.6);
    }
  }, [tabSheet.tuning, isLoaded]);

  return { initAudio, playNote, isLoaded };
};