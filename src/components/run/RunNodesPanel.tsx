// src/components/run/RunNodesPanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { statusChipClass } from "./runStatusUtils";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import dagre from "dagre";

type EdgeSnapshot = { source: string; target: string };

interface RunNodesPanelProps {
  nodes: NodeSnapshot[];
  edges: EdgeSnapshot[];
}

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
const nodeWidth = 180;
const nodeHeight = 60;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 80 });

  nodes.forEach((n) => {
    dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((n) => {
    const pos = dagreGraph.node(n.id);
    return {
      ...n,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
      sourcePosition: "right",
      targetPosition: "left",
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
}

// Lightweight custom node component
const AgNode: React.FC<{ data: any }> = ({ data }) => {
  const { nodeId, status, toolName } = data;

  return (
    <div
      className="relative rounded-lg border border-border/70 bg-card px-3 py-2 text-[11px] shadow-sm"
    >
      {/* Target handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-border"
      />
      {/* Source handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-border"
      />

      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="max-w-[120px] truncate font-mono text-foreground/80">
          {nodeId}
        </span>
        <span
          className={
            "rounded-full px-1.5 py-0.5 text-[10px] capitalize " +
            statusChipClass(status)
          }
        >
          {status.replace("_", " ")}
        </span>
      </div>
      <div className="truncate text-[10px] text-muted-foreground">
        {toolName ?? "—"}
      </div>
    </div>
  );
};

const nodeTypes = { agNode: AgNode };

export const RunNodesPanel: React.FC<RunNodesPanelProps> = ({
  nodes,
  edges,
}) => {
  // Build base rf nodes/edges from snapshots
  const baseNodes = React.useMemo<Node[]>(() => {
    return nodes.map((n) => ({
      id: n.node_id,
      type: "agNode",
      position: { x: 0, y: 0 }, // will be overridden by layout
      data: {
        nodeId: n.node_id,
        status: n.status,
        toolName: n.tool_name,
      },
    }));
  }, [nodes]);

  const baseEdges = React.useMemo<Edge[]>(() => {
    return edges.map((e, idx) => ({
      id: `${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { strokeWidth: 1.3 },
    }));
  }, [edges]);

  // Apply dagre layout whenever graph changes
  const layouted = React.useMemo(
    () => getLayoutedElements(baseNodes, baseEdges),
    [baseNodes, baseEdges],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(layouted.edges);

  // When layouted changes, update state
  React.useEffect(() => {
    setRfNodes(layouted.nodes);
    setRfEdges(layouted.edges);
  }, [layouted.nodes, layouted.edges, setRfNodes, setRfEdges]);

  const [selectedNode, setSelectedNode] = React.useState<NodeSnapshot | null>(
    null,
  );

  const handleNodeClick = React.useCallback(
    (_: any, node: Node) => {
      const snap = nodes.find((n) => n.node_id === node.id) ?? null;
      setSelectedNode(snap);
    },
    [nodes],
  );

  if (!nodes.length) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No node data yet. Once this run starts executing, nodes will appear
        here.
      </div>
    );
  }

  return (
    <div className="flex h-[360px] flex-col gap-3 text-xs text-muted-foreground lg:h-[420px]">
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        {/* Left: graph canvas – dominates */}
        <div className="min-h-[220px] flex-1 overflow-hidden rounded-md border border-border/60 bg-muted/40">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            onNodeClick={handleNodeClick}
          >
            <Background gap={16} size={0.5} />
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Right: compact details */}
        <div className="mt-1 w-full rounded-md border border-border/60 bg-muted/40 p-3 text-[11px] md:mt-0 md:w-[230px] lg:w-[260px]">
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">
            Node details
          </div>
          {!selectedNode ? (
            <div className="text-[11px] text-muted-foreground">
              Click a node in the graph to see its details.
            </div>
          ) : (
            <div className="space-y-1">
              <div>
                <span className="mr-1 text-muted-foreground">Node:</span>
                <span className="font-mono text-foreground/80">
                  {selectedNode.node_id}
                </span>
              </div>
              <div>
                <span className="mr-1 text-muted-foreground">Tool:</span>
                <span>{selectedNode.tool_name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] capitalize " +
                    statusChipClass(selectedNode.status)
                  }
                >
                  {selectedNode.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="mr-1 text-muted-foreground">Started:</span>
                <span>{selectedNode.started_at ?? "—"}</span>
              </div>
              <div>
                <span className="mr-1 text-muted-foreground">Finished:</span>
                <span>{selectedNode.finished_at ?? "—"}</span>
              </div>
              {/* later: link to artifacts/memory filtered by node */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
