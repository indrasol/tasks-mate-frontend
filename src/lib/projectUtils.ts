/*
 Utility helpers for project-related display logic. Centralised here so that every page
 uses the same mapping between enum values sent by the backend and user-facing UI.
*/

export const STATUS_META = {
  planning:     { label: "Planning",     color: "bg-purple-100 text-purple-800" },
  in_progress:  { label: "In Progress",  color: "bg-blue-100 text-blue-800" },
  active:      { label: "Active",       color: "bg-blue-100 text-blue-800" },
  not_started:  { label: "Not Started",  color: "bg-gray-100 text-gray-800" },
  on_hold:      { label: "On Hold",       color: "bg-yellow-100 text-yellow-800" },
  blocked:      { label: "Blocked",       color: "bg-red-100 text-red-800" },
  paused:       { label: "Paused",        color: "bg-orange-100 text-orange-800" },
  completed:    { label: "Completed",    color: "bg-green-100 text-green-800" },
  archived:     { label: "Archived",     color: "bg-black text-white" },
} as const;

export type ProjectStatus = keyof typeof STATUS_META;

export function getStatusMeta(status: string) {
  return STATUS_META[status as ProjectStatus] ?? { label: "Unknown", color: "bg-gray-100 text-gray-800" };
}

export const PRIORITY_META = {
  critical: { color: "bg-red-600 text-white" },
  high:     { color: "bg-red-100 text-red-800" },
  medium:   { color: "bg-orange-100 text-orange-800" },
  low:      { color: "bg-green-100 text-green-800" },
  none:     { color: "bg-gray-100 text-gray-800" },
} as const;

type ProjectPriority = keyof typeof PRIORITY_META;

export function getPriorityColor(priority: string): string {
  return (PRIORITY_META[priority as ProjectPriority] ?? PRIORITY_META.none).color;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  // Treat any ISO-like string that starts with YYYY-MM-DD as a local date (ignore timezone)
  const head = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(dateStr);
  let d: Date;
  if (head) {
    const [_, y, mo, da] = head;
    d = new Date(Number(y), Number(mo) - 1, Number(da));
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

// Helper to convert a username / email to display name & initials (same logic
// used in NewProjectModal)
export function deriveDisplayFromEmail(emailOrUsername: string) {
  const usernamePart = emailOrUsername.split("@")[0];
  const tokens = usernamePart.split(/[._-]+/).filter(Boolean);
  const displayTokens = tokens.map((t) =>
    t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)
  );
  const displayName = displayTokens.join(" ");
  const initials = displayTokens.map((t) => t[0]).join("").toUpperCase();
  return { displayName, initials };
}
