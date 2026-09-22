import { extractText } from "unpdf";
import type { Paper } from "../src/types.js";
import { scholarlyPlainText } from "../src/lib/plainText.js";
import { paperPdfUrl } from "../src/lib/source.js";
import { cleanPdfDump, markdownToSections } from "./pdfClean.js";

const PDF_CACHE_TTL_MS = 30 * 60 * 1000;
const pdfBytesCache = new Map<string, { bytes: Buffer; at: number }>();

export async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  const hit = pdfBytesCache.get(url);
  if (hit && Date.now() - hit.at < PDF_CACHE_TTL_MS) {
    return Uint8Array.from(hit.bytes);
  }
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "application/pdf,*/*",
      "User-Agent": "academic-research-assistant/0.1 (localhost research assistant)",
    },
  });
  if (!res.ok) {
    throw new Error(`PDF fetch failed (${res.status})`);
  }
  const stored = Buffer.from(await res.arrayBuffer());
  if (stored.length < 100) {
    throw new Error("PDF fetch returned an empty file");
  }
  pdfBytesCache.set(url, { bytes: stored, at: Date.now() });
  return Uint8Array.from(stored);
}

function splitParagraphs(block: string): string[] {
  const sentences = block.split(/(?<=[.?!])\s+(?=[A-Z“"(\[])/);
  const paras: string[] = [];
  let buf = "";
  for (const sentence of sentences) {
    const next = buf ? `${buf} ${sentence}` : sentence;
    if (next.length > 900 && buf) {
      paras.push(buf.trim());
      buf = sentence;
    } else {
      buf = next;
    }
  }
  if (buf.trim()) paras.push(buf.trim());
  return paras.filter((p) => p.length > 40);
}

export function textToSections(raw: string): Paper["sections"] {
  const text = scholarlyPlainText(raw, 400_000);
  if (!text) return [];
  const chunks = text
    .split(/\n{2,}|(?=\b\d+\.\s+[A-Z])/)
    .map((c) => c.trim())
    .filter((c) => c.length > 80);
  if (!chunks.length) {
    const paras = splitParagraphs(text);
    return paras.length ? [{ heading: "Paper", paragraphs: paras }] : [];
  }
  const sections: Paper["sections"] = [];
  for (const chunk of chunks) {
    const firstLine = chunk.split(/(?<=\.)\s/)[0] ?? chunk;
    const heading =
      firstLine.length < 80 && /^(\d+\.|[A-Z][A-Za-z0-9 ,:-]{3,})$/.test(firstLine)
        ? firstLine
        : `Section ${sections.length + 1}`;
    const body = heading === firstLine ? chunk.slice(firstLine.length).trim() : chunk;
    const paragraphs = splitParagraphs(body || chunk);
    if (paragraphs.length) sections.push({ heading, paragraphs });
  }
  return sections;
}

export async function extractPdfSections(bytes: Uint8Array): Promise<Paper["sections"]> {
  const extracted = await extractText(bytes, { mergePages: true });
  const dump = typeof extracted.text === "string" ? extracted.text : extracted.text.join("\n\n");
  const cleaned = await cleanPdfDump(dump);
  const fromModel = cleaned ? markdownToSections(cleaned) : [];
  const modelBody = fromModel.flatMap((s) => s.paragraphs).join(" ");
  if (modelBody.length >= 200) return fromModel;
  return textToSections(dump);
}

function looksLikePdfDump(sections: Paper["sections"]): boolean {
  if (!sections.length) return true;
  const dumpHeads = sections.filter((s) =>
    /^(section\s+\d+|[0-9.]+)$/i.test(s.heading.trim()),
  ).length;
  return dumpHeads >= Math.max(2, Math.ceil(sections.length * 0.5));
}

export async function ingestPaperPdf(paper: Paper): Promise<Paper> {
  const url = paperPdfUrl(paper);
  if (!url) return paper;
  if (paper.pdfIngested && !looksLikePdfDump(paper.sections)) return paper;
  try {
    const bytes = await fetchPdfBytes(url);
    const sections = await extractPdfSections(bytes);
    const body = sections.flatMap((s) => s.paragraphs).join(" ");
    if (body.length < 200) return { ...paper, pdfIngested: true };
    return { ...paper, sections, pdfIngested: true };
  } catch {
    return paper;
  }
}
