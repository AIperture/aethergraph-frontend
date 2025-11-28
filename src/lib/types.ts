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

export interface RunSnapshot {
  run_id: string;
  graph_id: string;
  nodes: NodeSnapshot[];
  edges: { [key: string]: any }[]; // you can tighten this later
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
