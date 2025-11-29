// src/components/run/RunNodesPanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { statusChipClass, formatDate } from "./runStatusUtils";

interface RunNodesPanelProps {
  nodes: NodeSnapshot[];
}

export const RunNodesPanel: React.FC<RunNodesPanelProps> = ({ nodes }) => {
  return (
    <Card className="shadow-[var(--ag-shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-card-foreground">
          Node status
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {nodes.length === 0 ? (
          <div className="text-[11px] text-muted-foreground">
            No node data yet. Once this run starts executing, nodes will appear
            here.
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex text-[11px] font-medium mb-1">
              <span className="w-40">Node</span>
              <span className="w-40">Tool</span>
              <span className="w-24">Status</span>
              <span className="flex-1">Timing</span>
            </div>
            <Separator />
            {nodes.map((node) => (
              <div
                key={node.node_id}
                className="flex items-center py-1.5 text-[11px]"
              >
                <span className="w-40 font-mono text-foreground/80">
                  {node.node_id}
                </span>
                <span className="w-40">
                  {node.tool_name ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </span>
                <span className="w-24">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full capitalize " +
                      statusChipClass(node.status)
                    }
                  >
                    {node.status.replace("_", " ")}
                  </span>
                </span>
                <span className="flex-1 text-muted-foreground">
                  {formatDate(node.started_at)} →{" "}
                  {formatDate(node.finished_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
