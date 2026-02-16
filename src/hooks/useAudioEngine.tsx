/**
 * @file useAudioEngine.ts
 * @description Sequence-Aware Audio Engine. 
 * Orchestrates multiple notes within a single rhythmic cell.
 */

import * as Tone from 'tone';
import { useCallback, useRef, useState } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  const { tabSheet } = useTab();
  const [isLoaded, setIsLoaded] = useState(false);
  const sampler = useRef<Tone.Sampler | null>(null);
  const vibrato = useRef<Tone.Vibrato | null>(null);

  const initAudio = useCallback(async () => {
    if (sampler.current) {
      if (Tone.context.state !== 'running') await Tone.start();
      return;
    }

    // Initialize Vibrato LFO node
    vibrato.current = new Tone.Vibrato(5, 0.1).toDestination();

    sampler.current = new Tone.Sampler({
      urls: {
        "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3",
        "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3",
        "E2": "E2.mp3", "E3": "E3.mp3", "E4": "E4.mp3",
        "G2": "G2.mp3", "G3": "G3.mp3", "G4": "G4.mp3"
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
      onload: () => {
        console.log("STRATUM_AUDIO: Legato Engine Online.");
        setIsLoaded(true);
      }
    }).connect(vibrato.current);

    await Tone.start();
  }, []);

  /**
   * TACTICAL NOTE SCHEDULER:
   * Splits input like "3p0" into ["3", "0"] and plays them in sequence.
   */
  const playNote = useCallback((stringIndex: number, fret: string, time?: number) => {
    if (!sampler.current || !isLoaded || fret === "") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const lowerFret = fret.toLowerCase();
    const triggerTime = time || Tone.now();
    
    // 1. DEAD NOTE PROTOCOL: (X)
    if (lowerFret.includes('x')) {
      sampler.current.triggerAttackRelease("E1", "32n", triggerTime, 0.3);
      return;
    }

    // 2. SEQUENCE PARSING: Identify multiple notes in the cell
    const noteSequence = fret.split(/[hp\/~m]/i).filter(n => n !== "");
    if (noteSequence.length === 0) return;

    // 3. PRIMARY NOTE: The strike
    const firstFret = parseInt(noteSequence[0]);
    if (!isNaN(firstFret)) {
      const pitch = Tone.Frequency(baseNote).transpose(firstFret).toNote();
      
      let duration = "4n"; 
      let velocity = 0.7;

      if (lowerFret.includes('m')) { // Palm Mute Choke
        duration = "64n"; 
        velocity = 0.4;
      }

      if (lowerFret.includes('~')) { // Vibrato Mod Ramp
        vibrato.current?.depth.setValueAtTime(0.4, triggerTime);
        vibrato.current?.depth.linearRampToValueAtTime(0, triggerTime + 0.6);
      }

      sampler.current.triggerAttackRelease(pitch, duration, triggerTime, velocity); 
    }

    // 4. LEGATO NOTE: The secondary action (Hammer/Pull/Slide)
    if (noteSequence.length > 1) {
      const secondFret = parseInt(noteSequence[1]);
      if (!isNaN(secondFret)) {
        const secondPitch = Tone.Frequency(baseNote).transpose(secondFret).toNote();
        
        // Schedule the second note 1/16th note after the first
        const legatoDelay = Tone.Time("16n").toSeconds();
        
        // Legato notes have a softer attack velocity
        sampler.current.triggerAttackRelease(secondPitch, "8n", triggerTime + legatoDelay, 0.5);
      }
    }
  }, [tabSheet.tuning, isLoaded]);

  return { initAudio, playNote, isLoaded };
};