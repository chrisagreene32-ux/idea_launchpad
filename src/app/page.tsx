import { db } from "@/lib/db";
import CaptureForm from "@/components/CaptureForm";
import IdeaCard from "@/components/IdeaCard";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ideas = await db.idea.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
      <CaptureForm />
      <h2 style={{ margin: "8px 0 0", fontSize: 16, color: "#9ca3af" }}>
        {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
      </h2>
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={{ ...idea, createdAt: idea.createdAt.toISOString() }}
        />
      ))}
      <form action={logout}>
        <button style={{ background: "none", border: "none", color: "#6b7280", padding: 8 }}>
          Lock
        </button>
      </form>
    </main>
  );
}
