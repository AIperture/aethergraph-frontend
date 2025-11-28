// src/store/shellStore.ts
import { create } from "zustand";
import type {
  AppPreset,
  RunSummary,
  RunCreateRequest,
  RunSnapshot,
} from "../lib/types";
import {
  listRuns,
  getRun,
  getRunSnapshot,
  startRun,
  cancelRun,
} from "../lib/api";

interface ShellState {
  presets: AppPreset[];
  runs: RunSummary[];
  runSnapshots: Record<string, RunSnapshot | undefined>;

  // selectors
  getPresetById: (id: string | undefined) => AppPreset | undefined;
  getPresetByGraphId: (graphId: string | undefined) => AppPreset | undefined;
  getRunsByAppId: (appId: string | undefined) => RunSummary[];
  getRunById: (runId: string | undefined) => RunSummary | undefined;
  getRunSnapshot: (runId: string | undefined) => RunSnapshot | undefined;

  // mutators
  setRuns: (runs: RunSummary[]) => void;
  upsertRun: (run: RunSummary) => void;
  setRunSnapshot: (runId: string, snapshot: RunSnapshot) => void;

  // async actions
  loadRuns: () => Promise<void>;
  loadRunSnapshot: (runId: string) => Promise<void>;
  startRunForPreset: (presetId: string) => Promise<string>; // returns run_id
  cancelRunById: (runId: string) => Promise<void>;
}

const USE_MOCKS = false; // flip to false once backend is wired

const fakeRuns: RunSummary[] = [
  {
    run_id: "run_01",
    graph_id: "rnd_orchestrator",
    status: "succeeded",
    started_at: new Date(Date.now() - 60_000 * 5).toISOString(),
    finished_at: new Date(Date.now() - 60_000 * 2).toISOString(),
    tags: ["rnd-orchestrator"],
    user_id: null,
    org_id: null,
  },
  {
    run_id: "run_02",
    graph_id: "metalens_design",
    status: "running",
    started_at: new Date(Date.now() - 60_000 * 3).toISOString(),
    finished_at: null,
    tags: ["metalens-design"],
    user_id: null,
    org_id: null,
  },
];

const fakeSnapshots: Record<string, RunSnapshot> = {
  run_02: {
    run_id: "run_02",
    graph_id: "metalens_design",
    nodes: [
      {
        node_id: "spec_parse",
        tool_name: "parse_spec",
        status: "succeeded",
        started_at: new Date(Date.now() - 60_000 * 3).toISOString(),
        finished_at: new Date(Date.now() - 60_000 * 2.5).toISOString(),
        outputs: null,
        error: null,
      },
      {
        node_id: "simulate",
        tool_name: "run_simulation",
        status: "running",
        started_at: new Date(Date.now() - 60_000 * 2.5).toISOString(),
        finished_at: null,
        outputs: null,
        error: null,
      },
    ],
    edges: [{ from: "spec_parse", to: "simulate" }],
  },
};

const initialPresets: AppPreset[] = [
  {
    id: "rnd-orchestrator",
    name: "R&D Orchestrator",
    badge: "Preset",
    shortDescription:
      "Coordinate multi-step simulation + analysis workflows with resumable runs.",
    longDescription:
      "This preset demonstrates how AetherGraph orchestrates a multi-stage R&D pipeline: ingest config, launch simulations, track runs, and summarize results with LLM-backed analysis.",
    graphId: "rnd_orchestrator", // backend graph_id
  },
  {
    id: "metalens-design",
    name: "Metalens Design Loop",
    badge: "Optics",
    shortDescription:
      "Spec → meta-atoms → surrogate model → lens → image analysis.",
    longDescription:
      "Designed for optics-focused demos. It walks through a simplified metalens pipeline, from specification to final image quality metrics, with resumable stages and artifact tracking.",
    graphId: "metalens_design", // adjust to your real graph name
  },
  {
    id: "game-agent",
    name: "Game Agent Loop",
    badge: "Experimental",
    shortDescription:
      "Env simulation → agent reaction → user feedback → agent refinement.",
    longDescription:
      "An experimental loop for game/NPC behavior, stitching together environment ticks, agent decisions, and user feedback as a single orchestrated run.",
    graphId: "game_agent_loop", // adjust as needed
  },
];


