"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Effort, Outcome, Priority, Status } from "@prisma/client";
import { db } from "@/lib/db";
import { isClaudeChatUrl, isClaudeProjectUrl } from "@/lib/start";
import { parseTags } from "@/lib/tags";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSessionToken,
  passwordMatches,
} from "@/lib/auth";

export async function login(_prev: string | null, formData: FormData) {
  if (!passwordMatches(String(formData.get("password") ?? ""))) {
    return "Wrong password";
  }
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 86_400,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

function enumOrNull<T extends string>(values: Record<string, T>, raw: FormDataEntryValue | null) {
  const value = String(raw ?? "");
  return value in values ? values[value] : null;
}

function optionalFields(formData: FormData) {
  return {
    tags: parseTags(String(formData.get("tags") ?? "")),
    project: String(formData.get("project") ?? "").trim() || null,
    nextStep: String(formData.get("nextStep") ?? "").trim() || null,
    priority: enumOrNull(Priority, formData.get("priority")),
    effort: enumOrNull(Effort, formData.get("effort")),
  };
}

function validProjectUrl(formData: FormData) {
  const url = String(formData.get("claudeProjectUrl") ?? "").trim();
  return url && isClaudeProjectUrl(url) ? url : null;
}

function validChatUrl(formData: FormData) {
  const url = String(formData.get("chatUrl") ?? "").trim();
  return url && isClaudeChatUrl(url) ? url : null;
}

export async function addIdea(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await db.idea.create({
    data: { text, ...optionalFields(formData) },
  });
  revalidatePath("/");
}

export async function updateIdea(id: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  const status = String(formData.get("status"));
  await db.idea.update({
    where: { id },
    data: {
      text,
      ...optionalFields(formData),
      ...(formData.has("claudeProjectUrl") ? { claudeProjectUrl: validProjectUrl(formData) } : {}),
      ...(formData.has("chatUrl") ? { chatUrl: validChatUrl(formData) } : {}),
      ...(status in Status ? { status: status as Status } : {}),
    },
  });
  revalidatePath("/");
}

export async function deleteIdea(id: string) {
  await db.idea.delete({ where: { id } });
  revalidatePath("/");
}

export async function archiveIdea(id: string, outcome: string) {
  if (!(outcome in Outcome)) return;
  await db.idea.update({
    where: { id },
    data: { outcome: outcome as Outcome, archivedAt: new Date() },
  });
  revalidatePath("/");
}

export async function unarchiveIdea(id: string) {
  await db.idea.update({ where: { id }, data: { outcome: null, archivedAt: null } });
  revalidatePath("/");
}

export async function setProjectLink(id: string, formData: FormData): Promise<string | null> {
  const url = String(formData.get("claudeProjectUrl") ?? "").trim();
  if (url && !isClaudeProjectUrl(url)) {
    return "That doesn't look like a Claude project link (https://claude.ai/project/…)";
  }
  await db.idea.update({ where: { id }, data: { claudeProjectUrl: url || null } });
  revalidatePath("/");
  return null;
}

export async function changeStatus(id: string, status: string) {
  if (!(status in Status)) return;
  await db.idea.update({ where: { id }, data: { status: status as Status } });
  revalidatePath("/");
  revalidatePath("/board");
}
