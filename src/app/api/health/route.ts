import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, database: "connected" });
  } catch {
    return Response.json({ ok: false, database: "unreachable" }, { status: 503 });
  }
}
