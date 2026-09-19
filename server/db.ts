import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_RECENTS,
  paperById,
  papers as seedPapers,
} from "../src/data/fixtures.ts";
import type { LibraryEntry, Note, NoteKind, NoteSource, Paper, ReadingStatus } from "../src/types.ts";
import { cleanPaper } from "../src/lib/plainText.ts";
import {
  nextReadingStatus,
  normalizeReadingStatus,
} from "../src/lib/readingStatus.ts";
import {
  matchesDiscipline,
  matchesYear,
  parseDiscipline,
  resolveYearRange,
} from "../src/lib/searchFilters.ts";

const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors_short TEXT,
  authors_full TEXT,
  year INTEGER,
  abstract TEXT,
  url TEXT,
  source TEXT,
  tldr TEXT,
  sections_json TEXT,
  related_json TEXT,
  summary TEXT,
  takeaways TEXT,
  tags_palette_json TEXT,
  read_time TEXT,
  fetched_at INTEGER
);
CREATE TABLE IF NOT EXISTS search_cache (
  query TEXT PRIMARY KEY,
  paper_ids_json TEXT,
  total INTEGER,
  fetched_at INTEGER
);
CREATE TABLE IF NOT EXISTS search_history (
  query TEXT PRIMARY KEY,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS marked_papers (
  paper_id TEXT PRIMARY KEY,
  tags_json TEXT,
  is_read INTEGER,
  flagged INTEGER,
  marked_at INTEGER,
  read_at INTEGER,
  reading_status TEXT
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  paper_id TEXT,
  content TEXT,
  created_at INTEGER,
  audio_timestamp REAL,
  source TEXT,
  transcript TEXT,
  type TEXT
);
`;

type PaperRow = {
  id: string;
  title: string;
  authors_short: string;
  authors_full: string;
  year: number;
  abstract: string;
  url: string | null;
  source: string | null;
  tldr: string | null;
  sections_json: string;
  related_json: string;
  summary: string;
  takeaways: string;
  tags_palette_json: string | null;
  read_time: string;
  fetched_at: number;
};

export function rowToPaper(row: PaperRow): Paper {
  let sections: Paper["sections"] = [];
  let related: Paper["related"] = [];
  let tagsPalette: Paper["tagsPalette"];
  try {
    sections = JSON.parse(row.sections_json);
  } catch {
    sections = [];
  }
  try {
    related = JSON.parse(row.related_json);
  } catch {
    related = [];
  }
  try {
    tagsPalette = row.tags_palette_json
      ? JSON.parse(row.tags_palette_json)
      : undefined;
  } catch {
    tagsPalette = undefined;
  }
  return cleanPaper({
    id: row.id,
    title: row.title,
    authorsShort: row.authors_short,
    authorsFull: row.authors_full,
    year: row.year,
    abstract: row.abstract,
    sections,
    related,
    summary: row.summary,
    takeaways: row.takeaways,
    tagsPalette,
    readTime: row.read_time,
    url: row.url ?? paperById(row.id)?.url,
    source: row.source ?? undefined,
    fieldsOfStudy: paperById(row.id)?.fieldsOfStudy,
  });
}

export function upsertPaper(db: Database.Database, paper: Paper) {
  db.prepare(
    `INSERT INTO papers (
      id, title, authors_short, authors_full, year, abstract, url, source, tldr,
      sections_json, related_json, summary, takeaways, tags_palette_json, read_time, fetched_at
    ) VALUES (
      @id, @title, @authors_short, @authors_full, @year, @abstract, @url, @source, @tldr,
      @sections_json, @related_json, @summary, @takeaways, @tags_palette_json, @read_time, @fetched_at
    )
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      authors_short=excluded.authors_short,
      authors_full=excluded.authors_full,
      year=excluded.year,
      abstract=excluded.abstract,
      url=excluded.url,
      source=excluded.source,
      sections_json=excluded.sections_json,
      related_json=excluded.related_json,
      summary=excluded.summary,
      takeaways=excluded.takeaways,
      tags_palette_json=excluded.tags_palette_json,
      read_time=excluded.read_time,
      fetched_at=excluded.fetched_at`,
  ).run({
    id: paper.id,
    title: paper.title,
    authors_short: paper.authorsShort,
    authors_full: paper.authorsFull,
    year: paper.year,
    abstract: paper.abstract,
    url: paper.url ?? null,
    source: paper.source ?? "Semantic Scholar",
    tldr: paper.takeaways,
    sections_json: JSON.stringify(paper.sections),
    related_json: JSON.stringify(paper.related),
    summary: paper.summary,
    takeaways: paper.takeaways,
    tags_palette_json: paper.tagsPalette ? JSON.stringify(paper.tagsPalette) : null,
    read_time: paper.readTime,
    fetched_at: Date.now(),
  });
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM papers").get() as { n: number };
  if (count.n > 0) return;
  const now = Date.now();
  for (const paper of seedPapers) upsertPaper(db, paper);
  for (const q of DEFAULT_RECENTS) {
    db.prepare(
      "INSERT INTO search_history (query, created_at) VALUES (?, ?)",
    ).run(q, now);
  }
  const marked: [string, string[], number, number, number, string][] = [
    ["attention", ["deep-learning", "nlp", "transformers"], 0, 1, now - 3600_000, "in_progress"],
    ["bert", ["language-models", "nlp"], 1, 0, now - 7200_000, "read"],
    ["gpt2", ["generative-models"], 0, 1, now - 1800_000, "yet_to_start"],
  ];
  for (const [id, tags, isRead, flagged, markedAt, readingStatus] of marked) {
    db.prepare(
      `INSERT INTO marked_papers (paper_id, tags_json, is_read, flagged, marked_at, read_at, reading_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      JSON.stringify(tags),
      isRead,
      flagged,
      markedAt,
      isRead ? markedAt : null,
      readingStatus,
    );
  }
  const notes: [string, string, string, number][] = [
    [
      "n1",
      "attention",
      "Core concept: Self-attention allows models to focus on relevant parts of input simultaneously",
      now - 120_000,
    ],
    [
      "n2",
      "attention",
      "Key advantage: Parallel processing unlike RNNs - enables faster training",
      now - 60_000,
    ],
    [
      "n3",
      "attention",
      "Multi-head attention enables model to capture different types of dependencies - syntax, semantics, etc.",
      now - 30_000,
    ],
  ];
  for (const [id, paperId, content, createdAt] of notes) {
    db.prepare(
      `INSERT INTO notes (id, paper_id, content, created_at, source, type)
       VALUES (?, ?, ?, ?, 'typed', 'user_note')`,
    ).run(id, paperId, content, createdAt);
  }
}

