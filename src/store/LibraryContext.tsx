import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import { papers as seedPapers } from "../data/fixtures";
import { cleanPaper } from "../lib/plainText";
import type { LibraryEntry, Note, NoteKind, NoteSource, Paper } from "../types";
import {
  nextReadingStatus,
  normalizeReadingStatus,
} from "../lib/readingStatus";

type LibraryContextValue = {
  recents: string[];
  papers: Record<string, Paper>;
  rememberSearch: (q: string) => void;
  library: LibraryEntry[];
  notes: Note[];
  isFlagged: (paperId: string) => boolean;
  isInLibrary: (paperId: string) => boolean;
  toggleFlag: (paperId: string) => void;
  addTag: (paperId: string, tag: string) => void;
  tagsFor: (paperId: string) => string[];
  markRead: (paperId: string, isRead?: boolean) => void;
  startReading: (paperId: string) => void;
  addNote: (
    paperId: string,
    content: string,
    extra?: {
      source?: NoteSource;
      transcript?: string;
      type?: NoteKind;
      audioTimestamp?: number;
    },
  ) => void;
  editNote: (paperId: string, noteId: string, content: string) => void;
  deleteNote: (paperId: string, noteId: string) => void;
  removePaper: (paperId: string) => void;
  notesFor: (paperId: string) => Note[];
  allTags: string[];
  ensurePaper: (id: string) => void;
  cachePapers: (list: Paper[]) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

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

const initialLibrary: LibraryEntry[] = [
  withStatus({
    paperId: "attention",
    tags: ["deep-learning", "nlp", "transformers"],
    flagged: true,
    markedAt: Date.now() - 3600_000,
    readingStatus: "in_progress",
  }),
  withStatus({
    paperId: "bert",
    tags: ["language-models", "nlp"],
    flagged: false,
    markedAt: Date.now() - 7200_000,
    readingStatus: "read",
  }),
  withStatus({
    paperId: "gpt2",
    tags: ["generative-models"],
    flagged: true,
    markedAt: Date.now() - 1800_000,
    readingStatus: "yet_to_start",
  }),
];

const initialNotes: Note[] = [
  {
    id: "n1",
    paperId: "attention",
    content:
      "Core concept: Self-attention allows models to focus on relevant parts of input simultaneously",
    createdAt: Date.now() - 120_000,
  },
  {
    id: "n2",
    paperId: "attention",
    content:
      "Key advantage: Parallel processing unlike RNNs - enables faster training",
    createdAt: Date.now() - 60_000,
  },
  {
    id: "n3",
    paperId: "attention",
    content:
      "Multi-head attention enables model to capture different types of dependencies - syntax, semantics, etc.",
    createdAt: Date.now() - 30_000,
  },
];

const initialPapers = Object.fromEntries(seedPapers.map((p) => [p.id, p]));

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [recents, setRecents] = useState([
    "Deep Learning",
    "Renewable Energy",
    "Immunotherapy",
  ]);
  const [library, setLibrary] = useState<LibraryEntry[]>(initialLibrary);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [papers, setPapers] = useState<Record<string, Paper>>(initialPapers);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [hist, marked] = await Promise.all([api.history(), api.marked()]);
        if (cancelled) return;
        if (hist.queries.length) setRecents(hist.queries);
        setLibrary(
          marked.markedPapers.map((row) =>
            withStatus({
              paperId: row.paperId,
              tags: row.tags,
              isRead: row.isRead,
              flagged: row.flagged,
              markedAt: row.markedAt,
              readingStatus: row.readingStatus,
            }),
          ),
        );
        setPapers((prev) => {
          const next = { ...prev };
          for (const row of marked.markedPapers) {
            if (row.paper) next[row.paper.id] = cleanPaper(row.paper);
          }
          return next;
        });
        setNotes(marked.markedPapers.flatMap((row) => row.notes ?? []));
      } catch {
        /* keep seeded session if API is down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rememberSearch = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecents((prev) =>
      [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        8,
      ),
    );
    void api.rememberSearch(trimmed).catch(() => undefined);
  }, []);

  const cachePapers = useCallback((list: Paper[]) => {
    setPapers((prev) => {
      const next = { ...prev };
      for (const paper of list) next[paper.id] = cleanPaper(paper);
      return next;
    });
  }, []);

  const ensurePaper = useCallback((id: string) => {
    if (!id) return;
    void (async () => {
      try {
        const paper = await api.getPaper(id);
        setPapers((prev) => ({ ...prev, [paper.id]: cleanPaper(paper) }));
      } catch {
        /* unknown paper */
      }
    })();
  }, []);

  const isInLibrary = useCallback(
    (paperId: string) => library.some((e) => e.paperId === paperId),
    [library],
  );

  const isFlagged = useCallback(
    (paperId: string) => library.some((e) => e.paperId === paperId && e.flagged),
    [library],
  );

  const tagsFor = useCallback(
    (paperId: string) => library.find((e) => e.paperId === paperId)?.tags ?? [],
    [library],
  );

  const toggleFlag = useCallback((paperId: string) => {
    setLibrary((prev) => {
      const existing = prev.find((e) => e.paperId === paperId);
      if (!existing) {
        void api.mark(paperId, { flagged: true, readingStatus: "yet_to_start" }).catch(() => undefined);
        return [
          ...prev,
          withStatus({
            paperId,
            tags: [],
            flagged: true,
            markedAt: Date.now(),
            readingStatus: "yet_to_start",
          }),
        ];
      }
      if (existing.flagged && existing.tags.length === 0 && !existing.isRead) {
        void api.patchMarked(paperId, { flagged: false }).catch(() => undefined);
        return prev.filter((e) => e.paperId !== paperId);
      }
      void api
        .patchMarked(paperId, { flagged: !existing.flagged })
        .catch(() => undefined);
      return prev.map((e) =>
        e.paperId === paperId ? { ...e, flagged: !e.flagged } : e,
      );
    });
  }, []);

  const addTag = useCallback((paperId: string, tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!clean) return;
    void api.patchMarked(paperId, { tag: clean }).catch(() => undefined);
    setLibrary((prev) => {
      const existing = prev.find((e) => e.paperId === paperId);
      if (!existing) {
        return [
          ...prev,
          withStatus({
            paperId,
            tags: [clean],
            flagged: false,
            markedAt: Date.now(),
            readingStatus: "yet_to_start",
          }),
        ];
      }
      if (existing.tags.includes(clean)) return prev;
      return prev.map((e) =>
        e.paperId === paperId ? { ...e, tags: [...e.tags, clean] } : e,
      );
    });
  }, []);

  const markRead = useCallback((paperId: string, isRead = true) => {
    const readingStatus = isRead ? "read" : "in_progress";
    void api.patchMarked(paperId, { isRead, readingStatus }).catch(() => undefined);
    setLibrary((prev) => {
      const existing = prev.find((e) => e.paperId === paperId);
      if (!existing) {
        return [
          ...prev,
          withStatus({
            paperId,
            tags: [],
            flagged: true,
            markedAt: Date.now(),
            readingStatus,
          }),
        ];
      }
      return prev.map((e) =>
        e.paperId === paperId ? withStatus({ ...e, readingStatus, isRead }) : e,
      );
    });
  }, []);

  const startReading = useCallback((paperId: string) => {
    setLibrary((prev) => {
      const existing = prev.find((e) => e.paperId === paperId);
      const current = existing?.readingStatus;
      const readingStatus = nextReadingStatus({ current, starting: true });
      if (existing && existing.readingStatus === readingStatus) return prev;
      void api
        .patchMarked(paperId, { readingStatus, flagged: true })
        .catch(() => undefined);
      if (!existing) {
        return [
          ...prev,
          withStatus({
            paperId,
            tags: [],
            flagged: true,
            markedAt: Date.now(),
            readingStatus,
          }),
        ];
      }
      return prev.map((e) =>
        e.paperId === paperId ? withStatus({ ...e, readingStatus, flagged: true }) : e,
      );
    });
  }, []);

  const addNote = useCallback(
    (
      paperId: string,
      content: string,
      extra?: {
        source?: NoteSource;
        transcript?: string;
        type?: NoteKind;
        audioTimestamp?: number;
      },
    ) => {
      const text = content.trim();
      if (!text) return;
      const local: Note = {
        id: crypto.randomUUID(),
        paperId,
        content: text,
        createdAt: Date.now(),
        source: extra?.source ?? "typed",
        transcript: extra?.transcript,
        type: extra?.type ?? "user_note",
        audioTimestamp: extra?.audioTimestamp,
      };
      setNotes((prev) => [...prev, local]);
      void api.addNote(paperId, text, extra).catch(() => undefined);
      setLibrary((prev) =>
        prev.some((e) => e.paperId === paperId)
          ? prev.map((e) =>
              e.paperId === paperId && e.readingStatus === "yet_to_start"
                ? withStatus({ ...e, readingStatus: "in_progress" })
                : e,
            )
          : [
              ...prev,
              withStatus({
                paperId,
                tags: [],
                flagged: true,
                markedAt: Date.now(),
                readingStatus: "in_progress",
              }),
            ],
      );
    },
    [],
  );

  const editNote = useCallback(
    (paperId: string, noteId: string, content: string) => {
      const text = content.trim();
      if (!text) return;
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, content: text } : n)),
      );
      void api.editNote(paperId, noteId, text).catch(() => undefined);
    },
    [],
  );

  const deleteNote = useCallback((paperId: string, noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    void api.deleteNote(paperId, noteId).catch(() => undefined);
  }, []);

  const removePaper = useCallback((paperId: string) => {
    setLibrary((prev) => prev.filter((e) => e.paperId !== paperId));
    setNotes((prev) => prev.filter((n) => n.paperId !== paperId));
    void api.unmark(paperId).catch(() => undefined);
  }, []);

  const notesFor = useCallback(
    (paperId: string) =>
      notes
        .filter((n) => n.paperId === paperId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [notes],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of library) for (const t of e.tags) set.add(t);
    return [...set].sort();
  }, [library]);

  const value = useMemo(
    () => ({
      recents,
      papers,
      rememberSearch,
      library,
      notes,
      isFlagged,
      isInLibrary,
      toggleFlag,
      addTag,
      tagsFor,
      markRead,
      startReading,
      addNote,
      editNote,
      deleteNote,
      removePaper,
      notesFor,
      allTags,
      ensurePaper,
      cachePapers,
    }),
    [
      recents,
      papers,
      rememberSearch,
      library,
      notes,
      isFlagged,
      isInLibrary,
      toggleFlag,
      addTag,
      tagsFor,
      markRead,
      startReading,
      addNote,
      editNote,
      deleteNote,
      removePaper,
      notesFor,
      allTags,
      ensurePaper,
      cachePapers,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}

export function usePaperEntry(paperId: string) {
  const { library } = useLibrary();
  return library.find((e) => e.paperId === paperId);
}

export function usePaper(id: string) {
  const { papers, ensurePaper } = useLibrary();
  useEffect(() => {
    if (id) ensurePaper(id);
  }, [id, ensurePaper]);
  return papers[id];
}
