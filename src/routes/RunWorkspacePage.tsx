// src/routes/RunWorkspacePage.tsx
import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useShellStore } from "../store/shellStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import type { NodeSnapshot, RunStatus, EdgeSnapshot } from "../lib/types";

import { RunArtifactsPanel } from "../components/run/RunArtifactsPanel";
import { RunMemoryPanel } from "../components/run/RunMemoryPanel";
import { RunTimelinePanel } from "../components/run/RunTimelinePanel";
import { RunChannelPanel } from "../components/run/RunChannelPanel";

import { RunNodesPanel } from "../components/run/RunNodesPanel";
import { statusChipClass, formatDate } from "../components/run/runStatusUtils";
import { useChannelStore } from "../store/channelStore";

const RunWorkspacePage: React.FC = () => {
    const { runId } = useParams<{ runId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    type TabKey = "nodes" | "timeline" | "artifacts" | "memory" | "channel";

    const urlTab = (searchParams.get("tab") as TabKey | null) || "nodes";
    const validTabs: TabKey[] = ["nodes", "timeline", "artifacts", "memory", "channel"];
    const initialTab: TabKey = validTabs.includes(urlTab) ? urlTab : "nodes";

    const loadRunSnapshot = useShellStore((s) => s.loadRunSnapshot);
    const cancelRunById = useShellStore((s) => s.cancelRunById);
    const runSummary = useShellStore((s) => s.getRunById(runId));
    const snapshot = useShellStore((s) => s.getRunSnapshot(runId));

    const [activeTab, setActiveTab] = React.useState<
        "nodes" | "timeline" | "artifacts" | "memory" | "channel"
    >("nodes");

    const setActiveRunId = useChannelStore((s) => s.setActiveRunId);

    const fetchNewEvents = useChannelStore((s) => s.fetchNewEvents);
    const unreadForRun = useChannelStore((s) =>
        runId ? s.getUnreadForRun(runId) : 0
    );

    // Sync activeTab with URL param
    React.useEffect(() => {
        const param = searchParams.get("tab") as TabKey | null;
        if (param && param !== activeTab && validTabs.includes(param)) {
            setActiveTab(param);
        }
    }, [searchParams, activeTab]);

    // Poll for new channel events -- later we will use websockets and move this logic into channelStore
    React.useEffect(() => {
        if (!runId) return;

        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
            try {
                await fetchNewEvents(runId);
            } catch (err) {
                console.error("Failed to fetch channel events for run", runId, err);
            }
        };

        void tick(); // initial fetch
        const id = window.setInterval(tick, 1500);

        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [runId, fetchNewEvents]);

    // Tell channelStore which run's channel is in focus
    React.useEffect(() => {
        if (!runId) return;

        if (activeTab === "channel") {
            setActiveRunId(runId);
        } else {
            // if we navigate away from this run's channel, clear active
            setActiveRunId(null);
        }
    }, [runId, activeTab, setActiveRunId]);

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

    const handleTabClick = (tab: TabKey) => {
        setActiveTab(tab);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (tab === "nodes") {
                // optional: clean URL by dropping ?tab when on default tab
                next.delete("tab");
            } else {
                next.set("tab", tab);
            }
            return next;
        });
    };


    const status: RunStatus =
        runSummary?.status ?? (snapshot ? "running" : "pending");

    const nodes: NodeSnapshot[] = snapshot?.nodes ?? [];
    const edges: EdgeSnapshot[] = snapshot?.edges ?? [];

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
                        onClick={() => handleTabClick("nodes")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "nodes"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Nodes
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick("timeline")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "timeline"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Timeline
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabClick("artifacts")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "artifacts"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Artifacts
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabClick("memory")}
                        className={`text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "memory"
                            ? "border-brand text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Memory
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabClick("channel")}
                        className={`relative text-xs px-3 py-2 border-b-2 -mb-px ${activeTab === "channel"
                                ? "border-brand text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Channel
                        {unreadForRun > 0 && (
                            <span className="ml-1 inline-flex items-center justify-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                            </span>
                        )}
                    </button>

                </div>

                {/* Content */}
                {activeTab === "nodes" && <RunNodesPanel nodes={nodes} edges={edges} />}

                {activeTab === "timeline" && <RunTimelinePanel nodes={nodes} />}

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
                                Channel
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RunChannelPanel runId={runId} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default RunWorkspacePage;
