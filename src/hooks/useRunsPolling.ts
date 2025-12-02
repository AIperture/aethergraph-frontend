// src/hooks/useRunsPolling.ts
import * as React from "react";
import { toast } from "sonner";
import { useShellStore } from "../store/shellStore";
import { useChannelStore } from "../store/channelStore";
import type { RunStatus } from "../lib/types";

const TERMINAL_STATUSES: RunStatus[] = ["succeeded", "failed", "canceled"];

export function useRunsPolling(intervalMs: number = 4000) {
  // track previous statuses so we can detect transitions
  const prevStatusRef = React.useRef<Map<string, RunStatus>>(new Map());

  React.useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const tick = async () => {
      if (cancelled || inFlight) return;

      // Don't hammer backend if tab is hidden
      if (document.visibilityState === "hidden") {
        return;
      }

      inFlight = true;

      try {
        const shellState = useShellStore.getState();
        const { runs, loadRuns } = shellState;

        // only bother if we already know about some runs
        const hasActive = runs.some(
          (r) => !TERMINAL_STATUSES.includes(r.status)
        );

        if (!hasActive && prevStatusRef.current.size === 0) {
          inFlight = false;
          return;
        }

        // 1) Refresh runs (already scoped by client_id in listRuns())
        await loadRuns();

        const latestRuns = useShellStore.getState().runs;
        const map = prevStatusRef.current;

        // 2) Run completion toasts (existing logic)
        for (const run of latestRuns) {
          const prev = map.get(run.run_id);
          const curr = run.status;

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

        // 3) Global channel polling for active runs
        const activeRuns = latestRuns.filter(
          (r) => r.status === "running" || r.status === "pending"
        );

        if (activeRuns.length > 0) {
          const { fetchNewEvents } = useChannelStore.getState();

          await Promise.all(
            activeRuns.map((r) =>
              fetchNewEvents(r.run_id).catch((err) => {
                console.error(
                  "Global channel poll failed for run",
                  r.run_id,
                  err
                );
              })
            )
          );
        }
      } catch (err) {
        console.error("Failed to load runs / channels for polling", err);
      } finally {
        inFlight = false;
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
