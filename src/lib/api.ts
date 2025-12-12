// src/lib/api.ts
import { getClientId } from "@/utils/clientId";
import type {
  RunListResponse,
  RunSummary,
  RunCreateRequest,
  RunCreateResponse,
  RunSnapshot,
  GraphListItem,
  GraphDetail,
  ArtifactListResponse,
  MemoryEventListResponse,
  MemorySummaryListResponse,
  MemorySearchRequest,
  MemorySearchResponse,
  StatsOverview,
  GraphStats,
  MemoryStats,
  ArtifactStats,
  LLMStats,
  RunChannelEvent,
  VizKind,
  RunVizResponse

} from "./types";


import { API_BASE } from "@/config";

function withClientHeaders(init?: RequestInit): RequestInit {
  const clientId = getClientId();
  const headers = new Headers(init?.headers || {});
  if (clientId) {
    headers.set("X-Client-ID", clientId);
  }
  return { ...init, headers };
}

async function apiFetch(input: string | URL, init?: RequestInit) {
  return fetch(input, withClientHeaders(init));
}


export async function listRuns(): Promise<RunListResponse> {
  const clientId = getClientId();
  // const url = new URL(`${API_BASE}/runs`, window.location.origin);

  // url.searchParams.set("client_id", clientId);
  // const res = await fetch(url.toString());
  const res = await fetch(`${API_BASE}/runs`, {
    headers: {
      "X-Client-ID": clientId,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function getRun(runId: string): Promise<RunSummary> {
  const res = await fetch(`${API_BASE}/runs/${runId}`,
    {headers: { "X-Client-ID": getClientId() }}
  );
  if (!res.ok) throw new Error("Failed to fetch run summary");
  return res.json();
}

export async function getRunSnapshot(runId: string): Promise<RunSnapshot> {
  const res = await fetch(`${API_BASE}/runs/${runId}/snapshot`,
    {headers: { "X-Client-ID": getClientId() }}
  );
  if (!res.ok) throw new Error("Failed to fetch run snapshot");
  return res.json();
}

export async function startRun(
  graphId: string,
  body: RunCreateRequest
): Promise<RunCreateResponse> {
  console.log("Starting run with body:", body);
  const res = await fetch(`${API_BASE}/graphs/${graphId}/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-ID": getClientId(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Failed to start run (status ${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) {
        message = data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export async function cancelRun(runId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/runs/${runId}/cancel`, {
    method: "POST",
    headers: { "X-Client-ID": getClientId() },
  });
  if (!res.ok) throw new Error("Failed to cancel run");
}


export async function listGraphs(): Promise<GraphListItem[]> {
  const res = await fetch(`${API_BASE}/graphs`,
    {headers: { "X-Client-ID": getClientId() }}
  );
  if (!res.ok) throw new Error("Failed to list graphs");
  return res.json();
}

export async function getGraphDetail(graphId: string): Promise<GraphDetail> {
  const res = await fetch(`${API_BASE}/graphs/${graphId}`,
    {headers: { "X-Client-ID": getClientId() }}
  );
  if (!res.ok) throw new Error("Failed to fetch graph detail");
  return res.json();
}




export async function listRunArtifacts(
  runId: string
): Promise<ArtifactListResponse> {
  const clientId = getClientId();
  const res = await fetch(
    `${API_BASE}/runs/${runId}/artifacts`,
    { headers: { "X-Client-ID": clientId } }
  );
  if (!res.ok) throw new Error("Failed to list run artifacts");
  return res.json();
}


/**
 * Convenience helper: URL to stream artifact content.
 * Use in <img>, <a href>, or fetch() calls.
 */

// export function getArtifactContentUrl(artifactId: string): string {
//   const clientId = getClientId();
//   return `${API_BASE}/artifacts/${artifactId}/content?client_id=${encodeURIComponent(
//     clientId
//   )}`;
// }
export function getArtifactContentUrl(artifactId: string): string {
  // We keep client_id here because the browser will hit this URL directly without headers.
  const clientId = getClientId();
  const url = new URL(`${API_BASE}/artifacts/${artifactId}/content`, window.location.origin);
  if (clientId) {
    url.searchParams.set("client_id", clientId);
  }
  return url.toString();
}


export async function fetchArtifactTextContent(
  artifactId: string
): Promise<string> {
  const res = await apiFetch(getArtifactContentUrl(artifactId));
  if (!res.ok) throw new Error("Failed to load artifact content");
  return res.text();
}



export async function pinArtifactApi(
  artifactId: string,
  pinned: boolean
): Promise<void> {
  const clientId = getClientId();
  const res = await apiFetch(
    `${API_BASE}/artifacts/${artifactId}/pin?client_id=${encodeURIComponent(clientId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pinned),
    }
  );
  if (!res.ok) throw new Error("Failed to pin artifact");
}

export async function listArtifacts(params?: {
  scopeId?: string;
  kind?: string;
  tags?: string; // comma-separated
  limit?: number;
}): Promise<ArtifactListResponse> {
  const query = new URLSearchParams();
  if (params?.scopeId) query.set("scope_id", params.scopeId);
  if (params?.kind) query.set("kind", params.kind);
  if (params?.tags) query.set("tags", params.tags);
  if (params?.limit) query.set("limit", String(params.limit));

  // TEMP: demo-only scoping; later replace with auth/identity
  query.set("client_id", getClientId());

  const res = await apiFetch(`${API_BASE}/artifacts?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to list artifacts");
  return res.json();
}


/* ---------------- Memory ---------------- */

export async function listMemoryEvents(
  scopeId: string,
  params?: {
    kinds?: string;
    tags?: string;
    limit?: number;
  }
): Promise<MemoryEventListResponse> {
  const search = new URLSearchParams();
  search.set("scope_id", scopeId);
  if (params?.kinds) search.set("kinds", params.kinds);
  if (params?.tags) search.set("tags", params.tags);
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const url = `${API_BASE}/memory/events${qs ? `?${qs}` : ""}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to list memory events");
  return res.json();
}


export async function listMemorySummaries(
  scopeId: string,
  params?: {
    summary_tag?: string;
    limit?: number;
  }
): Promise<MemorySummaryListResponse> {
  const search = new URLSearchParams();

  search.set("scope_id", scopeId);
  if (params?.summary_tag) search.set("summary_tag", params.summary_tag);
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  const url = `${API_BASE}/memory/summaries${qs ? `?${qs}` : ""}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to list memory summaries");
  return res.json();
}


export async function searchMemory(
  req: MemorySearchRequest
): Promise<MemorySearchResponse> {
  const res = await apiFetch(`${API_BASE}/memory/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to search memory");
  return res.json();
}


// --- Stats ---

export async function getStatsOverview(
  window = "24h"
): Promise<StatsOverview> {
  const search = new URLSearchParams({ window });
  const url = `${API_BASE}/stats/overview?${search.toString()}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch stats overview");
  return res.json();
}


export async function getGraphStats(
  window = "24h",
  graphId?: string
): Promise<GraphStats> {
  const search = new URLSearchParams({ window });
  if (graphId) search.set("graph_id", graphId);

  const url = `${API_BASE}/stats/graphs?${search.toString()}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch graph stats");
  return res.json();
}


export async function getMemoryStats(
  window = "24h",
  scopeId?: string
): Promise<MemoryStats> {
  const search = new URLSearchParams({ window });
  if (scopeId) search.set("scope_id", scopeId);

  const url = `${API_BASE}/stats/memory?${search.toString()}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch memory stats");
  return res.json();
}

export async function getArtifactStats(
  window = "24h"
): Promise<ArtifactStats> {
  const search = new URLSearchParams({ window });
  const url = `${API_BASE}/stats/artifacts?${search.toString()}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch artifact stats");
  return res.json();
}


export async function getLLMStats(
  window = "24h"
): Promise<LLMStats> {
  const search = new URLSearchParams({ window });
  const url = `${API_BASE}/stats/llm?${search.toString()}`;

  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch LLM stats");
  return res.json();
}


export async function listRunChannelEvents(
  runId: string,
  sinceTs?: number
): Promise<RunChannelEvent[]> {
  const url = new URL(
    `${API_BASE}/runs/${runId}/channel/events`,
    window.location.origin
  );

  if (sinceTs != null) {
    url.searchParams.set("since_ts", String(sinceTs));
  }

  const res = await apiFetch(url.toString(), {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch run channel events");
  }

  return res.json() as Promise<RunChannelEvent[]>;
}


export interface SendRunChannelMessageRequest {
  text?: string;
  choice?: string;
  meta?: Record<string, any>;
  // later: files
}

// POST /api/v1/runs/{run_id}/channel/incoming
export async function sendRunChannelMessage(
  runId: string,
  payload: SendRunChannelMessageRequest
): Promise<{ ok: boolean; resumed: boolean }> {
  const res = await apiFetch(`${API_BASE}/runs/${runId}/channel/incoming`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send channel message");
  return res.json();
}



export interface FetchRunVizOptions {
  kinds?: VizKind[]; // optional filter: ["scalar", "image"]
}

/**
 * Fetch visualization data for a run from /runs/{run_id}/viz.
 * Returns structured data (figures/tracks/points), not images.
 */
export async function fetchRunViz(
  runId: string,
  opts: FetchRunVizOptions = {},
): Promise<RunVizResponse> {
  const url = new URL(`${API_BASE}/runs/${runId}/viz`, window.location.origin);

  if (opts.kinds && opts.kinds.length > 0) {
    url.searchParams.set("viz_kinds", opts.kinds.join(","));
  }

  const res = await apiFetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch viz for run ${runId}: ${res.status}`);
  }

  return res.json() as Promise<RunVizResponse>;
}
