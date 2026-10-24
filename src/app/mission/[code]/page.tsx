import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import CopyButton from "@/components/CopyButton";
import { buttonStyle, ghostButtonStyle, inputStyle } from "@/components/ui";
import {
  ME_COOKIE,
  PEOPLE,
  PROJECT_STATUS_LABELS,
  SESSION_KIND_LABELS,
  SESSION_STATUS_LABELS,
  deadlineLabel,
  nextNamePattern,
  pickupPrompt,
  projectFlags,
  sessionName,
  wrapUpPrompt,
} from "@/lib/mission";
import { findProject } from "@/lib/mission-db";
import { logHandoffFromForm, passBaton, startSession, updateProject, updateSession } from "../actions";

export const dynamic = "force-dynamic";

const card = { background: "#1f2937", borderRadius: 12, padding: 14, display: "grid", gap: 8 } as const;
const muted = { color: "#9ca3af", fontSize: 14 } as const;
const dateValue = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function ProjectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const found = await findProject(decodeURIComponent(code));
  if (!found) notFound();
  const project = found;

  const jar = await cookies();
  const meRaw = jar.get(ME_COOKIE)?.value ?? "";
  const who = (PEOPLE as readonly string[]).includes(meRaw) ? meRaw : project.holder;

  const sessions = await db.session.findMany({
    where: { projectId: project.id },
    orderBy: { seq: "desc" },
  });
  const now = new Date();
  const flags = projectFlags(project, now);
  const due = deadlineLabel(project.deadline, now);
  const latestHandoff = sessions.find((s) => s.handoff);

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
      <Link href="/mission" style={{ color: "#a5b4fc" }}>
        ← Mission Control
      </Link>

      <section style={card}>
        <h1 style={{ margin: 0, fontSize: 22 }}>
          {project.code} · {project.name}
        </h1>
        <span style={muted}>
          {PROJECT_STATUS_LABELS[project.status]} · baton with <strong>{project.holder}</strong> since{" "}
          {dateValue(project.batonSince)}
          {due && ` · deadline ${due}`}
        </span>
        {flags.map((f) => (
          <span key={f.text} style={{ fontSize: 13, color: "#fbbf24" }}>
            ● {f.text}
          </span>
        ))}
        {project.nextAction && (
          <span>
            <span style={muted}>Next: </span>
            {project.nextAction}
          </span>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PEOPLE.filter((p) => p !== project.holder).map((p) => (
            <form key={p} action={passBaton.bind(null, project.id, p)}>
              <button style={ghostButtonStyle}>Pass baton to {p}</button>
            </form>
          ))}
          {project.repoUrl && (
            <a href={project.repoUrl} style={{ ...ghostButtonStyle, textDecoration: "none" }}>
              Repo
            </a>
          )}
          {project.claudeProjectUrl && (
            <a href={project.claudeProjectUrl} style={{ ...ghostButtonStyle, textDecoration: "none" }}>
              Claude project
            </a>
          )}
        </div>
      </section>

      <section style={card}>
        <strong>Prompts</strong>
        <span style={muted}>Best order: log the session below first, open it in the chain, and tap Copy start prompt. It titles the new chat for you. Paste the wrap-up prompt at the end.</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <CopyButton text={pickupPrompt(project.code, who)} label="Copy pickup prompt" />
          <CopyButton text={wrapUpPrompt(project.code, who)} label="Copy wrap-up prompt" />
        </div>
      </section>

      {latestHandoff?.handoff && (
        <section style={card}>
          <strong>Latest handoff</strong>
          <span style={muted}>
            {sessionName(project.code, latestHandoff.seq, latestHandoff.kind, latestHandoff.goal, latestHandoff.driver)}
          </span>
          <span style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{latestHandoff.handoff}</span>
        </section>
      )}

      <section style={card}>
        <strong>Start a session</strong>
        <span style={muted}>
          Next name: <code>{nextNamePattern(project, who)}</code>
        </span>
        <form action={startSession.bind(null, project.id)} style={{ display: "grid", gap: 8 }}>
          <input name="goal" placeholder="Goal: a verb and 2-4 words (new phase? start with phase 2:)" required style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select name="kind" style={inputStyle} aria-label="Chat or Code">
              {Object.entries(SESSION_KIND_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select name="driver" defaultValue={who} style={inputStyle} aria-label="Who is driving">
              {PEOPLE.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <input name="url" placeholder="Chat or session link (optional)" style={inputStyle} />
          <input name="branch" placeholder="Branch (optional)" style={inputStyle} />
          <button style={buttonStyle}>Log session</button>
        </form>
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#9ca3af" }}>Chain ({sessions.length})</h2>
        {sessions.length === 0 && <span style={muted}>No sessions logged yet.</span>}
        {sessions.map((s) => (
          <details key={s.id} style={card}>
            <summary style={{ cursor: "pointer" }}>
              <strong>{sessionName(project.code, s.seq, s.kind, s.goal, s.driver)}</strong>
              <span style={muted}>
                {" "}
                · {SESSION_STATUS_LABELS[s.status]} · {dateValue(s.createdAt)}
              </span>
            </summary>
            <form action={updateSession.bind(null, s.id)} style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <select name="status" defaultValue={s.status} style={inputStyle} aria-label="Status">
                {Object.entries(SESSION_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input name="url" defaultValue={s.url ?? ""} placeholder="Link" style={inputStyle} />
              <input name="branch" defaultValue={s.branch ?? ""} placeholder="Branch" style={inputStyle} />
              <textarea name="handoff" defaultValue={s.handoff ?? ""} rows={5} placeholder="Handoff" style={inputStyle} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={buttonStyle}>Save</button>
                {s.url && (
                  <a href={s.url} style={{ ...ghostButtonStyle, textDecoration: "none" }}>
                    Open
                  </a>
                )}
                <CopyButton
                  text={pickupPrompt(project.code, s.driver, sessionName(project.code, s.seq, s.kind, s.goal, s.driver))}
                  label="Copy start prompt"
                />
                <CopyButton text={sessionName(project.code, s.seq, s.kind, s.goal, s.driver)} label="Copy name" />
              </div>
            </form>
          </details>
        ))}
      </section>

      <details style={card}>
        <summary style={{ cursor: "pointer", color: "#a5b4fc" }}>Write a handoff by hand</summary>
        <form action={logHandoffFromForm.bind(null, project.id)} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <textarea name="handoff" rows={5} required placeholder="What got done, what is half-done, decisions, branch state" style={inputStyle} />
          <input name="nextAction" defaultValue={project.nextAction ?? ""} placeholder="Next action" style={inputStyle} />
          <input name="blockedOn" defaultValue={project.blockedOn ?? ""} placeholder="Blocked on (optional)" style={inputStyle} />
          <select name="batonTo" defaultValue="" style={inputStyle} aria-label="Pass baton">
            <option value="">Keep baton with {project.holder}</option>
            {PEOPLE.filter((p) => p !== project.holder).map((p) => (
              <option key={p} value={p}>
                Pass to {p}
              </option>
            ))}
          </select>
          <select name="sessionStatus" defaultValue="HANDED_OFF" style={inputStyle} aria-label="Session status">
            <option value="HANDED_OFF">Handed off</option>
            <option value="DONE">Done</option>
          </select>
          <button style={buttonStyle}>Save handoff</button>
        </form>
      </details>

      <details style={card}>
        <summary style={{ cursor: "pointer", color: "#a5b4fc" }}>Edit project</summary>
        <form action={updateProject.bind(null, project.id)} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <input name="name" defaultValue={project.name} required style={inputStyle} />
          <select name="status" defaultValue={project.status} style={inputStyle} aria-label="Status">
            {Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input name="deadline" type="date" defaultValue={dateValue(project.deadline)} style={inputStyle} aria-label="Deadline" />
          <input name="nextAction" defaultValue={project.nextAction ?? ""} placeholder="Next action" style={inputStyle} />
          <input name="blockedOn" defaultValue={project.blockedOn ?? ""} placeholder="Blocked on" style={inputStyle} />
          <input name="repoUrl" defaultValue={project.repoUrl ?? ""} placeholder="Repo link" style={inputStyle} />
          <input name="claudeProjectUrl" defaultValue={project.claudeProjectUrl ?? ""} placeholder="Claude project link" style={inputStyle} />
          <textarea name="notes" defaultValue={project.notes ?? ""} rows={4} placeholder="Notes" style={inputStyle} />
          <button style={buttonStyle}>Save</button>
        </form>
      </details>
    </main>
  );
}
