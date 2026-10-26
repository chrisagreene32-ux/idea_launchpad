import { headingFont } from "./ui";

const steps: { title: string; text: string }[] = [
  {
    title: "Capture",
    text: "Type an idea in the big box and tap Save idea. Open More details to add tags, a project, priority, effort or a next step. All optional.",
  },
  {
    title: "Find",
    text: "Search, or filter by status, tag and project. Tap a tag or project on a card to filter by it. The Board tab shows ideas in columns by status: swipe sideways and use Move to on a card.",
  },
  {
    title: "Start an idea",
    text: "The first time, tap Start, copy the project name, description and instructions into a new project in Claude, then paste the project link back here and save it. After that, Start copies the interview prompt and opens your project. Paste it into a new chat and send.",
  },
  {
    title: "The interview",
    text: "Claude asks one question at a time, then saves a short brief and its effort and priority estimate to the idea. Turn on the Idea Launchpad connector in that chat so it can save.",
  },
  {
    title: "Archive",
    text: "Archive an idea when it is shipped, parked or abandoned. It leaves the main list but stays searchable. Show: Archived lists them, and Restore brings one back.",
  },
  {
    title: "Ask Claude",
    text: "In any Claude chat with the connector on, try: What should I work on next? or Rate my unrated ideas.",
  },
];

export default function HowTo() {
  return (
    <details style={{ background: "#3b2415", border: "2px solid #6b4426", borderRadius: 12, padding: "10px 14px" }}>
      <summary style={{ cursor: "pointer", fontFamily: headingFont, fontSize: 18, color: "#f5c542" }}>
        ❓ How to use
      </summary>
      <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 8, fontSize: 15, lineHeight: 1.4 }}>
        {steps.map((s) => (
          <li key={s.title}>
            <strong>{s.title}.</strong> {s.text}
          </li>
        ))}
      </ol>
    </details>
  );
}
