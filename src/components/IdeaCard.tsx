"use client";

import { useState } from "react";
import { archiveIdea, deleteIdea, unarchiveIdea, updateIdea } from "@/app/actions";
import Link from "next/link";
import { EFFORT_LABELS, OUTCOME_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { interviewPrompt, projectPackage } from "@/lib/start";
import CopyButton from "./CopyButton";
import OptionalFields from "./OptionalFields";
import StartLink from "./StartLink";
import StartPanel from "./StartPanel";
import { buttonStyle, cardStyle as woodCard, ghostButtonStyle, inputStyle } from "./ui";

export type IdeaView = {
  id: string;
  text: string;
  tags: string[];
  status: string;
  project: string | null;
  priority: string | null;
  effort: string | null;
  nextStep: string | null;
  outcome: string | null;
  claudeProjectUrl: string | null;
  brief: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
};

export default function IdeaCard({ idea }: { idea: IdeaView }) {
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [starting, setStarting] = useState(false);

  const cardStyle = {
    ...woodCard,
    padding: 14,
    display: "grid",
    gap: 8,
  } as const;

  if (editing) {
    return (
      <form
        style={cardStyle}
        action={async (formData) => {
          await updateIdea(idea.id, formData);
          setEditing(false);
        }}
      >
        <textarea name="text" defaultValue={idea.text} required rows={4} style={inputStyle} />
        <OptionalFields
          defaults={{
            tags: idea.tags.join(" "),
            project: idea.project ?? "",
            nextStep: idea.nextStep ?? "",
            priority: idea.priority,
            effort: idea.effort,
          }}
        />
        <input
          name="claudeProjectUrl"
          defaultValue={idea.claudeProjectUrl ?? ""}
          placeholder="Claude project link (https://claude.ai/project/…)"
          style={inputStyle}
        />
        <select name="status" defaultValue={idea.status} style={inputStyle}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={buttonStyle}>Save</button>
          <button type="button" style={ghostButtonStyle} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article style={cardStyle}>
      <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{idea.text}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 13, color: "#d2b48c" }}>
        {idea.archivedAt && idea.outcome ? (
          <span>🗄️ {OUTCOME_LABELS[idea.outcome]} {new Date(idea.archivedAt).toLocaleDateString()} ·</span>
        ) : null}
        <span>{STATUS_LABELS[idea.status]}</span>
        {idea.priority && <span>· {PRIORITY_LABELS[idea.priority]} priority</span>}
        {idea.effort && <span>· {EFFORT_LABELS[idea.effort]}</span>}
        {idea.project && (
          <Link href={`/?project=${encodeURIComponent(idea.project)}`} style={{ color: "inherit" }}>
            · 📁 {idea.project}
          </Link>
        )}
        {idea.tags.map((t) => (
          <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} style={{ color: "inherit" }}>
            #{t}
          </Link>
        ))}
        <span>· {new Date(idea.createdAt).toLocaleDateString()}</span>
      </div>
      {idea.nextStep && <p style={{ margin: 0, fontSize: 14 }}>➡️ {idea.nextStep}</p>}
      {idea.brief && (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 14 }}>Brief</summary>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 14, margin: "8px 0 0" }}>{idea.brief}</p>
        </details>
      )}
      {idea.notes && (
        <details>
          <summary style={{ cursor: "pointer", fontSize: 14 }}>Notes</summary>
          <p style={{ whiteSpace: "pre-wrap", fontSize: 14, margin: "8px 0 0" }}>{idea.notes}</p>
        </details>
      )}
      {starting && !idea.claudeProjectUrl && (
        <StartPanel ideaId={idea.id} pkg={projectPackage(idea)} onClose={() => setStarting(false)} />
      )}
      {archiving ? (
        <form
          style={{ display: "flex", gap: 8 }}
          action={async (formData) => {
            await archiveIdea(idea.id, String(formData.get("outcome")));
            setArchiving(false);
          }}
        >
          <select name="outcome" defaultValue="SHIPPED" aria-label="Outcome" style={inputStyle}>
            {Object.entries(OUTCOME_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <button style={buttonStyle}>Archive</button>
          <button type="button" style={ghostButtonStyle} onClick={() => setArchiving(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!idea.archivedAt &&
            (idea.claudeProjectUrl ? (
              <>
                <StartLink projectUrl={idea.claudeProjectUrl} prompt={interviewPrompt(idea)} />
                <CopyButton text={interviewPrompt(idea)} label="Copy prompt" />
                <a
                  href={idea.claudeProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...ghostButtonStyle, textDecoration: "none" }}
                >
                  Open project
                </a>
              </>
            ) : (
              <button style={buttonStyle} onClick={() => setStarting((v) => !v)}>
                Start
              </button>
            ))}
          <button style={ghostButtonStyle} onClick={() => setEditing(true)}>
            Edit
          </button>
          {idea.archivedAt ? (
            <button style={ghostButtonStyle} onClick={() => unarchiveIdea(idea.id)}>
              Restore
            </button>
          ) : (
            <button style={ghostButtonStyle} onClick={() => setArchiving(true)}>
              Archive
            </button>
          )}
          <button
            style={ghostButtonStyle}
            onClick={() => {
              if (confirm("Delete this idea?")) deleteIdea(idea.id);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
