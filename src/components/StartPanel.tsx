"use client";

import { useState } from "react";
import { setProjectLink } from "@/app/actions";
import CopyButton from "./CopyButton";
import { buttonStyle, ghostButtonStyle, inputStyle } from "./ui";

type Package = { name: string; description: string; instructions: string };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <strong style={{ fontSize: 14 }}>{label}</strong>
      <pre
        style={{
          margin: 0,
          padding: 10,
          background: "#111827",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          fontSize: 13,
          maxHeight: 180,
          overflow: "auto",
        }}
      >
        {value}
      </pre>
      <div>
        <CopyButton text={value} label={`Copy ${label.toLowerCase()}`} />
      </div>
    </div>
  );
}

export default function StartPanel({
  ideaId,
  pkg,
  onClose,
}: {
  ideaId: string;
  pkg: Package;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: 12, background: "#111827", padding: 12, borderRadius: 10 }}>
      <strong>Set up the Claude project (one time)</strong>
      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, display: "grid", gap: 4 }}>
        <li>In Claude, create a new project and paste in the three items below.</li>
        <li>Copy the project&apos;s link from your browser and paste it here.</li>
      </ol>
      <Field label="Project name" value={pkg.name} />
      <Field label="Project description" value={pkg.description} />
      <Field label="Project instructions" value={pkg.instructions} />
      <form
        style={{ display: "grid", gap: 8 }}
        action={async (formData) => {
          const message = await setProjectLink(ideaId, formData);
          setError(message);
          if (!message) onClose();
        }}
      >
        <input
          name="claudeProjectUrl"
          type="url"
          required
          placeholder="https://claude.ai/project/…"
          style={inputStyle}
        />
        {error && <p style={{ color: "#fca5a5", margin: 0, fontSize: 14 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={buttonStyle}>Save project link</button>
          <button type="button" style={ghostButtonStyle} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
