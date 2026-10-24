import { db } from "./db";
import { safeEqual, sign } from "./auth";

export const ACCESS_TOKEN_SECONDS = 3600;
export const REFRESH_TOKEN_DAYS = 90;
export const CODE_MINUTES = 5;

export function origin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const local = /^(localhost|127\.)/.test(host);
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString("base64url");
}

// Access tokens are signed, not stored. The "mcp-access:" prefix keeps them
// from ever being accepted as a login cookie (and vice versa).
export async function createAccessToken(): Promise<string> {
  const expires = String(Date.now() + ACCESS_TOKEN_SECONDS * 1000);
  return `${expires}.${await sign(`mcp-access:${expires}`)}`;
}

export async function verifyAccessToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || !(Number(expires) > Date.now())) return false;
  return safeEqual(mac, await sign(`mcp-access:${expires}`));
}

export function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.hash) return false;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export async function issueTokens(clientId: string) {
  const refresh = randomToken();
  await db.oAuthRefreshToken.create({
    data: {
      tokenHash: await sha256Hex(refresh),
      clientId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 86_400_000),
    },
  });
  return {
    access_token: await createAccessToken(),
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_SECONDS,
    refresh_token: refresh,
  };
}

export async function deleteExpired() {
  const now = new Date();
  await Promise.all([
    db.oAuthCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.oAuthRefreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
