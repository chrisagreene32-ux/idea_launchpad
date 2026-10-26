import type { Metadata, Viewport } from "next";
import { Lilita_One } from "next/font/google";

const heading = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Idea Launchpad",
  description: "Capture ideas in seconds and turn them into Claude projects.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#24150d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={heading.variable}>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          color: "#fdf3dc",
          backgroundColor: "#24150d",
          // faint bamboo stripes
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 46px)",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            textAlign: "center",
            padding: "14px 16px 10px",
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            fontSize: 26,
            letterSpacing: 1,
            color: "#f5c542",
            textShadow: "0 2px 0 #a8390f, 0 4px 0 rgba(0,0,0,0.35)",
            borderBottom: "4px double #6b4426",
          }}
        >
          🗿 Idea Launchpad 🌺
        </header>
        {children}
      </body>
    </html>
  );
}
