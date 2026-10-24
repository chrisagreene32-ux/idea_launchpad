import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Effort, Priority, Status, type Idea, type Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { EFFORT_LABELS, OUTCOME_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "./labels";
import {
  PEOPLE,
  PROJECT_STATUS_LABELS,
    SESSION_STATUS_LABELS,
  deadlineLabel,
  rankProjects,
  sessionName,
} from "./mission";
import { createSession, findProject, saveHandoff } from "./mission-db";

const statusEnum = z.enum(Object.keys(Status) as [Status, ...Status[]]);
const effortEnum = z.enum(Object.keys(Effort) as [Effort, ...Effort[]]);
const priorityEnum = z.enum(Object.keys(Priority) as [Priority, ...Priority[]]);

function reply(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], ...(isError ? { isError: true } : {}) };
}

function summary(idea: Idea) {
  const snippet = idea.text.length > 200 ? `${idea.text.slice(0, 200)}…` : idea.text;
  const bits = [
    STATUS_LABELS[idea.status],
    idea.priority && `${PRIORITY_LABELS[idea.priority]} priority`,
    idea.effort && EFFORT_LABELS[idea.effort],
    idea.project && `project: ${idea.project}`,
    idea.tags.length > 0 && `tags: ${idea.tags.join(", ")}`,
    idea.brief && "has brief",
    idea.archivedAt && `archived (${idea.outcome ? OUTCOME_LABELS[idea.outcome] : "no outcome"})`,
  ].filter(Boolean);
  return `- [${idea.id}] ${snippet.replace(/\s+/g, " ")}\n  ${bits.join(" · ")}`;
}

function detail(idea: Idea) {
  return [
    `Idea ${idea.id}`,
    `Status: ${STATUS_LABELS[idea.status]}`,
    `Priority: ${idea.priority ? PRIORITY_LABELS[idea.priority] : "not set"}`,
    `Effort: ${idea.effort ? EFFORT_LABELS[idea.effort] : "not set"}`,
    `Project: ${idea.project ?? "none"}`,
    `Tags: ${idea.tags.join(", ") || "none"}`,
    `Next step: ${idea.nextStep ?? "none"}`,
    `Claude project: ${idea.claudeProjectUrl ?? "none"}`,
    idea.archivedAt
      ? `Archived: ${idea.archivedAt.toISOString()} (${idea.outcome ? OUTCOME_LABELS[idea.outcome] : "no outcome"})`
      : "Archived: no",
    `Created: ${idea.createdAt.toISOString()}`,
    "",
    "Text:",
    idea.text,
    "",
    "Brief:",
    idea.brief ?? "(none yet)",
    "",
    "Notes:",
    idea.notes ?? "(none)",
  ].join("\n");
}

const EFFORT_POINTS: Record<string, number> = { QUICK_WIN: 6, FEW_HOURS: 3, BIG_PROJECT: 0 };
const PRIORITY_POINTS: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const STATUS_POINTS: Record<string, number> = { BUILDING: 1.5, INTERVIEWED: 1, NEW: 0 };

// Effort dominates the score so easy wins rise to the top; priority, momentum
// and having a next step break ties. Unrated effort counts as a small amount.
export function scoreIdea(idea: Idea): number {
  return (
    (idea.effort ? EFFORT_POINTS[idea.effort] : 1) +
    (idea.priority ? PRIORITY_POINTS[idea.priority] : 1) +
    STATUS_POINTS[idea.status] +
    (idea.nextStep ? 0.5 : 0)
  );
}