export const useShellStore = create<ShellState>((set, get) => {
  const attachPresetInfo = (run: RunSummary): RunSummary => {
    const preset = get().presets.find((p) => p.graphId === run.graph_id);
    return {
      ...run,
      appId: preset?.id,
      appName: preset?.name,
    };
  };

    // helper for initial mock runs (can't use get() yet)
  const attachPresetInfoInitial = (run: RunSummary): RunSummary => {
    const preset = initialPresets.find((p) => p.graphId === run.graph_id);
    return {
      ...run,
      appId: preset?.id,
      appName: preset?.name,
    };
  };

  return {
    presets: initialPresets,
    // runs: initialRuns,
    // runSnapshots: {},

    runs: USE_MOCKS ? fakeRuns.map(attachPresetInfoInitial) : [],

    runSnapshots: USE_MOCKS ? fakeSnapshots : {},

    // selectors
    getPresetById: (id) =>
      id ? get().presets.find((p) => p.id === id) : undefined,

    getPresetByGraphId: (graphId) =>
      graphId ? get().presets.find((p) => p.graphId === graphId) : undefined,

    getRunsByAppId: (appId) => {
      if (!appId) return get().runs;
      return get().runs.filter((r) => r.appId === appId);
    },

    getRunById: (runId) => {
      if (!runId) return undefined;
      return get().runs.find((r) => r.run_id === runId);
    },

    getRunSnapshot: (runId) => {
      if (!runId) return undefined;
      return get().runSnapshots[runId];
    },

    // mutators
    setRuns: (runs) => set({ runs: runs.map(attachPresetInfo) }),
    upsertRun: (run) =>
      set((state) => {
        const withPreset = attachPresetInfo(run);
        const idx = state.runs.findIndex((r) => r.run_id === run.run_id);
        if (idx === -1) {
          return { runs: [withPreset, ...state.runs] };
        }
        const next = [...state.runs];
        next[idx] = { ...next[idx], ...withPreset };
        return { runs: next };
      }),
    setRunSnapshot: (runId, snapshot) =>
      set((state) => ({
        runSnapshots: { ...state.runSnapshots, [runId]: snapshot },
      })),

    loadRuns: async () => {
      if (USE_MOCKS) {
        // just ensure attachPresetInfo is applied
        set({ runs: fakeRuns.map(attachPresetInfo) });
        return;
      }
      const data = await listRuns();
      get().setRuns(data.runs);
    },

    loadRunSnapshot: async (runId: string) => {
      if (USE_MOCKS) {
        const snap = fakeSnapshots[runId];
        if (snap) get().setRunSnapshot(runId, snap);
        return;
      }
      const snapshot = await getRunSnapshot(runId);
      get().setRunSnapshot(runId, snapshot);

      try {
        const summary = await getRun(runId);
        get().upsertRun(summary);
      } catch {
        /* ignore */
      }
    },

    startRunForPreset: async (presetId: string) => {
      const preset = get().getPresetById(presetId);
      if (!preset) throw new Error(`Preset not found: ${presetId}`);

      if (USE_MOCKS) {
        const runId = `run_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();
        const summary: RunSummary = {
          run_id: runId,
          graph_id: preset.graphId,
          status: "running",
          started_at: now,
          finished_at: null,
          tags: [preset.id],
        };
        get().upsertRun(summary);
        return runId;
      }

      const body: RunCreateRequest = {
        run_id: null,
        inputs: {},
        run_config: {},
        tags: [preset.id],
      };
      const resp = await startRun(preset.graphId, body);
      const summary: RunSummary = {
        run_id: resp.run_id,
        graph_id: resp.graph_id,
        status: resp.status,
        started_at: resp.started_at,
        finished_at: resp.finished_at,
        tags: body.tags,
      };
      get().upsertRun(summary);
      return resp.run_id;
    },

    cancelRunById: async (runId: string) => {
      if (!USE_MOCKS) {
        await cancelRun(runId);
      }
      const run = get().getRunById(runId);
      if (run) {
        get().upsertRun({ ...run, status: "cancellation_requested" });
      }
    },
  };
});