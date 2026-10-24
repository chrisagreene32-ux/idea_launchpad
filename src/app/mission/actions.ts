"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ProjectStatus, SessionKind, SessionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ME_COOKIE, PEOPLE } from "@/lib/mission";
import { createSession, normalizeCode, saveHandoff } from "@/lib/mission-db";
import { STARTER_PROJECTS } from "@/lib/mission-seed";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function person(raw: string) {
  return (PEOPLE as readonly string[]).includes(raw) ? raw : PEOPLE[0];
}

function dateOrNull(raw: string) {
  if (!raw) return null;
  const d = new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function setMe(who: string) {
  (await cookies()).set(ME_COOKIE, person(who), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 365 * 86_400,
    path: "/",
  });
  revalidatePath("/mission");
}

export async function addProject(formData: FormData) {
  const code = normalizeCode(text(formData, "code"));
  const name = text(formData, "name");
  if (!code || !name) return;
  await db.project.upsert({
    where: { code },
    update: {},
    create: {
      code,
      name,
      holder: person(text(formData, "holder")),
      deadline: dateOrNull(text(formData, "deadline")),
      nextAction: text(formData, "nextAction") || null,
    },
  });
  revalidatePath("/mission");
}

export async function updateProject(id: string, formData: FormData) {
  const status = text(formData, "status");
  const name = text(formData, "name");
  if (!name) return;
  await db.project.update({
    where: { id },
    data: {
      name,
      ...(status in ProjectStatus ? { status: status as ProjectStatus } : {}),
      deadline: dateOrNull(text(formData, "deadline")),
      nextAction: text(formData, "nextAction") || null,
      blockedOn: text(formData, "blockedOn") || null,
      notes: text(formData, "notes") || null,
      repoUrl: text(formData, "repoUrl") || null,
      claudeProjectUrl: text(formData, "claudeProjectUrl") || null,
    },
  });
  revalidatePath("/mission");
}

export async function passBaton(id: string, to: string) {
  await db.project.update({
    where: { id },
    data: { holder: person(to), batonSince: new Date() },
  });
  revalidatePath("/mission");
}

export async function startSession(projectId: string, formData: FormData) {
  const goal = text(formData, "goal");
  if (!goal) return;
  const kind = text(formData, "kind");
  await createSession({
    projectId,
    goal,
    kind: kind in SessionKind ? (kind as SessionKind) : "CHAT",
    driver: person(text(formData, "driver")),
    url: text(formData, "url") || null,
    branch: text(formData, "branch") || null,
  });
  revalidatePath("/mission");
}

export async function updateSession(id: string, formData: FormData) {
  const status = text(formData, "status");
  await db.session.update({
    where: { id },
    data: {
      ...(status in SessionStatus ? { status: status as SessionStatus } : {}),
      url: text(formData, "url") || null,
      branch: text(formData, "branch") || null,
      handoff: text(formData, "handoff") || null,
    },
  });
  revalidatePath("/mission");
}

export async function logHandoffFromForm(projectId: string, formData: FormData) {
  const handoff = text(formData, "handoff");
  if (!handoff) return;
  const baton = text(formData, "batonTo");
  const status = text(formData, "sessionStatus");
  await saveHandoff({
    projectId,
    handoff,
    nextAction: text(formData, "nextAction"),
    blockedOn: text(formData, "blockedOn"),
    batonTo: baton ? person(baton) : null,
    sessionStatus: status in SessionStatus ? (status as SessionStatus) : "HANDED_OFF",
  });
  revalidatePath("/mission");
}

/** Loads the starter projects once. Existing codes are left alone. */
export async function loadStarterProjects() {
  for (const p of STARTER_PROJECTS) {
    await db.project.upsert({
      where: { code: p.code },
      update: {},
      create: {
        code: p.code,
        name: p.name,
        holder: "Chris",
        deadline: "deadline" in p ? dateOrNull(p.deadline) : null,
        nextAction: p.nextAction,
        notes: p.notes,
        repoUrl: "repoUrl" in p ? p.repoUrl : null,
      },
    });
  }
  revalidatePath("/mission");
}
