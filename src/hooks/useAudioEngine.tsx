/**
 * @file useAudioEngine.ts
 * @description Refined audio engine with a stable hook order and CDN samples.
 */

import * as Tone from 'tone';
import { useCallback, useRef, useState } from 'react';
import { useTab } from '../store/TabContext';

export const useAudioEngine = () => {
  // 1. All hooks called unconditionally at the top level
  const { tabSheet } = useTab();
  const [isLoaded, setIsLoaded] = useState(false);
  const sampler = useRef<Tone.Sampler | null>(null);

  const initAudio = useCallback(async () => {
    if (sampler.current) {
      if (Tone.context.state !== 'running') await Tone.start();
      return;
    }

    sampler.current = new Tone.Sampler({
      urls: {
        "F#2": "Fs2.mp3", "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3"
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        console.log("STRATUM_AUDIO: Engine Online.");
        setIsLoaded(true);
      }
    }).toDestination();

    await Tone.start();
  }, []);

  const playNote = useCallback((stringIndex: number, fret: string) => {
    if (!sampler.current || !isLoaded || fret === "" || fret === "x") return;

    const baseNote = tabSheet.tuning[stringIndex];
    const fretNum = parseInt(fret);
    
    try {
      const pitch = Tone.Frequency(baseNote).transpose(fretNum).toNote();
      sampler.current.triggerAttackRelease(pitch, "4n");
    } catch (e) {
      console.warn("AUDIO_ERROR: Invalid pitch calculation.");
    }
  }, [tabSheet.tuning, isLoaded]);

  return { initAudio, playNote, isLoaded };
};