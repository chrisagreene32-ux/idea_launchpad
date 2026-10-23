"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>Idea Launchpad</h1>
      <form action={action} style={{ display: "grid", gap: 12 }}>
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          style={{ padding: 14, fontSize: 18, borderRadius: 8, border: "1px solid #374151" }}
        />
        <button disabled={pending} style={{ padding: 14, fontSize: 18, borderRadius: 8 }}>
          {pending ? "Checking…" : "Unlock"}
        </button>
        {error && <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p>}
      </form>
    </main>
  );
}
