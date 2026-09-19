import type { FormEvent, ReactNode } from "react";
import { Button, IconAction, TextField } from "./controls";
import { SearchFilterPanel } from "./SearchFilters";
import { ui } from "../theme/classes";
import type { DisciplineId } from "../lib/searchFilters";

export function SearchHero({
  query,
  onQueryChange,
  onSubmit,
  recents,
  examples,
  onRecent,
  discipline,
  yearFrom,
  yearTo,
  onDiscipline,
  onYearFrom,
  onYearTo,
  filtersOpen,
  onToggleFilters,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  recents: string[];
  examples: string[];
  onRecent: (q: string) => void;
  discipline: DisciplineId;
  yearFrom: number;
  yearTo: number;
  onDiscipline: (value: DisciplineId) => void;
  onYearFrom: (value: number) => void;
  onYearTo: (value: number) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}) {
  return (
    <div className={ui.searchLayout}>
      <header className={ui.mobileHeader}>
        <h1 className={ui.mobileTitle}>Papers</h1>
        <IconAction
          icon="⚙️"
          label="Filters"
          tone="primary"
          onClick={onToggleFilters}
          pressed={filtersOpen}
        />
      </header>
      {filtersOpen && (
        <SearchFilterPanel
          discipline={discipline}
          yearFrom={yearFrom}
          yearTo={yearTo}
          onDiscipline={onDiscipline}
          onYearFrom={onYearFrom}
          onYearTo={onYearTo}
        />
      )}
      <div className={ui.hero}>
        <div className={ui.heroCopy}>
          <h1 className={ui.heroTitle}>
            <span className={ui.onlyMobile}>Research</span>
            <span className={ui.onlyDesktop}>Research Assistant</span>
          </h1>
          <p className={ui.heroSubtitle}>
            <span className={ui.onlyMobile}>Find papers</span>
            <span className={ui.onlyDesktop}>
              Discover, organize, and consume academic papers
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className={ui.heroForm}>
          <div className={ui.heroRow}>
            <TextField
              variant="hero"
              className={ui.onlyDesktopBlock}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="e.g., machine learning, CRISPR gene therapy..."
            />
            <TextField
              variant="hero"
              className={ui.onlyMobile}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Topic or keyword..."
            />
            <IconAction icon="🔍" label="Search" tone="primary" type="submit" />
          </div>
          <button
            type="button"
            className={ui.heroAdvanced}
            onClick={onToggleFilters}
          >
            {filtersOpen ? "Hide Filters ✕" : "Advanced Search ⚙️"}
          </button>
          <p className={ui.hint}>
            Try: {examples.map((t) => `"${t}"`).join(", ")}
          </p>
        </form>

        <div className={ui.recentsWrap}>
          <p className={ui.recentsLabel}>
            <span className={ui.onlyMobile}>Recent</span>
            <span className={ui.onlyDesktop}>Recent Searches</span>
          </p>
          <div className={ui.recentsDesktop}>
            {recents.map((r) => (
              <Button key={r} variant="chip" onClick={() => onRecent(r)}>
                {r}
              </Button>
            ))}
          </div>
          <div className={ui.recentsMobile}>
            {recents.slice(0, 3).map((r) => (
              <Button key={r} variant="chipMobile" onClick={() => onRecent(r)}>
                {r}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className={ui.page}>{children}</div>;
}

export function StatusText({ children }: { children: ReactNode }) {
  return <p className={ui.muted}>{children}</p>;
}
