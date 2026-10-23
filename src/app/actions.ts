"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Status } from "@prisma/client";
import { db } from "@/lib/db";
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

export async function addIdea(formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await db.idea.create({
    data: {
      text,
      tags: parseTags(String(formData.get("tags") ?? "")),
      project: String(formData.get("project") ?? "").trim() || null,
    },
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
      tags: parseTags(String(formData.get("tags") ?? "")),
      project: String(formData.get("project") ?? "").trim() || null,
      ...(status in Status ? { status: status as Status } : {}),
    },
  });
  revalidatePath("/");
}

export async function deleteIdea(id: string) {
  await db.idea.delete({ where: { id } });
  revalidatePath("/");
}
