import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "#f9fafb",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 16,
  borderRadius: 8,
  border: "none",
  background: "#6366f1",
  color: "#fff",
  cursor: "pointer",
};

export const ghostButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "#374151",
};
