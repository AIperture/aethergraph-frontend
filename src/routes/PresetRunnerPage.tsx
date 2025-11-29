// src/routes/PresetRunnerPage.tsx
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { useShellStore } from "../store/shellStore";
import type { RunSummary } from "../lib/types";

const PresetRunnerPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const getPresetById = useShellStore((s) => s.getPresetById);
  const getRunsByAppId = useShellStore((s) => s.getRunsByAppId);
  const startRunForPreset = useShellStore((s) => s.startRunForPreset);


  const preset = getPresetById(appId);
  const runs: RunSummary[] = getRunsByAppId(appId);

  // // Later: call backend to start a new run and navigate to /runs/{runId}.
  // const handleStartRun = () => {
  //   // TODO: replace with real API call
  //   const fakeNewRunId = "run_new_demo";
  //   navigate(`/runs/${fakeNewRunId}`);
  // };


  const handleStartRun = () => {
    if (!appId) return;
    navigate(`/apps/${appId}/run`);
  };


  if (!preset) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Unknown preset: <span className="ml-1 font-mono">{appId}</span>
      </div>
    );
  }

  return (
    <div className="h-full max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Header / hero */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {preset.name}
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent uppercase tracking-wide">
              {preset.badge}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {preset.shortDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="accent"
            size="sm"
            className="px-3"
            onClick={handleStartRun}
          >
            Configure & start
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-xs"
            >
              View docs (soon)
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: description / explainer */}
        <Card className="lg:col-span-2 shadow-[var(--ag-shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-sm text-card-foreground">
              How this preset works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>{preset.longDescription}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Uses AetherGraph to orchestrate multiple steps as one run.</li>
              <li>Tracks artifacts, memory, and LLM calls per run.</li>
              <li>Fully resumable: you can pause and resume runs (future).</li>
            </ul>
            <p className="text-[11px]">
              This content is static for now. Later, it can be generated from a
              config or docs.
            </p>
          </CardContent>
        </Card>

        {/* Right: recent runs for this app */}
        <Card className="shadow-[var(--ag-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-card-foreground">
              Recent runs for this preset
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <div className="flex justify-between text-[11px]">
              <span>Run ID</span>
              <span>Status</span>
              <span>Duration</span>
            </div>
            <Separator />
            {runs.length === 0 && (
              <div className="text-[11px] text-muted-foreground mt-2">
                No runs yet. Start a new run to see it appear here.
              </div>
            )}
            {runs.map((run) => (
              <div
                key={run.run_id}
                className="flex justify-between items-center text-[11px] py-1.5 px-1 rounded-md hover:bg-muted/60"
              >
                <span className="font-mono text-foreground/80">
                  <Link to={`/runs/${run.run_id}`} className="hover:underline">
                    {run.run_id}
                  </Link>
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
      </div>
    </div>
  );
};

export default PresetRunnerPage;
