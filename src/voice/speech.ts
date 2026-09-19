export type RecognitionHandlers = {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

export type MicPermission = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

type Recog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

function RecognitionCtor(): (new () => Recog) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => Recog;
    webkitSpeechRecognition?: new () => Recog;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ttsAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function sttAvailable() {
  return RecognitionCtor() !== null;
}

/** Call from a click so Chrome/Safari will actually prompt and unlock audio. */
export async function unlockSpeech(): Promise<void> {
  if (!ttsAvailable()) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    window.speechSynthesis.speak(warm);
  } catch {
    /* ignore */
  }
}

export async function queryMicPermission(): Promise<MicPermission> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }
  try {
    const status = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    if (status.state === "granted") return "granted";
    if (status.state === "denied") return "denied";
    return "prompt";
  } catch {
    return "unknown";
  }
}

export async function requestMicAccess(): Promise<{
  ok: boolean;
  permission: MicPermission;
  error?: string;
}> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      permission: "unsupported",
      error: "This browser has no microphone API.",
    };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    stream.getTracks().forEach((t) => t.stop());
    return { ok: true, permission: "granted" };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return {
        ok: false,
        permission: "denied",
        error:
          "Microphone is blocked. In the address-bar lock/info icon, set Microphone to Allow, then click Allow microphone again.",
      };
    }
    if (name === "NotFoundError") {
      return {
        ok: false,
        permission: "denied",
        error: "No microphone was found.",
      };
    }
    return {
      ok: false,
      permission: "denied",
      error: "Could not open the microphone.",
    };
  }
}

let speakGeneration = 0;
let ttsKeepAlive = 0;
let heldUtterance = false;

function clearKeepAlive() {
  if (!ttsKeepAlive) return;
  window.clearInterval(ttsKeepAlive);
  ttsKeepAlive = 0;
}

function armKeepAlive(generation?: number) {
  clearKeepAlive();
  ttsKeepAlive = window.setInterval(() => {
    if (generation !== undefined && generation !== speakGeneration) {
      clearKeepAlive();
      return;
    }
    if (window.speechSynthesis.paused) return;
    if (!window.speechSynthesis.speaking) {
      clearKeepAlive();
      return;
    }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 9000);
}

export function speak(
  text: string,
  opts: { rate: number; onEnd?: () => void; onStart?: () => void },
) {
  const generation = ++speakGeneration;
  heldUtterance = false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate;
  u.onstart = () => {
    if (generation !== speakGeneration) return;
    opts.onStart?.();
    armKeepAlive(generation);
  };
  u.onend = () => {
    if (generation !== speakGeneration) return;
    clearKeepAlive();
    opts.onEnd?.();
  };
  u.onerror = () => {
    /* cancelled / interrupted — do not advance the paper */
  };
  window.speechSynthesis.speak(u);
  return u;
}

export function cancelSpeak() {
  speakGeneration += 1;
  heldUtterance = false;
  clearKeepAlive();
  if (ttsAvailable()) window.speechSynthesis.cancel();
}

export function pauseSpeak() {
  if (!ttsAvailable()) return;
  heldUtterance = true;
  clearKeepAlive();
  window.speechSynthesis.pause();
}

export function resumeSpeak(): boolean {
  if (!ttsAvailable() || !heldUtterance) return false;
  heldUtterance = false;
  window.speechSynthesis.resume();
  armKeepAlive();
  return true;
}

export function createRecognizer(handlers: RecognitionHandlers): Recog | null {
  const Ctor = RecognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language || "en-US";
  rec.onresult = (ev) => {
    let interim = "";
    let finalText = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const piece = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    if (finalText.trim()) handlers.onResult(finalText.trim(), true);
    else if (interim.trim()) handlers.onResult(interim.trim(), false);
  };
  rec.onerror = (ev) => {
    if (ev.error === "no-speech" || ev.error === "aborted") return;
    if (ev.error === "audio-capture") {
      handlers.onEnd?.();
      return;
    }
    handlers.onError?.(ev.error);
  };
  rec.onend = () => handlers.onEnd?.();
  return rec;
}
