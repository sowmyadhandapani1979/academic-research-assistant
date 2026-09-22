/** @vitest-environment node */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { createDb, upsertPaper } from "./db.js";
import { HttpError } from "./types.js";
import type { S2Client } from "./s2.js";
import { s2ResetQuiet } from "./s2.js";
import * as openalex from "./openalex.js";
import type { Paper } from "../src/types.js";

const sample: Paper = {
  id: "s2-1",
  title: "Queued Transformers",
  authorsShort: "Lee et al.",
  authorsFull: "Lee, A.",
  year: 2024,
  abstract: "A paper about transformers and deep learning.",
  sections: [{ heading: "1. Overview", paragraphs: ["A paper about transformers and deep learning."] }],
  related: [],
  summary: "Transformers queue work.",
  takeaways: "Queue then attend.",
  readTime: "6 min",
  url: "https://www.semanticscholar.org/paper/s2-1",
  pdfUrl: "https://example.com/queued.pdf",
  pdfIngested: true,
};

function fakeS2(overrides: Partial<S2Client> = {}): S2Client {
  const search = vi.fn(async () => ({ papers: [sample], total: 1 }));
  const get = vi.fn(async (id: string) => (id === sample.id ? sample : null));
  return { search, get, ...overrides };
}

describe("API routes", () => {
  beforeEach(() => {
    s2ResetQuiet();
  });

  it("searches Semantic Scholar and caches the second call", async () => {
    const db = createDb(":memory:");
    const s2 = fakeS2();
    const app = createApp(db, s2);
    const first = await request(app).get("/api/papers/search").query({ query: "transformers" });
    expect(first.status).toBe(200);
    expect(first.body.papers[0].title).toMatch(/queued transformers/i);
    const second = await request(app).get("/api/papers/search").query({ query: "transformers" });
    expect(second.status).toBe(200);
    expect(s2.search).toHaveBeenCalledTimes(1);
    expect(second.body.papers[0].pdfUrl).toBe("https://example.com/queued.pdf");
  });

  it("passes discipline and year into the Semantic Scholar search query", async () => {
    const db = createDb(":memory:");
    const s2 = fakeS2();
    const app = createApp(db, s2);
    const res = await request(app).get("/api/papers/search").query({
      query: "strategy",
      discipline: "management",
      from: "2000",
      to: "2009",
    });
    expect(res.status).toBe(200);
    expect(s2.search).toHaveBeenCalledWith(
      "strategy Management 2000-2009",
      20,
      { year: "2000-2009", fieldsOfStudy: "Business" },
    );
  });

  it("on S2 429 returns local catalog papers instead of failing the search", async () => {
    const db = createDb(":memory:");
    const s2 = fakeS2({
      search: vi.fn(async () => {
        throw new HttpError(429, "rate_limited", "Paper search is rate-limited. Try again shortly.");
      }),
    });
    const app = createApp(db, s2);
    const limited = await request(app).get("/api/papers/search").query({ query: "Deep Learning" });
    expect(limited.status).toBe(200);
    expect(limited.body.warning).toBeUndefined();
    expect(limited.body.papers.some((p: Paper) => /attention/i.test(p.title))).toBe(true);
    const again = await request(app).get("/api/papers/search").query({ query: "brand-new-topic-xyz" });
    expect(again.status).toBe(200);
    expect(s2.search).toHaveBeenCalledTimes(1);
  });

  it("falls back to local seed papers when S2 fails", async () => {
    const db = createDb(":memory:");
    const s2 = fakeS2({
      search: vi.fn(async () => {
        throw new HttpError(502, "upstream", "down");
      }),
    });
    const app = createApp(db, s2);
    const res = await request(app).get("/api/papers/search").query({ query: "Deep Learning" });
    expect(res.status).toBe(200);
    expect(res.body.papers.some((p: Paper) => /attention/i.test(p.title))).toBe(true);
  });

  it("lists marked papers and filters unread", async () => {
    const app = createApp(createDb(":memory:"), fakeS2());
    const all = await request(app).get("/api/marked-papers");
    expect(all.body.total).toBe(3);
    const unread = await request(app).get("/api/marked-papers").query({ readStatus: "unread" });
    expect(unread.body.markedPapers.every((p: { isRead: boolean }) => !p.isRead)).toBe(true);
  });

  it("adds a note and consolidates by paper", async () => {
    const app = createApp(createDb(":memory:"), fakeS2());
    const created = await request(app)
      .post("/api/marked-papers/attention/notes")
      .send({ content: "Cache hits skip S2", source: "typed" });
    expect(created.status).toBe(201);
    const notes = await request(app).get("/api/marked-papers/attention/notes");
    expect(notes.body.some((n: { content: string }) => n.content.includes("Cache hits"))).toBe(
      true,
    );
    const dump = await request(app)
      .get("/api/notes/consolidate")
      .query({ by: "paper", filter: "attention" });
    expect(dump.body.consolidated_notes).toMatch(/cache hits skip s2/i);
  });

  it("patches read status", async () => {
    const app = createApp(createDb(":memory:"), fakeS2());
    const res = await request(app)
      .patch("/api/marked-papers/attention")
      .send({ isRead: true });
    expect(res.body.isRead).toBe(true);
  });

  it("removes a marked paper and edits notes", async () => {
    const app = createApp(createDb(":memory:"), fakeS2());
    const created = await request(app)
      .post("/api/marked-papers/attention/notes")
      .send({ content: "temporary note" });
    const noteId = created.body.id as string;
    const edited = await request(app)
      .patch(`/api/marked-papers/attention/notes/${noteId}`)
      .send({ content: "kept note" });
    expect(edited.body.content).toBe("kept note");
    const gone = await request(app).delete(
      `/api/marked-papers/attention/notes/${noteId}`,
    );
    expect(gone.status).toBe(204);
    const removed = await request(app).delete("/api/marked-papers/attention");
    expect(removed.status).toBe(204);
    const list = await request(app).get("/api/marked-papers");
    expect(
      list.body.markedPapers.every((p: { paperId: string }) => p.paperId !== "attention"),
    ).toBe(true);
  });

  it("loads an open-access PDF url when opening a cached paper that was missing one", async () => {
    const db = createDb(":memory:");
    upsertPaper(db, {
      ...sample,
      id: "cached-oa",
      pdfUrl: undefined,
      pdfIngested: true,
    });
    const remote = {
      ...sample,
      id: "cached-oa",
      pdfUrl: "https://example.com/queued.pdf",
      pdfIngested: true,
    };
    const s2 = fakeS2({
      get: vi.fn(async (id: string) => (id === remote.id ? remote : null)),
    });
    const app = createApp(db, s2);
    const res = await request(app).get("/api/papers/cached-oa");
    expect(res.status).toBe(200);
    expect(res.body.pdfUrl).toBe("https://example.com/queued.pdf");
    expect(s2.get).toHaveBeenCalled();
  });

  it("fills a missing PDF url from OpenAlex when Semantic Scholar has none", async () => {
    const spy = vi
      .spyOn(openalex, "findOpenAccessPdf")
      .mockResolvedValue("https://example.com/oa.pdf");
    const db = createDb(":memory:");
    upsertPaper(db, {
      ...sample,
      id: "no-pdf",
      pdfUrl: undefined,
      pdfIngested: false,
    });
    const remote = {
      ...sample,
      id: "no-pdf",
      pdfUrl: undefined,
      pdfIngested: false,
    };
    const s2 = fakeS2({
      get: vi.fn(async (id: string) => (id === remote.id ? remote : null)),
    });
    const app = createApp(db, s2);
    const res = await request(app).get("/api/papers/no-pdf");
    expect(res.status).toBe(200);
    expect(res.body.pdfUrl).toBe("https://example.com/oa.pdf");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
