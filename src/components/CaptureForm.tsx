"use client";

import { useRef, useState } from "react";
import { addIdea } from "@/app/actions";
import OptionalFields from "./OptionalFields";
import { buttonStyle, inputStyle } from "./ui";

export default function CaptureForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);

  async function submit(formData: FormData) {
    setSaving(true);
    try {
      await addIdea(formData);
      formRef.current?.reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} action={submit} style={{ display: "grid", gap: 8 }}>
      <textarea
        name="text"
        required
        rows={4}
        placeholder="New idea…"
        style={{ ...inputStyle, fontSize: 18 }}
      />
      <details>
        <summary style={{ cursor: "pointer", color: "#9ca3af" }}>More details (optional)</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <OptionalFields />
        </div>
      </details>
      <button disabled={saving} style={buttonStyle}>
        {saving ? "Saving…" : "Save idea"}
      </button>
    </form>
  );
}
