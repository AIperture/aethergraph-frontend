// src/components/run/RunNodesPanel.tsx
import * as React from "react";
import type { NodeSnapshot } from "../../lib/types";
import { statusChipClass, formatDate, normalizeStatus } from "./runStatusUtils";
import { cn } from "../../lib/utils"; // Assuming you have this utility

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
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import dagre from "dagre";

type EdgeSnapshot = { source: string; target: string };

interface RunNodesPanelProps {
  nodes: NodeSnapshot[];
  edges: EdgeSnapshot[];
}

// --- Icons ---
const NodeIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const ToolIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
);

// --- Layout Configuration ---
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
const nodeWidth = 190;
const nodeHeight = 64;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 60 });

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
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    } as Node;
  });

  return { nodes: layoutedNodes, edges };
}

// --- Custom Node Component ---
const AgNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const { nodeId, status, toolName } = data;

  // Status-based border coloring
  const simpleStatus = normalizeStatus(status);

  // Status-based border coloring
  const statusColor =
    simpleStatus === "running"
      ? "border-brand shadow-[0_0_10px_-3px_rgba(var(--brand-rgb),0.5)]"
      : simpleStatus === "failed"
        ? "border-red-500/60"
        : simpleStatus === "pending"
          ? "border-amber-400/60"
          : simpleStatus === "waiting"
            ? "border-sky-500/60"       // waiting placeholder
            : simpleStatus === "canceled"
              ? "border-slate-500/60"     // canceled placeholder
              : "border-border/80";

  const selectedClass = selected
    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
    : "";
  return (
    <div
      className={cn(
        "relative flex w-[190px] flex-col gap-1 rounded-md border bg-card px-3 py-2.5 shadow-sm transition-all hover:border-foreground/40",
        statusColor,
        selectedClass
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-1 !rounded-sm !bg-muted-foreground/50" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-1 !rounded-sm !bg-muted-foreground/50" />

      {/* Header: ID + Status Dot */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-muted-foreground"><NodeIcon /></span>
          <span className="truncate font-mono text-[10px] font-semibold text-foreground" title={nodeId}>
            {nodeId}
          </span>
        </div>
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            simpleStatus === "running"
              ? "bg-brand animate-pulse"
              : simpleStatus === "failed"
                ? "bg-red-500"
                : simpleStatus === "pending"
                  ? "bg-amber-400"
                  : simpleStatus === "waiting"
                    ? "bg-sky-400"
                    : simpleStatus === "canceled"
                      ? "bg-slate-400"
                      : "bg-emerald-500"
          )}
        />
      </div>

      {/* Footer: Tool Name */}
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <ToolIcon />
        <span className="truncate font-medium opacity-80">
          {toolName || "System"}
        </span>
      </div>
    </div>
  );
};

const nodeTypes = { agNode: AgNode };

