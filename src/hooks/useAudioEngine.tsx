/**
 * @file useAudioEngine.ts
 * @description State-Resilient Audio Engine. Forced Firefox compatibility via Ref-based ready-checks.
 */

import * as Tone from 'tone';
import { useCallback, useRef } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  const { tabSheet, setIsAudioReady } = useTab();
  
  const isInitializing = useRef(false);
  // TACTICAL: Use a Ref for the ready state to bypass React's closure staleness
  const audioReadyRef = useRef(false);
  
  const sampler = useRef<Tone.Sampler | null>(null);
  const vibrato = useRef<Tone.Vibrato | null>(null);
  const filter = useRef<Tone.Filter | null>(null);

  const resumeContext = useCallback(() => {
    if (Tone.context.state !== 'running') {
      Tone.start();
      console.log("STRATUM_AUDIO: Sync hardware wake-up.");
    }
  }, []);

  const initAudio = useCallback(async (): Promise<boolean> => {
    if (audioReadyRef.current && sampler.current) return true;
    if (isInitializing.current) return false;

    isInitializing.current = true;

    const highPass = new Tone.Filter(20, "highpass").toDestination();
    const vib = new Tone.Vibrato(5, 0.1).connect(highPass);
    
    filter.current = highPass;
    vibrato.current = vib;

    return new Promise((resolve) => {
      sampler.current = new Tone.Sampler({
        urls: {
          "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3",
          "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3",
          "E2": "E2.mp3", "E3": "E3.mp3", "E4": "E4.mp3",
          "G2": "G2.mp3", "G3": "G3.mp3", "G4": "G4.mp3"
        },
        baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
        onload: () => {
          console.log("STRATUM_AUDIO: Buffers full.");
          audioReadyRef.current = true; // Update Ref immediately
          setIsAudioReady(true);        // Update Context for UI
          isInitializing.current = false;
          resolve(true);
        }
      }).connect(vib);
    });
  }, [setIsAudioReady]);

  const playNote = useCallback((stringIndex: number, fret: string, time?: number) => {
    // NO-NONSENSE: Check the Ref, not the state, to avoid closure issues
    if (!sampler.current || !audioReadyRef.current || fret === "") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const lowerFret = fret.toLowerCase();
    const triggerTime = time || Tone.now();
    
    if (lowerFret.includes('x')) {
      sampler.current.triggerAttackRelease("E1", "32n", triggerTime, 0.3);
      return;
    }

    const noteSequence = fret.split(/[hp\/~m\*]/i).filter(n => n !== "");
    if (noteSequence.length === 0) return;

    const isHarmonic = lowerFret.includes('*');
    const isMuted = lowerFret.includes('m');

    const triggerNote = (fretVal: string, delay = 0, vel = 0.7) => {
      const fretNum = parseInt(fretVal);
      if (isNaN(fretNum)) return;

      let freq = Tone.Frequency(baseNote).transpose(fretNum);
      
      if (isHarmonic) {
        freq = freq.transpose(12);
        filter.current?.frequency.setValueAtTime(2500, triggerTime + delay);
      } else {
        filter.current?.frequency.setValueAtTime(20, triggerTime + delay);
      }

      const pitch = freq.toNote();
      const duration = isMuted ? "64n" : "2n";
      const finalVel = isMuted ? 0.3 : vel;

      sampler.current?.triggerAttackRelease(pitch, duration, triggerTime + delay, finalVel);
    };

    triggerNote(noteSequence[0]);

    if (noteSequence.length > 1) {
      const legatoDelay = Tone.Time("16n").toSeconds();
      triggerNote(noteSequence[1], legatoDelay, 0.5);
    }

    if (lowerFret.includes('~')) {
      vibrato.current?.depth.setValueAtTime(0.5, triggerTime);
      vibrato.current?.depth.linearRampToValueAtTime(0, triggerTime + 0.8);
    }
  }, [tabSheet.tuning]); // Removed isAudioReady from deps

  return { initAudio, resumeContext, playNote, isAudioReady: audioReadyRef.current };
};