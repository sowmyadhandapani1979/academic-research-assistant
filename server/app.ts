import express from "express";
import type { AppDb } from "./db.js";
import {
  addNoteRow,
  addTag,
  consolidate,
  deleteNoteRow,
  getCachedSearch,
  getPaper,
  listHistory,
  listMarked,
  listNotes,
  rememberQuery,
  removeMarked,
  searchLocal,
  setCachedSearch,
  updateNoteRow,
  upsertMarked,
  upsertPaper,
} from "./db.js";
import type { S2Client } from "./s2.js";
import { s2IsQuiet, s2NoteRateLimit, s2ResetQuiet } from "./s2.js";
import * as openalex from "./openalex.js";
import { HttpError } from "./types.js";
import type { Paper } from "../src/types.js";
import {
  composeSearchQuery,
  disciplineField,
  parseDiscipline,
  resolveYearRange,
  searchCacheKey,
  yearParam,
} from "../src/lib/searchFilters.js";
import { paperPdfFilename, paperPdfUrl } from "../src/lib/source.js";
import { fetchPdfBytes, ingestPaperPdf } from "./pdf.js";

const RATE_LIMIT_WARNING =
  "No matching papers on this device, and live search is cooling down. Try again in a minute.";

function searchPayload(papers: Paper[], extra: { warning?: string } = {}) {
  const warning =
    extra.warning && papers.length === 0 ? extra.warning : undefined;
  return {
    papers,
    total: papers.length,
    ...(warning ? { warning } : {}),
  };
}

