// src/lib/api.ts
import type {
  RunListResponse,
  RunSummary,
  RunCreateRequest,
  RunCreateResponse,
  RunSnapshot,
} from "./types";

const API_BASE = "/api/v1";

export async function listRuns(): Promise<RunListResponse> {
  const res = await fetch(`${API_BASE}/runs`);
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
  console.log("API startRun called with body:", body);
  const res = await fetch(`${API_BASE}/graphs/${graphId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),

  });
  console.log("API startRun response:", res);
  if (!res.ok) throw new Error("Failed to start run");
  return res.json();
}

export async function cancelRun(runId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/runs/${runId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to cancel run");
}
