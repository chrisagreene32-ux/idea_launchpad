import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import CopyButton from "@/components/CopyButton";
import { buttonStyle, ghostButtonStyle, inputStyle } from "@/components/ui";
import {
  ME_COOKIE,
  PEOPLE,
  PROJECT_STATUS_LABELS,
  deadlineLabel,
  pickupPrompt,
  projectFlags,
  rankProjects,
} from "@/lib/mission";
import { addProject, loadStarterProjects, setMe } from "./actions";

export const dynamic = "force-dynamic";

const card = { background: "#1f2937", borderRadius: 12, padding: 14, display: "grid", gap: 8 } as const;
const muted = { color: "#9ca3af", fontSize: 14 } as const;
const FLAG_COLORS: Record<string, string> = {
  deadline: "#f87171",
  blocked: "#fbbf24",
  stale: "#9ca3af",
  baton: "#60a5fa",
};

export default async function MissionControl() {
  const jar = await cookies();
  const meRaw = jar.get(ME_COOKIE)?.value ?? null;
  const me = meRaw && (PEOPLE as readonly string[]).includes(meRaw) ? meRaw : null;

  const projects = await db.project.findMany({ orderBy: { createdAt: "asc" } });
  const now = new Date();
  const active = rankProjects(
    projects.filter((p) => p.status === "ACTIVE"),
    me,
    now,
  );
  const others = projects.filter((p) => p.status !== "ACTIVE");
  const top = active[0];
  const who = me ?? "Chris";

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Mission Control</h1>
        <Link href="/" style={{ color: "#a5b4fc" }}>
          Ideas →
        </Link>
      </header>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={muted}>I&apos;m:</span>
        {PEOPLE.map((p) => (
          <form key={p} action={setMe.bind(null, p)}>
            <button style={me === p ? buttonStyle : ghostButtonStyle}>{p}</button>
          </form>
        ))}
        {!me && <span style={muted}>Pick one so the picks fit you</span>}
      </div>

      {projects.length === 0 && (
        <section style={card}>
          <strong>No projects yet</strong>
          <span style={muted}>
            Load the starter set (editable afterwards), or add your own below.
          </span>
          <form action={loadStarterProjects}>
            <button style={buttonStyle}>Load starter projects</button>
          </form>
        </section>
      )}

      {top && (
        <section style={{ ...card, border: "1px solid #6366f1" }}>
          <span style={{ ...muted, textTransform: "uppercase", letterSpacing: 1 }}>Do this next</span>
          <Link href={`/mission/${top.project.code}`} style={{ color: "#f9fafb", textDecoration: "none" }}>
            <strong style={{ fontSize: 18 }}>
              {top.project.code} · {top.project.name}
            </strong>
          </Link>
          {top.project.nextAction && <span>{top.project.nextAction}</span>}
          {top.reasons.length > 0 && <span style={muted}>Why: {top.reasons.join(", ")}</span>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <CopyButton text={pickupPrompt(top.project.code, who)} label="Copy pickup prompt" />
            <Link href={`/mission/${top.project.code}`} style={{ ...ghostButtonStyle, textDecoration: "none" }}>
              Open
            </Link>
          </div>
          {active.length > 1 && (
            <span style={muted}>
              Then: {active.slice(1, 3).map((a) => a.project.code).join(", ")}
            </span>
          )}
        </section>
      )}

      {active.length > 0 && (
        <section style={{ display: "grid", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: "#9ca3af" }}>Active ({active.length})</h2>
          {active.map(({ project: p }) => (
            <ProjectRow key={p.id} p={p} now={now} />
          ))}
        </section>
      )}

      {others.length > 0 && (
        <details>
          <summary style={{ color: "#9ca3af", cursor: "pointer" }}>
            Waiting, parked, done ({others.length})
          </summary>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {others.map((p) => (
              <ProjectRow key={p.id} p={p} now={now} />
            ))}
          </div>
        </details>
      )}

      <details>
        <summary style={{ color: "#a5b4fc", cursor: "pointer" }}>Add a project</summary>
        <form action={addProject} style={{ ...card, marginTop: 10 }}>
          <input name="name" placeholder="Project name" required style={inputStyle} />
          <input
            name="code"
            placeholder="Short code, e.g. SCHED"
            required
            maxLength={8}
            style={{ ...inputStyle, textTransform: "uppercase" }}
          />
          <select name="holder" defaultValue={who} style={inputStyle} aria-label="Who has it">
            {PEOPLE.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <input name="deadline" type="date" style={inputStyle} aria-label="Deadline" />
          <input name="nextAction" placeholder="Next action" style={inputStyle} />
          <button style={buttonStyle}>Add</button>
        </form>
      </details>
    </main>
  );
}

function ProjectRow({
  p,
  now,
}: {
  p: {
    id: string;
    code: string;
    name: string;
    status: ProjectStatus;
    holder: string;
    deadline: Date | null;
    nextAction: string | null;
    blockedOn: string | null;
    batonSince: Date;
    updatedAt: Date;
  };
  now: Date;
}) {
  const flags = projectFlags(p, now);
  const due = deadlineLabel(p.deadline, now);
  return (
    <Link href={`/mission/${p.code}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong>
            {p.code} · {p.name}
          </strong>
          <span style={muted}>{p.holder}</span>
        </div>
        {p.status !== "ACTIVE" && <span style={muted}>{PROJECT_STATUS_LABELS[p.status]}</span>}
        {p.nextAction && <span style={{ fontSize: 14 }}>{p.nextAction}</span>}
        {due && <span style={muted}>Deadline {due}</span>}
        {flags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {flags.map((f) => (
              <span key={f.text} style={{ fontSize: 12, color: FLAG_COLORS[f.kind] }}>
                ● {f.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
