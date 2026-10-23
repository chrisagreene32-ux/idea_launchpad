import { db } from "@/lib/db";
import { deleteExpired, issueTokens, pkceChallenge, sha256Hex } from "@/lib/oauth";

const headers = { "Cache-Control": "no-store", Pragma: "no-cache" };

function fail(error: string, description: string) {
  return Response.json({ error, error_description: description }, { status: 400, headers });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return fail("invalid_request", "Expected a form body");
  const get = (key: string) => String(form.get(key) ?? "");
  const clientId = get("client_id");
  await deleteExpired();

  if (get("grant_type") === "authorization_code") {
    const record = await db.oAuthCode
      .delete({ where: { codeHash: await sha256Hex(get("code")) } })
      .catch(() => null); // single use: gone once looked up
    if (
      !record ||
      record.expiresAt < new Date() ||
      record.clientId !== clientId ||
      record.redirectUri !== get("redirect_uri") ||
      !get("code_verifier") ||
      (await pkceChallenge(get("code_verifier"))) !== record.codeChallenge
    ) {
      return fail("invalid_grant", "Invalid or expired code");
    }
    return Response.json(await issueTokens(clientId), { headers });
  }

  if (get("grant_type") === "refresh_token") {
    const record = await db.oAuthRefreshToken
      .delete({ where: { tokenHash: await sha256Hex(get("refresh_token")) } })
      .catch(() => null); // rotated: the old refresh token stops working
    if (!record || record.expiresAt < new Date() || record.clientId !== clientId) {
      return fail("invalid_grant", "Invalid or expired refresh token");
    }
    return Response.json(await issueTokens(clientId), { headers });
  }

  return fail("unsupported_grant_type", "Use authorization_code or refresh_token");
}
