import { EFFORT_LABELS, PRIORITY_LABELS } from "@/lib/labels";
import { inputStyle } from "./ui";

type Defaults = {
  tags?: string;
  project?: string;
  nextStep?: string;
  priority?: string | null;
  effort?: string | null;
};

function Select({ name, label, options, value }: { name: string; label: string; options: Record<string, string>; value?: string | null }) {
  return (
    <select name={name} defaultValue={value ?? ""} aria-label={label} style={inputStyle}>
      <option value="">{label}: not set</option>
      {Object.entries(options).map(([v, l]) => (
        <option key={v} value={v}>
          {label}: {l}
        </option>
      ))}
    </select>
  );
}

export default function OptionalFields({ defaults = {} }: { defaults?: Defaults }) {
  return (
    <>
      <input name="tags" defaultValue={defaults.tags} placeholder="Tags, separated by spaces or commas" style={inputStyle} />
      <input name="project" defaultValue={defaults.project} placeholder="Project name" style={inputStyle} />
      <Select name="priority" label="Priority" options={PRIORITY_LABELS} value={defaults.priority} />
      <Select name="effort" label="Effort" options={EFFORT_LABELS} value={defaults.effort} />
      <input name="nextStep" defaultValue={defaults.nextStep} placeholder="Next step" style={inputStyle} />
    </>
  );
}
