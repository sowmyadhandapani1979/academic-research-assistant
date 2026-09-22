function httpUrl(value?: string): string | undefined {
  const direct = value?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  return undefined;
}

export function paperSourceUrl(paper: { id: string; url?: string }): string | undefined {
  const direct = httpUrl(paper.url);
  if (direct) return direct;
  if (/^[a-f0-9]{40}$/i.test(paper.id)) {
    return `https://www.semanticscholar.org/paper/${paper.id}`;
  }
  return undefined;
}

export function paperPdfUrl(paper: { url?: string; pdfUrl?: string }): string | undefined {
  const explicit = httpUrl(paper.pdfUrl);
  if (explicit) return explicit;
  const url = httpUrl(paper.url);
  if (!url) return undefined;
  if (/\.pdf(?:$|[?#])/i.test(url)) return url;
  const arxiv = url.match(
    /arxiv\.org\/(?:abs|pdf|html)\/(\d+\.\d+(?:v\d+)?)/i,
  );
  if (arxiv) return `https://arxiv.org/pdf/${arxiv[1]}`;
  return undefined;
}

export function paperPdfFilename(paper: { id: string }): string {
  return `${paper.id}.pdf`;
}

export function paperHasFullText(paper: { url?: string; pdfUrl?: string }): boolean {
  return Boolean(paperPdfUrl(paper));
}
