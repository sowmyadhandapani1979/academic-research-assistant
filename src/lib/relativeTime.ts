export function relativeTime(ts: number) {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `Added ${s} sec ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `Added ${m} min ago`;
  const h = Math.round(m / 60);
  return `Added ${h} hr ago`;
}
