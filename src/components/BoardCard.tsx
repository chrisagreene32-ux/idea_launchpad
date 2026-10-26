"use client";

import { useState, useTransition } from "react";
import { changeStatus } from "@/app/actions";
import { EFFORT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { inputStyle } from "./ui";

export type BoardIdea = {
  id: string;
  text: string;
  status: string;
  project: string | null;
  priority: string | null;
  effort: string | null;
  nextStep: string | null;
  hasBrief: boolean;
};

const PRIORITY_COLORS: Record<string, string> = { HIGH: "#f87171", MEDIUM: "#fbbf24", LOW: "#9ca3af" };

function Badge({ children, color = "#374151" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: color, borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#111827", fontWeight: 600 }}>
      {children}
    </span>
  );
}

export default function BoardCard({ idea }: { idea: BoardIdea }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <article
      style={{
        background: "#1f2937",
        borderRadius: 10,
        padding: 12,
        display: "grid",
        gap: 8,
        opacity: pending ? 0.5 : 1,
      }}
    >
      <p
        onClick={() => setOpen((v) => !v)}
        style={{
          margin: 0,
          cursor: "pointer",
          overflowWrap: "anywhere",
          whiteSpace: open ? "pre-wrap" : "normal",
          ...(open
            ? {}
            : { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }),
        }}
      >
        {idea.text}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {idea.priority && <Badge color={PRIORITY_COLORS[idea.priority]}>{PRIORITY_LABELS[idea.priority]}</Badge>}
        {idea.effort && <Badge color="#a5b4fc">{EFFORT_LABELS[idea.effort]}</Badge>}
        {idea.project && <Badge color="#6ee7b7">📁 {idea.project}</Badge>}
        {idea.hasBrief && <Badge color="#fcd34d">Brief</Badge>}
      </div>
      {open && idea.nextStep && <p style={{ margin: 0, fontSize: 14 }}>➡️ {idea.nextStep}</p>}
      <select
        aria-label="Move to"
        value={idea.status}
        onChange={(e) => startTransition(() => changeStatus(idea.id, e.target.value))}
        style={{ ...inputStyle, padding: 8, fontSize: 14 }}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            Move to: {label}
          </option>
        ))}
      </select>
    </article>
  );
}
