import { useMemo, useState } from "react";
import { useLibrary } from "../store/LibraryContext";
import {
  LibraryItem,
  LibraryScreen,
  LibraryToolbar,
  StatusText,
} from "../ui/LibraryViews";
import { paperHasFullText, paperSourceUrl } from "../lib/source";
import { TextLink } from "../ui/controls";
import { normalizeReadingStatus, readingStatusRank } from "../lib/readingStatus";
import type { ReadingStatus } from "../types";

type SortMode = "status" | "newest" | "oldest" | "tag";

export function LibraryPage() {
  const { library, allTags, papers, removePaper } = useLibrary();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("all");
  const [status, setStatus] = useState<"all" | ReadingStatus>("all");
  const [sort, setSort] = useState<SortMode>("status");

  const rows = useMemo(() => {
    const filtered = library.filter((e) => {
      const paper = papers[e.paperId];
      if (!paper) return false;
      const hay = `${paper.title} ${paper.authorsShort} ${e.tags.join(" ")}`.toLowerCase();
      if (q.trim() && !hay.includes(q.trim().toLowerCase())) return false;
      if (tag !== "all" && !e.tags.includes(tag)) return false;
      const readingStatus = normalizeReadingStatus(e);
      if (status !== "all" && readingStatus !== status) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return a.markedAt - b.markedAt;
      if (sort === "newest") return b.markedAt - a.markedAt;
      if (sort === "tag") {
        const ta = (a.tags[0] ?? "\uFFFF").toLowerCase();
        const tb = (b.tags[0] ?? "\uFFFF").toLowerCase();
        if (ta !== tb) return ta.localeCompare(tb);
        return (papers[a.paperId]?.title ?? "").localeCompare(
          papers[b.paperId]?.title ?? "",
        );
      }
      const rank =
        readingStatusRank(normalizeReadingStatus(a)) -
        readingStatusRank(normalizeReadingStatus(b));
      if (rank !== 0) return rank;
      return b.markedAt - a.markedAt;
    });
  }, [library, papers, q, tag, status, sort]);

  return (
    <LibraryScreen
      toolbar={
        <LibraryToolbar
          title="My Marked Papers"
          query={q}
          onQuery={setQ}
          tag={tag}
          onTag={setTag}
          tags={allTags}
          status={status}
          onStatus={(v) => setStatus(v as typeof status)}
          sort={sort}
          onSort={(v) => setSort(v as SortMode)}
        />
      }
      empty={
        rows.length === 0 ? (
          <StatusText>
            Nothing marked yet.{" "}
            <TextLink to="/" variant="empty">
              Search papers
            </TextLink>
          </StatusText>
        ) : undefined
      }
    >
      {rows.map((e) => {
        const paper = papers[e.paperId];
        if (!paper) return null;
        const readingStatus = normalizeReadingStatus(e);
        return (
          <LibraryItem
            key={e.paperId}
            title={paper.title}
            meta={`${paper.authorsShort} · ${paper.year}`}
            readingStatus={readingStatus}
            tags={e.tags}
            chipTone={(t) => paper.tagsPalette?.[t] ?? "blue"}
            openHref={`/read/${paper.id}`}
            listenHref={`/read/${paper.id}?listen=1`}
            notesHref={`/notes/${paper.id}`}
            sourceHref={paperSourceUrl(paper)}
            hasFullText={paperHasFullText(paper)}
            onRemove={() => removePaper(paper.id)}
          />
        );
      })}
    </LibraryScreen>
  );
}
