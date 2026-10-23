import { EFFORT_LABELS, PRIORITY_LABELS } from "./labels";

type StartIdea = {
  id: string;
  text: string;
  tags: string[];
  project: string | null;
  priority: string | null;
  effort: string | null;
  nextStep: string | null;
};

function shorten(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function projectPackage(idea: StartIdea) {
  const name = idea.project?.trim() || shorten(idea.text, 50);
  return {
    name,
    description: shorten(idea.text, 200),
    instructions: [
      `This project turns one idea into a clear plan: "${name}".`,
      "",
      "The idea, in my words:",
      idea.text.trim(),
      "",
      "How to work with me:",
      "- When I ask you to interview me, ask ONE question at a time and wait for my answer before the next.",
      "- Keep questions short and plain. I have ADHD, so avoid long lists and big walls of text.",
      "- Cover, in order: the problem and who it's for; the smallest useful first version; tools and other projects it connects to; what success looks like; the very first step.",
      "- Finish with a short brief (a few bullet points), then save it to the idea with the Idea Launchpad connector's add_brief tool.",
      "- Also estimate the effort (quick win, a few hours, or big project) and the priority (high, medium or low), with a one-line reason, and save them with the connector's set_effort_and_priority tool. I can change them later.",
      "- Never start an interview unless I ask for one.",
    ].join("\n"),
  };
}

export function interviewPrompt(idea: StartIdea) {
  const text = idea.text.trim();
  const details = [
    idea.project && `Project name: ${idea.project}`,
    idea.tags.length > 0 && `Tags: ${idea.tags.join(", ")}`,
    idea.priority && `Priority: ${PRIORITY_LABELS[idea.priority]}`,
    idea.effort && `Effort: ${EFFORT_LABELS[idea.effort]}`,
    idea.nextStep && `Next step I had in mind: ${idea.nextStep}`,
  ].filter(Boolean);

  return [
    "Please interview me about this idea, ONE question at a time. Wait for my answer before asking the next question.",
    "",
    "Idea:",
    text,
    ...(details.length > 0 ? ["", ...(details as string[])] : []),
    "",
    "Cover these in order: (1) the problem and who it's for, (2) the smallest useful first version, (3) tools and other projects it connects to, (4) what success looks like, (5) the very first step.",
    "",
    `When we're done, summarize it as a short brief and save it to this idea with the Idea Launchpad connector (add_brief tool, idea id ${idea.id}). Then estimate the effort (quick win, a few hours, or big project) and priority (high, medium or low), say why in one line, and save them with set_effort_and_priority. If the connector isn't available, show me the brief and your estimates so I can copy them.`,
  ].join("\n");
}

export function isClaudeProjectUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "claude.ai" && url.pathname.startsWith("/project/");
  } catch {
    return false;
  }
}
