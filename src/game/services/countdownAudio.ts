import { useEffect } from 'react';

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export type CountdownAudioPart = 'countdownStart' | 'countdownAlmostOver' | 'countdownEnd';

let audioContext: AudioContext | null = null;
let tickIntervalId: number | null = null;

export function primeCountdownAudio() {
  const context = getAudioContext();

  if (context?.state === 'suspended') {
    void context.resume();
  }
}

export function useCountdownAudioPart(part: CountdownAudioPart | null) {
  useEffect(() => {
    if (part === 'countdownStart') {
      stopCountdownAlmostOver();
      playCountdownStart();
      return;
    }

    if (part === 'countdownAlmostOver') {
      startCountdownAlmostOver();
      return stopCountdownAlmostOver;
    }

    if (part === 'countdownEnd') {
      stopCountdownAlmostOver();
      playCountdownEnd();
    }
  }, [part]);
}

export function playCountdownStart() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  void context.resume();

  const gain = context.createGain();

  gain.gain.value = 0.09;
  gain.connect(context.destination);
  playTone(context, gain, 523.25, 0, 'triangle', 0.12, 0.08);
  playTone(context, gain, 659.25, 0.11, 'triangle', 0.14, 0.09);
  window.setTimeout(() => gain.disconnect(), 450);
}

export function startCountdownAlmostOver() {
  const context = getAudioContext();

  if (!context || tickIntervalId !== null) {
    return;
  }

  void context.resume();
  playTick(context, true);
  tickIntervalId = window.setInterval(() => playTick(context, false), 1_000);
}

export function stopCountdownAlmostOver() {
  if (tickIntervalId === null) {
    return;
  }

  window.clearInterval(tickIntervalId);
  tickIntervalId = null;
}

export function playCountdownEnd() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  void context.resume();

  const gain = context.createGain();

  gain.gain.value = 0.16;
  gain.connect(context.destination);
  playTone(context, gain, 880, 0, 'sawtooth', 0.28, 0.22);
  playTone(context, gain, 660, 0.24, 'sawtooth', 0.28, 0.22);
  playTone(context, gain, 880, 0.48, 'sawtooth', 0.28, 0.22);
  window.setTimeout(() => gain.disconnect(), 1_200);
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextConstructor =
    window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  audioContext = new AudioContextConstructor();

  return audioContext;
}

function playTick(audioContext: AudioContext, accent: boolean) {
  const gain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  const startAt = audioContext.currentTime;
  const endAt = startAt + 0.055;

  oscillator.type = 'square';
  oscillator.frequency.value = accent ? 1_100 : 880;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(accent ? 0.08 : 0.055, startAt + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, endAt);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt);
  window.setTimeout(() => gain.disconnect(), 90);
}

function playTone(
  audioContext: AudioContext,
  gain: GainNode,
  frequency: number,
  delay: number,
  type: OscillatorType,
  duration: number,
  volume: number,
) {
  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();
  const startAt = audioContext.currentTime + delay;
  const endAt = startAt + duration;

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  noteGain.gain.setValueAtTime(0, startAt);
  noteGain.gain.linearRampToValueAtTime(volume, startAt + 0.018);
  noteGain.gain.exponentialRampToValueAtTime(0.001, endAt);
  oscillator.connect(noteGain);
  noteGain.connect(gain);
  oscillator.start(startAt);
  oscillator.stop(endAt);
}