export function createMcpServer() {
  const server = new McpServer({ name: "idea-launchpad", version: "1.0.0" });

  const notFound = (id: string) => reply(`No idea found with id ${id}`, true);

  server.registerTool(
    "list_ideas",
    {
      description:
        "List ideas, newest first. Archived ideas are left out unless include_archived is true. Returns each idea's id, a text snippet, status, priority, effort, project and tags.",
      inputSchema: {
        query: z.string().optional().describe("Search text (idea text, next step, project or tag)"),
        status: statusEnum.optional(),
        tag: z.string().optional(),
        project: z.string().optional(),
        include_archived: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).optional().describe("Default 25"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query, status, tag, project, include_archived, limit }) => {
      const q = query?.trim();
      const where: Prisma.IdeaWhereInput = {
        AND: [
          include_archived ? {} : { archivedAt: null },
          status ? { status } : {},
          tag ? { tags: { has: tag.toLowerCase().replace(/^#/, "") } } : {},
          project ? { project: { equals: project, mode: "insensitive" } } : {},
          q
            ? {
                OR: [
                  { text: { contains: q, mode: "insensitive" } },
                  { nextStep: { contains: q, mode: "insensitive" } },
                  { project: { contains: q, mode: "insensitive" } },
                  { tags: { has: q.toLowerCase() } },
                ],
              }
            : {},
        ],
      };
      const ideas = await db.idea.findMany({ where, orderBy: { createdAt: "desc" }, take: limit ?? 25 });
      return reply(ideas.length ? ideas.map(summary).join("\n") : "No ideas match.");
    },
  );

  server.registerTool(
    "get_idea",
    {
      description: "Get one idea with all its fields, including the brief and notes.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => {
      const idea = await db.idea.findUnique({ where: { id } });
      return idea ? reply(detail(idea)) : notFound(id);
    },
  );

  server.registerTool(
    "add_brief",
    {
      description:
        "Save the interview brief on an idea (replaces any earlier brief). A brief is a short summary: problem and audience, minimal first version, connected tools and projects, success, first step. Moves a New idea to Interviewed.",
      inputSchema: { id: z.string(), brief: z.string().min(1).max(20000) },
    },
    async ({ id, brief }) => {
      const idea = await db.idea.findUnique({ where: { id } });
      if (!idea) return notFound(id);
      await db.idea.update({
        where: { id },
        data: { brief, ...(idea.status === "NEW" ? { status: "INTERVIEWED" } : {}) },
      });
      return reply("Brief saved.");
    },
  );

  server.registerTool(
    "add_note",
    {
      description: "Append a dated note to an idea. Existing notes are kept.",
      inputSchema: { id: z.string(), note: z.string().min(1).max(10000) },
    },
    async ({ id, note }) => {
      const idea = await db.idea.findUnique({ where: { id } });
      if (!idea) return notFound(id);
      const entry = `[${new Date().toISOString().slice(0, 10)}] ${note.trim()}`;
      await db.idea.update({ where: { id }, data: { notes: idea.notes ? `${idea.notes}\n\n${entry}` : entry } });
      return reply("Note added.");
    },
  );

  server.registerTool(
    "set_status",
    {
      description: "Change an idea's status.",
      inputSchema: { id: z.string(), status: statusEnum },
    },
    async ({ id, status }) => {
      const idea = await db.idea.findUnique({ where: { id } });
      if (!idea) return notFound(id);
      await db.idea.update({ where: { id }, data: { status } });
      return reply(`Status set to ${STATUS_LABELS[status]}.`);
    },
  );

  server.registerTool(
    "set_effort_and_priority",
    {
      description:
        "Set an idea's effort size (QUICK_WIN, FEW_HOURS, BIG_PROJECT) and/or priority (HIGH, MEDIUM, LOW). Use it to save your estimate after an interview, or to rate ideas that have none. Give at least one.",
      inputSchema: { id: z.string(), effort: effortEnum.optional(), priority: priorityEnum.optional() },
    },
    async ({ id, effort, priority }) => {
      if (!effort && !priority) return reply("Give an effort, a priority, or both.", true);
      const idea = await db.idea.findUnique({ where: { id } });
      if (!idea) return notFound(id);
      await db.idea.update({
        where: { id },
        data: { ...(effort ? { effort } : {}), ...(priority ? { priority } : {}) },
      });
      return reply(
        [effort && `Effort: ${EFFORT_LABELS[effort]}`, priority && `Priority: ${PRIORITY_LABELS[priority]}`]
          .filter(Boolean)
          .join(". ") + ".",
      );
    },
  );

  server.registerTool(
    "suggest_next",
    {
      description:
        "Suggest what to work on next. Weighs effort size heavily so easy wins rise to the top, leads with up to three quick wins, then lists other good candidates. Skips archived, Parked and Done ideas.",
      inputSchema: { limit: z.number().int().min(3).max(15).optional().describe("How many suggestions in total, default 6") },
      annotations: { readOnlyHint: true },
    },
    async ({ limit }) => {
      const ideas = await db.idea.findMany({
        where: { archivedAt: null, status: { in: ["NEW", "INTERVIEWED", "BUILDING"] } },
      });
      if (ideas.length === 0) return reply("No active ideas to suggest.");
      const ranked = ideas
        .map((idea) => ({ idea, score: scoreIdea(idea) }))
        .sort((a, b) => b.score - a.score || b.idea.createdAt.getTime() - a.idea.createdAt.getTime());
      const total = limit ?? 6;
      const quick = ranked.filter((r) => r.idea.effort === "QUICK_WIN").slice(0, 3);
      const rest = ranked.filter((r) => !quick.includes(r)).slice(0, Math.max(0, total - quick.length));
      const unrated = ideas.filter((i) => !i.effort).length;
      const lines = [
        quick.length ? "Quick wins to start with:" : "No quick wins are marked yet.",
        ...quick.map((r) => summary(r.idea)),
        ...(rest.length ? ["", "Then consider:", ...rest.map((r) => summary(r.idea))] : []),
        ...(unrated ? ["", `${unrated} active idea${unrated === 1 ? " has" : "s have"} no effort estimate. Offer to rate them with set_effort_and_priority.`] : []),
      ];
      return reply(lines.join("\n"));
    },
  );

  // ---- Mission Control: projects, numbered sessions, handoffs, baton ----
  const personEnum = z.enum(PEOPLE);
  const projectNotFound = (code: string) =>
    reply(`No project found for "${code}". Use list_projects to see the codes.`, true);

  server.registerTool(
    "list_projects",
    {
      description:
        "List Mission Control projects with code, name, status, who holds the baton, deadline and next action.",
      inputSchema: { include_inactive: z.boolean().optional().describe("Include Parked and Done projects") },
      annotations: { readOnlyHint: true },
    },
    async ({ include_inactive }) => {
      const projects = await db.project.findMany({
        where: include_inactive ? {} : { status: { in: ["ACTIVE", "WAITING"] } },
        orderBy: { createdAt: "asc" },
      });
      if (!projects.length) return reply("No projects yet.");
      return reply(
        projects
          .map((p) => {
            const due = deadlineLabel(p.deadline);
            return [
              `- ${p.code}: ${p.name} [${PROJECT_STATUS_LABELS[p.status]}] baton: ${p.holder}${due ? ` · deadline ${due}` : ""}`,
              p.nextAction && `  next: ${p.nextAction}`,
              p.blockedOn && `  blocked on: ${p.blockedOn}`,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n"),
      );
    },
  );

  server.registerTool(
    "get_project",
    {
      description:
        "Get one project by code (for example SCHED): details, next action, blockers, the latest handoff and the last few sessions. Call this at the start of a chat to pick up where the last session left off.",
      inputSchema: { code: z.string().describe("Project code, such as SCHED") },
      annotations: { readOnlyHint: true },
    },
    async ({ code }) => {
      const project = await findProject(code);
      if (!project) return projectNotFound(code);
      const sessions = await db.session.findMany({
        where: { projectId: project.id },
        orderBy: { seq: "desc" },
        take: 6,
      });
      const latest = sessions.find((s) => s.handoff);
      const due = deadlineLabel(project.deadline);
      return reply(
        [
          `${project.code}: ${project.name}`,
          `Status: ${PROJECT_STATUS_LABELS[project.status]}`,
          `Baton: ${project.holder} (since ${project.batonSince.toISOString().slice(0, 10)})`,
          `Deadline: ${due ?? "none"}`,
          `Next action: ${project.nextAction ?? "none"}`,
          `Blocked on: ${project.blockedOn ?? "nothing"}`,
          `Repo: ${project.repoUrl ?? "none"}`,
          `Claude project: ${project.claudeProjectUrl ?? "none"}`,
          `Next chat number: ${project.nextSeq}`,
          "",
          "Notes:",
          project.notes ?? "(none)",
          "",
          latest
            ? `Latest handoff (${sessionName(project.code, latest.seq, latest.kind, latest.goal, latest.driver)}):\n${latest.handoff}`
            : "Latest handoff: (none yet)",
          "",
          "Recent sessions:",
          sessions.length
            ? sessions
                .map(
                  (s) =>
                    `- ${sessionName(project.code, s.seq, s.kind, s.goal, s.driver)} · ${SESSION_STATUS_LABELS[s.status]} · ${s.createdAt.toISOString().slice(0, 10)}${s.branch ? ` · branch ${s.branch}` : ""}`,
                )
                .join("\n")
            : "(none)",
        ].join("\n"),
      );
    },
  );

  server.registerTool(
    "start_session",
    {
      description:
        "Log a new numbered chat or Code session on a project and get the exact name to give this chat. Ask the person for a short goal and whether it is a Chat or Code session first.",
      inputSchema: {
        code: z.string(),
        goal: z.string().min(1).max(80).describe("Goal that starts with a verb, 2 to 4 words. If this chat begins a new phase, start it with \"phase N:\"."),
        kind: z.enum(["CHAT", "CODE"]).optional().describe("Default CHAT"),
        driver: personEnum.optional().describe("Who is driving this session, default is the baton holder"),
        url: z.string().optional(),
        branch: z.string().optional(),
      },
    },
    async ({ code, goal, kind, driver, url, branch }) => {
      const project = await findProject(code);
      if (!project) return projectNotFound(code);
      const { name, session } = await createSession({
        projectId: project.id,
        goal,
        kind: kind ?? "CHAT",
        driver: driver ?? project.holder,
        url,
        branch,
      });
      const previous = await db.session.findUnique({
        where: { projectId_seq: { projectId: project.id, seq: session.seq - 1 } },
      });
      const continues = previous
        ? `\nContinues: ${sessionName(project.code, previous.seq, previous.kind, previous.goal, previous.driver)}`
        : "\nThis is the first logged session.";
      return reply(`Session ${session.seq} logged. Name this chat exactly:\n${name}${continues}`);
    },
  );

  server.registerTool(
    "log_handoff",
    {
      description:
        "Save the end-of-session handoff on a project. Attaches it to the latest active session (or a given session number), updates the next action and blockers, and can pass the baton. Never include real client or therapist names or other health data.",
      inputSchema: {
        code: z.string(),
        handoff: z.string().min(1).max(20000).describe("What got done, what is half-done, decisions, exact branch or deploy state"),
        next_action: z.string().max(500).optional().describe("The single next step. Empty string clears it."),
        blocked_on: z.string().max(300).optional().describe("What the project is waiting on. Empty string clears it."),
        baton_to: personEnum.optional(),
        session_status: z.enum(["HANDED_OFF", "DONE"]).optional().describe("Default HANDED_OFF"),
        session_number: z.number().int().min(1).optional().describe("Defaults to the latest active session"),
      },
    },
    async ({ code, handoff, next_action, blocked_on, baton_to, session_status, session_number }) => {
      const project = await findProject(code);
      if (!project) return projectNotFound(code);
      await saveHandoff({
        projectId: project.id,
        sessionSeq: session_number ?? null,
        handoff,
        nextAction: next_action,
        blockedOn: blocked_on,
        batonTo: baton_to ?? null,
        sessionStatus: session_status,
      });
      return reply(
        `Handoff saved on ${project.code}.${baton_to && baton_to !== project.holder ? ` Baton passed to ${baton_to}.` : ""}`,
      );
    },
  );

  server.registerTool(
    "set_baton",
    {
      description: "Pass a project's baton to Chris or Kat.",
      inputSchema: { code: z.string(), to: personEnum },
    },
    async ({ code, to }) => {
      const project = await findProject(code);
      if (!project) return projectNotFound(code);
      await db.project.update({ where: { id: project.id }, data: { holder: to, batonSince: new Date() } });
      return reply(`${project.code} baton is now with ${to}.`);
    },
  );

  server.registerTool(
    "mission_next",
    {
      description:
        "Recommend which project to work on next. Weighs deadlines first, then who holds the baton, then how long a project has gone quiet, and sets blocked projects aside. Give `me` so the pick fits the person asking.",
      inputSchema: { me: personEnum.optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ me }) => {
      const projects = await db.project.findMany({ where: { status: "ACTIVE" } });
      if (!projects.length) return reply("No active projects.");
      const ranked = rankProjects(projects, me ?? null).slice(0, 4);
      return reply(
        ranked
          .map(
            (r, i) =>
              `${i === 0 ? "Do this next" : `#${i + 1}`}: ${r.project.code} · ${r.project.name}\n  next: ${r.project.nextAction ?? "none set"}${r.reasons.length ? `\n  why: ${r.reasons.join(", ")}` : ""}`,
          )
          .join("\n"),
      );
    },
  );

  return server;
}
