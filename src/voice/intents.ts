export type VoiceIntent =
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "skip"; by: "sentence" | "section"; dir: 1 | -1 }
  | { type: "repeat" }
  | { type: "rate"; value?: number; delta?: number }
  | { type: "jump"; target: "start" | "abstract" | "introduction" | string }
  | { type: "note"; content: string }
  | { type: "markRead"; isRead: boolean }
  | { type: "visual" }
  | { type: "help" }
  | { type: "clarify" }
  | { type: "fallbackNote"; content: string };

const NOTE_PREFIX =
  /^(take a note|take note|make a note|note that|remember that|remember|jot down|note)[:\s,-]+(.+)$/i;

export function parseIntent(raw: string): VoiceIntent {
  const text = raw.trim().replace(/[.?!'"]+$/g, "");
  const lower = text.toLowerCase().replace(/\s+/g, " ");
  if (!lower) return { type: "clarify" };

  const note = text.match(NOTE_PREFIX);
  if (note?.[2]) return { type: "note", content: note[2].trim() };
  if (/^(take a note|take note|make a note|remember)$/i.test(lower)) {
    return { type: "clarify" };
  }

  if (/^(pause|hold|hold on|hold it|wait|stop reading)$/.test(lower)) {
    return { type: "pause" };
  }
  if (/^(resume|continue|keep going|go on|play|unpause)$/.test(lower)) {
    return { type: "resume" };
  }
  if (/^(stop|end listen|stop listening)$/.test(lower)) return { type: "stop" };
  if (/^(repeat|again|say that again|what was that)$/.test(lower)) {
    return { type: "repeat" };
  }

  if (/^(skip|skip ahead|next paragraph|next sentence|skip forward|next)$/.test(lower) ||
      (/(skip ahead|next paragraph|next sentence|skip forward|\bnext\b)/.test(lower) && !/section/.test(lower))) {
    return { type: "skip", by: "sentence", dir: 1 };
  }
  if (/(go back|previous|skip back|last paragraph)/.test(lower) && !/section/.test(lower)) {
    return { type: "skip", by: "sentence", dir: -1 };
  }
  if (/next section/.test(lower)) return { type: "skip", by: "section", dir: 1 };
  if (/previous section|last section/.test(lower)) {
    return { type: "skip", by: "section", dir: -1 };
  }

  if (/slow(er)?|decrease speed/.test(lower)) return { type: "rate", delta: -0.25 };
  if (/faster|speed up|increase speed/.test(lower)) return { type: "rate", delta: 0.25 };
  if (/normal speed|one times|1 x/.test(lower)) return { type: "rate", value: 1 };

  if (/start over|from the beginning|beginning/.test(lower)) {
    return { type: "jump", target: "start" };
  }
  if (/\babstract\b/.test(lower)) return { type: "jump", target: "abstract" };
  if (/introduction/.test(lower)) return { type: "jump", target: "introduction" };
  const jump = lower.match(/jump to (.+)|go to (?:the )?(.+)/);
  if (jump) return { type: "jump", target: (jump[1] ?? jump[2]).trim() };

  if (/mark as unread|not read/.test(lower)) return { type: "markRead", isRead: false };
  if (/mark as read|i('m| am) done|finished reading/.test(lower)) {
    return { type: "markRead", isRead: true };
  }

  if (/visual|switch to (visual|reading)|read on screen/.test(lower)) {
    return { type: "visual" };
  }
  if (/^(help|what can i say|commands)$/.test(lower)) return { type: "help" };

  const words = lower.split(" ");
  if (words.length <= 2) return { type: "clarify" };
  return { type: "fallbackNote", content: text };
}

export function isActionIntent(intent: VoiceIntent) {
  return intent.type !== "fallbackNote" && intent.type !== "clarify";
}

export function looksLikeEcho(transcript: string, spoken: string) {
  const a = new Set(transcript.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const b = new Set(spoken.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (a.size === 0) return false;
  let hit = 0;
  for (const w of a) if (b.has(w)) hit += 1;
  return hit / a.size >= 0.6;
}

export const HELP_TEXT =
  "You can say pause or hold, resume, skip, go back, next section, repeat, slower, faster, jump to abstract or introduction, take a note followed by your thought, mark as read, or switch to visual.";
