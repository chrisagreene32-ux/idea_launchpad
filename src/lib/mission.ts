import type { Project } from "@prisma/client";

export const PEOPLE = ["Chris", "Kat"] as const;
export const ME_COOKIE = "mc_me";

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  WAITING: "Waiting",
  PARKED: "Parked",
  DONE: "Done",
};

export const SESSION_KIND_LABELS: Record<string, string> = {
  CHAT: "Chat",
  CODE: "Code",
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  HANDED_OFF: "Handed off",
  DONE: "Done",
};

const DAY = 86_400_000;

export function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / DAY);
}

/** Whole days from now until the deadline (negative once it has passed). */
export function daysUntil(deadline: Date, now = new Date()) {
  return Math.ceil((deadline.getTime() - now.getTime()) / DAY);
}

export function deadlineLabel(deadline: Date | null, now = new Date()) {
  if (!deadline) return null;
  const d = daysUntil(deadline, now);
  const date = deadline.toISOString().slice(0, 10);
  if (d < 0) return `${date} (${-d}d overdue)`;
  if (d === 0) return `${date} (today)`;
  return `${date} (${d}d)`;
}

const seqLabel = (code: string, seq: number) => `${code}-${String(seq).padStart(3, "0")}`;
const initialOf = (driver: string) => driver.trim().charAt(0).toUpperCase() || "?";

/**
 * Chat name rule: CODE-001 · Chat or Code · goal · driver initial.
 * The padded number keeps search results in order. Start the goal with a verb,
 * 2 to 4 words. To mark a new phase, begin it with "phase 2:".
 */
export function sessionName(code: string, seq: number, kind: string, goal: string, driver: string) {
  const label = kind === "CODE" ? "Code" : "Chat";
  return `${seqLabel(code, seq)} · ${label} · ${goal.trim() || "goal"} · ${initialOf(driver)}`;
}

export function nextNamePattern(project: Pick<Project, "code" | "nextSeq">, driver: string) {
  return `${seqLabel(project.code, project.nextSeq)} · Chat or Code · <goal> · ${initialOf(driver)}`;
}

type Scored = Pick<
  Project,
  "status" | "holder" | "deadline" | "nextAction" | "blockedOn" | "batonSince" | "updatedAt"
>;

export type Pick_ = { score: number; reasons: string[] };

/**
 * Deadlines come first, then who holds the baton, then neglect. A blocked project
 * drops down because there is nothing to do on it yet.
 */
export function scoreProject(p: Scored, me: string | null, now = new Date()): Pick_ {
  if (p.status !== "ACTIVE") return { score: -100, reasons: [] };
  let score = 0;
  const reasons: string[] = [];

  if (p.deadline) {
    const d = daysUntil(p.deadline, now);
    if (d < 0) {
      score += 12;
      reasons.push(`deadline passed ${-d} day${d === -1 ? "" : "s"} ago`);
    } else if (d <= 7) {
      score += 10;
      reasons.push(`deadline in ${d} day${d === 1 ? "" : "s"}`);
    } else if (d <= 21) {
      score += 6;
      reasons.push(`deadline in ${d} days`);
    } else if (d <= 45) {
      score += 2;
      reasons.push(`deadline in ${d} days`);
    }
  }

  if (me && p.holder === me) {
    score += 3;
    reasons.push("you hold the baton");
  } else if (me && p.holder !== me) {
    score -= 2;
  }

  const idle = daysBetween(p.updatedAt, now);
  if (idle >= 7) {
    score += 2;
    reasons.push(`untouched for ${idle} days`);
  }

  if (p.blockedOn) {
    score -= 4;
    reasons.push(`blocked on ${p.blockedOn}`);
  }
  if (p.nextAction) score += 1;

  return { score, reasons };
}

export function rankProjects<T extends Scored>(projects: T[], me: string | null, now = new Date()) {
  return projects
    .map((project) => ({ project, ...scoreProject(project, me, now) }))
    .sort((a, b) => b.score - a.score);
}

export type Flag = { kind: "deadline" | "stale" | "blocked" | "baton"; text: string };

export function projectFlags(p: Scored, now = new Date()): Flag[] {
  const flags: Flag[] = [];
  if (p.status === "ACTIVE" && p.deadline) {
    const d = daysUntil(p.deadline, now);
    if (d <= 21) flags.push({ kind: "deadline", text: d < 0 ? "Past deadline" : `${d}d to deadline` });
  }
  if (p.status === "ACTIVE" && p.blockedOn) flags.push({ kind: "blocked", text: `Blocked: ${p.blockedOn}` });
  const idle = daysBetween(p.updatedAt, now);
  if (p.status === "ACTIVE" && idle >= 7) flags.push({ kind: "stale", text: `Quiet ${idle}d` });
  const batonIdle = daysBetween(p.batonSince, now);
  if (p.status === "ACTIVE" && batonIdle >= 4) flags.push({ kind: "baton", text: `${p.holder} has had it ${batonIdle}d` });
  return flags;
}

/**
 * Paste at the START of a new chat or Code session. With a logged session's name,
 * the first line asks Claude to title the chat with it, and Claude skips logging
 * it again.
 */
export function pickupPrompt(code: string, who: string, name?: string) {
  const header = name
    ? [
        `[Chat Title: ${name}] Ignore all previous naming conventions. Please title this conversation "${name}". Now, for my actual request...`,
      ]
    : [];
  const logging = name
    ? `This chat is already logged as "${name}", so don't call start_session. Tell me which earlier chat it continues.`
    : `Then call start_session to log this chat (ask me for a short goal that starts with a verb, and whether this is a Chat or Code session; if it begins a new phase, start the goal with "phase N:"), and tell me the exact name to give this chat and which earlier chat it continues.`;
  return [
    ...header,
    `I'm ${who}, picking up project ${code}.`,
    `Use the Idea Launchpad connector: call get_project with code "${code}" and read the latest handoff and next action.`,
    logging,
    `Recap in 3 lines, then ask me one question to begin.`,
  ].join("\n");
}

/** Paste at the END of a chat or Code session. */
export function wrapUpPrompt(code: string, who: string) {
  return [
    `I'm ${who}, wrapping up this session on project ${code}.`,
    `Use the Idea Launchpad connector: call log_handoff for project "${code}" with:`,
    `- handoff: what got done, what is half-done, decisions made, and the exact state of any branch or deploy. No client or therapist names or other real health data.`,
    `- next_action: the single next step.`,
    `- blocked_on: anything we are waiting on, or leave it empty.`,
    `- baton_to: Chris or Kat, whoever picks it up next (or the same person).`,
    `- session_status: HANDED_OFF if someone continues it, DONE if finished.`,
    `Then show me the handoff you saved in 4 lines or less.`,
  ].join("\n");
}
