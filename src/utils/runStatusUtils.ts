export type SimpleStatus =
  | "pending"
  | "running"
  | "waiting"
  | "succeeded"
  | "failed"
  | "canceled"
  | "other";

export function normalizeStatus(raw: string | null | undefined): SimpleStatus {
  if (!raw) return "other";
  const s = raw.toLowerCase();

  // Waiting states (run or node)
  if (s === "waiting" || s.startsWith("waiting_")) {
    return "waiting";
  }

  // Cancellation states
  if (s === "canceled" || s === "cancelled" || s === "cancellation_requested") {
    return "canceled";
  }

  // Regular states
  if (s === "running") return "running";
  if (s === "pending") return "pending";
  if (s === "failed" || s === "failed_timeout") return "failed";
  if (s === "succeeded" || s === "done" || s === "skipped") return "succeeded";

  return "other";
}

// Update this to use normalizeStatus internally.
// If you already had statusChipClass, just replace its body with this switch.
export function statusChipClass(status: string | null | undefined): string {
  const s = normalizeStatus(status);

  switch (s) {
    case "running":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900";
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900";
    case "waiting":
      // placeholder waiting color
      return "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900";
    case "failed":
      return "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900";
    case "canceled":
      return "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800";
    case "succeeded":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900";
    default:
      return "bg-muted text-muted-foreground border border-border/60";
  }
}

// formatDate stays as-is
export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
