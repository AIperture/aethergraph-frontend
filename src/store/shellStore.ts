// src/store/shellStore.ts
import { create } from "zustand";
import type {
  AppPreset,
  RunSummary,
  RunCreateRequest,
  RunSnapshot,
  GraphDetail,
  ArtifactMeta,
  MemoryEvent,
  MemorySummaryEntry,
  MemorySearchHit,
  StatsOverview,
  GraphStats,
  LLMStats,
  MemoryStats,
  ArtifactStats,

} from "../lib/types";
import {
  listRuns,
  getRun,
  getRunSnapshot,
  startRun,
  cancelRun,
  getGraphDetail,
  listRunArtifacts,
  listMemoryEvents,
  listMemorySummaries,
  searchMemory as searchMemoryApi,
  getStatsOverview,
  getGraphStats,
  getLLMStats,
  getMemoryStats,
  getArtifactStats,

} from "../lib/api";

// Mock data imports
import {
  USE_MOCKS,
  fakeRuns,
  fakeSnapshots,
  fakeArtifactsByRun,
  fakeMemoryEventsByScope,
  fakeMemorySummariesByScope,
  fakeMemoryHitsByScope,
} from "./mock_data";

interface ShellState {
  presets: AppPreset[];
  runs: RunSummary[];
  runSnapshots: Record<string, RunSnapshot | undefined>;
  graphDetails: Record<string, GraphDetail | undefined>;

  artifactsByRun: Record<string, ArtifactMeta[]>;
  memoryEventsByScope: Record<string, MemoryEvent[]>;
  memorySummariesByScope: Record<string, MemorySummaryEntry[]>;
  memorySearchHitsByScope: Record<string, MemorySearchHit[]>;

  statsOverview: StatsOverview | null;
  graphStats: GraphStats | null;
  memoryStats: MemoryStats | null;
  artifactStats: ArtifactStats | null;
  llmStats: LLMStats | null;
  loadingStats: boolean;
  statsWindow: string;


  loadStats: (window?: string) => Promise<void>;

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

  // Graph details
  getGraphDetail: (graphId: string | undefined) => GraphDetail | undefined;
  loadGraphDetail: (graphId: string) => Promise<void>;

  // Artifacts and Memory
  loadRunArtifacts: (runId: string) => Promise<void>;
  getRunArtifacts: (runId?: string) => ArtifactMeta[] | undefined;

  loadMemoryForScope: (scopeId: string) => Promise<void>;
  getMemoryEvents: (scopeId?: string) => MemoryEvent[] | undefined;
  getMemorySummaries: (scopeId?: string) => MemorySummaryEntry[] | undefined;

  searchMemory: (scopeId: string, query: string) => Promise<void>;
  getMemorySearchHits: (scopeId?: string) => MemorySearchHit[] | undefined;
}



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
    runs: USE_MOCKS ? fakeRuns.map(attachPresetInfoInitial) : [],
    runSnapshots: USE_MOCKS ? fakeSnapshots : {},
    graphDetails: {},
    artifactsByRun: USE_MOCKS ? fakeArtifactsByRun : {},
    memoryEventsByScope: USE_MOCKS ? fakeMemoryEventsByScope : {},
    memorySummariesByScope: USE_MOCKS ? fakeMemorySummariesByScope : {},
    memorySearchHitsByScope: USE_MOCKS ? fakeMemoryHitsByScope : {},

    statsOverview: null,
    graphStats: null,
    memoryStats: null,
    artifactStats: null,
    llmStats: null,
    loadingStats: false,
    statsWindow: "24h",


    loadStats: async (window = "24h") => {
      const { loadingStats } = get();
      if (loadingStats) return; // simple guard

      set({ loadingStats: true, statsWindow: window });
      try {
        const [overview, graphs, memory, artifacts, llm] = await Promise.all([
          getStatsOverview(window),
          getGraphStats(window),
          getMemoryStats(window),
          getArtifactStats(window),
          getLLMStats(window),
        ]);

        set({
          statsOverview: overview,
          graphStats: graphs,
          memoryStats: memory,
          artifactStats: artifacts,
          llmStats: llm,
          loadingStats: false,
        });
      } catch (err) {
        console.error("Failed to load stats", err);
        set({ loadingStats: false });
      }
    },

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
      // console.log("returned snapshot for runId", runId, get().runSnapshots[runId]);
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


    getGraphDetail: (graphId) =>
      graphId ? get().graphDetails[graphId] : undefined,

    loadGraphDetail: async (graphId: string) => {
      const existing = get().graphDetails[graphId];
      if (existing) return; // simple memoization

      const detail = await getGraphDetail(graphId);
      set((state) => ({
        graphDetails: { ...state.graphDetails, [graphId]: detail },
      }));
    },

    /* -------- Artifacts actions -------- */

    loadRunArtifacts: async (runId: string) => {
      if (USE_MOCKS) return;
      try {
        const res = await listRunArtifacts(runId);
        set((state) => ({
          artifactsByRun: {
            ...state.artifactsByRun,
            [runId]: res.artifacts,
          },
        }));
      } catch (err) {
        console.error("Failed to load artifacts for run", runId, err);
      }
    },


    getRunArtifacts: (runId?: string) => {
      if (!runId) return undefined;
      return get().artifactsByRun[runId];
    },

    /* -------- Memory actions -------- */

    loadMemoryForScope: async (scopeId: string) => {
      if (USE_MOCKS) return;
      try {
        const [eventsRes, summariesRes] = await Promise.all([
          listMemoryEvents(scopeId, { limit: 50 }),
          listMemorySummaries(scopeId, { limit: 50 }),
        ]);

        set((state) => ({
          memoryEventsByScope: {
            ...state.memoryEventsByScope,
            [scopeId]: eventsRes.events,
          },
          memorySummariesByScope: {
            ...state.memorySummariesByScope,
            [scopeId]: summariesRes.summaries,
          },
        }));
      } catch (err) {
        console.error("Failed to load memory for scope", scopeId, err);
      }
    },

    getMemoryEvents: (scopeId?: string) => {
      if (!scopeId) return undefined;
      return get().memoryEventsByScope[scopeId];
    },

    getMemorySummaries: (scopeId?: string) => {
      if (!scopeId) return undefined;
      return get().memorySummariesByScope[scopeId];
    },

    searchMemory: async (scopeId: string, query: string) => {
      if (!query) {
        set((state) => ({
          memorySearchHitsByScope: {
            ...state.memorySearchHitsByScope,
            [scopeId]: [],
          },
        }));
        return;
      }

      if (USE_MOCKS) {
        set((state) => ({
          memorySearchHitsByScope: {
            ...state.memorySearchHitsByScope,
            [scopeId]: fakeMemoryHitsByScope[scopeId] ?? [],
          },
        }));
        return;
      }

      try {
        const res = await searchMemoryApi({ scope_id: scopeId, query, top_k: 10 });
        set((state) => ({
          memorySearchHitsByScope: {
            ...state.memorySearchHitsByScope,
            [scopeId]: res.hits,
          },
        }));
      } catch (err) {
        console.error("Failed to search memory for scope", scopeId, err);
      }
    },


    getMemorySearchHits: (scopeId?: string) => {
      if (!scopeId) return undefined;
      return get().memorySearchHitsByScope[scopeId];
    },

  };

});