export function createDb(path: string) {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  migrateMarked(db);
  seedIfEmpty(db);
  return db;
}

function migrateMarked(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(marked_papers)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "reading_status")) {
    db.exec("ALTER TABLE marked_papers ADD COLUMN reading_status TEXT");
  }
  db.exec(`
    UPDATE marked_papers
    SET reading_status = CASE
      WHEN is_read = 1 THEN 'read'
      ELSE 'yet_to_start'
    END
    WHERE reading_status IS NULL OR reading_status = ''
  `);
}

export function getPaper(db: Database.Database, id: string): Paper | undefined {
  const row = db.prepare("SELECT * FROM papers WHERE id = ?").get(id) as
    | PaperRow
    | undefined;
  return row ? rowToPaper(row) : undefined;
}

export function searchLocal(
  db: Database.Database,
  query: string,
  opts?: { discipline?: string; period?: string; from?: string; to?: string },
): Paper[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/);
  const discipline = parseDiscipline(opts?.discipline);
  const range = resolveYearRange(opts);
  const rows = db.prepare("SELECT * FROM papers").all() as PaperRow[];
  return rows
    .map(rowToPaper)
    .filter((p) => {
      const hay =
        `${p.title} ${p.authorsShort} ${p.abstract} transformers machine learning language models`.toLowerCase();
      if (!tokens.some((token) => hay.includes(token))) return false;
      if (!matchesYear(p.year, range)) return false;
      if (!matchesDiscipline(p, discipline)) return false;
      return true;
    });
}

export function getCachedSearch(
  db: Database.Database,
  query: string,
): { papers: Paper[]; total: number } | null {
  const key = query.trim().toLowerCase();
  const row = db
    .prepare("SELECT * FROM search_cache WHERE query = ?")
    .get(key) as
    | { paper_ids_json: string; total: number; fetched_at: number }
    | undefined;
  if (!row || Date.now() - row.fetched_at > SEARCH_TTL_MS) return null;
  const ids = JSON.parse(row.paper_ids_json) as string[];
  const papers = ids
    .map((id) => getPaper(db, id))
    .filter((p): p is Paper => Boolean(p));
  return { papers, total: row.total };
}

export function setCachedSearch(
  db: Database.Database,
  query: string,
  papers: Paper[],
  total: number,
) {
  const key = query.trim().toLowerCase();
  for (const paper of papers) upsertPaper(db, paper);
  db.prepare(
    `INSERT INTO search_cache (query, paper_ids_json, total, fetched_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(query) DO UPDATE SET
       paper_ids_json=excluded.paper_ids_json,
       total=excluded.total,
       fetched_at=excluded.fetched_at`,
  ).run(key, JSON.stringify(papers.map((p) => p.id)), total, Date.now());
}

