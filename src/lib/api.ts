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
  RunChannelEvent

} from "./types";


import { API_BASE } from "@/config";

// export async function listRuns(): Promise<RunListResponse> {
//   const res = await fetch(`${API_BASE}/runs`);
//   if (!res.ok) throw new Error("Failed to fetch runs");
//   return res.json();
// }

export async function listRuns(): Promise<RunListResponse> {
  const clientId = getClientId();
  console.log(
    API_BASE,
  )

  const url = new URL(`${API_BASE}/runs`, window.location.origin);
  url.searchParams.set("client_id", clientId);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function getRun(runId: string): Promise<RunSummary> {
  const res = await fetch(`${API_BASE}/runs/${runId}`);
  if (!res.ok) throw new Error("Failed to fetch run summary");
  return res.json();
}

export async function getRunSnapshot(runId: string): Promise<RunSnapshot> {
  const res = await fetch(`${API_BASE}/runs/${runId}/snapshot`);
  if (!res.ok) throw new Error("Failed to fetch run snapshot");
  return res.json();
}

export async function startRun(
  graphId: string,
  body: RunCreateRequest
): Promise<RunCreateResponse> {
  const res = await fetch(`${API_BASE}/graphs/${graphId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      // ignore JSON parse errors, keep default message
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
  });
  if (!res.ok) throw new Error("Failed to cancel run");
}


export async function listGraphs(): Promise<GraphListItem[]> {
  const res = await fetch(`${API_BASE}/graphs`);
  if (!res.ok) throw new Error("Failed to list graphs");
  return res.json();
}

export async function getGraphDetail(graphId: string): Promise<GraphDetail> {
  const res = await fetch(`${API_BASE}/graphs/${graphId}`);
  if (!res.ok) throw new Error("Failed to fetch graph detail");
  return res.json();
}




export async function listRunArtifacts(
  runId: string
): Promise<ArtifactListResponse> {
  const clientId = getClientId();
  const res = await fetch(
    `${API_BASE}/runs/${runId}/artifacts?client_id=${encodeURIComponent(clientId)}`
  );
  if (!res.ok) throw new Error("Failed to list run artifacts");
  return res.json();
}


/**
 * Convenience helper: URL to stream artifact content.
 * Use in <img>, <a href>, or fetch() calls.
 */

export function getArtifactContentUrl(artifactId: string): string {
  const clientId = getClientId();
  return `${API_BASE}/artifacts/${artifactId}/content?client_id=${encodeURIComponent(
    clientId
  )}`;
}


export async function fetchArtifactTextContent(
  artifactId: string
): Promise<string> {
  const res = await fetch(getArtifactContentUrl(artifactId));
  if (!res.ok) throw new Error("Failed to load artifact content");
  return res.text();
}



export async function pinArtifactApi(
  artifactId: string,
  pinned: boolean
): Promise<void> {
  const clientId = getClientId();
  const res = await fetch(
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

  const res = await fetch(`${API_BASE}/artifacts?${query.toString()}`);
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

  const res = await fetch(url);
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

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to list memory summaries");
  return res.json();
}


export async function searchMemory(
  req: MemorySearchRequest
): Promise<MemorySearchResponse> {
  const res = await fetch(`${API_BASE}/memory/search`, {
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
  const search = new URLSearchParams({ window, client_id: getClientId() });
  const res = await fetch(`${API_BASE}/stats/overview?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch stats overview");
  return res.json();
}

export async function getGraphStats(
  window = "24h",
  graphId?: string
): Promise<GraphStats> {
  const search = new URLSearchParams({ window, client_id: getClientId() });
  if (graphId) search.set("graph_id", graphId);
  const res = await fetch(`${API_BASE}/stats/graphs?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch graph stats");
  return res.json();
}

export async function getMemoryStats(
  window = "24h",
  scopeId?: string
): Promise<MemoryStats> {
  const search = new URLSearchParams({ window, client_id: getClientId() });
  if (scopeId) search.set("scope_id", scopeId);
  const res = await fetch(`${API_BASE}/stats/memory?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch memory stats");
  return res.json();
}

export async function getArtifactStats(
  window = "24h"
): Promise<ArtifactStats> {
  const search = new URLSearchParams({ window, client_id: getClientId() });
  const res = await fetch(`${API_BASE}/stats/artifacts?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch artifact stats");
  return res.json();
}

export async function getLLMStats(
  window = "24h"
): Promise<LLMStats> {
  const search = new URLSearchParams({ window, client_id: getClientId() });
  const res = await fetch(`${API_BASE}/stats/llm?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch LLM stats");
  return res.json();
}


// GET /api/v1/runs/{run_id}/channel/events?since_ts=...
// export async function listRunChannelEvents(
//   runId: string,
//   sinceTs?: number
// ): Promise<RunChannelEvent[]> {

//   const params: Record<string, any> = {};
//   if (sinceTs != null) params.since_ts = sinceTs;

//   const res = await fetch(`/api/v1/runs/${runId}/channel/events?${new URLSearchParams(params)}`, {
//     method: "GET",
//   });
//   // assuming backend returns a plain array of events
//   if (!res.ok) throw new Error("Failed to fetch run channel events");
//   return res.json() as Promise<RunChannelEvent[]>;
// }

export async function listRunChannelEvents(
  runId: string,
  sinceTs?: number
): Promise<RunChannelEvent[]> {
  const clientId = getClientId();

  // Build URL with query params
  const url = new URL(`${API_BASE}/runs/${runId}/channel/events`, window.location.origin);

  if (sinceTs != null) {
    url.searchParams.set("since_ts", String(sinceTs));
  }
  url.searchParams.set("client_id", clientId);

  const res = await fetch(url.toString(), {
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

  const res = await fetch(`${API_BASE}/runs/${runId}/channel/incoming`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send channel message");
  return res.json();
}