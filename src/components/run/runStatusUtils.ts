// src/components/run/runStatusUtils.ts
import type { RunStatus } from "../../lib/types";

export const statusChipClass = (status: RunStatus) => {
  switch (status) {
    case "running":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    case "succeeded":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "failed":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "canceled":
    case "cancellation_requested":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
    case "pending":
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
  }
};

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};
