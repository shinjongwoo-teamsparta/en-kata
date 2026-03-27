"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundPresetId = "soft" | "mechanical" | "retro" | "minimal";

export const SOUND_PRESET_IDS: SoundPresetId[] = [
  "soft",
  "mechanical",
  "retro",
  "minimal",
];

interface PresetFiles {
  keys: string[];
  error: string;
  complete: string;
  volume: number;
}

const PRESET_CONFIG: Record<SoundPresetId, PresetFiles> = {
  soft: {
    keys: [
      "/sounds/soft/key1.mp3",
      "/sounds/soft/key2.mp3",
      "/sounds/soft/key3.mp3",
      "/sounds/soft/key4.mp3",
    ],
    error: "/sounds/soft/error.mp3",
    complete: "/sounds/soft/complete.mp3",
    volume: 0.6,
  },
  mechanical: {
    keys: [
      "/sounds/mechanical/key1.mp3",
      "/sounds/mechanical/key2.mp3",
      "/sounds/mechanical/key3.mp3",
      "/sounds/mechanical/key4.mp3",
    ],
    error: "/sounds/mechanical/error.mp3",
    complete: "/sounds/mechanical/complete.mp3",
    volume: 0.5,
  },
  retro: {
    keys: [
      "/sounds/retro/key1.mp3",
      "/sounds/retro/key2.mp3",
      "/sounds/retro/key3.mp3",
      "/sounds/retro/key4.mp3",
    ],
    error: "/sounds/retro/error.mp3",
    complete: "/sounds/retro/complete.mp3",
    volume: 0.5,
  },
  minimal: {
    keys: [
      "/sounds/minimal/key1.mp3",
      "/sounds/minimal/key2.mp3",
      "/sounds/minimal/key3.mp3",
      "/sounds/minimal/key4.mp3",
    ],
    error: "/sounds/minimal/error.mp3",
    complete: "/sounds/minimal/complete.mp3",
    volume: 0.6,
  },
};

interface SoundBuffers {
  keys: AudioBuffer[];
  error: AudioBuffer;
  complete: AudioBuffer;
}

const bufferCache = new Map<SoundPresetId, SoundBuffers>();

async function loadBuffer(
  ctx: AudioContext,
  url: string,
): Promise<AudioBuffer> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return ctx.decodeAudioData(arrayBuffer);
}

async function loadPresetBuffers(
  ctx: AudioContext,
  presetId: SoundPresetId,
): Promise<SoundBuffers> {
  const cached = bufferCache.get(presetId);
  if (cached) return cached;

  const config = PRESET_CONFIG[presetId];
  const [keys, error, complete] = await Promise.all([
    Promise.all(config.keys.map((url) => loadBuffer(ctx, url))),
    loadBuffer(ctx, config.error),
    loadBuffer(ctx, config.complete),
  ]);

  const buffers: SoundBuffers = { keys, error, complete };
  bufferCache.set(presetId, buffers);
  return buffers;
}

function playBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  volume: number,
): void {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

function isValidPreset(value: string | null): value is SoundPresetId {
  return SOUND_PRESET_IDS.includes(value as SoundPresetId);
}

export function useKeyboardSound() {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPresetState] = useState<SoundPresetId>("soft");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<SoundBuffers | null>(null);
  const keyIndexRef = useRef(0);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Load saved preferences
  useEffect(() => {
    setEnabled(localStorage.getItem("keyboardSound") === "true");
    const stored = localStorage.getItem("soundPreset");
    if (isValidPreset(stored)) {
      setPresetState(stored);
    }
  }, []);

  // Preload buffers when preset or enabled changes
  useEffect(() => {
    if (!enabled) return;
    const ctx = getAudioCtx();
    loadPresetBuffers(ctx, preset).then((buffers) => {
      buffersRef.current = buffers;
    });
  }, [enabled, preset, getAudioCtx]);

  const playKeySound = useCallback(() => {
    if (!enabled || !buffersRef.current) return;
    const { keys } = buffersRef.current;
    const idx = keyIndexRef.current % keys.length;
    keyIndexRef.current++;
    const buffer = keys[idx];
    if (buffer) playBuffer(getAudioCtx(), buffer, PRESET_CONFIG[preset].volume);
  }, [enabled, preset, getAudioCtx]);

  const playErrorSound = useCallback(() => {
    if (!enabled || !buffersRef.current) return;
    playBuffer(
      getAudioCtx(),
      buffersRef.current.error,
      PRESET_CONFIG[preset].volume * 1.2,
    );
  }, [enabled, preset, getAudioCtx]);

  const playCompleteSound = useCallback(() => {
    if (!enabled || !buffersRef.current) return;
    playBuffer(
      getAudioCtx(),
      buffersRef.current.complete,
      PRESET_CONFIG[preset].volume,
    );
  }, [enabled, preset, getAudioCtx]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("keyboardSound", String(next));
      if (next) {
        const ctx = getAudioCtx();
        loadPresetBuffers(ctx, preset).then((buffers) => {
          buffersRef.current = buffers;
          const first = buffers.keys[0];
          if (first) playBuffer(ctx, first, PRESET_CONFIG[preset].volume);
        });
      }
      return next;
    });
  }, [preset, getAudioCtx]);

  const setPreset = useCallback(
    (id: SoundPresetId) => {
      setPresetState(id);
      localStorage.setItem("soundPreset", id);
      const ctx = getAudioCtx();
      loadPresetBuffers(ctx, id).then((buffers) => {
        buffersRef.current = buffers;
        const first = buffers.keys[0];
        if (first) playBuffer(ctx, first, PRESET_CONFIG[id].volume);
      });
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
