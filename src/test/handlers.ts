import { http, HttpResponse } from "msw";
import { DEFAULT_RECENTS, papers, searchPapers } from "../data/fixtures";
import type { LibraryEntry, Note, Paper, ReadingStatus } from "../types";
import {
  nextReadingStatus,
  normalizeReadingStatus,
} from "../lib/readingStatus";

type Store = {
  recents: string[];
  library: LibraryEntry[];
  notes: Note[];
  catalog: Paper[];
};

type MarkedBody = {
  flagged?: boolean;
  tags?: string[];
  tag?: string;
  isRead?: boolean;
  readingStatus?: ReadingStatus;
  starting?: boolean;
};

function withStatus(
  entry: Omit<LibraryEntry, "isRead" | "readingStatus"> & {
    isRead?: boolean;
    readingStatus?: string | null;
  },
): LibraryEntry {
  const readingStatus = normalizeReadingStatus(entry);
  return {
    paperId: entry.paperId,
    tags: entry.tags,
    flagged: entry.flagged,
    markedAt: entry.markedAt,
    readingStatus,
    isRead: readingStatus === "read",
  };
}

function applyMarkedPatch(entry: LibraryEntry, body: MarkedBody): LibraryEntry {
  const readingStatus = nextReadingStatus({
    current: entry.readingStatus,
    readingStatus: body.readingStatus,
    isRead: body.isRead,
    starting: body.starting,
  });
  let tags = body.tags ? [...new Set([...entry.tags, ...body.tags])] : entry.tags;
  if (body.tag) {
    const clean = body.tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (clean && !tags.includes(clean)) tags = [...tags, clean];
  }
  return withStatus({
    ...entry,
    tags,
    flagged: body.flagged ?? entry.flagged,
    readingStatus,
  });
}

function seedStore(): Store {
  const now = Date.now();
  return {
    recents: [...DEFAULT_RECENTS],
    catalog: papers.map((p) => ({ ...p })),
    library: [
      withStatus({
        paperId: "attention",
        tags: ["deep-learning", "nlp", "transformers"],
        flagged: true,
        markedAt: now - 3600_000,
        readingStatus: "in_progress",
      }),
      withStatus({
        paperId: "bert",
        tags: ["language-models", "nlp"],
        flagged: false,
        markedAt: now - 7200_000,
        readingStatus: "read",
      }),
      withStatus({
        paperId: "gpt2",
        tags: ["generative-models"],
        flagged: true,
        markedAt: now - 1800_000,
        readingStatus: "yet_to_start",
      }),
    ],
    notes: [
      {
        id: "n1",
        paperId: "attention",
        content:
          "Core concept: Self-attention allows models to focus on relevant parts of input simultaneously",
        createdAt: now - 120_000,
      },
      {
        id: "n2",
        paperId: "attention",
        content:
          "Key advantage: Parallel processing unlike RNNs - enables faster training",
        createdAt: now - 60_000,
      },
      {
        id: "n3",
        paperId: "attention",
        content:
          "Multi-head attention enables model to capture different types of dependencies - syntax, semantics, etc.",
        createdAt: now - 30_000,
      },
    ],
  };
}

export const mockApi = seedStore();

export function resetMockApi() {
  const next = seedStore();
  mockApi.recents = next.recents;
  mockApi.library = next.library;
  mockApi.notes = next.notes;
  mockApi.catalog = next.catalog;
}

function paper(id: string) {
  return mockApi.catalog.find((p) => p.id === id);
}

function markedDto(e: LibraryEntry) {
  return {
    ...e,
    paper: paper(e.paperId),
    notes: mockApi.notes.filter((n) => n.paperId === e.paperId),
  };
}