async function recoverLimitedSearch(
  db: AppDb,
  query: string,
  limit: number,
  local: Paper[],
  cacheKey: string,
  filters?: { year?: string; fieldsOfStudy?: string },
) {
  if (local.length) {
    return { papers: local, total: local.length };
  }
  if (process.env.S2_API_KEY?.trim()) {
    try {
      const fallback = await openalex.searchOpenAlex(query, limit, filters);
      if (fallback.papers.length) {
        for (const paper of fallback.papers) upsertPaper(db, paper);
        setCachedSearch(db, cacheKey, fallback.papers, fallback.total);
        return fallback;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return searchPayload(local, { warning: RATE_LIMIT_WARNING });
}

async function resolvePaper(
  db: AppDb,
  s2: S2Client,
  id: string,
): Promise<Paper | null> {
  const local = getPaper(db, id);
  if (local && paperPdfUrl(local)) return local;
  let paper = local ?? null;
  try {
    const remote = await s2.get(id);
    if (remote) {
      const pdfUrl = paperPdfUrl(remote) || paperPdfUrl(local ?? {});
      paper = {
        ...(local ?? remote),
        ...remote,
        url: remote.url || local?.url,
        pdfUrl,
        doi: remote.doi || local?.doi,
        pdfIngested: Boolean(local?.pdfIngested && paperPdfUrl(local) === pdfUrl),
        sections:
          local?.pdfIngested && (local.sections?.length ?? 0) > (remote.sections?.length ?? 0)
            ? local.sections
            : remote.sections,
      };
      upsertPaper(db, paper);
    }
  } catch (err) {
    if (!paper) {
      if (err instanceof HttpError && err.status === 404) return null;
      throw err;
    }
  }
  if (paper && !paperPdfUrl(paper)) {
    const pdfUrl = await openalex.findOpenAccessPdf(paper);
    if (pdfUrl) {
      paper = { ...paper, pdfUrl, pdfIngested: false };
      upsertPaper(db, paper);
    }
  }
  return paper;
}

export function createApp(db: AppDb, s2: S2Client) {
  const app = express();
  app.use(express.json());

  app.get("/api/papers/search", async (req, res) => {
    const query = String(req.query.query ?? "").trim();
    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 50);
    const discipline = parseDiscipline(String(req.query.discipline ?? "any"));
    const range = resolveYearRange({
      period: req.query.period != null ? String(req.query.period) : undefined,
      from: req.query.from != null ? String(req.query.from) : undefined,
      to: req.query.to != null ? String(req.query.to) : undefined,
    });
    const cacheKey = searchCacheKey(query, discipline, range);
    const filters = {
      year: yearParam(range),
      fieldsOfStudy: disciplineField(discipline),
    };
    const upstreamQuery = composeSearchQuery(query, discipline, range);
    if (!query) {
      res.json({ papers: [], total: 0 });
      return;
    }
    rememberQuery(db, query);
    try {
      const cached = getCachedSearch(db, cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
      const local = searchLocal(db, query, {
        discipline,
        period: req.query.period != null ? String(req.query.period) : undefined,
        from: req.query.from != null ? String(req.query.from) : undefined,
        to: req.query.to != null ? String(req.query.to) : undefined,
      });
      const keyed = Boolean(process.env.S2_API_KEY?.trim());
      if (s2IsQuiet() && !keyed) {
        res.json(await recoverLimitedSearch(db, upstreamQuery, limit, local, cacheKey, filters));
        return;
      }
      try {
        const result = await s2.search(upstreamQuery, limit, filters);
        s2ResetQuiet();
        setCachedSearch(db, cacheKey, result.papers, result.total);
        res.json(result);
      } catch (err) {
        if (err instanceof HttpError && err.status === 429) {
          s2NoteRateLimit();
          res.json(await recoverLimitedSearch(db, upstreamQuery, limit, local, cacheKey, filters));
          return;
        }
        if (local.length) {
          res.json({ papers: local, total: local.length });
          return;
        }
        const status = err instanceof HttpError ? err.status : 502;
        const code = err instanceof HttpError ? err.code : "upstream";
        const message =
          err instanceof Error ? err.message : "Paper search failed";
        res.status(status).json({ error: message, code });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Search failed",
        code: "internal",
      });
    }
  });

  app.get("/api/papers/:id/pdf", async (req, res) => {
    try {
      const paper = await resolvePaper(db, s2, req.params.id);
      if (!paper) {
        res.status(404).json({ error: "Paper not found", code: "not_found" });
        return;
      }
      const url = paperPdfUrl(paper);
      if (!url) {
        res.status(404).json({ error: "No PDF for this paper", code: "not_found" });
        return;
      }
      const bytes = await fetchPdfBytes(url);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${paperPdfFilename(paper)}"`,
      );
      res.send(Buffer.from(bytes));
    } catch (err) {
      if (err instanceof HttpError && err.status === 429) {
        res.status(429).json({ error: err.message, code: err.code });
        return;
      }
      res.status(502).json({
        error: err instanceof Error ? err.message : "Could not load PDF",
        code: "upstream",
      });
    }
  });

  app.get("/api/papers/:id", async (req, res) => {
    try {
      const paper = await resolvePaper(db, s2, req.params.id);
      if (!paper) {
        res.status(404).json({ error: "Paper not found", code: "not_found" });
        return;
      }
      const hydrated = await ingestPaperPdf(paper);
      upsertPaper(db, hydrated);
      res.json(hydrated);
    } catch (err) {
      if (err instanceof HttpError && err.status === 429) {
        res.status(429).json({ error: err.message, code: err.code });
        return;
      }
      res.status(err instanceof HttpError ? err.status : 502).json({
        error: err instanceof Error ? err.message : "Could not load paper",
        code: err instanceof HttpError ? err.code : "upstream",
      });
    }
  });

  app.get("/api/search-history", (_req, res) => {
    res.json({ queries: listHistory(db) });
  });

  app.post("/api/search-history", (req, res) => {
    rememberQuery(db, String(req.body?.query ?? ""));
    res.json({ queries: listHistory(db) });
  });

  app.get("/api/marked-papers", (req, res) => {
    const markedPapers = listMarked(db, {
      tags: String(req.query.tags ?? ""),
      search: String(req.query.search ?? ""),
      readStatus: String(req.query.readStatus ?? "all"),
    });
    res.json({ markedPapers, total: markedPapers.length });
  });

  app.post("/api/marked-papers", (req, res) => {
    const paperId = String(req.body?.paperId ?? "");
    if (!paperId) {
      res.status(400).json({ error: "paperId required", code: "bad_request" });
      return;
    }
    const entry = upsertMarked(db, paperId, {
      tags: Array.isArray(req.body?.tags) ? req.body.tags : undefined,
      flagged: req.body?.flagged ?? true,
      isRead: req.body?.isRead,
      readingStatus: req.body?.readingStatus,
      starting: req.body?.starting,
    });
    if (typeof req.body?.tag === "string") addTag(db, paperId, req.body.tag);
    const paper = getPaper(db, paperId);
    res.status(201).json({ ...entry, paper, notes: listNotes(db, paperId) });
  });

  app.patch("/api/marked-papers/:id", (req, res) => {
    const id = req.params.id;
    if (typeof req.body?.tag === "string") {
      addTag(db, id, req.body.tag);
    }
    const entry = upsertMarked(db, id, {
      isRead: req.body?.isRead,
      flagged: req.body?.flagged,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : undefined,
      readingStatus: req.body?.readingStatus,
      starting: req.body?.starting,
    });
    const paper = getPaper(db, id);
    res.json({ ...entry, paper, notes: listNotes(db, id) });
  });

  app.get("/api/marked-papers/:id/notes", (req, res) => {
    res.json(listNotes(db, req.params.id));
  });

  app.post("/api/marked-papers/:id/notes", (req, res) => {
    const content = String(req.body?.content ?? "");
    if (!content.trim()) {
      res.status(400).json({ error: "content required", code: "bad_request" });
      return;
    }
    const note = addNoteRow(db, req.params.id, content, {
      source: req.body?.source,
      transcript: req.body?.transcript,
      type: req.body?.type,
      audioTimestamp: req.body?.audioTimestamp,
    });
    res.status(201).json(note);
  });

  app.patch("/api/marked-papers/:id/notes/:noteId", (req, res) => {
    const content = String(req.body?.content ?? "");
    if (!content.trim()) {
      res.status(400).json({ error: "content required", code: "bad_request" });
      return;
    }
    const note = updateNoteRow(db, req.params.id, req.params.noteId, content);
    if (!note) {
      res.status(404).json({ error: "Note not found", code: "not_found" });
      return;
    }
    res.json(note);
  });

  app.delete("/api/marked-papers/:id/notes/:noteId", (req, res) => {
    const ok = deleteNoteRow(db, req.params.id, req.params.noteId);
    if (!ok) {
      res.status(404).json({ error: "Note not found", code: "not_found" });
      return;
    }
    res.status(204).end();
  });

  app.delete("/api/marked-papers/:id", (req, res) => {
    removeMarked(db, req.params.id);
    res.status(204).end();
  });

  app.get("/api/notes/consolidate", (req, res) => {
    const by = String(req.query.by ?? "paper");
    const filter = String(req.query.filter ?? "");
    res.json({ consolidated_notes: consolidate(db, by, filter) });
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const message = err instanceof Error ? err.message : "Internal error";
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: message, code: "internal" });
      }
    },
  );

  return app;
}
