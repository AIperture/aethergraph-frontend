// src/components/run/RunTimelinePanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { statusChipClass, formatDate } from "./runStatusUtils";

interface RunTimelinePanelProps {
  nodes: NodeSnapshot[];
}

export const RunTimelinePanel: React.FC<RunTimelinePanelProps> = ({ nodes }) => {
  const timelineNodes = React.useMemo(
    () =>
      [...nodes].sort((a, b) => {
        const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
        const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
        return ta - tb;
      }),
    [nodes],
  );

  const bucketedTimeline = React.useMemo(() => {
    if (!timelineNodes.length) return [];
    const buckets: { label: string; nodes: NodeSnapshot[] }[] = [];

    for (const node of timelineNodes) {
      const d = node.started_at ? new Date(node.started_at) : null;
      const label = d
        ? d.toLocaleTimeString(undefined, { hour12: false })
        : "unknown";

      const last = buckets[buckets.length - 1];
      if (last && last.label === label) {
        last.nodes.push(node);
      } else {
        buckets.push({ label, nodes: [node] });
      }
    }
    return buckets;
  }, [timelineNodes]);

  return (
    <Card className="shadow-[var(--ag-shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-card-foreground">Timeline</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {bucketedTimeline.length === 0 ? (
          <div className="text-[11px] text-muted-foreground">
            No timeline events yet.
          </div>
        ) : (
          <div className="relative">
            {/* vertical rail */}
            <div className="absolute left-2 top-0 bottom-0 border-l border-border/60" />
            <div className="space-y-4">
              {bucketedTimeline.map((bucket) => (
                <div key={bucket.label} className="relative pl-8">
                  {/* dot */}
                  <div className="absolute left-1.5 top-1 w-2 h-2 rounded-full bg-brand" />
                  {/* time label */}
                  <div className="text-[11px] text-muted-foreground mb-1">
                    {bucket.label}
                  </div>
                  {/* nodes at this time */}
                  <div className="space-y-1">
                    {bucket.nodes.map((node) => (
                      <div
                        key={node.node_id}
                        className="rounded-md border border-border/60 bg-muted/40 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-foreground/80">
                            {node.node_id}
                          </span>
                          <span
                            className={
                              "px-2 py-0.5 rounded-full capitalize text-[10px] " +
                              statusChipClass(node.status)
                            }
                          >
                            {node.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {node.tool_name ?? "—"} •{" "}
                          {formatDate(node.started_at)} →{" "}
                          {formatDate(node.finished_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
