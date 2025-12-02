// src/routes/DashboardPage.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { FakeStatsCard } from "../components/core/FakeStatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { useShellStore } from "../store/shellStore";
import type { RunSummary } from "../lib/types";

import { useChannelStore } from "../store/channelStore";
import type { RunChannelEvent } from "../lib/types";
import { cn } from "../lib/utils";


const DashboardPage: React.FC = () => {
  // Store slices
  const runs = useShellStore((s) => s.runs);
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
    loadStats("24h");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Derived run stats ----
  const activeCount = runs.filter((r) => r.status === "running").length;
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
      // entry is { count: number, ... }
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground tracking-tight">
            AetherGraph Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Holistic overview of runs, artifacts, and memory activity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden md:inline px-2 py-1 rounded-full border border-border bg-muted/60">
            Connected:{" "}
            <span className="font-mono text-brand-light">
              local-sidecar
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadStats("24h")}
            disabled={loadingStats}
          >
            {loadingStats ? "Refreshing…" : "Refresh stats"}
          </Button>
        </div>
      </div>


      {/* Top stats: runs + LLM + artifacts + memory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FakeStatsCard
          label="Active runs"
          value={String(activeCount)}
          hint={`${totalRuns} total runs`}
        />
        <FakeStatsCard
          label="Avg. run time"
          value={avgRunTimeLabel}
          hint="Across all graphs (last 24h)"
        />
        <FakeStatsCard
          label="LLM calls"
          value={String(llmCallsLast24h)}
          hint="Past 24 hours"
        />
        <FakeStatsCard
          label="Artifacts"
          value={
            totalArtifacts > 0
              ? `${totalArtifacts} · ${totalArtifactMB.toFixed(1)} MB`
              : "0"
          }
          hint="Total artifacts + storage"
        />
      </div>


      {/* Bottom grid – recent runs + channel mock (unchanged) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       <Card className="lg:col-span-2 shadow-[var(--ag-shadow-soft)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recent runs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {/* Column labels */}
        <div className="grid grid-cols-[2.4fr_1.6fr_1.2fr_0.8fr] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Run ID</span>
          <span>App</span>
          <span>Status</span>
          <span>Duration</span>
        </div>
        <Separator />
        {sortedRuns.length === 0 && (
          <div className="text-[11px] text-muted-foreground mt-2">
            No runs yet. Start a new run from any preset to see it here.
          </div>
        )}
        {sortedRuns.map((run: RunSummary) => {
          // 🔑 Derive app info from presets every render
          const preset = getPresetByGraphId(run.graph_id);
          const appLabel = preset?.name ?? preset?.id ?? "—";

          const duration =
            run.started_at && run.finished_at
              ? `${Math.round(
                  (new Date(run.finished_at).getTime() -
                    new Date(run.started_at).getTime()) /
                    1000
                )}s`
              : "–";

          const statusClass =
            run.status === "failed"
              ? "inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : run.status === "running"
              ? "inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : "inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";

          return (
            <div
              key={run.run_id}
              className="grid grid-cols-[2.4fr_1.6fr_1.2fr_0.8fr] items-center text-xs py-1.5 px-1 rounded-md hover:bg-muted/60"
            >
              <span className="font-mono text-foreground/80 truncate">
                <Link to={`/runs/${run.run_id}`} className="hover:underline">
                  {run.run_id}
                </Link>
              </span>

              {/* App column – now stable */}
              <span className="text-muted-foreground truncate">
                {appLabel}
              </span>

              <div className="flex justify-start">
                <span className={statusClass}>{run.status}</span>
              </div>

              <span className="text-muted-foreground">{duration}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>

        <Card
  className={cn(
    "shadow-[var(--ag-shadow-soft)] transition-colors",
    totalUnreadRuns > 0 && "border-brand/60 bg-brand/5"
  )}
>
  <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
    <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      Channel activity
    </CardTitle>
    <div className="text-[11px] flex items-center gap-1 text-muted-foreground">
      {totalUnreadRuns > 0 ? (
        <>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
          <span>
            {totalUnreadRuns} run
            {totalUnreadRuns === 1 ? "" : "s"} waiting on you
          </span>
        </>
      ) : (
        <span>No unread messages</span>
      )}
    </div>
  </CardHeader>

<CardContent className="space-y-2 text-xs text-card-foreground">
  {/* Summary row */}
  <div className="flex items-center justify-between">
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">
        Channel activity
      </span>
      {unreadSummary.totalUnread > 0 ? (
        <span className="text-[11px]">
          <span className="font-semibold">{unreadSummary.totalUnread}</span>{" "}
          unread message{unreadSummary.totalUnread > 1 ? "s" : ""} in{" "}
          <span className="font-semibold">
            {unreadSummary.runsWithUnread.length}
          </span>{" "}
          run{unreadSummary.runsWithUnread.length > 1 ? "s" : ""}.
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">
          No unread messages.
        </span>
      )}
    </div>
  </div>

  {/* Recent activity list */}
  {recentEvents.length === 0 ? (
    <div className="text-[11px] text-muted-foreground">
      No channel messages yet. When runs ask for input or send updates,
      they’ll show up here.
    </div>
  ) : (
    <div className="space-y-1.5">
      {recentEvents.slice(0, 4).map(({ runId, ev }) => {
        const ts = Number.isFinite(ev.ts)
          ? new Date(ev.ts * 1000).toLocaleTimeString(undefined, {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        const text =
          ev.text?.length && ev.text.length > 80
            ? ev.text.slice(0, 77) + "…"
            : ev.text ?? "";

        const isUser =
          ev.type === "user.message" ||
          ev.meta?.direction === "inbound" ||
          ev.meta?.role === "user";

        const label = isUser
          ? "user"
          : ev.type.startsWith("agent.")
          ? "agent"
          : "system";

        const unread = getUnreadForRun(runId);

        // Try to get a nicer label (preset name > graph_id > short id)
        const run = runs.find((r) => r.run_id === runId);
        const preset = run ? getPresetByGraphId(run.graph_id) : undefined;
        const runLabel =
          preset?.name || run?.graph_id || runId.slice(0, 8);

        return (
          <Link
            key={ev.id}
            to={`/runs/${runId}?tab=channel`}
            className={cn(
              "flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5",
              "hover:bg-muted/70 transition-colors"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-medium text-[11px] text-foreground truncate max-w-[140px]">
                  {runLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {ts}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
                {run && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {runId.slice(0, 6)}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-foreground line-clamp-2">
                {text || (
                  <span className="text-muted-foreground">[no text]</span>
                )}
              </div>
            </div>

            {unread > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] px-2 py-0.5">
                {unread}
              </span>
            )}
          </Link>
        );
      })}

      {recentEvents.length > 4 && (
        <div className="text-[10px] text-muted-foreground">
          + {recentEvents.length - 4} more recent messages…
        </div>
      )}
    </div>
  )}
</CardContent>


  {/* <CardContent className="space-y-2 text-xs text-card-foreground">
    {recentEvents.length === 0 ? (
      <div className="text-[11px] text-muted-foreground">
        No channel messages yet. When runs send prompts or updates,
        they’ll show up here.
      </div>
    ) : (
      <div className="space-y-1.5">
        {recentEvents.map(({ runId, ev }) => {
          const ts = Number.isFinite(ev.ts)
            ? new Date(ev.ts * 1000).toLocaleTimeString(undefined, {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          const text =
            ev.text?.length && ev.text.length > 120
              ? ev.text.slice(0, 117) + "…"
              : ev.text ?? "";

          const isUser =
            ev.type === "user.message" ||
            ev.meta?.direction === "inbound" ||
            ev.meta?.role === "user";

          const label = isUser
            ? "user"
            : ev.type.startsWith("agent.")
            ? "agent"
            : "system";

          return (
            <Link
              key={ev.id}
              to={`/runs/${runId}?tab=channel`}
              className={cn(
                "flex flex-col rounded-md border border-border/60 bg-muted/40 px-2 py-1.5",
                "hover:bg-muted/70 transition-colors"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-mono text-[11px] text-foreground/80 truncate max-w-[120px]">
                  {runId}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {ts}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
              </div>
              <div className="text-[11px] text-foreground line-clamp-2">
                {text || <span className="text-muted-foreground">[no text]</span>}
              </div>
            </Link>
          );
        })}
      </div>
    )}
  </CardContent> */}
</Card>

      </div>
    </div>
  );
};

export default DashboardPage;