export function listHistory(db: Database.Database): string[] {
  const rows = db
    .prepare(
      "SELECT query FROM search_history ORDER BY created_at DESC LIMIT 8",
    )
    .all() as { query: string }[];
  return rows.map((r) => r.query);
}

export function rememberQuery(db: Database.Database, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  db.prepare(
    `INSERT INTO search_history (query, created_at) VALUES (?, ?)
     ON CONFLICT(query) DO UPDATE SET created_at=excluded.created_at`,
  ).run(trimmed, Date.now());
}

function entryFromRow(row: {
  paper_id: string;
  tags_json: string;
  is_read: number;
  flagged: number;
  marked_at: number;
  reading_status?: string | null;
}): LibraryEntry {
  const readingStatus = normalizeReadingStatus({
    isRead: Boolean(row.is_read),
    readingStatus: row.reading_status,
  });
  return {
    paperId: row.paper_id,
    tags: JSON.parse(row.tags_json),
    isRead: readingStatus === "read",
    flagged: Boolean(row.flagged),
    markedAt: row.marked_at,
    readingStatus,
  };
}

export function listNotes(db: Database.Database, paperId: string): Note[] {
  const rows = db
    .prepare(
      "SELECT * FROM notes WHERE paper_id = ? ORDER BY created_at DESC",
    )
    .all(paperId) as {
    id: string;
    paper_id: string;
    content: string;
    created_at: number;
    audio_timestamp: number | null;
    source: string | null;
    transcript: string | null;
    type: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    paperId: r.paper_id,
    content: r.content,
    createdAt: r.created_at,
    audioTimestamp: r.audio_timestamp ?? undefined,
    source: (r.source as NoteSource) ?? undefined,
    transcript: r.transcript ?? undefined,
    type: (r.type as NoteKind) ?? undefined,
  }));
}

