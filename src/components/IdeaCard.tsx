"use client";

import { useState } from "react";
import { deleteIdea, updateIdea } from "@/app/actions";
import Link from "next/link";
import { EFFORT_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import OptionalFields from "./OptionalFields";
import { buttonStyle, ghostButtonStyle, inputStyle } from "./ui";

export type IdeaView = {
  id: string;
  text: string;
  tags: string[];
  status: string;
  project: string | null;
  priority: string | null;
  effort: string | null;
  nextStep: string | null;
  createdAt: string;
};

export default function IdeaCard({ idea }: { idea: IdeaView }) {
  const [editing, setEditing] = useState(false);

  const cardStyle = {
    background: "#1f2937",
    borderRadius: 12,
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 13, color: "#9ca3af" }}>
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
      <div style={{ display: "flex", gap: 8 }}>
        <button style={ghostButtonStyle} onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          style={ghostButtonStyle}
          onClick={() => {
            if (confirm("Delete this idea?")) deleteIdea(idea.id);
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
