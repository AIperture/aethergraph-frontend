// src/components/run/RunTimelinePanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { statusChipClass, formatDate } from "./runStatusUtils";
import { cn } from "../../lib/utils";

interface RunTimelinePanelProps {
  nodes: NodeSnapshot[];
}

type TimelineEntry = {
  node: NodeSnapshot;
  start: number | null;
  end: number | null;
  duration: number | null;
};

// --- Icons ---
const NodeIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const ToolIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);

// --- Helpers ---
const formatDuration = (ms: number | null | undefined) => {
  if (ms == null || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
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
  const [now, setNow] = React.useState(() => Date.now());

  // 1. Base Filter: Ignore __graph_inputs__
  const meaningfulNodes = React.useMemo(() => {
    return nodes.filter(n => n.node_id !== "__graph_inputs__");
  }, [nodes]);

  // 2. Timeline Sort: Chronological (Old -> New) for the Gantt chart
  const timelineSorted = React.useMemo(() => {
    return [...meaningfulNodes].sort((a, b) => {
      const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
      const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
      if (ta === tb) return a.node_id.localeCompare(b.node_id);
      return ta - tb;
    });
  }, [meaningfulNodes]);

  // 3. List Sort: Smart Priority for the Left Panel
  // Priority: Running > Pending > Failed > Success
  // Secondary: Newest Started -> Oldest Started
  const listSorted = React.useMemo(() => {
    return [...meaningfulNodes].sort((a, b) => {
      const getRank = (s: string) => {
        if (s === 'running') return 0;
        if (s === 'pending') return 1;
        if (s === 'failed') return 2;
        return 3; // success
      };
      
      const rankA = getRank(a.status);
      const rankB = getRank(b.status);
      
      if (rankA !== rankB) return rankA - rankB;

      // If status is same, show newest first
      const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
      const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
      return tb - ta; 
    });
  }, [meaningfulNodes]);

  // Build timeline entries (for the Right Panel)
  const timelineEntries: TimelineEntry[] = React.useMemo(() => {
    return timelineSorted.map((n) => {
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
  }, [timelineSorted, now]);

  const hasAny = timelineEntries.length > 0;
  const hasActive = React.useMemo(
    () => timelineEntries.some((e) => e.node.status === "running" || e.node.status === "pending"),
    [timelineEntries],
  );

  // Tick clock
  React.useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasActive]);

  // Compute global time range
  const { minStart, maxEnd } = React.useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const e of timelineEntries) {
      if (e.start != null && e.start < min) min = e.start;
      if (e.end != null && e.end > max) max = e.end;
    }
    if (!isFinite(min) || !isFinite(max) || max <= min) {
      const t = Date.now();
      return { minStart: t - 1000, maxEnd: t };
    }
    return { minStart: min, maxEnd: max };
  }, [timelineEntries]);

  const span = maxEnd - minStart || 1;

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs">
        No active timeline events yet.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header Info */}
      <div className="flex shrink-0 items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-4">
            <div>
                <span className="font-semibold text-foreground">Start:</span>{" "}
                <span className="font-mono">{formatDate(new Date(minStart).toISOString())}</span>
            </div>
            <div>
                <span className="font-semibold text-foreground">Duration:</span>{" "}
                <span className="font-mono">{formatDuration(span)}</span>
            </div>
        </div>
        {hasActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            <span className="font-medium uppercase tracking-wider">Live</span>
          </span>
        )}
      </div>

      {/* Main Layout */}
      <div className="flex min-h-0 flex-1 flex-col gap-0 border border-border/60 rounded-md overflow-hidden bg-background md:flex-row">
        
        {/* LEFT PANE: Priority List (Sorted by Status/Newest) */}
        <div className="flex flex-col min-h-0 border-b border-border/60 md:w-1/3 md:border-b-0 md:border-r bg-muted/5">
          <div className="shrink-0 border-b border-border/60 bg-muted/30 px-3 py-2 flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold">Node Status</span>
            <span className="text-[9px] opacity-70">(Priority Sort)</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-border/40">
              {listSorted.map((node) => {
                const startTime = node.started_at
                  ? new Date(node.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                  : "—";

                return (
                  <div key={node.node_id} className="flex flex-col gap-1.5 p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <NodeIcon />
                            <span className="font-medium text-foreground truncate text-[11px]" title={node.node_id}>
                                {node.node_id}
                            </span>
                        </div>
                        <span className={cn(
                            "shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
                            statusChipClass(node.status)
                        )}>
                            {node.status}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                         <div className={cn(
                             "flex items-center gap-1 max-w-[65%] rounded px-1.5 py-0.5 border border-border/40",
                             node.tool_name ? "bg-background text-foreground/80" : "opacity-0"
                         )}>
                             <ToolIcon />
                             <span className="truncate">{node.tool_name || "—"}</span>
                         </div>
                         <span className="font-mono opacity-70">{startTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Gantt Timeline (Chronological) */}
        <div className="flex flex-col min-h-0 flex-1 bg-background relative">
           <div className="shrink-0 border-b border-border/60 bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Execution Timeline
          </div>

          <div className="flex-1 overflow-y-auto relative">
             {/* Background Grid Lines */}
             <div className="absolute inset-0 flex w-full pointer-events-none z-0">
                <div className="w-1/4 border-r border-dashed border-border/30 h-full" />
                <div className="w-1/4 border-r border-dashed border-border/30 h-full" />
                <div className="w-1/4 border-r border-dashed border-border/30 h-full" />
                <div className="w-1/4 h-full" />
             </div>

            <div className="divide-y divide-border/30 relative z-10">
              {timelineEntries.map(({ node, start, end, duration }) => {
                const fracStart = start != null ? (start - minStart) / span : 0;
                const fracWidth = start != null && end != null && end > start ? (end - start) / span : 0;

                const left = `${Math.max(0, Math.min(fracStart, 1)) * 100}%`;
                const width = `${Math.max(fracWidth * 100, duration ? 1 : 0)}%`; 

                let barColor = "bg-emerald-500";
                if (node.status === "failed") barColor = "bg-red-500";
                if (node.status === "running") barColor = "bg-brand animate-pulse";
                if (node.status === "pending") barColor = "bg-amber-400";

                return (
                  <div key={node.node_id} className="group relative h-[50px] flex flex-col justify-center px-3 hover:bg-muted/10 transition-colors">
                    {/* Simplified Label for Timeline Row */}
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="font-medium text-foreground/70 truncate w-32 group-hover:text-foreground transition-colors">
                            {node.node_id}
                        </span>
                        <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                            {formatDuration(duration)}
                        </span>
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                       {start != null && end != null && (
                         <div
                           className={cn("absolute top-0 bottom-0 rounded-full shadow-sm opacity-90 transition-all", barColor)}
                           style={{ left, width, minWidth: '4px' }}
                         />
                       )}
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