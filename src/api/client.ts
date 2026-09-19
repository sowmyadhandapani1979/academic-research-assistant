import type { LibraryEntry, Note, NoteKind, NoteSource, Paper, ReadingStatus } from "../types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
    };
    throw new ApiError(
      res.status,
      body.code ?? "error",
      body.error ?? res.statusText,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type MarkedPaperDto = LibraryEntry & {
  paper: Paper;
  notes: Note[];
};

export const api = {
  search(
    query: string,
    limit = 20,
    filters?: { discipline?: string; period?: string; from?: number; to?: number },
  ) {
    const q = new URLSearchParams({ query, limit: String(limit) });
    if (filters?.discipline && filters.discipline !== "any") {
      q.set("discipline", filters.discipline);
    }
    if (filters?.period && filters.period !== "any") {
      q.set("period", filters.period);
    }
    if (filters?.from != null) q.set("from", String(filters.from));
    if (filters?.to != null) q.set("to", String(filters.to));
    return request<{ papers: Paper[]; total: number; warning?: string }>(
      `/api/papers/search?${q}`,
    );
  },
  getPaper(id: string) {
    return request<Paper>(`/api/papers/${encodeURIComponent(id)}`);
  },
  history() {
    return request<{ queries: string[] }>("/api/search-history");
  },
  rememberSearch(query: string) {
    return request<{ queries: string[] }>("/api/search-history", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
  marked(params?: { tags?: string; search?: string; readStatus?: string }) {
    const q = new URLSearchParams();
    if (params?.tags) q.set("tags", params.tags);
    if (params?.search) q.set("search", params.search);
    if (params?.readStatus) q.set("readStatus", params.readStatus);
    const suffix = q.toString() ? `?${q}` : "";
    return request<{ markedPapers: MarkedPaperDto[]; total: number }>(
      `/api/marked-papers${suffix}`,
    );
  },
  mark(
    paperId: string,
    body?: {
      flagged?: boolean;
      tags?: string[];
      tag?: string;
      isRead?: boolean;
      readingStatus?: ReadingStatus;
      starting?: boolean;
    },
  ) {
    return request<MarkedPaperDto>("/api/marked-papers", {
      method: "POST",
      body: JSON.stringify({ paperId, ...body }),
    });
  },
  patchMarked(
    paperId: string,
    body: {
      flagged?: boolean;
      tags?: string[];
      tag?: string;
      isRead?: boolean;
      readingStatus?: ReadingStatus;
      starting?: boolean;
    },
  ) {
    return request<MarkedPaperDto>(
      `/api/marked-papers/${encodeURIComponent(paperId)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  },
  addNote(
    paperId: string,
    content: string,
    extra?: {
      source?: NoteSource;
      transcript?: string;
      type?: NoteKind;
      audioTimestamp?: number;
    },
  ) {
    return request<Note>(
      `/api/marked-papers/${encodeURIComponent(paperId)}/notes`,
      { method: "POST", body: JSON.stringify({ content, ...extra }) },
    );
  },
  editNote(paperId: string, noteId: string, content: string) {
    return request<Note>(
      `/api/marked-papers/${encodeURIComponent(paperId)}/notes/${encodeURIComponent(noteId)}`,
      { method: "PATCH", body: JSON.stringify({ content }) },
    );
  },
  deleteNote(paperId: string, noteId: string) {
    return request<void>(
      `/api/marked-papers/${encodeURIComponent(paperId)}/notes/${encodeURIComponent(noteId)}`,
      { method: "DELETE" },
    );
  },
  unmark(paperId: string) {
    return request<void>(
      `/api/marked-papers/${encodeURIComponent(paperId)}`,
      { method: "DELETE" },
    );
  },
};