export const apiHandlers = [
  http.get("/api/papers/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const found = searchPapers(query, {
      discipline: url.searchParams.get("discipline") ?? undefined,
      period: url.searchParams.get("period") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });
    return HttpResponse.json({ papers: found, total: found.length });
  }),
  http.get("/api/papers/:id", ({ params }) => {
    const found = paper(String(params.id));
    if (!found) {
      return HttpResponse.json(
        { error: "Paper not found", code: "not_found" },
        { status: 404 },
      );
    }
    return HttpResponse.json(found);
  }),
  http.get("/api/search-history", () =>
    HttpResponse.json({ queries: mockApi.recents }),
  ),
  http.post("/api/search-history", async ({ request }) => {
    const body = (await request.json()) as { query?: string };
    const q = body.query?.trim();
    if (q) {
      mockApi.recents = [
        q,
        ...mockApi.recents.filter((r) => r.toLowerCase() !== q.toLowerCase()),
      ].slice(0, 8);
    }
    return HttpResponse.json({ queries: mockApi.recents });
  }),
  http.get("/api/marked-papers", () =>
    HttpResponse.json({
      markedPapers: mockApi.library.map(markedDto),
      total: mockApi.library.length,
    }),
  ),
  http.post("/api/marked-papers", async ({ request }) => {
    const body = (await request.json()) as MarkedBody & { paperId: string };
    let entry = mockApi.library.find((e) => e.paperId === body.paperId);
    if (!entry) {
      entry = applyMarkedPatch(
        withStatus({
          paperId: body.paperId,
          tags: body.tags ?? [],
          flagged: body.flagged ?? true,
          markedAt: Date.now(),
          readingStatus: "yet_to_start",
        }),
        body,
      );
      mockApi.library.push(entry);
    } else {
      entry = applyMarkedPatch(entry, body);
      mockApi.library = mockApi.library.map((e) =>
        e.paperId === body.paperId ? entry! : e,
      );
    }
    return HttpResponse.json(markedDto(entry), { status: 201 });
  }),
  http.patch("/api/marked-papers/:id", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as MarkedBody;
    let entry = mockApi.library.find((e) => e.paperId === id);
    if (!entry) {
      entry = applyMarkedPatch(
        withStatus({
          paperId: id,
          tags: [],
          flagged: true,
          markedAt: Date.now(),
          readingStatus: "yet_to_start",
        }),
        body,
      );
      mockApi.library.push(entry);
    } else {
      entry = applyMarkedPatch(entry, body);
      mockApi.library = mockApi.library.map((e) => (e.paperId === id ? entry! : e));
    }
    if (!entry.flagged && entry.tags.length === 0 && !entry.isRead) {
      mockApi.library = mockApi.library.filter((e) => e.paperId !== id);
    }
    return HttpResponse.json(markedDto(entry));
  }),
  http.post("/api/marked-papers/:id/notes", async ({ params, request }) => {
    const paperId = String(params.id);
    const body = (await request.json()) as {
      content: string;
      source?: Note["source"];
      transcript?: string;
      type?: Note["type"];
      audioTimestamp?: number;
    };
    const note: Note = {
      id: crypto.randomUUID(),
      paperId,
      content: body.content.trim(),
      createdAt: Date.now(),
      source: body.source ?? "typed",
      transcript: body.transcript,
      type: body.type ?? "user_note",
      audioTimestamp: body.audioTimestamp,
    };
    mockApi.notes.push(note);
    return HttpResponse.json(note, { status: 201 });
  }),
  http.patch("/api/marked-papers/:id/notes/:noteId", async ({ params, request }) => {
    const paperId = String(params.id);
    const noteId = String(params.noteId);
    const body = (await request.json()) as { content?: string };
    const note = mockApi.notes.find((n) => n.id === noteId && n.paperId === paperId);
    if (!note) {
      return HttpResponse.json(
        { error: "Note not found", code: "not_found" },
        { status: 404 },
      );
    }
    note.content = String(body.content ?? "").trim();
    return HttpResponse.json(note);
  }),
  http.delete("/api/marked-papers/:id/notes/:noteId", ({ params }) => {
    const paperId = String(params.id);
    const noteId = String(params.noteId);
    const before = mockApi.notes.length;
    mockApi.notes = mockApi.notes.filter(
      (n) => !(n.id === noteId && n.paperId === paperId),
    );
    if (mockApi.notes.length === before) {
      return HttpResponse.json(
        { error: "Note not found", code: "not_found" },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
  http.delete("/api/marked-papers/:id", ({ params }) => {
    const id = String(params.id);
    mockApi.library = mockApi.library.filter((e) => e.paperId !== id);
    mockApi.notes = mockApi.notes.filter((n) => n.paperId !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
