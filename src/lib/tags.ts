export function parseTags(raw: string): string[] {
  const tags = raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}
