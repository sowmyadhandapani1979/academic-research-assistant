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
    source?: { display_name?: string | null } | null;
  } | null;
};

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
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "academic-research-assistant/0.1 (mailto:research@localhost)",
    },
  });
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
