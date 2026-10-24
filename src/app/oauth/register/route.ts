import { db } from "@/lib/db";
import { isAllowedRedirectUri, randomToken } from "@/lib/oauth";

// Dynamic client registration (RFC 7591): Claude registers itself before sign-in.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const uris: unknown = body?.redirect_uris;
  if (
    !Array.isArray(uris) ||
    uris.length === 0 ||
    uris.length > 5 ||
    !uris.every((u) => typeof u === "string" && isAllowedRedirectUri(u))
  ) {
    return Response.json(
      { error: "invalid_redirect_uri", error_description: "Provide 1-5 https redirect_uris" },
      { status: 400 },
    );
  }
  const name = typeof body?.client_name === "string" ? body.client_name.slice(0, 100) : null;
  const client = await db.oAuthClient.create({
    data: { id: randomToken(), name, redirectUris: uris as string[] },
  });
  return Response.json(
    {
      client_id: client.id,
      client_name: name ?? undefined,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201 },
  );
}
