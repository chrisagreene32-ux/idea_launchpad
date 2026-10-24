"use client";

import { useActionState } from "react";
import { buttonStyle, inputStyle } from "@/components/ui";
import { approve, type AuthorizeParams } from "./actions";

export default function AuthorizeForm({ params, clientName }: { params: AuthorizeParams; clientName: string }) {
  const [error, action, pending] = useActionState(approve, null);
  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Idea Launchpad</h1>
      <p>
        <strong>{clientName}</strong> wants to read and update your ideas. Enter your password to allow it.
      </p>
      <form action={action} style={{ display: "grid", gap: 12 }}>
        {Object.entries(params).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          autoCapitalize="off"
          style={{ ...inputStyle, padding: 14, fontSize: 18 }}
        />
        <button disabled={pending} style={{ ...buttonStyle, padding: 14, fontSize: 18 }}>
          {pending ? "Checking…" : "Allow access"}
        </button>
        {error && <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p>}
      </form>
    </main>
  );
}
