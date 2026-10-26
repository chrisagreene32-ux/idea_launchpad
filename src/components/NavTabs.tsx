import Link from "next/link";
import { buttonStyle, ghostButtonStyle } from "./ui";

export default function NavTabs({ current }: { current: "list" | "board" }) {
  const tab = (active: boolean) => ({
    ...(active ? buttonStyle : ghostButtonStyle),
    flex: 1,
    textAlign: "center" as const,
    textDecoration: "none",
  });
  return (
    <nav style={{ display: "flex", gap: 8 }}>
      <Link href="/" style={tab(current === "list")}>
        🌴 List
      </Link>
      <Link href="/board" style={tab(current === "board")}>
        🏝️ Board
      </Link>
    </nav>
  );
}
