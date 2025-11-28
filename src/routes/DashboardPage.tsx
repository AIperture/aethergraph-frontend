// src/routes/DashboardPage.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import { FakeStatsCard } from "../components/core/FakeStatsCard";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useShellStore } from "../store/shellStore";
import type { RunSummary } from "../lib/types";

const DashboardPage: React.FC = () => {
  const runs = useShellStore((s) => s.runs);

  // Very naive derived stats (mocked for now)
  const activeCount = runs.filter((r) => r.status === "running").length;
  const totalRuns = runs.length;

  // Just a placeholder; later we compute from numeric durations or from backend
  const avgRunTime = totalRuns > 0 ? "42s" : "-";
  const llmCallsLast24h = "128"; // placeholder; will come from /stats/llm

  return (
    <div className="h-full bg-background">
      <div className="h-full max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              AetherGraph Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Holistic overview of all runs across presets and agents.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full border border-border bg-muted/60">
              Connected:{" "}
              <span className="font-mono text-brand-light">local-sidecar</span>
            </span>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FakeStatsCard
            label="Active runs"
            value={String(activeCount)}
            hint={`${totalRuns} total runs`}
          />
          <FakeStatsCard
            label="Avg. run time"
            value={avgRunTime}
            hint="Last N runs (mock)"
          />
          <FakeStatsCard
            label="LLM calls"
            value={llmCallsLast24h}
            hint="Past 24 hours (mock)"
          />
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent runs */}
          <Card className="lg:col-span-2 shadow-[var(--ag-shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-card-foreground">
                Recent runs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Run ID</span>
                <span>App</span>
                <span>Status</span>
                <span>Duration</span>
              </div>
              <Separator />
              {runs.length === 0 && (
                <div className="text-[11px] text-muted-foreground mt-2">
                  No runs yet. Start a new run from any preset to see it here.
                </div>
              )}
              {runs.map((run: RunSummary) => (
                <div
                  key={run.run_id}
                  className="flex justify-between items-center text-xs py-1.5 px-1 rounded-md hover:bg-muted/60"
                >
                  <span className="font-mono text-foreground/80">
                    <Link to={`/runs/${run.run_id}`} className="hover:underline">
                      {run.run_id}
                    </Link>
                  </span>
                  <span className="text-muted-foreground">
                    {run.appName ?? run.appId ?? "—"}
                  </span>
                  <span
                    className={
                      run.status === "failed"
                        ? "px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : run.status === "running"
                        ? "px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }
                  >
                    {run.status}
                  </span>
                  <span className="text-muted-foreground">
                    {run.started_at && run.finished_at
                      ? Math.round(
                          (new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000
                        )
                      : "-"}s
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Channel mock (unchanged) */}
          <Card className="shadow-[var(--ag-shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-card-foreground">
                Channel (read-only mock)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-card-foreground">
              <div className="text-[11px] text-muted-foreground mb-1">
                # lab-rnd-session-1
              </div>
              <div>
                <span className="font-semibold text-foreground">you</span>{" "}
                <span className="text-muted-foreground">· just now</span>
                <div className="mt-1">
                  “Optimize the metalens for 532nm, 10° FOV with max NA.”
                </div>
              </div>
              <div>
                <span className="font-semibold text-brand">ag-rnd-bot</span>{" "}
                <span className="text-muted-foreground">· just now</span>
                <div className="mt-1">
                  A new orchestration run has been started:{" "}
                  <span className="font-mono">run_04</span>.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