export function listMarked(
  db: Database.Database,
  opts: { tags?: string; search?: string; readStatus?: string },
) {
  const rows = db
    .prepare("SELECT * FROM marked_papers ORDER BY marked_at DESC")
    .all() as {
    paper_id: string;
    tags_json: string;
    is_read: number;
    flagged: number;
    marked_at: number;
    read_at: number | null;
    reading_status?: string | null;
  }[];
  const wantedTags = opts.tags
    ? opts.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const q = opts.search?.trim().toLowerCase() ?? "";
  const status = opts.readStatus ?? "all";

  return rows
    .map((row) => {
      const entry = entryFromRow(row);
      const paper = getPaper(db, entry.paperId);
      if (!paper) return null;
      if (wantedTags.length && !wantedTags.every((t) => entry.tags.includes(t))) {
        return null;
      }
      if (status === "unread" && entry.isRead) return null;
      if (status === "read" && entry.readingStatus !== "read") return null;
      if (status === "in_progress" && entry.readingStatus !== "in_progress") return null;
      if (status === "yet_to_start" && entry.readingStatus !== "yet_to_start") return null;
      if (q) {
        const hay = `${paper.title} ${paper.authorsShort} ${entry.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return null;
      }
      return {
        ...entry,
        paper,
        notes: listNotes(db, entry.paperId),
      };
    })
    .filter(Boolean);
}

export function upsertMarked(
  db: Database.Database,
  paperId: string,
  patch: {
    tags?: string[];
    isRead?: boolean;
    flagged?: boolean;
    readingStatus?: ReadingStatus;
    starting?: boolean;
  },
): LibraryEntry {
  const existing = db
    .prepare("SELECT * FROM marked_papers WHERE paper_id = ?")
    .get(paperId) as
    | {
        paper_id: string;
        tags_json: string;
        is_read: number;
        flagged: number;
        marked_at: number;
        reading_status?: string | null;
      }
    | undefined;
  const current = existing
    ? normalizeReadingStatus({
        isRead: Boolean(existing.is_read),
        readingStatus: existing.reading_status,
      })
    : undefined;
  const readingStatus = nextReadingStatus({
    current,
    readingStatus: patch.readingStatus,
    isRead: patch.isRead,
    starting: patch.starting,
  });
  if (!existing) {
    const entry: LibraryEntry = {
      paperId,
      tags: patch.tags ?? [],
      isRead: readingStatus === "read",
      flagged: patch.flagged ?? true,
      markedAt: Date.now(),
      readingStatus,
    };
    db.prepare(
      `INSERT INTO marked_papers (paper_id, tags_json, is_read, flagged, marked_at, read_at, reading_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      paperId,
      JSON.stringify(entry.tags),
      entry.isRead ? 1 : 0,
      entry.flagged ? 1 : 0,
      entry.markedAt,
      entry.isRead ? Date.now() : null,
      entry.readingStatus,
    );
    return entry;
  }
  let tags = JSON.parse(existing.tags_json) as string[];
  if (patch.tags) {
    const extra = patch.tags.filter((t) => !tags.includes(t));
    tags = [...tags, ...extra];
  }
  const isRead = readingStatus === "read";
  const flagged = patch.flagged ?? Boolean(existing.flagged);
  if (
    existing &&
    patch.flagged === false &&
    tags.length === 0 &&
    !isRead
  ) {
    db.prepare("DELETE FROM marked_papers WHERE paper_id = ?").run(paperId);
    return {
      paperId,
      tags: [],
      isRead: false,
      flagged: false,
      markedAt: existing.marked_at,
      readingStatus: "yet_to_start",
    };
  }
  db.prepare(
    `UPDATE marked_papers SET tags_json=?, is_read=?, flagged=?, read_at=?, reading_status=? WHERE paper_id=?`,
  ).run(
    JSON.stringify(tags),
    isRead ? 1 : 0,
    flagged ? 1 : 0,
    isRead ? Date.now() : null,
    readingStatus,
    paperId,
  );
  return {
    paperId,
    tags,
    isRead,
    flagged,
    markedAt: existing.marked_at,
    readingStatus,
  };
}

export function addTag(db: Database.Database, paperId: string, tag: string) {
  const clean = tag.trim().toLowerCase().replace(/\s+/g, "-");
  if (!clean) return upsertMarked(db, paperId, {});
  const existing = db
    .prepare("SELECT tags_json FROM marked_papers WHERE paper_id = ?")
    .get(paperId) as { tags_json: string } | undefined;
  const tags = existing ? (JSON.parse(existing.tags_json) as string[]) : [];
  if (!tags.includes(clean)) tags.push(clean);
  return upsertMarked(db, paperId, {
    tags,
    flagged: existing ? undefined : false,
  });
}

export function addNoteRow(
  db: Database.Database,
  paperId: string,
  content: string,
  extra?: {
    source?: NoteSource;
    transcript?: string;
    type?: NoteKind;
    audioTimestamp?: number;
  },
): Note {
  const text = content.trim();
  const note: Note = {
    id: randomUUID(),
    paperId,
    content: text,
    createdAt: Date.now(),
    source: extra?.source ?? "typed",
    transcript: extra?.transcript,
    type: extra?.type ?? "user_note",
    audioTimestamp: extra?.audioTimestamp,
  };
  db.prepare(
    `INSERT INTO notes (id, paper_id, content, created_at, audio_timestamp, source, transcript, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    note.id,
    note.paperId,
    note.content,
    note.createdAt,
    note.audioTimestamp ?? null,
    note.source ?? "typed",
    note.transcript ?? null,
    note.type ?? "user_note",
  );
  upsertMarked(db, paperId, { flagged: true, starting: true });
  return note;
}

export function updateNoteRow(
  db: Database.Database,
  paperId: string,
  noteId: string,
  content: string,
): Note | null {
  const text = content.trim();
  if (!text) return null;
  const row = db
    .prepare("SELECT * FROM notes WHERE id = ? AND paper_id = ?")
    .get(noteId, paperId) as
    | {
        id: string;
        paper_id: string;
        content: string;
        created_at: number;
        audio_timestamp: number | null;
        source: string | null;
        transcript: string | null;
        type: string | null;
      }
    | undefined;
  if (!row) return null;
  db.prepare("UPDATE notes SET content = ? WHERE id = ?").run(text, noteId);
  return {
    id: row.id,
    paperId: row.paper_id,
    content: text,
    createdAt: row.created_at,
    audioTimestamp: row.audio_timestamp ?? undefined,
    source: (row.source as NoteSource) ?? undefined,
    transcript: row.transcript ?? undefined,
    type: (row.type as NoteKind) ?? undefined,
  };
}

export function deleteNoteRow(
  db: Database.Database,
  paperId: string,
  noteId: string,
): boolean {
  const info = db
    .prepare("DELETE FROM notes WHERE id = ? AND paper_id = ?")
    .run(noteId, paperId);
  return info.changes > 0;
}

export function removeMarked(db: Database.Database, paperId: string) {
  db.prepare("DELETE FROM notes WHERE paper_id = ?").run(paperId);
  db.prepare("DELETE FROM marked_papers WHERE paper_id = ?").run(paperId);
}

export function consolidate(
  db: Database.Database,
  by: string,
  filter: string,
): string {
  const marked = listMarked(db, {
    tags: by === "topic" ? filter : undefined,
  });
  const parts: string[] = [];
  for (const row of marked) {
    if (!row) continue;
    if (by === "paper" && filter && row.paperId !== filter) continue;
    parts.push(`# ${row.paper.title}`);
    parts.push(row.paper.authorsFull);
    for (const n of row.notes) parts.push(`- ${n.content}`);
    parts.push("");
  }
  return parts.join("\n").trim();
}
