import type { Prisma } from "@prisma/client";
import { Status } from "@prisma/client";
import { db } from "@/lib/db";
import CaptureForm from "@/components/CaptureForm";
import FilterBar, { type Filters } from "@/components/FilterBar";
import IdeaCard from "@/components/IdeaCard";
import NavTabs from "@/components/NavTabs";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters: Filters = {
    q: first(params.q),
    tag: first(params.tag),
    project: first(params.project),
    status: first(params.status) in Status ? first(params.status) : "",
    view: ["active", "archived", "all"].includes(first(params.view)) ? first(params.view) : "",
  };
  // Archived ideas stay out of the main list but a text search looks everywhere.
  const view = filters.view || (filters.q ? "all" : "active");

  const where: Prisma.IdeaWhereInput = {
    AND: [
      filters.q
        ? {
            OR: [
              { text: { contains: filters.q, mode: "insensitive" } },
              { nextStep: { contains: filters.q, mode: "insensitive" } },
              { project: { contains: filters.q, mode: "insensitive" } },
              { tags: { has: filters.q.toLowerCase() } },
            ],
          }
        : {},
      filters.tag ? { tags: { has: filters.tag } } : {},
      filters.project ? { project: { equals: filters.project, mode: "insensitive" } } : {},
      filters.status ? { status: filters.status as Status } : {},
      view === "active" ? { archivedAt: null } : view === "archived" ? { archivedAt: { not: null } } : {},
    ],
  };

  const [ideas, facets] = await Promise.all([
    db.idea.findMany({ where, orderBy: { createdAt: "desc" } }),
    db.idea.findMany({ select: { tags: true, project: true } }),
  ]);
  const tags = [...new Set(facets.flatMap((i) => i.tags))].sort();
  const projects = [...new Set(facets.flatMap((i) => (i.project ? [i.project] : [])))].sort();
  const filtered = Object.values(filters).some(Boolean);

  return (
    <main style={{ padding: 16, maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
      <NavTabs current="list" />
      <CaptureForm />
      <FilterBar filters={filters} tags={tags} projects={projects} />
      <h2 style={{ margin: "8px 0 0", fontSize: 16, color: "#9ca3af" }}>
        {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
        {filtered && " match"}
      </h2>
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={{
            ...idea,
            createdAt: idea.createdAt.toISOString(),
            archivedAt: idea.archivedAt?.toISOString() ?? null,
          }} />
      ))}
      <form action={logout}>
        <button style={{ background: "none", border: "none", color: "#6b7280", padding: 8 }}>
          Lock
        </button>
      </form>
    </main>
  );
}
