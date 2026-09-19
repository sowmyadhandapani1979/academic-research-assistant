export const SEARCH_DISCIPLINES = [
  { id: "any", label: "All disciplines", shortLabel: "All", s2: "" },
  { id: "computer-science", label: "Computer Science", shortLabel: "CS", s2: "Computer Science" },
  { id: "medicine", label: "Medicine", shortLabel: "Med", s2: "Medicine" },
  { id: "biology", label: "Biology", shortLabel: "Bio", s2: "Biology" },
  { id: "physics", label: "Physics", shortLabel: "Phys", s2: "Physics" },
  { id: "chemistry", label: "Chemistry", shortLabel: "Chem", s2: "Chemistry" },
  { id: "mathematics", label: "Mathematics", shortLabel: "Math", s2: "Mathematics" },
  { id: "engineering", label: "Engineering", shortLabel: "Eng", s2: "Engineering" },
  { id: "psychology", label: "Psychology", shortLabel: "Psych", s2: "Psychology" },
  { id: "economics", label: "Economics", shortLabel: "Econ", s2: "Economics" },
  { id: "management", label: "Management", shortLabel: "Mgmt", s2: "Business" },
  { id: "environmental-science", label: "Environmental Science", shortLabel: "Environmental", s2: "Environmental Science" },
] as const;

export const DISCIPLINE_CHIPS = SEARCH_DISCIPLINES.filter((d) => d.id !== "any");
export const MOBILE_DISCIPLINE_IDS = new Set([
  "computer-science",
  "medicine",
  "biology",
  "physics",
  "management",
]);

export const SEARCH_YEAR_MIN = 1990;
export const SEARCH_YEAR_MAX = new Date().getFullYear();
export const DEFAULT_YEAR_FROM = 2010;
export const DEFAULT_YEAR_TO = 2019;

export const SEARCH_PERIODS = [
  { id: "any", label: "Any year" },
  { id: "last5", label: "Last 5 years" },
  { id: "last10", label: "Last 10 years" },
  { id: "2020s", label: "2020–present" },
  { id: "2010s", label: "2010–2019" },
  { id: "2000s", label: "2000–2009" },
  { id: "before2000", label: "Before 2000" },
] as const;

export type DisciplineId = (typeof SEARCH_DISCIPLINES)[number]["id"];
export type PeriodId = (typeof SEARCH_PERIODS)[number]["id"];

export type YearRange = { from?: number; to?: number };

export function parseDiscipline(value: string | null | undefined): DisciplineId {
  return SEARCH_DISCIPLINES.some((d) => d.id === value)
    ? (value as DisciplineId)
    : "any";
}

export function parsePeriod(value: string | null | undefined): PeriodId {
  return SEARCH_PERIODS.some((p) => p.id === value) ? (value as PeriodId) : "any";
}

export function periodToRange(period: PeriodId, now = new Date().getFullYear()): YearRange {
  if (period === "last5") return { from: now - 4, to: now };
  if (period === "last10") return { from: now - 9, to: now };
  if (period === "2020s") return { from: 2020, to: now };
  if (period === "2010s") return { from: 2010, to: 2019 };
  if (period === "2000s") return { from: 2000, to: 2009 };
  if (period === "before2000") return { to: 1999 };
  return {};
}

export function parseYear(
  value: string | null | undefined,
  fallback: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(SEARCH_YEAR_MAX, Math.max(SEARCH_YEAR_MIN, Math.round(n)));
}

export function orderedYears(a: number, b: number): { from: number; to: number } {
  return { from: Math.min(a, b), to: Math.max(a, b) };
}

export function resolveYearRange(opts?: {
  period?: string | null;
  from?: string | number | null;
  to?: string | number | null;
}): YearRange {
  const hasFrom = opts?.from != null && opts.from !== "";
  const hasTo = opts?.to != null && opts.to !== "";
  if (hasFrom || hasTo) {
    return orderedYears(
      parseYear(hasFrom ? String(opts?.from) : undefined, SEARCH_YEAR_MIN),
      parseYear(hasTo ? String(opts?.to) : undefined, SEARCH_YEAR_MAX),
    );
  }
  return periodToRange(parsePeriod(opts?.period));
}

export function yearParam(range: YearRange): string | undefined {
  if (range.from != null && range.to != null) return `${range.from}-${range.to}`;
  if (range.from != null) return `${range.from}-`;
  if (range.to != null) return `-${range.to}`;
  return undefined;
}

export function composeSearchQuery(
  query: string,
  discipline: DisciplineId,
  range: YearRange,
): string {
  const parts = [query.trim()];
  const row = SEARCH_DISCIPLINES.find((d) => d.id === discipline);
  if (row && row.id !== "any") parts.push(row.label);
  const years = yearParam(range);
  if (years) parts.push(years);
  return parts.join(" ");
}

export function disciplineField(id: DisciplineId): string | undefined {
  const row = SEARCH_DISCIPLINES.find((d) => d.id === id);
  return row?.s2 || undefined;
}

export function matchesYear(year: number, range: YearRange): boolean {
  if (!year) return true;
  if (range.from != null && year < range.from) return false;
  if (range.to != null && year > range.to) return false;
  return true;
}

export function matchesDiscipline(
  paper: { title: string; abstract?: string; fieldsOfStudy?: string[] },
  discipline: DisciplineId,
): boolean {
  const field = disciplineField(discipline);
  if (!field) return true;
  if (paper.fieldsOfStudy?.some((f) => f.toLowerCase() === field.toLowerCase())) {
    return true;
  }
  const hay = `${paper.title} ${paper.abstract ?? ""} ${paper.fieldsOfStudy?.join(" ") ?? ""}`.toLowerCase();
  const tokens = field.toLowerCase().split(/\s+/);
  return tokens.every((token) => hay.includes(token));
}

export function searchCacheKey(
  query: string,
  discipline: DisciplineId,
  range: YearRange,
): string {
  return `${query.trim().toLowerCase()}|${discipline}|${range.from ?? ""}-${range.to ?? ""}`;
}

export function resultsPath(
  query: string,
  discipline: DisciplineId,
  years: { from: number; to: number },
): string {
  const range = orderedYears(years.from, years.to);
  const q = new URLSearchParams({
    q: query.trim(),
    from: String(range.from),
    to: String(range.to),
  });
  if (discipline !== "any") q.set("discipline", discipline);
  return `/results?${q}`;
}
