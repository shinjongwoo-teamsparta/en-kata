"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundPresetId = "soft" | "mechanical" | "retro" | "minimal";

interface SoundConfig {
  type: OscillatorType;
  frequency: number;
  duration: number;
  volume: number;
}

interface SoundPreset {
  normal: SoundConfig;
  error: SoundConfig;
  complete: [SoundConfig, SoundConfig];
}

export const SOUND_PRESET_IDS: SoundPresetId[] = [
  "soft",
  "mechanical",
  "retro",
  "minimal",
];

const SOUND_PRESETS: Record<SoundPresetId, SoundPreset> = {
  soft: {
    normal: { type: "sine", frequency: 800, duration: 0.05, volume: 0.03 },
    error: { type: "sine", frequency: 300, duration: 0.08, volume: 0.04 },
    complete: [
      { type: "sine", frequency: 600, duration: 0.08, volume: 0.03 },
      { type: "sine", frequency: 900, duration: 0.08, volume: 0.03 },
    ],
  },
  mechanical: {
    normal: { type: "square", frequency: 400, duration: 0.03, volume: 0.02 },
    error: { type: "square", frequency: 150, duration: 0.06, volume: 0.03 },
    complete: [
      { type: "square", frequency: 500, duration: 0.05, volume: 0.025 },
      { type: "square", frequency: 700, duration: 0.05, volume: 0.025 },
    ],
  },
  retro: {
    normal: { type: "sawtooth", frequency: 660, duration: 0.04, volume: 0.02 },
    error: { type: "sawtooth", frequency: 220, duration: 0.07, volume: 0.03 },
    complete: [
      { type: "sawtooth", frequency: 440, duration: 0.06, volume: 0.025 },
      { type: "sawtooth", frequency: 880, duration: 0.06, volume: 0.025 },
    ],
  },
  minimal: {
    normal: { type: "triangle", frequency: 1000, duration: 0.03, volume: 0.02 },
    error: { type: "triangle", frequency: 350, duration: 0.05, volume: 0.025 },
    complete: [
      { type: "triangle", frequency: 700, duration: 0.05, volume: 0.02 },
      { type: "triangle", frequency: 1050, duration: 0.05, volume: 0.02 },
    ],
  },
};

function createBeep(
  audioCtx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration,
  );

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

function isValidPreset(value: string | null): value is SoundPresetId {
  return SOUND_PRESET_IDS.includes(value as SoundPresetId);
}

export function useKeyboardSound() {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPresetState] = useState<SoundPresetId>("soft");
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setEnabled(localStorage.getItem("keyboardSound") === "true");
    const stored = localStorage.getItem("soundPreset");
    if (isValidPreset(stored)) {
      setPresetState(stored);
    }
  }, []);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playKeySound = useCallback(() => {
    if (!enabled) return;
    const { type, frequency, duration, volume } = SOUND_PRESETS[preset].normal;
    createBeep(getAudioCtx(), frequency, duration, volume, type);
  }, [enabled, preset, getAudioCtx]);

  const playErrorSound = useCallback(() => {
    if (!enabled) return;
    const { type, frequency, duration, volume } = SOUND_PRESETS[preset].error;
    createBeep(getAudioCtx(), frequency, duration, volume, type);
  }, [enabled, preset, getAudioCtx]);

  const playCompleteSound = useCallback(() => {
    if (!enabled) return;
    const ctx = getAudioCtx();
    const [first, second] = SOUND_PRESETS[preset].complete;
    createBeep(ctx, first.frequency, first.duration, first.volume, first.type);
    setTimeout(
      () =>
        createBeep(
          ctx,
          second.frequency,
          second.duration,
          second.volume,
          second.type,
        ),
      80,
    );
  }, [enabled, preset, getAudioCtx]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("keyboardSound", String(next));
      if (next) {
        const { type, frequency, duration, volume } =
          SOUND_PRESETS[preset].normal;
        createBeep(getAudioCtx(), frequency, duration, volume, type);
      }
      return next;
    });
  }, [preset, getAudioCtx]);

  const setPreset = useCallback(
    (id: SoundPresetId) => {
      setPresetState(id);
      localStorage.setItem("soundPreset", id);
      const { type, frequency, duration, volume } = SOUND_PRESETS[id].normal;
      createBeep(getAudioCtx(), frequency, duration, volume, type);
    },
    [getAudioCtx],
  );

  return {
    enabled,
    toggle,
    preset,
    setPreset,
    playKeySound,
    playErrorSound,
    playCompleteSound,
  };
}
