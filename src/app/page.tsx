import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function databaseConnected() {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export default async function Home() {
  const connected = await databaseConnected();
  return (
    <main style={{ padding: 24, textAlign: "center" }}>
      <h1>Idea Launchpad is running ✅</h1>
      <p>{connected ? "Database connected ✅" : "Database not connected yet ⚠️"}</p>
    </main>
  );
}
