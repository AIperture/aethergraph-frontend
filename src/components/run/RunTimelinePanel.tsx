// src/components/run/RunTimelinePanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { statusChipClass, formatDate } from "./runStatusUtils";

interface RunTimelinePanelProps {
  nodes: NodeSnapshot[];
}

type TimelineEntry = {
  node: NodeSnapshot;
  start: number | null;
  end: number | null;
  duration: number | null;
};

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
  // ticking clock for active nodes
  const [now, setNow] = React.useState(() => Date.now());

  // Sort by start time, then id for stability
  const sorted = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
      const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
      if (ta === tb) return a.node_id.localeCompare(b.node_id);
      return ta - tb;
    });
  }, [nodes]);

  // Build timeline entries (start, end, duration)
  const entries: TimelineEntry[] = React.useMemo(() => {
    return sorted.map((n) => {
      const start = n.started_at ? new Date(n.started_at).getTime() : null;
      const end = n.finished_at
        ? new Date(n.finished_at).getTime()
        : start != null
          ? now
          : null;
      const duration =
        start != null && end != null && end >= start ? end - start : null;
      return { node: n, start, end, duration };
    });
  }, [sorted, now]);

  const hasAny = entries.length > 0;

  const hasActive = React.useMemo(
    () =>
      entries.some(
        (e) => e.node.status === "running" || e.node.status === "pending",
      ),
    [entries],
  );

  // Only tick when we actually have active nodes
  React.useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasActive]);

  if (!hasAny) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No timeline events yet.
      </div>
    );
  }

  // Compute global time range for the x-axis
  const { minStart, maxEnd } = React.useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const e of entries) {
      if (e.start != null && e.start < min) min = e.start;
      if (e.end != null && e.end > max) max = e.end;
    }

    if (!isFinite(min) || !isFinite(max) || max <= min) {
      const t = Date.now();
      return { minStart: t - 1000, maxEnd: t };
    }

    return { minStart: min, maxEnd: max };
  }, [entries]);

  const span = maxEnd - minStart || 1; // avoid divide by zero

  return (
    <div className="flex h-[360px] flex-col gap-3 text-xs text-muted-foreground lg:h-[420px]">
      {/* Small meta row (span + live) */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="hidden md:inline">
          Span:{" "}
          <span className="font-mono">
            {formatDate(new Date(minStart).toISOString())}
          </span>{" "}
          →{" "}
          <span className="font-mono">
            {formatDate(new Date(maxEnd).toISOString())}
          </span>
        </span>
        {hasActive && (
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            live
          </span>
        )}
      </div>

      {/* Main two-column layout */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        {/* Left: node list (chronological) */}
        <div className="min-h-0 space-y-1.5 md:w-1/3 flex flex-col">
          <div className="text-[11px] font-medium text-muted-foreground">
            Nodes in chronological order
          </div>
          <div className="mt-1 flex-1 min-h-0 max-h-full overflow-auto rounded-md border border-border/60 bg-muted/40">
            <ul className="divide-y divide-border/60">
              {entries.map(({ node }) => {
                const startedLabel = node.started_at
                  ? new Date(node.started_at).toLocaleTimeString(undefined, {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "—";

                return (
                  <li
                    key={node.node_id}
                    className="flex flex-col gap-0.5 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {startedLabel}
                      </span>
                      <span
                        className={
                          "rounded-full px-1.5 py-0.5 text-[10px] capitalize " +
                          statusChipClass(node.status)
                        }
                      >
                        {node.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="max-w-[140px] truncate font-mono text-[11px] text-foreground/80">
                        {node.node_id}
                      </span>
                      <span className="max-w-[140px] truncate text-[10px] text-muted-foreground">
                        {node.tool_name ?? "—"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: horizontal timeline with concurrency */}
        <div className="min-h-0 space-y-2 md:w-2/3 flex flex-col">
          <div className="text-[11px] font-medium text-muted-foreground">
            Execution window (concurrency)
          </div>
          <div className="mt-1 flex-1 min-h-0 max-h-full overflow-auto rounded-md border border-border/60 bg-muted/40 px-3 py-2">
            <div className="space-y-2">
              {entries.map(({ node, start, end, duration }) => {
                const fracStart =
                  start != null ? (start - minStart) / span : 0;
                const fracWidth =
                  start != null && end != null && end > start
                    ? (end - start) / span
                    : 0;

                const left = `${Math.max(0, Math.min(fracStart, 1)) * 100}%`;
                const width = `${Math.max(fracWidth * 100, duration ? 4 : 0)}%`;

                return (
                  <div key={node.node_id} className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="max-w-[160px] truncate font-mono text-foreground/80">
                        {node.node_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(duration)}
                      </span>
                    </div>
                    <div className="relative h-4 overflow-hidden rounded-full bg-background/60">
                      {start != null && end != null && (
                        <div
                          className={
                            "absolute top-0 bottom-0 rounded-full " +
                            (node.status === "failed"
                              ? "bg-red-500/80"
                              : node.status === "running"
                                ? "bg-brand"
                                : node.status === "pending"
                                  ? "bg-amber-400/80"
                                  : "bg-emerald-500/80")
                          }
                          style={{ left, width }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {node.started_at ? formatDate(node.started_at) : "—"}
                      </span>
                      <span>
                        {node.finished_at
                          ? formatDate(node.finished_at)
                          : node.status === "running" ||
                              node.status === "pending"
                            ? "running…"
                            : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
