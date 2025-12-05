// src/store/shellStore.ts
import { create } from "zustand";
import { getClientId } from "@/utils/clientId"; // temp client ID util authentication is in place

import { initialPresets } from "./initialPresets";
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
  pinArtifactApi,
  listArtifacts,


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
  artifactsById: Record<string, ArtifactMeta>;
  selectedArtifactIdByRun: Record<string, string | null>;
  globalArtifacts: ArtifactMeta[];
  selectedGlobalArtifactId: string | null;

  memoryEventsByScope: Record<string, MemoryEvent[]>;
  memorySummariesByScope: Record<string, MemorySummaryEntry[]>;
  memorySearchHitsByScope: Record<string, MemorySearchHit[]>;

  runParamsById: Record<string, RunCreateRequest | undefined>;

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
  getRunParamsForRun: (runId: string | undefined) => RunCreateRequest | undefined;


  // mutators
  setRuns: (runs: RunSummary[]) => void;
  upsertRun: (run: RunSummary) => void;
  setRunSnapshot: (runId: string, snapshot: RunSnapshot) => void;
  setRunParamsForRun: (runId: string, params: RunCreateRequest) => void;


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
  selectRunArtifact: (runId: string, artifactId: string | null) => void;
  pinArtifact: (artifactId: string, pinned: boolean) => Promise<void>;
  loadGlobalArtifacts: (filters?: {
    scopeId?: string;
    kind?: string;
    tags?: string;
  }) => Promise<void>;
  getGlobalArtifacts: () => ArtifactMeta[];
  selectGlobalArtifact: (artifactId: string | null) => void;

  loadMemoryForScope: (scopeId: string) => Promise<void>;
  getMemoryEvents: (scopeId?: string) => MemoryEvent[] | undefined;
  getMemorySummaries: (scopeId?: string) => MemorySummaryEntry[] | undefined;

  searchMemory: (scopeId: string, query: string) => Promise<void>;
  getMemorySearchHits: (scopeId?: string) => MemorySearchHit[] | undefined;
}




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
    artifactsById: {},
    selectedArtifactIdByRun: {},
    globalArtifacts: [],
    selectedGlobalArtifactId: null,

    memoryEventsByScope: USE_MOCKS ? fakeMemoryEventsByScope : {},
    memorySummariesByScope: USE_MOCKS ? fakeMemorySummariesByScope : {},
    memorySearchHitsByScope: USE_MOCKS ? fakeMemoryHitsByScope : {},

    runParamsById: {},


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
      const out = get().runs.filter((r) => r.appId === appId);
      return out;
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
      try {
        const data = await listRuns();
        set({ runs: data.runs });
      } catch (err) {
        console.error("Failed to load runs", err);
      }
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
          appId: preset.id,
          appName: preset.name,
        };
        get().upsertRun(summary);
        return runId;
      }

      const clientId = getClientId();

      const body: RunCreateRequest = {
        run_id: null,
        inputs: {},
        run_config: {},
        tags: [preset.id, `client:${clientId}`],
      };
      const resp = await startRun(preset.graphId, body);
      const summary: RunSummary = {
        run_id: resp.run_id,
        graph_id: resp.graph_id,
        status: resp.status,
        started_at: resp.started_at,
        finished_at: resp.finished_at,
        tags: body.tags,
        appId: preset.id,
        appName: preset.name,
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



    getRunParamsForRun: (runId) => {
      if (!runId) return undefined;
      return get().runParamsById[runId];
    },



    setRunParamsForRun: (runId, params) => {
      set((state) => ({
        runParamsById: {
          ...state.runParamsById,
          [runId]: params,
        },
      }));
    },

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
      const data = await listRunArtifacts(runId);
      set((state) => {
        const artifactsById = { ...state.artifactsById };
        for (const meta of data.artifacts) {
          artifactsById[meta.artifact_id] = meta;
        }
        return {
          artifactsByRun: {
            ...state.artifactsByRun,
            [runId]: data.artifacts,
          },
          artifactsById,
        };
      });
    },

    selectRunArtifact: (runId: string, artifactId: string | null) =>
      set((state) => ({
        selectedArtifactIdByRun: {
          ...state.selectedArtifactIdByRun,
          [runId]: artifactId,
        },
      })),


    getRunArtifacts: (runId?: string) => {
      if (!runId) return undefined;
      return get().artifactsByRun[runId];
    },

    pinArtifact: async (artifactId: string, pinned: boolean) => {
      // optimistic update
      set((state) => {
        const meta = state.artifactsById[artifactId];
        if (!meta) return state;

        const updated = { ...meta, pinned };
        const artifactsById = { ...state.artifactsById, [artifactId]: updated };

        const artifactsByRun: typeof state.artifactsByRun = {};
        for (const [runId, list] of Object.entries(state.artifactsByRun)) {
          artifactsByRun[runId] = list.map((a) =>
            a.artifact_id === artifactId ? updated : a
          );
        }

        const globalArtifacts = state.globalArtifacts.map((a) =>
          a.artifact_id === artifactId ? updated : a
        );

        return { artifactsById, artifactsByRun, globalArtifacts };
      });

      try {
        await pinArtifactApi(artifactId, pinned);
      } catch (err) {
        console.error("Failed to pin artifact", err);
        // optional: reload or rollback
      }
    },


    loadGlobalArtifacts: async (filters) => {
      const data = await listArtifacts(filters);
      set((state) => {
        const byId = { ...state.artifactsById };
        for (const meta of data.artifacts) {
          byId[meta.artifact_id] = meta;
        }
        return {
          artifactsById: byId,
          globalArtifacts: data.artifacts,
        };
      });
    },

    getGlobalArtifacts: () => get().globalArtifacts,

    selectGlobalArtifact: (artifactId: string | null) =>
      set(() => ({ selectedGlobalArtifactId: artifactId })),
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