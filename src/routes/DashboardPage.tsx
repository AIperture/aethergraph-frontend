import * as React from "react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/core/StatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useShellStore } from "../store/shellStore";
import type { RunSummary } from "../lib/types";
import { statusChipClass, normalizeStatus } from "../components/run/runStatusUtils";


import { useChannelStore } from "../store/channelStore";
import type { RunChannelEvent } from "../lib/types";
import { cn } from "../lib/utils";
import {
  Activity,
  Clock,
  MessageSquare,
  Play,
  LayoutDashboard,
  Server,
  Zap,
  History,
  Terminal,
  Database
} from "lucide-react";


const DashboardPage: React.FC = () => {
  // Store slices
  const runs = useShellStore((s) => s.runs);
  const loadRuns = useShellStore((s) => s.loadRuns); // Add loadRuns action
  const statsOverview = useShellStore((s) => s.statsOverview);
  const graphStats = useShellStore((s) => s.graphStats);
  const artifactStats = useShellStore((s) => s.artifactStats);
  const memoryStats = useShellStore((s) => s.memoryStats);
  const loadingStats = useShellStore((s) => s.loadingStats);
  const loadStats = useShellStore((s) => s.loadStats);
  const messagesByRunId = useChannelStore((s) => s.messagesByRunId);
  const getUnreadForRun = useChannelStore((s) => s.getUnreadForRun);
  const getPresetByGraphId = useShellStore((s) => s.getPresetByGraphId);

  // aggregate unread by run
  const unreadSummary = React.useMemo(() => {
    if (!runs || runs.length === 0) {
      return { totalUnread: 0, runsWithUnread: [] as { runId: string; unread: number }[] };
    }

    const runsWithUnread = runs
      .map((r) => ({ runId: r.run_id, unread: getUnreadForRun(r.run_id) }))
      .filter((e) => e.unread > 0);

    const totalUnread = runsWithUnread.reduce((sum, e) => sum + e.unread, 0);

    return { totalUnread, runsWithUnread };
  }, [runs, getUnreadForRun]);

  // Initial load
  React.useEffect(() => {
    // Fetch runs list AND aggregates on mount
    loadRuns();
    loadStats("24h");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Derived run stats ----
  const activeCount = runs.filter((r) => {
    const s = normalizeStatus(r.status);
    // Count both actively running and waiting runs as "active"
    return s === "running" || s === "waiting";
  }).length;
  const totalRuns = runs.length;

  const avgRunTimeLabel = React.useMemo(() => {
    if (!graphStats) return "-";
    let totalRuns = 0;
    let totalSeconds = 0;

    Object.values(graphStats).forEach((entry) => {
      totalRuns += entry.runs ?? 0;
      totalSeconds += entry.total_duration_s ?? 0;
    });

    if (!totalRuns || !totalSeconds) return "-";

    const avg = totalSeconds / totalRuns;
    if (avg < 120) return `${Math.round(avg)}s`;

    const mins = avg / 60;
    if (mins < 60) return `${mins.toFixed(1)} min`;

    const hours = mins / 60;
    return `${hours.toFixed(1)} h`;
  }, [graphStats]);

  const llmCallsLast24h = statsOverview?.llm_calls ?? 0;

  // ---- Derived artifact stats ----
  const { totalArtifacts, totalArtifactMB } = React.useMemo(() => {
    if (!artifactStats) return { totalArtifacts: 0, totalArtifactMB: 0 };

    let count = 0;
    let bytes = 0;

    Object.values(artifactStats).forEach((entry) => {
      count += entry.count ?? 0;
      bytes += entry.bytes ?? 0;
    });

    return {
      totalArtifacts: count,
      totalArtifactMB: bytes > 0 ? bytes / (1024 * 1024) : 0,
    };
  }, [artifactStats]);

  // ---- Derived memory stats ----
  const totalMemoryEvents = React.useMemo(() => {
    if (!memoryStats) return 0;

    let total = 0;
    Object.values(memoryStats).forEach((entry) => {
      total += entry.count ?? 0;
    });
    return total;
  }, [memoryStats]);

  // aggregate unread + recent events
  const { runsWithUnread, recentEvents } = React.useMemo(() => {
    const runsWithUnread = runs.filter(
      (r) => getUnreadForRun(r.run_id) > 0
    );

    const all: { runId: string; ev: RunChannelEvent }[] = [];
    for (const r of runs) {
      const msgs = messagesByRunId[r.run_id] ?? [];
      const last = msgs[msgs.length - 1];
      if (last) all.push({ runId: r.run_id, ev: last });
    }

    all.sort((a, b) => (b.ev.ts ?? 0) - (a.ev.ts ?? 0));

    return {
      runsWithUnread,
      recentEvents: all.slice(0, 3),
    };
  }, [runs, messagesByRunId, getUnreadForRun]);

  const totalUnreadRuns = runsWithUnread.length;

  const sortedRuns = React.useMemo(
    () =>
      [...runs].sort((a, b) => {
        const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
        const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
        return tb - ta;
      }),
    [runs]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 w-full max-w-[1800px] mx-auto p-4 md:p-6">

      {/* 1. Dashboard Header */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Dashboard
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-9">
            Overview of your active runs, system health, and recent activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-muted/40 text-[10px] text-muted-foreground">
            <Server className="w-3 h-3 text-emerald-500" />
            <span>Connected:</span>
            <span className="font-mono font-medium text-foreground">local-sidecar</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { loadStats("24h"); loadRuns(); }}
            disabled={loadingStats}
            className="h-8 text-xs gap-2"
          >
            <History className="w-3 h-3" />
            {loadingStats ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          label="Active Runs"
          value={String(activeCount)}
          hint={`${totalRuns} total runs`}
          icon={<Play className="w-4 h-4 text-brand" />}
        />
        <StatsCard
          label="Avg. Runtime"
          value={avgRunTimeLabel}
          hint="Last 24 hours"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
        <StatsCard
          label="LLM Calls"
          value={String(llmCallsLast24h)}
          hint="Total inferences"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
        />
        <StatsCard
          label="Artifacts"
          value={totalArtifacts > 0 ? `${totalArtifacts}` : "0"}
          hint={totalArtifactMB > 0 ? `${totalArtifactMB.toFixed(1)} MB stored` : "No data"}
          icon={<Database className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* 3. Main Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT: Recent Runs Table */}
        <Card className="lg:col-span-2 shadow-sm border-border/60 flex flex-col overflow-hidden h-[500px] lg:h-auto">
          <CardHeader className="shrink-0 border-b border-border/40 bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Runs
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 bg-background">{sortedRuns.length} Total</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 min-h-0 bg-background">
            <div className="min-w-[600px]"> {/* Ensure min width for table scrolling */}
              {/* Table Header */}
              <div className="sticky top-0 z-10 grid grid-cols-[100px_1.5fr_100px_80px] gap-4 px-4 py-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Run ID</span>
                <span>Application / Preset</span>
                <span>Status</span>
                <span className="text-right">Duration</span>
              </div>

              {sortedRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Play className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-xs">No runs recorded yet.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {sortedRuns.map((run: RunSummary) => {
                    const preset = getPresetByGraphId(run.graph_id);
                    const appLabel = preset?.name ?? preset?.id ?? run.graph_id ?? "—";

                    const duration = run.started_at && run.finished_at
                      ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                      : "—";

                    return (
                      <div key={run.run_id} className="group grid grid-cols-[100px_1.5fr_100px_80px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors text-xs">
                        <Link
                          to={`/runs/${run.run_id}`}
                          className="font-mono text-foreground/80 hover:text-brand hover:underline truncate"
                        >
                          {run.run_id.slice(0, 8)}
                        </Link>

                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1 rounded bg-muted/50 text-muted-foreground"><Terminal className="w-3 h-3" /></div>
                          <span className="truncate text-foreground/90 font-medium" title={appLabel}>{appLabel}</span>
                        </div>

                        <div>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize",
                              statusChipClass(run.status)
                            )}
                          >
                            {run.status.replace("_", " ")}
                          </span>

                        </div>

                        <div className="text-right font-mono text-muted-foreground text-[11px]">
                          {duration}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Channel Activity */}
        <Card className={cn(
          "shadow-sm border-border/60 flex flex-col overflow-hidden h-[500px] lg:h-auto transition-colors",
          totalUnreadRuns > 0 && "border-brand/40"
        )}>
          <CardHeader className="shrink-0 border-b border-border/40 bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Channel Activity
                </CardTitle>
              </div>
              {totalUnreadRuns > 0 ? (
                <div className="flex items-center gap-1.5 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  <span className="text-[10px] font-medium text-brand">{totalUnreadRuns} active</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">All caught up</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 bg-background min-h-0">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6 text-center">
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-xs font-medium text-foreground">Quiet on the channel</p>
                <p className="text-[10px] mt-1 opacity-70">When runs generate messages or require input, they will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/40">
                {recentEvents.map(({ runId, ev }) => {
                  const ts = Number.isFinite(ev.ts)
                    ? new Date(ev.ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "";

                  const text = ev.text?.length && ev.text.length > 80
                    ? ev.text.slice(0, 77) + "…"
                    : ev.text ?? "New event";

                  const isUser = ev.type === "user.message" || ev.meta?.role === "user";
                  const unread = getUnreadForRun(runId);

                  const run = runs.find((r) => r.run_id === runId);
                  const preset = run ? getPresetByGraphId(run.graph_id) : undefined;
                  const runLabel = preset?.name || run?.graph_id || runId.slice(0, 8);

                  return (
                    <Link
                      key={ev.id}
                      to={`/runs/${runId}?tab=channel`}
                      className="relative flex gap-3 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Left Indicator */}
                      <div className="mt-1 shrink-0">
                        {unread > 0 ? (
                          <div className="h-2 w-2 rounded-full bg-brand ring-4 ring-brand/10" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/20 group-hover:bg-muted-foreground/40 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {runLabel}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                            {ts}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase tracking-wider rounded-[3px]">
                            {isUser ? "You" : "Agent"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/50 font-mono">#{runId.slice(0, 6)}</span>
                        </div>

                        <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 pt-0.5 group-hover:text-foreground/90 transition-colors">
                          {text}
                        </p>
                      </div>
                    </Link>
                  );
                })}

                {/* View More Link */}
                {recentEvents.length >= 3 && (
                  <div className="p-2 text-center bg-muted/10">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Showing recent activity
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DashboardPage;