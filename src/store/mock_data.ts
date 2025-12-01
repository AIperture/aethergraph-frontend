import type {
  ArtifactMeta,
  MemoryEvent,
  MemorySummaryEntry,
  MemorySearchHit,
  RunSummary,
  RunSnapshot,
} from "../lib/types";

export const USE_MOCKS = false; // flip to false once backend is wired

export const fakeRuns: RunSummary[] = [
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

export const fakeSnapshots: Record<string, RunSnapshot> = {
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
    edges: [{ source: "spec_parse", target: "simulate" }],
  },
};


export const fakeArtifactsByRun: Record<string, ArtifactMeta[]> = {
  "run_02": [
    {
      artifact_id: "art-001",
      kind: "image/png",
      mime_type: "image/png",
      size: 123456,
      scope_id: "run_02",
      tags: ["preview", "metalens"],
      created_at: new Date().toISOString(),
      uri: "s3://fake/preview.png",
    },
    {
      artifact_id: "art-002",
      kind: "metrics/json",
      mime_type: "application/json",
      size: 2048,
      scope_id: "run_02",
      tags: ["metrics"],
      created_at: new Date().toISOString(),
      uri: "s3://fake/metrics.json",
    },
  ],
};

export const fakeMemoryEventsByScope: Record<string, MemoryEvent[]> = {
  run_02: [
    {
      event_id: "evt-001",
      scope_id: "run_02",
      kind: "log",
      tags: ["info"],
      created_at: new Date(Date.now() - 60_000 * 5).toISOString(),
      data: { text: "Started metalens simulation" },
    },
    {
      event_id: "evt-002",
      scope_id: "run_02",
      kind: "log",
      tags: ["info"],
      created_at: new Date(Date.now() - 60_000 * 2).toISOString(),
      data: { text: "Completed step 1 / 3" },
    },
  ],
};

export const fakeMemorySummariesByScope: Record<string, MemorySummaryEntry[]> = {
  run_02: [
    {
      summary_id: "sum-001",
      scope_id: "run_02",
      summary_tag: "session",
      created_at: new Date().toISOString(),
      time_from: new Date(Date.now() - 60_000 * 10).toISOString(),
      time_to: new Date().toISOString(),
      text: "Short session summary: simulated metalens for 532nm, basic convergence achieved.",
      metadata: { quality: "ok", steps: 3 },
    },
  ],
};

export const fakeMemoryHitsByScope: Record<string, MemorySearchHit[]> = {
  run_02: [
    {
      score: 1.0,
      event: fakeMemoryEventsByScope.run_02[1],
      summary: null,
    },
    {
      score: 0.9,
      event: null,
      summary: fakeMemorySummariesByScope.run_02[0],
    },
  ],
};