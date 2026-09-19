import { cx, ui } from "../theme/classes";
import {
  DISCIPLINE_CHIPS,
  MOBILE_DISCIPLINE_IDS,
  SEARCH_YEAR_MAX,
  SEARCH_YEAR_MIN,
  orderedYears,
  type DisciplineId,
} from "../lib/searchFilters";

export function SearchFilterPanel({
  discipline,
  yearFrom,
  yearTo,
  onDiscipline,
  onYearFrom,
  onYearTo,
}: {
  discipline: DisciplineId;
  yearFrom: number;
  yearTo: number;
  onDiscipline: (value: DisciplineId) => void;
  onYearFrom: (value: number) => void;
  onYearTo: (value: number) => void;
}) {
  const years = orderedYears(yearFrom, yearTo);
  const span = SEARCH_YEAR_MAX - SEARCH_YEAR_MIN || 1;
  const left = ((years.from - SEARCH_YEAR_MIN) / span) * 100;
  const right = 100 - ((years.to - SEARCH_YEAR_MIN) / span) * 100;

  return (
    <aside className={ui.searchSidebar}>
      <div>
        <p className={ui.filterLabel}>Discipline</p>
        <div className={ui.disciplineChips}>
          {DISCIPLINE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-label={chip.label}
              aria-pressed={discipline === chip.id}
              className={cx(
                discipline === chip.id ? ui.disciplineChipOn : ui.disciplineChip,
                MOBILE_DISCIPLINE_IDS.has(chip.id) ? undefined : ui.onlyDesktop,
              )}
              onClick={() => onDiscipline(chip.id)}
            >
              <span className={ui.onlyDesktop}>
                {chip.id === "environmental-science" ? "Environmental" : chip.label}
              </span>
              <span className={ui.onlyMobile}>{chip.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={ui.filterLabel}>Year Range</p>
        <div className={ui.dualSlider}>
          <div className="absolute w-full h-1 rounded-sm bg-line top-1/2 -translate-y-1/2 pointer-events-none" />
          <div
            className="absolute h-1 rounded-sm bg-accent top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${left}%`, right: `${right}%` }}
          />
          <input
            type="range"
            min={SEARCH_YEAR_MIN}
            max={SEARCH_YEAR_MAX}
            value={yearFrom}
            aria-label="From"
            onChange={(e) => onYearFrom(Number(e.target.value))}
          />
          <input
            type="range"
            min={SEARCH_YEAR_MIN}
            max={SEARCH_YEAR_MAX}
            value={yearTo}
            aria-label="To"
            onChange={(e) => onYearTo(Number(e.target.value))}
          />
        </div>
        <div className={ui.yearLabels}>
          <div className="text-center flex-1">
            <p className={`${ui.yearCaption} hidden md:block`}>From</p>
            <p className={ui.yearValue}>{years.from}</p>
          </div>
          <span className={ui.yearDash}>–</span>
          <div className="text-center flex-1">
            <p className={`${ui.yearCaption} hidden md:block`}>To</p>
            <p className={ui.yearValue}>{years.to}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
