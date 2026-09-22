import type { Paper, SpeechUnit } from "../types";

export function paperToUnits(paper: Paper): SpeechUnit[] {
  const units: SpeechUnit[] = [
    {
      id: "title",
      kind: "title",
      text: `${paper.title}, by ${paper.authorsShort}, ${paper.year}.`,
    },
  ];
  if (!paper.pdfIngested) {
    units.push({
      id: "abstract",
      kind: "abstract",
      heading: "Abstract",
      text: `Abstract. ${paper.abstract}`,
    });
  }
  paper.sections.forEach((section, si) => {
    units.push({
      id: `h-${si}`,
      kind: "heading",
      heading: section.heading,
      text: section.heading,
    });
    section.paragraphs.forEach((p, pi) => {
      units.push({
        id: `p-${si}-${pi}`,
        kind: "paragraph",
        heading: section.heading,
        text: p,
      });
    });
  });
  return units;
}

export function findUnitIndex(
  units: SpeechUnit[],
  target: "start" | "abstract" | "introduction" | string,
): number {
  if (target === "start") return 0;
  if (target === "abstract") {
    return Math.max(0, units.findIndex((u) => u.kind === "abstract"));
  }
  const needle = target.toLowerCase();
  const intro = units.findIndex((u) =>
    (u.heading ?? u.text).toLowerCase().includes("introduction"),
  );
  if (target === "introduction" && intro >= 0) return intro;
  const named = units.findIndex((u) =>
    (u.heading ?? "").toLowerCase().includes(needle),
  );
  return named >= 0 ? named : 0;
}

export function nextSectionIndex(units: SpeechUnit[], from: number, dir: 1 | -1) {
  if (dir === 1) {
    for (let i = from + 1; i < units.length; i++) {
      if (units[i].kind === "heading") return i;
    }
    return Math.min(units.length - 1, from + 1);
  }
  for (let i = from - 1; i >= 0; i--) {
    if (units[i].kind === "heading") return i;
  }
  return 0;
}
