export function paperSourceUrl(paper: { id: string; url?: string }): string | undefined {
  const direct = paper.url?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  if (/^[a-f0-9]{40}$/i.test(paper.id)) {
    return `https://www.semanticscholar.org/paper/${paper.id}`;
  }
  return undefined;
}
