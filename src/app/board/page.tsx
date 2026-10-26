import { db } from "@/lib/db";
import BoardCard from "@/components/BoardCard";
import NavTabs from "@/components/NavTabs";
import { STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

const COLUMN_COLORS: Record<string, string> = {
  NEW: "#60a5fa",
  INTERVIEWED: "#c084fc",
  BUILDING: "#fbbf24",
  PARKED: "#9ca3af",
  DONE: "#34d399",
};

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default async function Board() {
  const ideas = await db.idea.findMany({ where: { archivedAt: null }, orderBy: { createdAt: "desc" } });

  return (
    <main style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ maxWidth: 640, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <NavTabs current="board" />
      </div>
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 16,
          alignItems: "flex-start",
        }}
      >
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const column = ideas
            .filter((i) => i.status === status)
            .sort(
              (a, b) =>
                (a.priority ? PRIORITY_RANK[a.priority] : 3) - (b.priority ? PRIORITY_RANK[b.priority] : 3),
            );
          return (
            <section
              key={status}
              style={{
                flex: "0 0 min(85vw, 300px)",
                scrollSnapAlign: "start",
                background: "#111827",
                border: "1px solid #1f2937",
                borderTop: `4px solid ${COLUMN_COLORS[status]}`,
                borderRadius: 12,
                padding: 10,
                display: "grid",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16 }}>
                {label} <span style={{ color: "#9ca3af", fontWeight: 400 }}>{column.length}</span>
              </h2>
              {column.length === 0 && <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Nothing here</p>}
              {column.map((idea) => (
                <BoardCard
                  key={idea.id}
                  idea={{
                    id: idea.id,
                    text: idea.text,
                    status: idea.status,
                    project: idea.project,
                    priority: idea.priority,
                    effort: idea.effort,
                    nextStep: idea.nextStep,
                    hasBrief: !!idea.brief,
                  }}
                />
              ))}
            </section>
          );
        })}
      </div>
    </main>
  );
}
