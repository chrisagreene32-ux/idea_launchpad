import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Effort, Priority, Status, type Idea, type Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { EFFORT_LABELS, OUTCOME_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "./labels";

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

  return server;
}
