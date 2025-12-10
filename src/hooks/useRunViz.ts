// src/hooks/useRunViz.ts
import { useEffect } from "react";
import { useVizStore, useRunVizState, buildTrackKeyFromTrack } from "@/store/vizStore";
import type { VizTrack } from "@/lib/types";
import { useShellStore } from "@/store/shellStore";

export function useRunViz(runId: string) {
  const loadRunViz = useVizStore((s) => s.loadRunViz);
  const state = useRunVizState(runId);
  const runStatus = useShellStore((s) =>
    s.runs.find((r) => r.run_id === runId)?.status
  );

  useEffect(() => {
    if (!state?.data && !state?.loading) {
      // Lazy-load when the viz tab is first mounted
      loadRunViz(runId).catch(console.error);
    }
  }, [runId, state?.data, state?.loading, loadRunViz]);

  // 🔁 poll while run is active
  useEffect(() => {
    if (runStatus !== "running") return;
    let cancelled = false;

    const interval = setInterval(() => {
      if (cancelled) return;
      // force=true to ignore the "already has data" guard
      loadRunViz(runId, { force: true }).catch(console.error);
    }, 4000); // 3–5s is usually fine

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [runId, runStatus, loadRunViz]);


  return {
    data: state?.data,
    loading: state?.loading ?? false,
    error: state?.error ?? null,
    activeFigureId: state?.activeFigureId,
  };
}

// helper for UI components
export function getTrackKeyFromTrack(runId: string, t: VizTrack): string {
  return buildTrackKeyFromTrack(runId, t.figure_id ?? null, t.node_id ?? null, t.track_id);
}
