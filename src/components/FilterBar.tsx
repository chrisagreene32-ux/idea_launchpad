import Link from "next/link";
import { STATUS_LABELS } from "@/lib/labels";
import { buttonStyle, ghostButtonStyle, inputStyle } from "./ui";

export type Filters = { q: string; tag: string; project: string; status: string };

export default function FilterBar({
  filters,
  tags,
  projects,
}: {
  filters: Filters;
  tags: string[];
  projects: string[];
}) {
  const active = Object.values(filters).some(Boolean);
  return (
    <form method="GET" style={{ display: "grid", gap: 8 }}>
      <input name="q" defaultValue={filters.q} placeholder="Search ideas…" type="search" style={inputStyle} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <select name="status" defaultValue={filters.status} aria-label="Status" style={inputStyle}>
          <option value="">Any status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select name="tag" defaultValue={filters.tag} aria-label="Tag" style={inputStyle}>
          <option value="">Any tag</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>
        <select name="project" defaultValue={filters.project} aria-label="Project" style={inputStyle}>
          <option value="">Any project</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={buttonStyle}>Apply</button>
        {active && (
          <Link href="/" style={{ ...ghostButtonStyle, textDecoration: "none" }}>
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
