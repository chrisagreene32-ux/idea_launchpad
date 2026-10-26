"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", fontWeight: 400 }}>Unlock the tiki hut 🛖</h1>
      <form action={action} style={{ display: "grid", gap: 12 }}>
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          style={{ padding: 14, fontSize: 18, borderRadius: 8, border: "1px solid #6b4426" }}
        />
        <button disabled={pending} style={{ padding: 14, fontSize: 18, borderRadius: 8 }}>
          {pending ? "Checking…" : "Unlock"}
        </button>
        {error && <p style={{ color: "#ff9d7a", margin: 0 }}>{error}</p>}
      </form>
    </main>
  );
}
