import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "./msw";

class MockUtterance {
  text = "";
  rate = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onstart: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

export const ttsUtterances: MockUtterance[] = [];

const speakMock = vi.fn((u: MockUtterance) => {
  ttsUtterances.push(u);
  speechSynth.speaking = true;
  speechSynth.paused = false;
  queueMicrotask(() => u.onstart?.());
});

export const speechSynth = {
  speaking: false,
  paused: false,
  speak: speakMock,
  cancel: vi.fn(() => {
    speechSynth.paused = false;
    speechSynth.speaking = false;
    ttsUtterances.at(-1)?.onend?.();
  }),
  pause: vi.fn(() => {
    speechSynth.paused = true;
  }),
  resume: vi.fn(() => {
    if (!speechSynth.paused && !speechSynth.speaking) return;
    speechSynth.paused = false;
    speechSynth.speaking = true;
  }),
};

vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
vi.stubGlobal("speechSynthesis", speechSynth);

export const recognitionInstances: MockRecognition[] = [];

export class MockRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    recognitionInstances.push(this);
  }
  emit(transcript: string, isFinal = true) {
    this.onresult?.({
      resultIndex: 0,
      results: [{ isFinal, 0: { transcript } }],
    });
  }
}

vi.stubGlobal("webkitSpeechRecognition", MockRecognition);
vi.stubGlobal("SpeechRecognition", MockRecognition);

Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    getUserMedia: vi.fn(async () => ({
      getTracks: () => [{ stop: vi.fn() }],
    })),
  },
});

Object.defineProperty(navigator, "permissions", {
  configurable: true,
  value: {
    query: vi.fn(async () => ({ state: "granted" })),
  },
});

export const clipboardWriteText = vi.fn(async () => undefined);

if (!("clipboard" in navigator) || !navigator.clipboard) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: clipboardWriteText },
  });
} else {
  vi.spyOn(navigator.clipboard, "writeText").mockImplementation(
    clipboardWriteText,
  );
}

afterEach(() => {
  cleanup();
  clipboardWriteText.mockClear();
  recognitionInstances.length = 0;
  ttsUtterances.length = 0;
  speechSynth.speaking = false;
  speechSynth.paused = false;
  speechSynth.pause.mockClear();
  speechSynth.resume.mockClear();
  speechSynth.cancel.mockClear();
  speechSynth.speak.mockClear();
});
