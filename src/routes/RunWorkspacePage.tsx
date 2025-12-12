// src/routes/RunWorkspacePage.tsx
import * as React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useShellStore } from "../store/shellStore";
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

import { statusChipClass, formatDate, normalizeStatus } from "../components/run/runStatusUtils";
import { useChannelStore } from "../store/channelStore";
import { cn } from "../lib/utils";
import { RunVizPanel } from "@/components/run/runVizPanel";

type TabKey = "nodes" | "timeline" | "artifacts" | "memory" | "viz" | "channel";
const validTabs: TabKey[] = ["nodes", "timeline", "artifacts", "memory", "viz", "channel"];

const RunWorkspacePage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const preset = useShellStore((s) => s.getPresetForRun(runId || "")); 

  const loadRunSnapshot = useShellStore((s) => s.loadRunSnapshot);
  const cancelRunById = useShellStore((s) => s.cancelRunById);
  const runSummary = useShellStore((s) => s.getRunById(runId));
  const snapshot = useShellStore((s) => s.getRunSnapshot(runId));
  const getRunParamsForRun = useShellStore((s) => s.getRunParamsForRun);

  const [isActing, setIsActing] = React.useState(false);

  const setActiveRunId = useChannelStore((s) => s.setActiveRunId);
  const fetchNewEvents = useChannelStore((s) => s.fetchNewEvents);
  const unreadForRun = useChannelStore((s) =>
    runId ? s.getUnreadForRun(runId) : 0
  );

  const prevUnreadRef = React.useRef(unreadForRun);

  const urlTab = (searchParams.get("tab") as TabKey | null) || "nodes";
  const activeTab: TabKey = validTabs.includes(urlTab) ? urlTab : "nodes";

  const setActiveTab = (tab: TabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
    
  };

  // --- Polling Logic ---
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

  React.useEffect(() => {
    if (!runId) return;
    if (activeTab === "channel") {
      setActiveRunId(runId);
    } else {
      setActiveRunId(null);
    }
    return () => {
      setActiveRunId(null);
    };
  }, [runId, activeTab, setActiveRunId]);

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

  React.useEffect(() => {
    if (!runId) return;
    const prev = prevUnreadRef.current;
    if (unreadForRun > prev && activeTab !== "channel") {
      toast("New channel message", {
        description: `Run ${runId.slice(0, 8)} has ${unreadForRun} unread message${unreadForRun > 1 ? "s" : ""}.`,
        action: {
          label: "Open channel",
          onClick: () => setActiveTab("channel"),
        },
        duration: 5000,
      });
    }
    prevUnreadRef.current = unreadForRun;
  }, [unreadForRun, activeTab, runId]);

  if (!runId) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No run selected. Choose a run from the dashboard.
      </div>
    );
  }

  // --- Derived Data ---
  const status: RunStatus =
    runSummary?.status ?? (snapshot ? "running" : "pending");
  //   console.log(runSummary);
  // console.log("Run status:", status);
  const simpleStatus = normalizeStatus(status);
  const nodes: NodeSnapshot[] = snapshot?.nodes ?? [];
  const edges: EdgeSnapshot[] = snapshot?.edges ?? [];
  const graphId = runSummary?.graph_id ?? snapshot?.graph_id ?? null;
  const runParams = getRunParamsForRun(runId);
  const runInputs = runParams?.inputs ?? {};
  const runConfig = runParams?.run_config ?? {};
  const runTags: string[] = runParams?.tags ?? [];
  const hasFailedNodes = nodes.some((n) => n.status === "failed" || n.status === "canceled");
  const canResume = (status === "failed" || status === "canceled") && hasFailedNodes && !!runParams;


  const setRunParamsForRun = useShellStore((s) => s.setRunParamsForRun);

  // --- Handlers (Original Logic Preserved) ---
  const handleCancel = async () => {
    setIsActing(true);
    try {
      await cancelRunById(runId);
    } catch (err) {
      toast.error("Failed to cancel run");
    } finally {
      setIsActing(false);
    }
  };

  const handleResume = async () => {
    console.log("Resuming run", runId);
    if (!graphId || !runId || !canResume || !runParams) return;

    console.log(runParams);
    console.log(runTags);
    setIsActing(true);
    try {
      const body: RunCreateRequest = {
        run_id: runId,
        inputs: runInputs,
        run_config: runConfig,
        tags: runTags,
        appId: preset?.id,
      };

      toast("Resuming run", { description: "Restarting from failed nodes…" });
      await startRun(graphId, body);
    } catch (err: any) {
      toast.error("Failed to resume run", { description: err?.message });
    } finally {
      setIsActing(false);
    }
  };

  const handleStartOver = async () => {
    console.log("Starting over run", runId, graphId, runParams);

    if (!graphId || !runParams) {
      toast.error("Cannot start over: missing graph or run parameters");
      return;
    }
    setIsActing(true);

    try {
      console.log(runParams);
      const body: RunCreateRequest = {
        run_id: null,
        inputs: runInputs,
        run_config: runConfig,
        tags: runTags,
        appId: preset?.id,
      };
      toast("Starting new run...");
      const resp = await startRun(graphId, body);
      toast.success("New run started");
      navigate(`/runs/${resp.run_id}`);
      // set the run parameters for the new run
      setRunParamsForRun(resp.run_id, {
        run_id: resp.run_id,
        inputs: runInputs,
        run_config: runConfig,
        tags: runTags,
        appId: preset?.id,
      });
    } catch (err: any) {
      toast.error("Failed to start new run", { description: err?.message });
    } finally {
      setIsActing(false);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "nodes", label: "Graph" },
    { key: "timeline", label: "Timeline" },
    { key: "artifacts", label: "Artifacts" },
    { key: "memory", label: "Memory" },
    { key: "viz", label: "Viz" },
    { key: "channel", label: "Channel" },
  ];

  return (
    // Height Fix: Use calc(100vh - headerOffset). Adjust '3rem' depending on your main app layout padding.
    <div className="flex flex-col gap-4 h-[calc(100vh-2rem)] w-full max-w-[1800px] mx-auto">

      {/* 1. Header Section (Shrink-0 to preserve size) */}
      <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Run <span className="font-mono text-base opacity-60 ml-1">{runId}</span>
            </h1>
            <span
              className={cn(
                "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full capitalize font-medium border",
                statusChipClass(status)
              )}
            >
              {status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/40 border border-border/40">
              <span className="opacity-70">Graph:</span>
              <span className="font-mono font-medium text-foreground">{runSummary?.graph_id ?? snapshot?.graph_id ?? "—"}</span>
            </div>
            <span className="text-border/60">|</span>
            <span>Started {formatDate(runSummary?.started_at)}</span>
            {runSummary?.finished_at && (
              <>
                <span className="text-border/60">|</span>
                <span>Finished {formatDate(runSummary?.finished_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Original Button Logic Restored */}
        <div className="flex items-center gap-2">
          {canResume && (
            <Button
              variant="default" // Changed to default to make it pop as primary action
              size="sm"
              onClick={handleResume}
              disabled={isActing}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
            >
              Resume Run
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleStartOver}
            disabled={isActing || !graphId}
            className="h-8 text-xs"
          >
            Start Over
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20"
            disabled={
              isActing ||
              simpleStatus === "succeeded" ||
              simpleStatus === "failed" ||
              simpleStatus === "canceled"
            }

            onClick={handleCancel}
          >
            Cancel Run
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs (Shrink-0) */}
      <div className="shrink-0 border-b border-border/60">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const showUnreadDot = tab.key === "channel" && unreadForRun > 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative pb-2.5 text-[13px] font-medium transition-all hover:text-foreground outline-none",
                  isActive
                    ? "text-brand border-b-2 border-brand"
                    : "text-muted-foreground border-b-2 border-transparent"
                )}
              >
                {tab.label}
                {showUnreadDot && (
                  <span className="absolute -top-0.5 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Content Area (Grows to fill page) */}
      {/* IMPORTANT: 
          For these panels to fill the screen, you must go into the individual 
          components (RunNodesPanel, RunTimelinePanel, etc.) and REPLACE 
          their fixed height classes (e.g. h-[360px]) with `h-full`.
      */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border/40 bg-background/50 shadow-sm">

        {activeTab === "nodes" && (
          <div className="h-full w-full">
            <RunNodesPanel nodes={nodes} edges={edges} />
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="h-full w-full">
            <RunTimelinePanel nodes={nodes} />
          </div>
        )}

        {activeTab === "artifacts" && runId && (
          <div className="h-full w-full">
            <RunArtifactsPanel runId={runId} />
          </div>
        )}

        {activeTab === "memory" && runId && (
          <div className="h-full w-full">
            <RunMemoryPanel scopeId={runId} />
          </div>
        )}

        {activeTab === "viz" && runId && (
          <div className="h-full w-full">
            <RunVizPanel runId={runId} />
          </div>
        )}

        {activeTab === "channel" && (
          <div className="h-full w-full">
            <RunChannelPanel runId={runId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RunWorkspacePage;