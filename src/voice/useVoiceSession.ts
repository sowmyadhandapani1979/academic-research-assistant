import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NoteKind, NoteSource, Paper } from "../types";
import { HELP_TEXT, isActionIntent, looksLikeEcho, parseIntent, type VoiceIntent } from "./intents";
import { findUnitIndex, nextSectionIndex, paperToUnits } from "./script";
import {
  cancelSpeak,
  createRecognizer,
  pauseSpeak,
  queryMicPermission,
  requestMicAccess,
  resumeSpeak,
  speak,
  sttAvailable,
  ttsAvailable,
  unlockSpeech,
  type MicPermission,
} from "./speech";

export type VoiceStatus = "idle" | "speaking" | "listening" | "thinking" | "paused";

export type VoiceSession = {
  status: VoiceStatus;
  index: number;
  total: number;
  rate: number;
  liveTranscript: string;
  lastHeard: string;
  lastAction: string;
  activeUnitId: string | null;
  sttOk: boolean;
  ttsOk: boolean;
  micMuted: boolean;
  micError: string | null;
  micPermission: MicPermission;
  requestMic: () => Promise<boolean>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setMicMuted: (muted: boolean) => void;
  handleTranscript: (text: string) => void;
};

const RATES = [0.75, 1, 1.25, 1.5];

function clampRate(n: number) {
  const nearest = RATES.reduce((a, b) =>
    Math.abs(b - n) < Math.abs(a - n) ? b : a,
  );
  return nearest;
}

export type NoteInput = {
  content: string;
  source: NoteSource;
  transcript?: string;
  type?: NoteKind;
  audioTimestamp?: number;
};

