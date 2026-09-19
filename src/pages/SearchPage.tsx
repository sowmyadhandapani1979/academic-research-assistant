import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXAMPLE_QUERIES } from "../data/fixtures";
import { useLibrary } from "../store/LibraryContext";
import { SearchHero } from "../ui/SearchHero";
import {
  DEFAULT_YEAR_FROM,
  DEFAULT_YEAR_TO,
  resultsPath,
  type DisciplineId,
} from "../lib/searchFilters";

export function SearchPage() {
  const navigate = useNavigate();
  const { recents, rememberSearch } = useLibrary();
  const [q, setQ] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineId>("computer-science");
  const [yearFrom, setYearFrom] = useState(DEFAULT_YEAR_FROM);
  const [yearTo, setYearTo] = useState(DEFAULT_YEAR_TO);
  const [filtersOpen, setFiltersOpen] = useState(false);

  function go(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    rememberSearch(trimmed);
    navigate(resultsPath(trimmed, discipline, { from: yearFrom, to: yearTo }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(q);
  }

  return (
    <SearchHero
      query={q}
      onQueryChange={setQ}
      onSubmit={onSubmit}
      recents={recents}
      examples={EXAMPLE_QUERIES}
      onRecent={go}
      discipline={discipline}
      yearFrom={yearFrom}
      yearTo={yearTo}
      onDiscipline={setDiscipline}
      onYearFrom={setYearFrom}
      onYearTo={setYearTo}
      filtersOpen={filtersOpen}
      onToggleFilters={() => setFiltersOpen((open) => !open)}
    />
  );
}
