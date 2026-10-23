import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Idea Launchpad",
  description: "Capture ideas in seconds and turn them into Claude projects.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#111827",
          color: "#f9fafb",
        }}
      >
        {children}
      </body>
    </html>
  );
}