export function useVoiceSession({
  paper,
  enabled,
  onNote,
  onMarkRead,
  onVisual,
}: {
  paper: Paper | undefined;
  enabled: boolean;
  onNote: (note: NoteInput) => void;
  onMarkRead: (isRead: boolean) => void;
  onVisual: () => void;
}): VoiceSession {
  const units = useMemo(() => (paper ? paperToUnits(paper) : []), [paper]);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");

  const statusRef = useRef(status);
  const indexRef = useRef(index);
  const rateRef = useRef(rate);
  const unitsRef = useRef(units);
  const enabledRef = useRef(enabled);
  const wantPlay = useRef(false);
  const recRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const ignoreEchoUntil = useRef(0);
  const bargeInRef = useRef<() => void>(() => undefined);

  statusRef.current = status;
  indexRef.current = index;
  rateRef.current = rate;
  unitsRef.current = units;
  enabledRef.current = enabled;

  const confirm = useCallback((spoken: string, action: string, after?: () => void) => {
    setLastAction(action);
    ignoreEchoUntil.current = Date.now() + 2500;
    if (ttsAvailable()) {
      speak(spoken, {
        rate: Math.min(rateRef.current, 1.1),
        onEnd: () => after?.(),
      });
    } else {
      after?.();
    }
  }, []);

  const restartListening = useCallback(() => {
    const rec = recRef.current;
    if (!rec || micMuted || !enabledRef.current) return;
    try {
      rec.start();
    } catch {
      /* already started */
    }
  }, [micMuted]);

  const bargeIn = useCallback(() => {
    if (statusRef.current !== "speaking") return;
    cancelSpeak();
    setStatus("listening");
    restartListening();
  }, [restartListening]);
  bargeInRef.current = bargeIn;

  const speakCurrent = useCallback(() => {
    const list = unitsRef.current;
    const i = indexRef.current;
    if (!enabledRef.current || !wantPlay.current) return;
    if (!ttsAvailable() || !list[i]) {
      wantPlay.current = false;
      setStatus("paused");
      return;
    }
    setStatus("speaking");
    speak(list[i].text, {
      rate: rateRef.current,
      onStart: () => {
        restartListening();
      },
      onEnd: () => {
        if (!wantPlay.current || !enabledRef.current) return;
        const next = indexRef.current + 1;
        if (next >= unitsRef.current.length) {
          wantPlay.current = false;
          setStatus("paused");
          setLastAction("Reached the end of the paper.");
          return;
        }
        setIndex(next);
        indexRef.current = next;
        speakCurrent();
      },
    });
  }, [restartListening]);

  const pause = useCallback(() => {
    wantPlay.current = false;
    pauseSpeak();
    setStatus("paused");
  }, []);

  const play = useCallback(() => {
    wantPlay.current = true;
    if (resumeSpeak()) {
      setStatus("speaking");
      return;
    }
    speakCurrent();
  }, [speakCurrent]);

  const applyIntent = useCallback(
    (intent: VoiceIntent, transcript: string) => {
      const list = unitsRef.current;
      const i = indexRef.current;
      const stamp = i;

      switch (intent.type) {
        case "pause":
          pause();
          setLastAction("Paused.");
          break;
        case "resume":
          setLastAction("Resumed reading.");
          play();
          break;
        case "stop":
          wantPlay.current = false;
          cancelSpeak();
          setStatus("paused");
          confirm("Stopped.", "Stopped.");
          break;
        case "skip": {
          const next =
            intent.by === "section"
              ? nextSectionIndex(list, i, intent.dir)
              : Math.max(0, Math.min(list.length - 1, i + intent.dir));
          setIndex(next);
          indexRef.current = next;
          confirm(intent.dir === 1 ? "Skipping ahead." : "Going back.", "Moved in the paper.", () => {
            if (wantPlay.current) speakCurrent();
          });
          break;
        }
        case "repeat":
          confirm("Repeating.", "Repeated the current passage.", () => {
            wantPlay.current = true;
            speakCurrent();
          });
          break;
        case "rate": {
          const next = clampRate(
            intent.value ?? rateRef.current + (intent.delta ?? 0),
          );
          setRate(next);
          rateRef.current = next;
          confirm(`Speed ${next}.`, `Playback speed ${next}×`, () => {
            if (wantPlay.current) speakCurrent();
          });
          break;
        }
        case "jump": {
          const next = findUnitIndex(list, intent.target);
          setIndex(next);
          indexRef.current = next;
          confirm("Jumping.", `Jumped to ${intent.target}.`, () => {
            wantPlay.current = true;
            speakCurrent();
          });
          break;
        }
        case "note":
        case "fallbackNote":
          onNote({
            content: intent.content,
            source: "voice",
            transcript,
            type: "user_note",
            audioTimestamp: stamp,
          });
          confirm(
            intent.type === "note" ? "Note saved." : "Saved as a note.",
            intent.type === "note"
              ? "Saved a voice note."
              : "Saved spoken text as a note.",
            () => {
              if (wantPlay.current) speakCurrent();
            },
          );
          break;
        case "markRead":
          onMarkRead(intent.isRead);
          confirm(
            intent.isRead ? "Marked as read." : "Marked as unread.",
            intent.isRead ? "Marked as read." : "Marked as unread.",
          );
          break;
        case "visual":
          wantPlay.current = false;
          cancelSpeak();
          setStatus("paused");
          confirm("Opening visual mode.", "Switched to visual.");
          onVisual();
          break;
        case "help":
          setLastAction(HELP_TEXT);
          ignoreEchoUntil.current = Date.now() + 8000;
          if (ttsAvailable()) speak(HELP_TEXT, { rate: 1 });
          break;
        case "clarify":
          confirm(
            "Sorry, I didn't catch a command. Say help for options, or take a note, then your thought.",
            "Didn't catch that — try help, or take a note…",
          );
          break;
        default:
          break;
      }
    },
    [confirm, onMarkRead, onNote, onVisual, pause, play, speakCurrent],
  );

  const handleTranscript = useCallback(
    (text: string) => {
      const spoken = unitsRef.current[indexRef.current]?.text ?? "";
      const intent = parseIntent(text);
      const command = isActionIntent(intent);
      if (!command && Date.now() < ignoreEchoUntil.current) return;
      if (!command && looksLikeEcho(text, spoken)) return;
      if (
        wantPlay.current &&
        statusRef.current === "speaking" &&
        (intent.type === "clarify" || intent.type === "fallbackNote")
      ) {
        return;
      }
      setLastHeard(text);
      setLiveTranscript("");
      setStatus("thinking");
      if (intent.type === "pause" || intent.type === "resume") {
        applyIntent(intent, text);
        return;
      }
      if (intent.type === "stop" || intent.type === "visual") {
        wantPlay.current = false;
      }
      cancelSpeak();
      applyIntent(intent, text);
    },
    [applyIntent],
  );
  const handleRef = useRef(handleTranscript);
  handleRef.current = handleTranscript;

  const requestMic = useCallback(async () => {
    await unlockSpeech();
    if (!sttAvailable()) {
      setMicPermission("unsupported");
      setMicError(
        "This browser cannot transcribe speech (try Chrome). You can still type commands.",
      );
      return false;
    }
    const result = await requestMicAccess();
    setMicPermission(result.permission);
    setMicError(result.error ?? null);
    if (result.ok) setMicMuted(false);
    return result.ok;
  }, []);

  useEffect(() => {
    let cancelled = false;
    queryMicPermission().then((p) => {
      if (!cancelled) setMicPermission(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const speakCurrentRef = useRef(speakCurrent);
  speakCurrentRef.current = speakCurrent;

  useEffect(() => {
    if (!enabled) {
      wantPlay.current = false;
      cancelSpeak();
      recRef.current?.abort();
      recRef.current = null;
      setStatus("idle");
      setLiveTranscript("");
      return;
    }
    wantPlay.current = true;
    speakCurrentRef.current();
    return () => {
      wantPlay.current = false;
      cancelSpeak();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || micMuted || !sttAvailable() || micPermission === "denied") {
      if (enabled && !sttAvailable()) {
        setMicError(
          "Voice commands unavailable in this browser — type instead.",
        );
      }
      return;
    }

    const rec = createRecognizer({
      onResult: (transcript, isFinal) => {
        const spoken = unitsRef.current[indexRef.current]?.text ?? "";
        if (!isFinal) {
          setLiveTranscript(transcript);
          if (
            isActionIntent(parseIntent(transcript)) &&
            !looksLikeEcho(transcript, spoken)
          ) {
            bargeInRef.current();
          }
          return;
        }
        setLiveTranscript(transcript);
        handleRef.current(transcript);
      },
      onError: (err) => {
        if (err === "not-allowed") {
          setMicPermission("denied");
          setMicError(
            "Microphone is blocked. Use the lock icon in the address bar → Microphone → Allow.",
          );
        } else {
          setMicError(`Voice input error: ${err}`);
        }
      },
      onEnd: () => {
        if (!rec || !enabledRef.current || micMuted) return;
        try {
          rec.start();
        } catch {
          /* already started */
        }
      },
    });
    if (!rec) {
      setMicError("Voice commands unavailable in this browser — type instead.");
      return;
    }
    recRef.current = rec;
    try {
      rec.start();
      if (micPermission === "granted") setMicError(null);
    } catch {
      setMicError("Could not start listening. Click Allow microphone.");
    }

    return () => {
      rec.abort();
      recRef.current = null;
    };
  }, [enabled, micMuted, micPermission]);

  return {
    status: enabled && status === "idle" && wantPlay.current ? "speaking" : status,
    index,
    total: units.length,
    rate,
    liveTranscript,
    lastHeard,
    lastAction,
    activeUnitId: units[index]?.id ?? null,
    sttOk:
      sttAvailable() &&
      micPermission === "granted" &&
      !micError?.toLowerCase().includes("blocked") &&
      !micError?.toLowerCase().includes("denied"),
    ttsOk: ttsAvailable(),
    micMuted,
    micError,
    micPermission,
    requestMic,
    play,
    pause,
    togglePlay: () => (wantPlay.current ? pause() : play()),
    setMicMuted: (muted) => {
      setMicMuted(muted);
      if (muted) recRef.current?.abort();
    },
    handleTranscript,
  };
}

