import type { Paper } from "../src/types.js";
import { scholarlyPlainText } from "../src/lib/plainText.js";

type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  display_name?: string;
  publication_year?: number;
  authorships?: { author?: { display_name?: string } }[];
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  best_oa_location?: { pdf_url?: string | null; landing_page_url?: string | null } | null;
  open_access?: { oa_url?: string | null } | null;
  locations?: { pdf_url?: string | null; landing_page_url?: string | null }[] | null;
};

const OA_HEADERS = {
  Accept: "application/json",
  "User-Agent": "academic-research-assistant/0.1 (mailto:research@localhost)",
};

function looksLikePdfUrl(value?: string | null): string | undefined {
  const url = value?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  if (/\.pdf(?:$|[?#])/i.test(url) || /\/pdf(?:\/|$|\?)/i.test(url)) return url;
  return undefined;
}

export function pdfUrlFromWork(raw: OpenAlexWork): string | undefined {
  const candidates = [
    raw.best_oa_location?.pdf_url,
    raw.primary_location?.pdf_url,
    raw.open_access?.oa_url,
    ...(raw.locations ?? []).map((loc) => loc.pdf_url),
  ];
  for (const candidate of candidates) {
    const pdf = looksLikePdfUrl(candidate);
    if (pdf) return pdf;
  }
  return undefined;
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchJson(url: string): Promise<unknown | null> {
  const res = await fetch(url, { headers: OA_HEADERS });
  if (!res.ok) return null;
  return res.json();
}

async function unpaywallPdf(doi: string): Promise<string | undefined> {
  const clean = doi.replace(/^https?:\/\/doi.org\//i, "");
  const data = (await fetchJson(
    `https://api.unpaywall.org/v2/${encodeURIComponent(clean)}?email=research@localhost`,
  )) as { best_oa_location?: { url_for_pdf?: string | null } | null } | null;
  return looksLikePdfUrl(data?.best_oa_location?.url_for_pdf);
}

export async function findOpenAccessPdf(paper: {
  title: string;
  year?: number;
  doi?: string;
}): Promise<string | undefined> {
  try {
    const doi = paper.doi?.replace(/^https?:\/\/doi.org\//i, "").trim();
    if (doi) {
      const byDoi = (await fetchJson(
        `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`,
      )) as OpenAlexWork | null;
      const fromWork = byDoi ? pdfUrlFromWork(byDoi) : undefined;
      if (fromWork) return fromWork;
      const fromUnpaywall = await unpaywallPdf(doi);
      if (fromUnpaywall) return fromUnpaywall;
    }
    const url = new URL("https://api.openalex.org/works");
    const filters = [`title.search:${paper.title}`];
    if (paper.year && paper.year > 1000) filters.push(`publication_year:${paper.year}`);
    url.searchParams.set("filter", filters.join(","));
    url.searchParams.set("per-page", "5");
    const data = (await fetchJson(url.toString())) as { results?: OpenAlexWork[] } | null;
    const want = normalizeTitle(paper.title);
    const match = (data?.results ?? []).find((work) => {
      const name = normalizeTitle(work.display_name ?? "");
      return name === want || name.includes(want) || want.includes(name);
    });
    return match ? pdfUrlFromWork(match) : undefined;
  } catch {
    return undefined;
  }
}

function reconstructAbstract(index?: Record<string, number[]> | null): string {
  if (!index) return "";
  const placed: { i: number; w: string }[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const i of positions) placed.push({ i, w: word });
  }
  placed.sort((a, b) => a.i - b.i);
  return placed.map((p) => p.w).join(" ");
}

function mapWork(raw: OpenAlexWork): Paper | null {
  const id = String(raw.id ?? "")
    .replace("https://openalex.org/", "")
    .trim();
  const title = scholarlyPlainText(raw.display_name ?? "", 240);
  if (!id || !title) return null;
  const names = (raw.authorships ?? [])
    .map((a) => a.author?.display_name)
    .filter(Boolean) as string[];
  const authorsShort =
    names.length <= 1 ? names[0] ?? "Unknown" : `${names[0]} et al.`;
  const authorsFull = names.length ? names.join(", ") : "Unknown";
  const abstract =
    scholarlyPlainText(reconstructAbstract(raw.abstract_inverted_index), 1200) ||
    "No abstract available.";
  const year = raw.publication_year ?? 0;
  const url =
    raw.primary_location?.landing_page_url ||
    (raw.doi ? `https://doi.org/${raw.doi.replace(/^https?:\/\/doi.org\//, "")}` : "") ||
    `https://openalex.org/${id}`;
  const pdfUrl = pdfUrlFromWork(raw);
  return {
    id,
    title,
    authorsShort,
    authorsFull,
    year,
    abstract,
    sections: [{ heading: "1. Overview", paragraphs: [abstract] }],
    related: [],
    summary: abstract.slice(0, 400),
    takeaways: "See abstract for key claims.",
    readTime: `${Math.max(5, Math.round(abstract.split(/\s+/).length / 200) + 4)} min`,
    url,
    pdfUrl,
    source: raw.primary_location?.source?.display_name || "OpenAlex",
  };
}

export async function searchOpenAlex(
  query: string,
  limit: number,
  filters?: { year?: string; fieldsOfStudy?: string },
): Promise<{ papers: Paper[]; total: number }> {
  const url = new URL("https://api.openalex.org/works");
  const search = filters?.fieldsOfStudy
    ? `${query} ${filters.fieldsOfStudy}`
    : query;
  url.searchParams.set("search", search);
  url.searchParams.set("per-page", String(Math.min(limit, 25)));
  const yearFilters: string[] = [];
  const year = filters?.year ?? "";
  if (/^\d+-\d+$/.test(year)) {
    const [from, to] = year.split("-");
    yearFilters.push(`from_publication_year:${from}`, `to_publication_year:${to}`);
  } else if (/^\d+-$/.test(year)) {
    yearFilters.push(`from_publication_year:${year.slice(0, -1)}`);
  } else if (/^-\d+$/.test(year)) {
    yearFilters.push(`to_publication_year:${year.slice(1)}`);
  }
  if (yearFilters.length) url.searchParams.set("filter", yearFilters.join(","));
  const res = await fetch(url, { headers: OA_HEADERS });
  if (!res.ok) {
    throw new Error(`OpenAlex returned ${res.status}`);
  }
  const data = (await res.json()) as {
    results?: OpenAlexWork[];
    meta?: { count?: number };
  };
  const papers = (data.results ?? [])
    .map(mapWork)
    .filter((p): p is Paper => Boolean(p));
  return { papers, total: data.meta?.count ?? papers.length };
}
