// src/lib/types.ts

// App preset (gallery + /apps/:appId)
export type AppPreset = {
  id: string;                 // route id; keep this == graphId
  name: string;
  badge: string;
  shortDescription: string;
  longDescription: string;
  graphId: string;            // backend graph_id
  category: "Core" | "R&D Lab" | "Experimental" | "Infra" | "Productivity";
  status: "available" | "coming-soon";
  iconKey?: "chat" | "target" | "microscope" | "aperture" | "gamepad" | "sparkles" | "cpu" | "bolt" | "file-pen" | "server" | "database" | "rotate-ccw" | "line-chart" | "trending-up" | "flask" | "cog" | "beaker" | "projector" | "puzzle" | "lightbulb" | "robot" | "brain" | "network" | "chart-pie" | "code" | "cloud" | "shield-check" | "eye" | "book-open" | "hammer" | "wrench" | "bar-chart-2" | "repeat";
  features?: string[];
  demoSteps?: string[];
  githubUrl?: string;
};


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
  pinned?: boolean;
  preview_uri?: string | null;
  run_id?: string | null;
  graph_id?: string | null;

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


// ---------- Channel Messages ----------
// lib/types.ts

export interface ChannelButton {
  label: string | null;
  value: string | null;
  style?: string | null;
  url?: string | null;
}

export interface ChannelFile {
  id?: string;
  name?: string;
  mimetype?: string;
  size?: number;
  uri?: string | null;
  url?: string | null;
  // meta if needed later
  [key: string]: any;
}

export interface RunChannelEvent {
  id: string;
  run_id: string;
  type: string; // e.g. "agent.message", "session.need_input", "session.need_approval"
  text?: string | null;
  buttons?: ChannelButton[];
  file?: ChannelFile | null;
  meta?: Record<string, any>;
  ts: number; // unix timestamp (seconds or ms, but treat as number)
}


export type VizKind = "scalar" | "vector" | "matrix" | "image";
export type VizMode = "append" | "replace";

export interface VizPoint {
  step: number;
  value?: number | null;
  vector?: number[] | null;
  matrix?: number[][] | null;
  artifact_id?: string | null;
  created_at?: string | null; // ISO string
}

export interface VizTrack {
  track_id: string;
  figure_id?: string | null;
  node_id?: string | null;
  viz_kind: VizKind;
  mode: VizMode;
  meta?: Record<string, any> | null;
  points: VizPoint[];
}

export interface VizFigure {
  figure_id?: string | null;
  tracks: VizTrack[];
}

export interface RunVizResponse {
  run_id: string;
  figures: VizFigure[];
}