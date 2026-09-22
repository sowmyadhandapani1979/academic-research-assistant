import type { Paper } from "../src/types.js";
import { scholarlyPlainText } from "../src/lib/plainText.js";
import { HttpError } from "./types.js";

const S2 = "https://api.semanticscholar.org/graph/v1";
const FIELDS =
  "paperId,title,authors,year,abstract,url,venue,tldr,openAccessPdf,externalIds,fieldsOfStudy";
const MIN_INTERVAL_MS = 1100;
const UNAUTH_INTERVAL_MS = 2500;
const RATE_LIMIT_COOLDOWN_MS = 20_000;

let quietUntil = 0;
const inflight = new Map<string, Promise<{ papers: Paper[]; total: number }>>();

export function s2IsQuiet(): boolean {
  return Date.now() < quietUntil;
}

export function s2ResetQuiet() {
  quietUntil = 0;
}

export function s2NoteRateLimit() {
  quietUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
}

export type S2Client = {
  search: (
    query: string,
    limit: number,
    filters?: { year?: string; fieldsOfStudy?: string },
  ) => Promise<{ papers: Paper[]; total: number }>;
  get: (id: string) => Promise<Paper | null>;
};

type S2Paper = {
  paperId?: string;
  title?: string;
  authors?: { name?: string }[];
  year?: number;
  abstract?: string | null;
  url?: string;
  venue?: string;
  tldr?: { text?: string } | null;
  openAccessPdf?: { url?: string } | null;
  externalIds?: { ArXiv?: string; DOI?: string; PubMedCentral?: string };
  fieldsOfStudy?: string[];
};

let chain: Promise<unknown> = Promise.resolve();
let lastAt = 0;

function minInterval(): number {
  return process.env.S2_API_KEY?.trim() ? MIN_INTERVAL_MS : UNAUTH_INTERVAL_MS;
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = minInterval() - (Date.now() - lastAt);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastAt = Date.now();
    return fn();
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function headers(): HeadersInit {
  const key = process.env.S2_API_KEY?.trim();
  return key ? { "x-api-key": key } : {};
}

async function s2Get(url: string, attempt = 0): Promise<unknown> {
  const res = await fetch(url, { headers: headers() });
  if (res.status === 429) {
    if (attempt === 0 && process.env.S2_API_KEY?.trim()) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 4000)
          : 1500;
      await new Promise((r) => setTimeout(r, waitMs));
      return s2Get(url, 1);
    }
    s2NoteRateLimit();
    throw new HttpError(429, "rate_limited", "Paper search is rate-limited. Try again shortly.");
  }
  if (res.status === 404) {
    throw new HttpError(404, "not_found", "Paper not found");
  }
  if (!res.ok) {
    throw new HttpError(502, "upstream", `Semantic Scholar returned ${res.status}`);
  }
  return res.json();
}

function s2PdfUrl(raw: S2Paper): string | undefined {
  const direct = raw.openAccessPdf?.url?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  const arxiv = raw.externalIds?.ArXiv?.trim();
  if (arxiv) return `https://arxiv.org/pdf/${arxiv}`;
  const pmc = raw.externalIds?.PubMedCentral?.trim();
  if (pmc) return `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmc.replace(/^PMC/i, "")}/pdf/`;
  return undefined;
}

export function mapS2Paper(raw: S2Paper): Paper | null {
  const id = raw.paperId;
  if (!id || !raw.title) return null;
  const names = (raw.authors ?? []).map((a) => a.name).filter(Boolean) as string[];
  const authorsShort =
    names.length <= 1 ? names[0] ?? "Unknown" : `${names[0]} et al.`;
  const authorsFull = names.length ? names.join(", ") : "Unknown";
  const abstract =
    scholarlyPlainText(raw.abstract ?? "", 12_000) || "No abstract available.";
  const tldr = scholarlyPlainText(raw.tldr?.text ?? "", 400);
  const year = raw.year ?? 0;
  const title = scholarlyPlainText(raw.title, 240);
  if (!title) return null;
  const sections = [
    ...(tldr
      ? [{ heading: "TL;DR", paragraphs: [tldr] }]
      : []),
    { heading: "1. Overview", paragraphs: [abstract] },
  ];
  const summary = tldr || abstract.slice(0, 400);
  return {
    id,
    title,
    authorsShort,
    authorsFull,
    year,
    abstract,
    sections,
    related: [],
    summary,
    takeaways: tldr || "See abstract for key claims.",
    readTime: `${Math.max(5, Math.round(abstract.split(/\s+/).length / 200) + 4)} min`,
    url: raw.url || `https://www.semanticscholar.org/paper/${id}`,
    pdfUrl: s2PdfUrl(raw),
    doi: raw.externalIds?.DOI?.trim() || undefined,
    source: raw.venue || "Semantic Scholar",
    fieldsOfStudy: raw.fieldsOfStudy,
  };
}

export function createS2(): S2Client {
  return {
    async search(query, limit, filters) {
      const key = `search:${query.toLowerCase()}:${limit}:${filters?.year ?? ""}:${filters?.fieldsOfStudy ?? ""}`;
      const existing = inflight.get(key);
      if (existing) return existing;
      const work = enqueue(async () => {
        const url = new URL(`${S2}/paper/search`);
        url.searchParams.set("query", query);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("fields", FIELDS);
        if (filters?.year) url.searchParams.set("year", filters.year);
        if (filters?.fieldsOfStudy) {
          url.searchParams.set("fieldsOfStudy", filters.fieldsOfStudy);
        }
        const data = (await s2Get(url.toString())) as {
          total?: number;
          data?: S2Paper[];
        };
        const papers = (data.data ?? [])
          .map(mapS2Paper)
          .filter((p): p is Paper => Boolean(p));
        return { papers, total: data.total ?? papers.length };
      }).finally(() => inflight.delete(key));
      inflight.set(key, work);
      return work;
    },
    async get(id) {
      return enqueue(async () => {
        try {
          const url = new URL(`${S2}/paper/${encodeURIComponent(id)}`);
          url.searchParams.set("fields", FIELDS);
          const raw = (await s2Get(url.toString())) as S2Paper;
          return mapS2Paper(raw);
        } catch (err) {
          if (err instanceof HttpError && err.status === 404) return null;
          throw err;
        }
      });
    },
  };
}
