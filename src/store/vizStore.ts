import { create } from "zustand";
import { fetchRunViz } from "@/lib/api";
import type { RunVizResponse, VizKind } from "@/lib/types";

export type ChartType = "line" | "scatter";
export type ScaleType = "linear" | "log";

export interface TrackViewSettings {
  chartType?: ChartType; // default from backend meta or "line"
  scale?: ScaleType;     // default from backend meta or "linear"
}

export interface ImageViewSettings {
  selectedStep?: number; // chosen step index (not value)
  autoPlay?: boolean;    // for future animation
}

export interface RunVizState {
  data?: RunVizResponse;
  loading: boolean;
  error?: string | null;

  // UI state
  activeFigureId?: string | null;
  trackView: Record<string, TrackViewSettings>;
  imageView: Record<string, ImageViewSettings>;
}

interface VizStoreState {
  runs: Record<string, RunVizState>;

  /**
   * Ensure viz data for a run is loaded.
   * If already loaded and force = false, does nothing.
   */
  loadRunViz: (
    runId: string,
    opts?: { force?: boolean; kinds?: VizKind[] },
  ) => Promise<void>;

  setActiveFigure: (runId: string, figureId: string | null) => void;

  setTrackChartType: (
    runId: string,
    trackKey: string,
    chartType: ChartType,
  ) => void;

  setTrackScale: (
    runId: string,
    trackKey: string,
    scale: ScaleType,
  ) => void;

  setImageSelectedStep: (
    runId: string,
    trackKey: string,
    selectedStep: number,
  ) => void;

  setImageAutoPlay: (
    runId: string,
    trackKey: string,
    autoPlay: boolean,
  ) => void;
}

/**
 * Build a stable key to identify a track's UI state.
 * We scope by (figure_id, node_id, track_id) to avoid collisions.
 */
function makeTrackKey(
  figureId: string | null | undefined,
  nodeId: string | null | undefined,
  trackId: string,
): string {
  const fig = figureId ?? "default";
  const node = nodeId ?? "node";
  return `${fig}::${node}::${trackId}`;
}

export const useVizStore = create<VizStoreState>((set, get) => ({
  runs: {},

  async loadRunViz(runId, opts?: {force?: boolean, kinds?: VizKind[]}) {
    const { force } = opts ?? {};
    const { runs } = get();
    const existing = runs[runId];
    if (existing?.data && !force) {
      // Already loaded; no need to refetch
      return;
    }

    // Set loading state
    set((state) => ({
      runs: {
        ...state.runs,
        [runId]: {
          ...(state.runs[runId] ?? {
            trackView: {},
            imageView: {},
          }),
          ...state.runs[runId],
          loading: true,
          error: null,
        },
      },
    }));

    try {
      const data = await fetchRunViz(runId, { kinds: opts?.kinds });
      console.log("Fetched viz data for run", runId, data);

      // Derive a default activeFigureId: first figure if available
      const defaultFigureId =
        data.figures.length > 0 ? data.figures[0].figure_id ?? null : null;

      set((state) => ({
        runs: {
          ...state.runs,
          [runId]: {
            ...(state.runs[runId] ?? {
              trackView: {},
              imageView: {},
            }),
            data,
            loading: false,
            error: null,
            activeFigureId: state.runs[runId]?.activeFigureId ?? defaultFigureId,
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        runs: {
          ...state.runs,
          [runId]: {
            ...(state.runs[runId] ?? {
              trackView: {},
              imageView: {},
            }),
            loading: false,
            error: err?.message ?? "Failed to load viz",
          },
        },
      }));
    }
  },

  setActiveFigure(runId, figureId) {
    set((state) => {
      const prev = state.runs[runId] ?? {
        trackView: {},
        imageView: {},
      };
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...prev,
            activeFigureId: figureId,
          },
        },
      };
    });
  },

  setTrackChartType(runId, trackKey, chartType) {
    set((state) => {
      const prev = state.runs[runId] ?? {
        trackView: {},
        imageView: {},
      };
      const prevTrackView = prev.trackView[trackKey] ?? {};
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...prev,
            trackView: {
              ...prev.trackView,
              [trackKey]: {
                ...prevTrackView,
                chartType,
              },
            },
          },
        },
      };
    });
  },

  setTrackScale(runId, trackKey, scale) {
    set((state) => {
      const prev = state.runs[runId] ?? {
        trackView: {},
        imageView: {},
      };
      const prevTrackView = prev.trackView[trackKey] ?? {};
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...prev,
            trackView: {
              ...prev.trackView,
              [trackKey]: {
                ...prevTrackView,
                scale,
              },
            },
          },
        },
      };
    });
  },

  setImageSelectedStep(runId, trackKey, selectedStep) {
    set((state) => {
      const prev = state.runs[runId] ?? {
        trackView: {},
        imageView: {},
      };
      const prevImageView = prev.imageView[trackKey] ?? {};
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...prev,
            imageView: {
              ...prev.imageView,
              [trackKey]: {
                ...prevImageView,
                selectedStep,
              },
            },
          },
        },
      };
    });
  },

  setImageAutoPlay(runId, trackKey, autoPlay) {
    set((state) => {
      const prev = state.runs[runId] ?? {
        trackView: {},
        imageView: {},
      };
      const prevImageView = prev.imageView[trackKey] ?? {};
      return {
        runs: {
          ...state.runs,
          [runId]: {
            ...prev,
            imageView: {
              ...prev.imageView,
              [trackKey]: {
                ...prevImageView,
                autoPlay,
              },
            },
          },
        },
      };
    });
  },
}));

// Convenience selector helpers

export function useRunVizState(runId: string) {
  return useVizStore((state) => state.runs[runId]);
}

export function buildTrackKeyFromTrack(
  runId: string,
  figureId: string | null | undefined,
  nodeId: string | null | undefined,
  trackId: string,
): string {
  return makeTrackKey(figureId, nodeId, trackId);
}
