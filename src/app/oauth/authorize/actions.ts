"use server";

import { redirect } from "next/navigation";
import { passwordMatches } from "@/lib/auth";
import { db } from "@/lib/db";
import { CODE_MINUTES, deleteExpired, randomToken, sha256Hex } from "@/lib/oauth";

export type AuthorizeParams = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  response_type: string;
  state: string;
};

// Checks the request against the registered client. Returns an error message,
// or null when it is safe to ask for the password.
export async function checkAuthorizeRequest(p: AuthorizeParams): Promise<string | null> {
  if (p.response_type !== "code") return "Unsupported response type";
  if (p.code_challenge_method !== "S256" || !p.code_challenge) return "A PKCE (S256) challenge is required";
  const client = await db.oAuthClient.findUnique({ where: { id: p.client_id } });
  if (!client || !client.redirectUris.includes(p.redirect_uri)) return "Unknown app or redirect address";
  return null;
}

export async function approve(_prev: string | null, formData: FormData): Promise<string | null> {
  const get = (key: string) => String(formData.get(key) ?? "");
  const params: AuthorizeParams = {
    client_id: get("client_id"),
    redirect_uri: get("redirect_uri"),
    code_challenge: get("code_challenge"),
    code_challenge_method: get("code_challenge_method"),
    response_type: get("response_type"),
    state: get("state"),
  };
  const problem = await checkAuthorizeRequest(params);
  if (problem) return problem;
  if (!passwordMatches(get("password"))) return "Wrong password";

  await deleteExpired();
  const code = randomToken();
  await db.oAuthCode.create({
    data: {
      codeHash: await sha256Hex(code),
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      codeChallenge: params.code_challenge,
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
    },
  });

  const target = new URL(params.redirect_uri);
  target.searchParams.set("code", code);
  if (params.state) target.searchParams.set("state", params.state);
  redirect(target.toString());
}
