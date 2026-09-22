import type { Paper } from "../types";

/** Turn Semantic Scholar MathML/HTML into a single readable line of text. */
export function scholarlyPlainText(input: string, maxLen = 400): string {
  if (!input) return "";
  let s = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&[a-z]+;/gi, " ");
  s = s
    .replace(/<\s*br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/<(?:mml:|\/mml:|math\b)[\s\S]*$/i, "")
    .replace(/<[^>]*$/g, "")
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > maxLen) s = `${s.slice(0, maxLen - 1).trimEnd()}…`;
  return s;
}

export function cleanPaper(paper: Paper): Paper {
  return {
    ...paper,
    title: scholarlyPlainText(paper.title, 240),
    abstract: scholarlyPlainText(paper.abstract, 12_000),
    summary: scholarlyPlainText(paper.summary, 800),
    takeaways: scholarlyPlainText(paper.takeaways, 400),
    sections: paper.sections.map((section) => ({
      heading: scholarlyPlainText(section.heading, 160),
      paragraphs: section.paragraphs.map((p) => scholarlyPlainText(p, 4000)),
    })),
  };
}
