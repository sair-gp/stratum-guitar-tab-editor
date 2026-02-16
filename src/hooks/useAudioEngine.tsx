/**
 * @file useAudioEngine.ts
 * @description Physics-Based Audio Engine. Implements Node-Interval mapping for authentic harmonics.
 */

import * as Tone from 'tone';
import { useCallback, useRef } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  const { tabSheet } = useTab();
  const isInitializing = useRef(false);
  const audioReadyRef = useRef(false);
  const sampler = useRef<Tone.Sampler | null>(null);
  const vibrato = useRef<Tone.Vibrato | null>(null);
  const filter = useRef<Tone.Filter | null>(null);

  const resumeContext = useCallback(() => {
    if (Tone.context.state !== 'running') Tone.start();
  }, []);

  const initAudio = useCallback(async (): Promise<boolean> => {
    if (audioReadyRef.current && sampler.current) return true;
    if (isInitializing.current) return false;
    isInitializing.current = true;

    // TACTICAL: Standard High-Pass at 80Hz to clear the sub-mud
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
          console.log("STRATUM_AUDIO: High-fidelity buffers ready.");
          audioReadyRef.current = true;
          isInitializing.current = false;
          resolve(true);
        }
      }).connect(vib);
    });
  }, []);

  const playNote = useCallback((stringIndex: number, fret: string, time?: number) => {
    if (!sampler.current || !audioReadyRef.current || fret === "") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const triggerTime = time || Tone.now();
    const lowerFret = fret.toLowerCase();
    
    // 1. DEAD NOTES
    if (lowerFret.includes('x')) {
      sampler.current.triggerAttackRelease("E1", "32n", triggerTime, 0.2);
      return;
    }

    // 2. DETECT MODIFIERS
    const isHarmonic = fret.includes('<') || fret.includes('>') || fret.includes('*');
    const isMuted = lowerFret.includes('m');

    // 3. PARSE SEQUENCE (Supports h, p, /, ~)
    const noteSequence = lowerFret.replace(/[<>]/g, "").split(/[hp\/~m\*]/).filter(n => n !== "");
    if (noteSequence.length === 0) return;

    /**
     * TACTICAL NODE MAPPER:
     * Calculates the interval based on the string's physical nodes.
     * Harmonics are relative to the OPEN STRING, not the fret position.
     */
    const getHarmonicInterval = (fretNum: number): number => {
      if (fretNum === 12) return 12; // Octave
      if (fretNum === 7 || fretNum === 19) return 19; // Octave + Perfect 5th
      if (fretNum === 5 || fretNum === 24) return 24; // 2 Octaves
      if (fretNum === 4 || fretNum === 9 || fretNum === 16) return 28; // 2 Octaves + Major 3rd
      return 12; // Fallback
    };

    const triggerNote = (fretVal: string, delay = 0, isLegatoChild = false) => {
  const fretNum = parseInt(fretVal);
  if (isNaN(fretNum)) return;

  let freq = Tone.Frequency(baseNote);
  const executeTime = triggerTime + delay;
  
  if (isHarmonic) {
    const interval = getHarmonicInterval(fretNum);
    freq = freq.transpose(interval);
    
    /**
     * TACTICAL FILTER ADAPTATION:
     * The 12th fret is "thicker." We lower the filter to 800Hz to let the 
     * fundamental ring, while 5/7/others stay at 1600Hz for the chime.
     */
    const filterFreq = fretNum === 12 ? 800 : 1600;
    const filterQ = fretNum === 12 ? 0.8 : 1.1; // Lower Q for 12th to reduce "quack"

    filter.current?.frequency.setValueAtTime(filterFreq, executeTime); 
    filter.current?.Q.setValueAtTime(filterQ, executeTime);
  } else {
    freq = freq.transpose(fretNum);
    filter.current?.frequency.setValueAtTime(80, executeTime);
    filter.current?.Q.setValueAtTime(1, executeTime);
  }

  const pitch = freq.toNote();
  const duration = isHarmonic ? "1n" : (isMuted ? "32n" : "2n");

  /**
   * VELOCITY SCALING:
   * 12th fret is naturally louder, so we pull it back to 0.85 
   * to prevent digital clipping (the "quack").
   */
  const velocity = isHarmonic 
    ? (fretNum === 12 ? 0.85 : 0.95) 
    : (isMuted ? 0.2 : (isLegatoChild ? 0.45 : 0.75));

  sampler.current?.triggerAttackRelease(pitch, duration, executeTime, velocity);
};

    // Trigger Primary Note
    triggerNote(noteSequence[0]);

    // Handle Legato/Techniques
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