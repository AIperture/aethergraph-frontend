// src/routes/RunWorkspacePage.tsx
import * as React from "react";
import { useParams } from "react-router-dom";
import { useShellStore } from "../store/shellStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import type { NodeSnapshot, RunStatus } from "../lib/types";

import { RunArtifactsPanel } from "../components/run/RunArtifactsPanel";
import { RunMemoryPanel } from "../components/run/RunMemoryPanel";

const statusChipClass = (status: RunStatus) => {
    switch (status) {
        case "running":
            return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
        case "succeeded":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
        case "failed":
            return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
        case "canceled":
        case "cancellation_requested":
            return "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
        case "pending":
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
    }
};

const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
};

const RunWorkspacePage: React.FC = () => {
    const { runId } = useParams<{ runId: string }>();
    const loadRunSnapshot = useShellStore((s) => s.loadRunSnapshot);
    const cancelRunById = useShellStore((s) => s.cancelRunById);
    const runSummary = useShellStore((s) => s.getRunById(runId));
    const snapshot = useShellStore((s) => s.getRunSnapshot(runId));

    const [activeTab, setActiveTab] = React.useState<
        "nodes" | "timeline" | "artifacts" | "memory" | "channel"
    >("nodes");

    // Poll for snapshot + summary
    React.useEffect(() => {
        if (!runId) return;
        let cancelled = false;

        async function loop() {
            try {
                await loadRunSnapshot(runId!);
            } catch (err) {
                console.error("Failed to load run snapshot", err);
            } finally {
                if (!cancelled) {
                    setTimeout(loop, 2000); // 2s polling
                }
            }
        }

        loop();
        return () => {
            cancelled = true;
        };
    }, [runId, loadRunSnapshot]);


    if (!runId) {
        return (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No run selected.
            </div>
        );
    }

    const status: RunStatus =
        runSummary?.status ?? (snapshot ? "running" : "pending");

    const nodes: NodeSnapshot[] = snapshot?.nodes ?? [];
    const timelineNodes = [...nodes].sort((a, b) => {
        const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
        const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
        return ta - tb;
    });


    const bucketedTimeline = React.useMemo(() => {
        if (!timelineNodes.length) return [];
        const buckets: { label: string; nodes: NodeSnapshot[] }[] = [];

        for (const node of timelineNodes) {
            const d = node.started_at ? new Date(node.started_at) : null;
            const label = d ? d.toLocaleTimeString(undefined, { hour12: false }) : "unknown";

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
        <div className="h-full bg-background">
            <div className="h-full max-w-6xl mx-auto px-4 py-4 space-y-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-semibold text-foreground">
                                Run <span className="font-mono text-sm">{runId}</span>
                            </h1>
                            <span
                                className={
                                    "text-[11px] px-2 py-0.5 rounded-full capitalize " +
                                    statusChipClass(status)
                                }
                            >
                                {status.replace("_", " ")}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-2">
                            <span>
                                Graph:{" "}
                                <span className="font-mono">
                                    {runSummary?.graph_id ?? snapshot?.graph_id ?? "—"}
                                </span>
                            </span>
                            <span>•</span>
                            <span>Started: {formatDate(runSummary?.started_at)}</span>
                            <span>•</span>
                            <span>Finished: {formatDate(runSummary?.finished_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={
                                status === "succeeded" ||
                                status === "failed" ||
                                status === "canceled"
                            }
                            onClick={() => cancelRunById(runId)}
                        >
                            Cancel run
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab("nodes")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "nodes"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Nodes
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("timeline")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "timeline"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Timeline
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("artifacts")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "artifacts"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Artifacts
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("memory")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "memory"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Memory
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("channel")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "channel"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Channel
                    </button>


                </div>

                {/* Content */}
                {activeTab === "nodes" && (
                    <Card className="shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Node status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">
                            {nodes.length === 0 ? (
                                <div className="text-[11px] text-muted-foreground">
                                    No node data yet. Once this run starts executing, nodes will
                                    appear here.
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
                                                {node.tool_name ?? <span className="text-slate-400">—</span>}
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
                )}


                {activeTab === "timeline" && (
                    <Card className="shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Timeline
                            </CardTitle>
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
                )}

                {activeTab === "artifacts" && runId && (
                    <Card className="shadow-[var(--ag-shadow-soft)]">
                        <RunArtifactsPanel runId={runId} />
                    </Card>
                )}

                {activeTab === "memory" && runId && (
                    <Card className="shadow-[var(--ag-shadow-soft)]">
                        <RunMemoryPanel scopeId={runId} />
                    </Card>
                )}


                {activeTab === "channel" && (
                    <Card className="shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Channel (coming soon)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground space-y-2">
                            <div className="text-[11px] text-muted-foreground mb-1">
                                # example-channel
                            </div>
                            <div>
                                <span className="font-semibold text-foreground">you</span>{" "}
                                <span className="text-muted-foreground">· just now</span>
                                <div className="mt-1">
                                    “This will eventually show the chat or Slack thread linked to this run.”
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
};

export default RunWorkspacePage;
