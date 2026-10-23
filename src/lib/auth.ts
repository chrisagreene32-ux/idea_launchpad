// Single-password login. The cookie holds an expiry time and an HMAC of it,
// signed with SESSION_SECRET (Web Crypto, so it also runs in middleware).
export const SESSION_COOKIE = "lp_session";
export const SESSION_DAYS = 90;

async function sign(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expires = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${expires}.${await sign(expires)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, await sign(expires));
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  return !!expected && safeEqual(input, expected);
}
