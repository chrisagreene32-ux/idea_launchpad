// Starter projects for a first run. Everything here is editable in the app.
// Real client or therapist data never belongs in this tool.
export const STARTER_PROJECTS = [
  {
    code: "NAT",
    name: "Author Nation photography",
    deadline: "2026-11-10",
    nextAction: "Pick lenses and flash settings per room type; confirm lighting with convention services",
    notes: "Horseshoe Las Vegas, Nov 10-13. Nikon D3300.",
  },
  {
    code: "SCHED",
    name: "HOB Scheduler",
    nextAction:
      "Finish pending branches (call-out training, team activities, compliance changelog), then roll out to the 11 testers",
    notes: "Next.js, Prisma, Postgres. Sample data only: invented names and CL- codes.",
    repoUrl: "https://github.com/chrisagreene32-ux/aba-scheduler",
  },
  {
    code: "INV",
    name: "HOB Inventory",
    nextAction:
      "Finish launch checklist on draft PR #25: link repo, Google sign-in, IMAGING_API_TOKEN, DNS",
    notes: "inventory.hobschedule.com. QR check-out and check-in. Imaging kit reports by serial number.",
  },
  {
    code: "IMG",
    name: "Laptop imaging",
    nextAction: "Image the first donated laptop with the USB kit and check it reports to HOB Inventory",
    notes: "Under 20 donated laptops, Windows 11, names HOB-<serial>. Works from a Mac.",
  },
  {
    code: "LAUNCH",
    name: "Idea Launchpad",
    nextAction: "Switch the Netlify production branch to main now that the build steps are merged",
    notes: "Mission Control lives inside this app.",
    repoUrl: "https://github.com/chrisagreene32-ux/idea_launchpad",
  },
  {
    code: "ROOST",
    name: "Roost (regional burn volunteer app)",
    nextAction: "Settle the name (Roost or Batcall) and start the build from the volunteer app spec",
    notes:
      "Replaces Tribal Cities. Roles: volunteer, department lead, leadership. Tribal Cities event list caps at 50, which is a separate bug owned by its developer.",
  },
  {
    code: "TIFF",
    name: "Tiff the parrot chatbot",
    nextAction: "Test the local voice pipeline on the MacBook Air and the kid-friendly version",
    notes: "Ollama with Qwen2.5 and audio.cpp. Two models: tiff-adult and tiff-kids.",
  },
  {
    code: "SCRATCH",
    name: "Scratch and browser games",
    nextAction: "Next lesson card for the moto game; update the Star Solver word lists",
    notes: "Galaxy Clicker, Star Solver, and the motorcycle game.",
  },
] as const;
