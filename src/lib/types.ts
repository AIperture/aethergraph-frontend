// src/lib/types.ts

// App preset (gallery + /apps/:appId)
export interface AppPreset {
  id: string;
  name: string;
  badge: string;
  shortDescription: string;
  longDescription: string;
  graphId: string; // << which graph this preset launches
}


// ---------- Runs ----------

export type RunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"
  | "cancellation_requested";

export interface RunSummary {
  run_id: string;
  graph_id: string;
  status: RunStatus;
  started_at: string | null;
  finished_at: string | null;
  tags: string[];
  user_id?: string | null;
  org_id?: string | null;

  // UI-only convenience
  appId?: string;
  appName?: string;
}

export interface RunCreateRequest {
  run_id?: string | null;
  inputs: Record<string, any>;
  run_config: Record<string, any>;
  tags: string[];
}

export interface RunCreateResponse {
  run_id: string;
  graph_id: string;
  status: RunStatus;
  outputs?: Record<string, any> | null;
  has_waits: boolean;
  continuations: Record<string, any>[];
  started_at: string | null;
  finished_at: string | null;
}

export interface NodeSnapshot {
  node_id: string;
  tool_name?: string | null;
  status: RunStatus;
  started_at: string | null;
  finished_at: string | null;
  outputs?: Record<string, any> | null;
  error?: string | null;
}

export type EdgeSnapshot = {
  source: string; // node_id
  target: string; // node_id
};

export interface RunSnapshot {
  run_id: string;
  graph_id: string;
  nodes: NodeSnapshot[];
  edges: EdgeSnapshot[];
}

export interface RunListResponse {
  runs: RunSummary[];
  next_cursor?: string | null;
}

// TODO: add these later:
export interface ChannelSummary {
  id: string;
  name: string;
  scopedToRunId?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  author: string;
  text: string;
  createdAt: string;
}



export interface GraphListItem {
  graph_id: string;
  name: string;
  description?: string | null;
  inputs: string[];
  outputs: string[];
  tags: string[];
}

export interface GraphNodeInfo {
  id: string;
  type: string;
  tool_name?: string | null;
  tool_version?: string | null;
  expected_inputs: string[];
  expected_outputs: string[];
  output_keys: string[];
}

export interface GraphEdgeInfo {
  from: string;
  to: string;
}

export interface GraphDetail {
  graph_id: string;
  name: string;
  description?: string | null;
  inputs: string[];
  outputs: string[];
  tags: string[];
  nodes: GraphNodeInfo[];
  edges: GraphEdgeInfo[];
}


/* --------- Artifacts --------- */

export interface ArtifactMeta {
  artifact_id: string;
  kind: string;
  mime_type: string | null;
  size: number | null;
  scope_id: string | null;
  tags: string[];
  created_at: string; // ISO datetime
  uri: string | null;
}

export interface ArtifactListResponse {
  artifacts: ArtifactMeta[];
  next_cursor: string | null;
}

/* --------- Memory --------- */

export interface MemoryEvent {
  event_id: string;
  scope_id: string;
  kind: string;
  tags: string[];
  created_at: string; // ISO
  data: Record<string, unknown> | null;
}

export interface MemoryEventListResponse {
  events: MemoryEvent[];
  next_cursor: string | null;
}

export interface MemorySummaryEntry {
  summary_id: string;
  scope_id: string;
  summary_tag: string;
  created_at: string;
  time_from: string;
  time_to: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface MemorySummaryListResponse {
  summaries: MemorySummaryEntry[];
  next_cursor: string | null;
}

export interface MemorySearchRequest {
  query: string;
  scope_id?: string | null;
  top_k?: number;
}

export interface MemorySearchHit {
  score: number;
  event: MemoryEvent | null;
  summary: MemorySummaryEntry | null;
}

export interface MemorySearchResponse {
  hits: MemorySearchHit[];
}


// ---- Stats ----

export interface StatsOverview {
  llm_calls: number;
  llm_prompt_tokens: number;
  llm_completion_tokens: number;

  runs: number;
  runs_succeeded: number;
  runs_failed: number;

  artifacts: number;
  artifact_bytes: number;

  events: number;
}

export interface GraphStatsEntry {
  runs: number;
  succeeded: number;
  failed: number;
  total_duration_s: number;
}

export type GraphStats = Record<string, GraphStatsEntry>;

export interface MemoryStats {
  [kind: string]: { count: number };
}

export interface ArtifactStatsEntry {
  count: number;
  bytes: number;
  pinned_count: number;
  pinned_bytes: number;
}

export type ArtifactStats = Record<string, ArtifactStatsEntry>;

export interface LLMStatsEntry {
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
}


export type LLMStats = Record<string, LLMStatsEntry>;
