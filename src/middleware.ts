import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // The connector endpoints do their own checks: OAuth uses the app password,
  // /api/mcp needs a bearer token.
  matcher: ["/((?!login|oauth|api/health|api/mcp|\\.well-known|_next/static|_next/image|favicon.ico).*)"],
};
