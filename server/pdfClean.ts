import type { Paper } from "../src/types.js";

const OLLAMA_HOST = (process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434").replace(
  /\/$/,
  "",
);
const PREFERRED_MODEL = process.env.OLLAMA_MODEL?.trim() || "phi3:mini";
const CHUNK_CHARS = 5000;
const MAX_CHUNKS = 8;

export type OllamaGenerate = (model: string, prompt: string) => Promise<string>;

export function markdownToSections(markdown: string): Paper["sections"] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: Paper["sections"] = [];
  let heading = "Paper";
  let buf: string[] = [];

  function flush() {
    const paragraphs = buf
      .join("\n")
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter((p) => p.length > 30);
    if (paragraphs.length) sections.push({ heading, paragraphs });
    buf = [];
  }

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (match) {
      flush();
      heading = match[1].replace(/^\d+(\.\d+)*\s+/, "").trim() || heading;
      continue;
    }
    buf.push(line);
  }
  flush();
  return sections;
}

function chunkPdfDump(raw: string): string[] {
  const text = raw.replace(/\s+\n/g, "\n").trim();
  if (!text) return [];
  const parts: string[] = [];
  let rest = text;
  while (rest.length && parts.length < MAX_CHUNKS) {
    if (rest.length <= CHUNK_CHARS) {
      parts.push(rest);
      break;
    }
    let cut = rest.lastIndexOf("\n\n", CHUNK_CHARS);
    if (cut < CHUNK_CHARS * 0.4) cut = rest.lastIndexOf(" ", CHUNK_CHARS);
    if (cut < CHUNK_CHARS * 0.4) cut = CHUNK_CHARS;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return parts;
}

function cleanPrompt(chunk: string, index: number, total: number): string {
  return `You reconstruct a readable academic paper fragment from noisy PDF text extraction.
Part ${index + 1} of ${total}.
Rules:
- Keep the authors' wording. Do not invent claims, citations, or sections.
- Repair hyphenation and broken line wraps.
- Drop page numbers, running headers/footers, and isolated figure codes.
- Use markdown ## headings only when the source clearly starts a section.
- Output markdown only, no preamble.

PDF extract:
${chunk}`;
}

async function defaultOllamaGenerate(model: string, prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      keep_alive: "5m",
      options: { temperature: 0.1, num_predict: 1800 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama generate failed (${res.status})`);
  }
  const data = (await res.json()) as { response?: string };
  return (data.response ?? "").trim();
}

async function resolveLocalModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!res.ok) return null;
    const data = (await res.json()) as { models?: { name?: string }[] };
    const names = (data.models ?? []).map((m) => m.name).filter(Boolean) as string[];
    if (!names.length) return null;
    const preferred = names.find(
      (n) => n === PREFERRED_MODEL || n.startsWith(`${PREFERRED_MODEL}:`) || n.startsWith(PREFERRED_MODEL),
    );
    return preferred ?? names[0] ?? null;
  } catch {
    return null;
  }
}

export async function cleanPdfDump(
  raw: string,
  generate: OllamaGenerate = defaultOllamaGenerate,
  resolveModel: () => Promise<string | null> = resolveLocalModel,
): Promise<string | null> {
  const model = await resolveModel();
  if (!model) return null;
  const chunks = chunkPdfDump(raw);
  if (!chunks.length) return null;
  try {
    const parts: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const out = await generate(model, cleanPrompt(chunks[i], i, chunks.length));
      if (out) parts.push(out);
    }
    const cleaned = parts.join("\n\n").trim();
    return cleaned.length >= 80 ? cleaned : null;
  } catch {
    return null;
  }
}
