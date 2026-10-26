"use client";

import { useState } from "react";
import { buttonStyle } from "./ui";

// Opening a chat in a project with the prompt prefilled doesn't work, so Start
// copies the prompt and opens the project; the prompt just needs pasting.
export default function StartLink({ projectUrl, prompt }: { projectUrl: string; prompt: string }) {
  const [copied, setCopied] = useState<boolean | null>(null);

  function onClick() {
    navigator.clipboard.writeText(prompt).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  return (
    <>
      <a
        href={projectUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        style={{ ...buttonStyle, textDecoration: "none" }}
      >
        Start
      </a>
      {copied !== null && (
        <span style={{ alignSelf: "center", fontSize: 14, color: copied ? "#7fe0b0" : "#ff9d7a" }}>
          {copied ? "Prompt copied. Paste it in the chat." : "Copy failed. Tap Copy prompt."}
        </span>
      )}
    </>
  );
}
