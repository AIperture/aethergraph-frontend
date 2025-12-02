// src/routes/RunWorkspacePage.tsx
import * as React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useShellStore } from "../store/shellStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import type {
    NodeSnapshot,
    RunStatus,
    EdgeSnapshot,
    RunCreateRequest,
} from "../lib/types";
import { startRun } from "../lib/api";

import { RunArtifactsPanel } from "../components/run/RunArtifactsPanel";
import { RunMemoryPanel } from "../components/run/RunMemoryPanel";
import { RunTimelinePanel } from "../components/run/RunTimelinePanel";
import { RunChannelPanel } from "../components/run/RunChannelPanel";
import { RunNodesPanel } from "../components/run/RunNodesPanel";

import { statusChipClass, formatDate } from "../components/run/runStatusUtils";
import { useChannelStore } from "../store/channelStore";
import { cn } from "../lib/utils";

type TabKey = "nodes" | "timeline" | "artifacts" | "memory" | "channel";
const validTabs: TabKey[] = ["nodes", "timeline", "artifacts", "memory", "channel"];


const RunWorkspacePage: React.FC = () => {
    const { runId } = useParams<{ runId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // const urlTab = (searchParams.get("tab") as TabKey | null) || "nodes";
    // const initialTab: TabKey = validTabs.includes(urlTab) ? urlTab : "nodes";

    const loadRunSnapshot = useShellStore((s) => s.loadRunSnapshot);
    const cancelRunById = useShellStore((s) => s.cancelRunById);
    const runSummary = useShellStore((s) => s.getRunById(runId));
    const snapshot = useShellStore((s) => s.getRunSnapshot(runId));
    const getRunParamsForRun = useShellStore((s) => s.getRunParamsForRun);

    // const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);
    const [isActing, setIsActing] = React.useState(false);

    const setActiveRunId = useChannelStore((s) => s.setActiveRunId);
    const fetchNewEvents = useChannelStore((s) => s.fetchNewEvents);
    const unreadForRun = useChannelStore((s) =>
        runId ? s.getUnreadForRun(runId) : 0
    );

    // Sync activeTab with URL param
    // React.useEffect(() => {
    //     const param = searchParams.get("tab") as TabKey | null;

    //     if (!param) {
    //         // default to nodes if no tab in URL
    //         if (activeTab !== "nodes") {
    //             setActiveTab("nodes");
    //         }
    //         return;
    //     }

    //     if (param !== activeTab && validTabs.includes(param)) {
    //         setActiveTab(param);
    //     }
    // }, [searchParams, activeTab]);
    const urlTab = (searchParams.get("tab") as TabKey | null) || "nodes";
    const activeTab: TabKey = validTabs.includes(urlTab) ? urlTab : "nodes";


    // Poll for new channel events
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

        void tick();
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
                    setTimeout(loop, 2000);
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
            <div className="text-xs text-muted-foreground">
                No run selected. Choose a run from the dashboard or sidebar.
            </div>
        );
    }

    const handleTabClick = (tab: TabKey) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set("tab", tab);
            return next;
        });
    };


    const status: RunStatus =
        runSummary?.status ?? (snapshot ? "running" : "pending");

    const nodes: NodeSnapshot[] = snapshot?.nodes ?? [];
    const edges: EdgeSnapshot[] = snapshot?.edges ?? [];

    const graphId = runSummary?.graph_id ?? snapshot?.graph_id ?? null;

    // These assume RunSummary includes inputs/run_config/tags.
    const runParams = getRunParamsForRun(runId);
    const runInputs = runParams?.inputs ?? {};
    const runConfig = runParams?.run_config ?? {};
    const runTags: string[] = runParams?.tags ?? [];

    const hasFailedNodes = nodes.some((n) => n.status === "failed");
    const canResume = status === "failed" && hasFailedNodes && !!runParams;



    const handleCancel = async () => {
        setIsActing(true);
        try {
            await cancelRunById(runId);
        } catch (err) {
            console.error("Failed to cancel run", err);
            toast.error("Failed to cancel run");
        } finally {
            setIsActing(false);
        }
    };

    const handleResume = async () => {
        if (!graphId || !runId || !canResume || !runParams) return;

        setIsActing(true);
        try {
            const body: RunCreateRequest = {
                run_id: runId,                  // same run id → resume
                inputs: runInputs,
                run_config: runConfig,
                tags: runTags,
            };

            toast("Resuming run", {
                description: "Restarting from failed nodes…",
            });

            await startRun(graphId, body);
        } catch (err: any) {
            console.error("Failed to resume run", err);
            const msg = err?.message || "Failed to resume run";
            toast.error("Failed to resume run", { description: msg });
        } finally {
            setIsActing(false);
        }
    };

    const handleStartOver = async () => {
        if (!graphId || !runParams) return;

        setIsActing(true);
        try {
            const body: RunCreateRequest = {
                run_id: null,             // new run
                inputs: runInputs,
                run_config: runConfig,
                tags: runTags,
            };

            toast("Starting new run", {
                description: "A new run will be created with the same inputs.",
            });

            const resp = await startRun(graphId, body);

            toast.success("New run started", {
                description: `Run ${resp.run_id} has been created.`,
            });

            navigate(`/runs/${resp.run_id}`);
        } catch (err: any) {
            console.error("Failed to start over", err);
            const msg = err?.message || "Failed to start new run";
            toast.error("Failed to start new run", { description: msg });
        } finally {
            setIsActing(false);
        }
    };


    const tabs: { key: TabKey; label: string }[] = [
        { key: "nodes", label: "Nodes" },
        { key: "timeline", label: "Timeline" },
        { key: "artifacts", label: "Artifacts" },
        { key: "memory", label: "Memory" },
        { key: "channel", label: "Channel" },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">
                            Run{" "}
                            <span className="font-mono text-sm text-foreground/80">
                                {runId}
                            </span>
                        </h1>
                        <span
                            className={cn(
                                "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full capitalize",
                                statusChipClass(status)
                            )}
                        >
                            {status.replace("_", " ")}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
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
                        variant="accent"
                        size="sm"
                        className="text-xs"
                        onClick={handleResume}
                        disabled={isActing || !canResume}
                    >
                        Resume failed
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={handleStartOver}
                        disabled={isActing || !graphId || !runParams}
                    >
                        Start over
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={
                            isActing ||
                            status === "succeeded" ||
                            status === "failed" ||
                            status === "canceled"
                        }
                        onClick={handleCancel}
                    >
                        Cancel run
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const showUnreadDot = tab.key === "channel" && unreadForRun > 0;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => handleTabClick(tab.key)}
                            className={cn(
                                "relative text-[11px] inline-flex items-center gap-1 px-3 py-2 border-b-2 -mb-px",
                                "cursor-pointer transition-colors",
                                isActive
                                    ? "border-brand text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            {tab.label}
                            {showUnreadDot && (
                                <span className="inline-flex items-center justify-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === "nodes" && (
                    <Card className="min-h-[420px] shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Node graph
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <RunNodesPanel nodes={nodes} edges={edges} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === "timeline" && (
                    <Card className="min-h-[420px] shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <RunTimelinePanel nodes={nodes} />
                        </CardContent>
                    </Card>
                )}

                {activeTab === "artifacts" && runId && (
                    <Card className="min-h-[420px] shadow-[var(--ag-shadow-soft)]">
                        <RunArtifactsPanel runId={runId} />
                    </Card>
                )}

                {activeTab === "memory" && runId && (
                    <Card className="min-h-[420px] shadow-[var(--ag-shadow-soft)]">
                        <RunMemoryPanel scopeId={runId} />
                    </Card>
                )}

                {activeTab === "channel" && (
                    <Card className="min-h-[420px] shadow-[var(--ag-shadow-soft)]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-card-foreground">
                                Channel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <RunChannelPanel runId={runId} />
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
};

export default RunWorkspacePage;
