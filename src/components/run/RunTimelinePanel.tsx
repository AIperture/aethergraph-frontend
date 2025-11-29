// src/components/run/RunTimelinePanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { statusChipClass, formatDate } from "./runStatusUtils";

interface RunTimelinePanelProps {
  nodes: NodeSnapshot[];
}

// Simple duration formatter for the active block
const formatDuration = (ms: number | null | undefined) => {
  if (ms == null || ms < 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
};

export const RunTimelinePanel: React.FC<RunTimelinePanelProps> = ({ nodes }) => {
  // Sort nodes by start time (downward timeline)
  const sortedNodes = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
      const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
      if (ta === tb) return a.node_id.localeCompare(b.node_id);
      return ta - tb;
    });
  }, [nodes]);

  const activeNodes = React.useMemo(
    () =>
      sortedNodes.filter((n) => {
        const status = n.status;
        return status === "running" || status === "pending";
      }),
    [sortedNodes],
  );

  const hasActive = activeNodes.length > 0;

  // Internal clock for active nodes; only runs when there are active nodes
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasActive]);

  // Precompute durations for active panel
  const activeWithDurations = React.useMemo(
    () =>
      activeNodes.map((node) => {
        const start = node.started_at
          ? new Date(node.started_at).getTime()
          : null;
        const end = node.finished_at
          ? new Date(node.finished_at).getTime()
          : now;
        const duration = start !== null && end !== null ? end - start : null;
        return { node, duration };
      }),
    [activeNodes, now],
  );

  const maxActiveDuration = React.useMemo(() => {
    const vals = activeWithDurations
      .map((e) => e.duration ?? 0)
      .filter((d) => d > 0);
    if (!vals.length) return 0;
    return Math.max(...vals);
  }, [activeWithDurations]);

  if (nodes.length === 0) {
    return (
      <Card className="shadow-[var(--ag-shadow-soft)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-card-foreground">
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <div className="text-[11px] text-muted-foreground">
            No timeline events yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--ag-shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-card-foreground">
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: vertical timeline */}
          <div className="md:w-2/3 space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground mb-1">
              History
            </div>
            <div className="relative pl-6">
              {/* vertical rail */}
              <div className="absolute left-2 top-1 bottom-1 border-l border-border/60" />
              <div className="space-y-2">
                {sortedNodes.map((node, idx) => {
                  const startedLabel = node.started_at
                    ? new Date(node.started_at).toLocaleTimeString(undefined, {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—";

                  return (
                    <div key={node.node_id} className="relative">
                      {/* dot */}
                      <div className="absolute left-1 top-2 w-2 h-2 rounded-full bg-brand" />
                      <div className="ml-4 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {startedLabel}
                          </span>
                          <span
                            className={
                              "px-1.5 py-0.5 rounded-full capitalize text-[10px] " +
                              statusChipClass(node.status)
                            }
                          >
                            {node.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-foreground/80 truncate max-w-[220px]">
                            {node.node_id}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                            {node.tool_name ?? "—"}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {node.started_at ? formatDate(node.started_at) : "—"}{" "}
                          <span className="mx-0.5">→</span>
                          {node.finished_at
                            ? formatDate(node.finished_at)
                            : node.status === "running" ||
                              node.status === "pending"
                            ? "running…"
                            : "—"}
                        </div>
                      </div>
                      {idx === sortedNodes.length - 1 && (
                        <div className="h-1" /> // small spacer at bottom
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: active nodes block */}
          <div className="md:w-1/3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-muted-foreground">
                Active nodes
              </div>
              {hasActive && (
                <div className="text-[10px] text-muted-foreground">
                  updating…
                </div>
              )}
            </div>

            <div className="rounded-md border border-border/60 bg-muted/40 px-2 py-2 min-h-[60px]">
              {activeWithDurations.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">
                  No active nodes. All tasks are completed or waiting to start.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeWithDurations.map(({ node, duration }) => {
                    const frac =
                      duration && maxActiveDuration > 0
                        ? Math.min(duration / maxActiveDuration, 1)
                        : 0;

                    return (
                      <div
                        key={node.node_id}
                        className="space-y-1 text-[11px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="font-mono text-foreground/80 truncate max-w-[160px]">
                              {node.node_id}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                              {node.tool_name ?? "—"}
                            </span>
                          </div>
                          <span
                            className={
                              "px-1.5 py-0.5 rounded-full capitalize text-[10px] " +
                              statusChipClass(node.status)
                            }
                          >
                            {node.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-background/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand/80 animate-pulse"
                              style={{
                                width: `${Math.max(frac * 100, 8)}%`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground w-16 text-right">
                            {formatDuration(duration ?? null)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
