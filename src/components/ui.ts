import type { CSSProperties } from "react";

export const headingFont = "var(--font-heading), system-ui, sans-serif";

export const inputStyle: CSSProperties = {
  padding: 12,
  fontSize: 16,
  borderRadius: 10,
  border: "2px solid #6b4426",
  background: "#2d1b10",
  color: "#fdf3dc",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 16,
  fontFamily: headingFont,
  letterSpacing: 0.5,
  borderRadius: 10,
  border: "none",
  borderBottom: "4px solid #a8390f",
  background: "linear-gradient(#f2793c, #e8602c)",
  color: "#fff",
  cursor: "pointer",
  textShadow: "0 1px 0 rgba(0,0,0,0.3)",
};

export const ghostButtonStyle: CSSProperties = {
  ...buttonStyle,
  borderBottom: "4px solid #3a2310",
  background: "linear-gradient(#7a4f2c, #6b4426)",
  textShadow: "none",
};

export const cardStyle: CSSProperties = {
  background: "linear-gradient(#45291a, #3b2415)",
  border: "2px solid #6b4426",
  borderRadius: 12,
  boxShadow: "0 3px 0 #1a0d06",
};
