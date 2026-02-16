/**
 * @file useAudioEngine.ts
 * @description Zero-Dependency Audio Engine. Manages internal readiness.
 */

import * as Tone from 'tone';
import { useCallback, useRef } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  // NO-NONSENSE: We only need tabSheet for the tuning. 
  const { tabSheet } = useTab();
  
  const isInitializing = useRef(false);
  const audioReadyRef = useRef(false);
  
  const sampler = useRef<Tone.Sampler | null>(null);
  const vibrato = useRef<Tone.Vibrato | null>(null);
  const filter = useRef<Tone.Filter | null>(null);

  const resumeContext = useCallback(() => {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
  }, []);

  const initAudio = useCallback(async (): Promise<boolean> => {
    if (audioReadyRef.current && sampler.current) return true;
    if (isInitializing.current) return false;

    isInitializing.current = true;

    // TACTICAL: Clean signal chain for maximum transparency
    const highPass = new Tone.Filter(80, "highpass").toDestination();
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
          console.log("STRATUM_AUDIO: Buffers loaded.");
          audioReadyRef.current = true;
          isInitializing.current = false;
          resolve(true);
        }
      }).connect(vib);
    });
  }, []); // Removed Context dependency

  const playNote = useCallback((stringIndex: number, fret: string, time?: number) => {
    if (!sampler.current || !audioReadyRef.current || fret === "") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const lowerFret = fret.toLowerCase();
    const triggerTime = time || Tone.now();
    
    if (lowerFret.includes('x')) {
      sampler.current.triggerAttackRelease("E1", "32n", triggerTime, 0.2);
      return;
    }

    const noteSequence = fret.split(/[hp\/~m\*]/i).filter(n => n !== "");
    if (noteSequence.length === 0) return;

    const isHarmonic = lowerFret.includes('*');
    const isMuted = lowerFret.includes('m');

    const triggerNote = (fretVal: string, delay = 0, isLegatoChild = false) => {
      const fretNum = parseInt(fretVal);
      if (isNaN(fretNum)) return;

      let freq = Tone.Frequency(baseNote).transpose(fretNum);
      const executeTime = triggerTime + delay;
      
      if (isHarmonic) {
        freq = freq.transpose(12);
        filter.current?.frequency.setValueAtTime(3200, executeTime);
        filter.current?.Q.setValueAtTime(2, executeTime);
      } else {
        filter.current?.frequency.setValueAtTime(80, executeTime);
        filter.current?.Q.setValueAtTime(1, executeTime);
      }

      const pitch = freq.toNote();
      const duration = isMuted ? "32n" : "1n";
      const velocity = isMuted ? 0.2 : (isLegatoChild ? 0.45 : 0.75);

      sampler.current?.triggerAttackRelease(pitch, duration, executeTime, velocity);
    };

    triggerNote(noteSequence[0]);

    if (noteSequence.length > 1) {
      const legatoDelay = Tone.Time("16n").toSeconds();
      triggerNote(noteSequence[1], legatoDelay, true);
    }

    if (lowerFret.includes('~')) {
      vibrato.current?.depth.setValueAtTime(0.6, triggerTime + 0.1);
      vibrato.current?.depth.linearRampToValueAtTime(0, triggerTime + 1.2);
    }
  }, [tabSheet.tuning]);

  return { initAudio, resumeContext, playNote, isAudioReady: audioReadyRef.current };
};