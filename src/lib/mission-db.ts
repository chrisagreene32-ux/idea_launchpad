import type { SessionKind, SessionStatus } from "@prisma/client";
import { db } from "./db";
import { sessionName } from "./mission";

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

export async function findProject(codeOrId: string) {
  const code = normalizeCode(codeOrId);
  return db.project.findFirst({
    where: { OR: [{ id: codeOrId }, ...(code ? [{ code }] : [])] },
  });
}

/** Adds the next numbered session to a project and returns it with its chat name. */
export async function createSession(input: {
  projectId: string;
  goal: string;
  kind: SessionKind;
  driver: string;
  url?: string | null;
  branch?: string | null;
}) {
  return db.$transaction(async (tx) => {
    // Bumping nextSeq first locks the project row, so two people starting a chat
    // at the same moment get different numbers.
    const project = await tx.project.update({
      where: { id: input.projectId },
      data: { nextSeq: { increment: 1 } },
    });
    const seq = project.nextSeq - 1;
    const session = await tx.session.create({
      data: {
        projectId: project.id,
        seq,
        goal: input.goal.trim(),
        kind: input.kind,
        driver: input.driver,
        url: input.url || null,
        branch: input.branch || null,
      },
    });
    return { session, project, name: sessionName(project.code, seq, session.kind, session.goal, session.driver) };
  });
}

/** Saves a handoff on a session (the latest active one if none is given) and updates the project. */
export async function saveHandoff(input: {
  projectId: string;
  sessionSeq?: number | null;
  handoff: string;
  nextAction?: string | null;
  blockedOn?: string | null;
  batonTo?: string | null;
  sessionStatus?: SessionStatus;
}) {
  return db.$transaction(async (tx) => {
    const project = await tx.project.findUniqueOrThrow({ where: { id: input.projectId } });
    const session = input.sessionSeq
      ? await tx.session.findUnique({
          where: { projectId_seq: { projectId: project.id, seq: input.sessionSeq } },
        })
      : await tx.session.findFirst({
          where: { projectId: project.id, status: "ACTIVE" },
          orderBy: { seq: "desc" },
        });

    if (session) {
      await tx.session.update({
        where: { id: session.id },
        data: { handoff: input.handoff, status: input.sessionStatus ?? "HANDED_OFF" },
      });
    } else {
      // Nothing was logged for this chat. Keep the handoff anyway as its own entry
      // rather than losing it.
      const bumped = await tx.project.update({
        where: { id: project.id },
        data: { nextSeq: { increment: 1 } },
      });
      await tx.session.create({
        data: {
          projectId: project.id,
          seq: bumped.nextSeq - 1,
          goal: "Unlogged session",
          driver: project.holder,
          status: input.sessionStatus ?? "HANDED_OFF",
          handoff: input.handoff,
        },
      });
    }

    const baton =
      input.batonTo && input.batonTo !== project.holder
        ? { holder: input.batonTo, batonSince: new Date() }
        : {};
    await tx.project.update({
      where: { id: project.id },
      data: {
        ...baton,
        ...(input.nextAction !== undefined ? { nextAction: input.nextAction || null } : {}),
        ...(input.blockedOn !== undefined ? { blockedOn: input.blockedOn || null } : {}),
        updatedAt: new Date(),
      },
    });
    return { project, session };
  });
}
