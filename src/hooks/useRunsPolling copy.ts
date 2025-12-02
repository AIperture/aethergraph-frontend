// src/hooks/useRunsPolling.ts
import * as React from "react";
import { toast } from "sonner";
import { useShellStore } from "../store/shellStore";
import type { RunStatus } from "../lib/types";

const TERMINAL_STATUSES: RunStatus[] = ["succeeded", "failed", "canceled"];

export function useRunsPolling(intervalMs: number = 4000) {
  // local ref to track previous statuses so we can detect transitions
  const prevStatusRef = React.useRef<Map<string, RunStatus>>(new Map());

  React.useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;

      // Don't hammer the backend if tab is hidden
      if (document.visibilityState === "hidden") {
        return;
      }

      const store = useShellStore.getState();
      const { runs, loadRuns } = store;

      // Only poll if there is at least one non-terminal run
      const hasActive = runs.some(
        (r) => !TERMINAL_STATUSES.includes(r.status)
      );

      if (!hasActive && prevStatusRef.current.size === 0) {
        // nothing to track yet
        return;
      }

      try {
        await loadRuns();
      } catch (err) {
        console.error("Failed to load runs for polling", err);
        return;
      }

      const latestRuns = useShellStore.getState().runs;
      const map = prevStatusRef.current;

      for (const run of latestRuns) {
        const prev = map.get(run.run_id);
        const curr = run.status;

        // Only toast on transition from non-terminal -> terminal
        const wasNonTerminal =
          prev && !TERMINAL_STATUSES.includes(prev);
        const isTerminal = TERMINAL_STATUSES.includes(curr);

        if (wasNonTerminal && isTerminal) {
          const label =
            curr === "succeeded"
              ? "Run completed"
              : curr === "failed"
              ? "Run failed"
              : "Run canceled";

          toast(label, {
            description: `Run ${run.run_id} is ${curr}.`,
          });
        }

        map.set(run.run_id, curr);
      }
    };

    // initial check
    void tick();

    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);
}
