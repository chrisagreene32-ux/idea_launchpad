"use client";

import { useState, useTransition } from "react";
import { changeStatus } from "@/app/actions";
import { EFFORT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { resumePrompt } from "@/lib/start";
import StartLink from "./StartLink";
import { buttonStyle, cardStyle, ghostButtonStyle, inputStyle } from "./ui";

const smallButton = { textDecoration: "none", textAlign: "center" as const, fontSize: 14, padding: "8px 12px" };

export type BoardIdea = {
  id: string;
  text: string;
  status: string;
  project: string | null;
  priority: string | null;
  effort: string | null;
  nextStep: string | null;
  hasBrief: boolean;
  claudeProjectUrl: string | null;
  chatUrl: string | null;
  tags: string[];
};

const PRIORITY_COLORS: Record<string, string> = { HIGH: "#ff7a59", MEDIUM: "#f5c542", LOW: "#d2b48c" };

function Badge({ children, color = "#6b4426" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: color, borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#24150d", fontWeight: 600 }}>
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
        ...cardStyle,
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
        {idea.effort && <Badge color="#8fd3c8">{EFFORT_LABELS[idea.effort]}</Badge>}
        {idea.project && <Badge color="#a8e063">📁 {idea.project}</Badge>}
        {idea.hasBrief && <Badge color="#fcd34d">Brief</Badge>}
      </div>
      {open && idea.nextStep && <p style={{ margin: 0, fontSize: 14 }}>➡️ {idea.nextStep}</p>}
      {idea.status !== "DONE" && idea.chatUrl ? (
        <a
          href={idea.chatUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...buttonStyle, ...smallButton }}
        >
          Continue
        </a>
      ) : idea.status !== "DONE" && idea.status !== "NEW" && idea.claudeProjectUrl ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <StartLink projectUrl={idea.claudeProjectUrl} prompt={resumePrompt(idea)} label="Continue" />
        </div>
      ) : (
        idea.claudeProjectUrl && (
          <a
            href={idea.claudeProjectUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...ghostButtonStyle, ...smallButton }}
          >
            Open project
          </a>
        )
      )}
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
