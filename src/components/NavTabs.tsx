import Link from "next/link";

export default function NavTabs({ current }: { current: "list" | "board" }) {
  const tab = (active: boolean) => ({
    flex: 1,
    textAlign: "center" as const,
    padding: "10px 0",
    borderRadius: 8,
    textDecoration: "none",
    color: "#f9fafb",
    background: active ? "#6366f1" : "#1f2937",
  });
  return (
    <nav style={{ display: "flex", gap: 8 }}>
      <Link href="/" style={tab(current === "list")}>
        List
      </Link>
      <Link href="/board" style={tab(current === "board")}>
        Board
      </Link>
    </nav>
  );
}
