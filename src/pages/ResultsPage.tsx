import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { cleanPaper } from "../lib/plainText";
import { useLibrary } from "../store/LibraryContext";
import { paperHasFullText, paperSourceUrl } from "../lib/source";
import {
  SEARCH_YEAR_MAX,
  SEARCH_YEAR_MIN,
  orderedYears,
  parseDiscipline,
  resolveYearRange,
  resultsPath,
} from "../lib/searchFilters";
import { PaperResultCard, RefineBar } from "../ui/PaperResultCard";
import { SearchFilterPanel } from "../ui/SearchFilters";
import { Screen, StatusText } from "../ui/SearchHero";
import { ui } from "../theme/classes";
import type { Paper } from "../types";

export function ResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") ?? "";
  const discipline = parseDiscipline(params.get("discipline"));
  const range = resolveYearRange({
    period: params.get("period"),
    from: params.get("from"),
    to: params.get("to"),
  });
  const yearFrom = range.from ?? SEARCH_YEAR_MIN;
  const yearTo = range.to ?? SEARCH_YEAR_MAX;
  const [draft, setDraft] = useState(q);
  const [draftDiscipline, setDraftDiscipline] = useState(discipline);
  const [draftFrom, setDraftFrom] = useState(yearFrom);
  const [draftTo, setDraftTo] = useState(yearTo);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [results, setResults] = useState<Paper[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const { rememberSearch, isFlagged, toggleFlag, addTag, tagsFor, cachePapers } =
    useLibrary();

  useEffect(() => {
    setDraft(q);
    setDraftDiscipline(discipline);
    setDraftFrom(yearFrom);
    setDraftTo(yearTo);
    rememberSearch(q);
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotice(null);
    void (async () => {
      try {
        const years = orderedYears(yearFrom, yearTo);
        const data = await api.search(q, 20, {
          discipline,
          from: range.from != null ? years.from : undefined,
          to: range.to != null ? years.to : undefined,
        });
        if (cancelled) return;
        setResults(data.papers.map(cleanPaper));
        cachePapers(data.papers);
        setOpenId(null);
        setNotice(
          data.warning && data.papers.length === 0 ? data.warning : null,
        );
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not search papers. Try again.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, discipline, yearFrom, yearTo, range.from, range.to, rememberSearch, cachePapers]);

  function refine(e: FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) return;
    navigate(resultsPath(next, draftDiscipline, { from: draftFrom, to: draftTo }));
  }

  return (
    <div className={ui.searchLayout}>
      {filtersOpen && (
        <SearchFilterPanel
          discipline={draftDiscipline}
          yearFrom={draftFrom}
          yearTo={draftTo}
          onDiscipline={setDraftDiscipline}
          onYearFrom={setDraftFrom}
          onYearTo={setDraftTo}
        />
      )}
      <Screen>
        <RefineBar
          value={draft}
          onChange={setDraft}
          onSubmit={refine}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
        />
        <div className={ui.scrollList}>
          {loading && <StatusText>Searching papers…</StatusText>}
          {!loading && error && <StatusText>{error}</StatusText>}
          {!loading && !error && notice && <StatusText>{notice}</StatusText>}
          {!loading && !error && !notice && results.length === 0 && (
            <StatusText>No papers matched “{q}”. Try another topic.</StatusText>
          )}
          {!loading &&
            !error &&
            results.map((paper) => (
              <ResultItem
                key={paper.id}
                paper={paper}
                flagged={isFlagged(paper.id)}
                tags={tagsFor(paper.id)}
                expanded={openId === paper.id}
                onToggleExpand={() =>
                  setOpenId((current) => (current === paper.id ? null : paper.id))
                }
                onToggle={() => toggleFlag(paper.id)}
                onAddTag={(tag) => addTag(paper.id, tag)}
              />
            ))}
        </div>
      </Screen>
    </div>
  );
}

function ResultItem({
  paper,
  flagged,
  tags,
  expanded,
  onToggleExpand,
  onToggle,
  onAddTag,
}: {
  paper: Paper;
  flagged: boolean;
  tags: string[];
  expanded: boolean;
  onToggleExpand: () => void;
  onToggle: () => void;
  onAddTag: (tag: string) => void;
}) {
  const [tagDraft, setTagDraft] = useState("");

  function submitTag(e: FormEvent) {
    e.preventDefault();
    onAddTag(tagDraft);
    setTagDraft("");
  }

  return (
    <PaperResultCard
      title={paper.title}
      meta={`${paper.authorsShort} · ${paper.year}`}
      abstract={paper.abstract}
      flagged={flagged}
      tags={tags}
      tagDraft={tagDraft}
      onTagDraft={setTagDraft}
      onAddTag={submitTag}
      onToggleFlag={onToggle}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      abstractId={`abstract-${paper.id}`}
      readHref={`/read/${paper.id}`}
      sourceHref={paperSourceUrl(paper)}
      chipTone={(t) => paper.tagsPalette?.[t] ?? "blue"}
      hasFullText={paperHasFullText(paper)}
    />
  );
}