// --- Main Component ---
export const RunNodesPanel: React.FC<RunNodesPanelProps> = ({
  nodes,
  edges,
}) => {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // 1. Filter out unwanted nodes (Global Inputs) and their connecting edges
  const { filteredNodes, filteredEdges } = React.useMemo(() => {
    const validNodes = nodes.filter(n => n.node_id !== "__graph_inputs__");
    const validNodeIds = new Set(validNodes.map(n => n.node_id));

    const validEdges = edges.filter(e =>
      validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    return { filteredNodes: validNodes, filteredEdges: validEdges };
  }, [nodes, edges]);

  // 2. Prepare React Flow Objects
  const baseNodes = React.useMemo<Node[]>(() => {
    return filteredNodes.map((n) => ({
      id: n.node_id,
      type: "agNode",
      position: { x: 0, y: 0 },
      data: {
        nodeId: n.node_id,
        status: n.status,
        toolName: n.tool_name,
      },
      // Pass selected state naturally via React Flow
    }));
  }, [filteredNodes]);

  const baseEdges = React.useMemo<Edge[]>(() => {
    return filteredEdges.map((e, idx) => ({
      id: `${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep', // "smoothstep" = right angles, "default" = bezier curves
      animated: false,
      // Use a hardcoded hex (e.g., #a1a1aa is zinc-400) to ensure visibility in SVG
      style: { stroke: '#a1a1aa', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#a1a1aa', // Must match the stroke color
      },
    }));
  }, [filteredEdges]);

  // 3. Layout Calculation
  const layouted = React.useMemo(
    () => getLayoutedElements(baseNodes, baseEdges),
    [baseNodes, baseEdges],
  );

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(layouted.edges);

  // Sync layout changes
  React.useEffect(() => {
    setRfNodes(layouted.nodes);
    setRfEdges(layouted.edges);
  }, [layouted.nodes, layouted.edges, setRfNodes, setRfEdges]);

  // Handle Selection
  const handleNodeClick = React.useCallback(
    (_: any, node: Node) => {
      setSelectedNodeId(node.id);
    },
    []
  );

  // Retrieve actual data snapshot for the side panel
  const selectedNodeData = React.useMemo(
    () => nodes.find((n) => n.node_id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  if (!nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-xs text-muted-foreground">
        No active nodes to display.
      </div>
    );
  }


  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row overflow-hidden">

        {/* LEFT: Interactive Graph */}
        <div className="flex-1 min-h-[220px] overflow-hidden rounded-md border border-border/60 bg-muted/5 shadow-inner relative">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, minZoom: 0.5, maxZoom: 1.5 }}
            onNodeClick={handleNodeClick}
            // Defaults to unselecting if clicking canvas
            onPaneClick={() => setSelectedNodeId(null)}
          >
            <Background gap={20} size={1} color="hsl(var(--muted-foreground))" className="opacity-10" />
            <Controls
              className="!bg-background !border-border/60 !shadow-sm [&>button]:!border-border/60 [&>button]:!text-muted-foreground"
              showInteractive={false}
            />
            {/* <MiniMap 
                nodeColor={(n) => {
                   if(n.data.status === 'failed') return '#ef4444';
                   if(n.data.status === 'running') return 'var(--brand)';
                   return 'hsl(var(--muted-foreground))';
                }}
                maskColor="rgba(0,0,0, 0.1)"
                className="!w-[100px] !h-[70px] !border !border-border/40 !rounded-md !bg-background/80 !bottom-2 !right-2"
                pannable 
                zoomable 
            /> */}
          </ReactFlow>
        </div>

        {/* RIGHT: Property Inspector */}
        <div className="w-full shrink-0 flex flex-col rounded-md border border-border/60 bg-background md:w-[240px] lg:w-[260px]">
          <div className="shrink-0 border-b border-border/60 bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Inspector
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {!selectedNodeData ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
                <div className="p-2 rounded-full bg-muted/50">
                  <NodeIcon />
                </div>
                <p className="text-[11px]">Select a node to view details</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Header Group */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Node ID</label>
                  <div className="font-mono text-sm font-medium text-foreground break-all">
                    {selectedNodeData.node_id}
                  </div>
                </div>

                <hr className="border-border/40" />

                {/* Status Group */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      statusChipClass(selectedNodeData.status)
                    )}>
                      {selectedNodeData.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tool</span>
                    <span className="font-medium text-foreground text-right truncate max-w-[120px]" title={selectedNodeData.tool_name ?? ""}>
                      {selectedNodeData.tool_name ?? "—"}
                    </span>
                  </div>
                </div>

                <hr className="border-border/40" />

                {/* Timing Group */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Started At</span>
                    <span className="font-mono text-[11px] text-foreground/80">
                      {selectedNodeData.started_at ? formatDate(selectedNodeData.started_at) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted-foreground">Finished At</span>
                    <span className="font-mono text-[11px] text-foreground/80">
                      {selectedNodeData.finished_at ? formatDate(selectedNodeData.finished_at) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};