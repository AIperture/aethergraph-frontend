import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { useShellStore } from "../store/shellStore";
import type { RunSummary } from "../lib/types";
import { cn } from "../lib/utils";
import { 
  ArrowLeft, 
  Play, 
  BookOpen, 
  Activity, 
  Layers, 
  Clock,
  ExternalLink
} from "lucide-react";

// Shared status style helper
const getStatusStyles = (status: string) => {
  switch (status) {
    case "running":
      return "bg-brand/10 text-brand border-brand/20";
    case "failed":
      return "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/30 dark:text-red-400";
    case "succeeded":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/30 dark:text-emerald-400";
    case "pending":
      return "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const PresetRunnerPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const getPresetById = useShellStore((s) => s.getPresetById);
  const getRunsByAppId = useShellStore((s) => s.getRunsByAppId);
  const loadRuns = useShellStore((s) => s.loadRuns); // Import the action

  const preset = getPresetById(appId);
  
  // Note: We use the preset.id (appId) here. Ensure your store logic matches runs by this ID 
  // (or pass preset.graphId if your backend filters by graph_id)
  const runs: RunSummary[] = getRunsByAppId(appId);

  const handleStartRun = () => {
    if (!appId) return;
    navigate(`/apps/${appId}/run`);
  };

  // FIX: Fetch runs on mount so data appears even after a hard refresh
  React.useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  if (!preset) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="p-3 rounded-full bg-muted">
            <Layers className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Unknown Preset</h1>
            <p className="text-sm text-muted-foreground">
                No preset found for id <span className="font-mono text-foreground">{appId}</span>.
            </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/apps")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 w-full max-w-[1200px] mx-auto p-4 md:p-6">
      
      {/* 1. Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {preset.name}
            </h1>
            <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                {preset.badge}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground ml-9 max-w-2xl">
            {preset.shortDescription}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/apps")} className="text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Gallery
            </Button>
            <Button
                variant="default" // Primary action
                size="sm"
                className="text-xs gap-2"
                onClick={handleStartRun}
            >
                <Play className="w-3 h-3 fill-current" />
                Configure &amp; Start
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Description / Docs */}
        <Card className="lg:col-span-2 shadow-sm border-border/60">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    About this App
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground">{preset.longDescription}</p>
            
            <div className="rounded-md bg-muted/30 p-4 border border-border/40">
                <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Key Features
                </h4>
                <ul className="grid gap-2 text-xs">
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                        <span>Orchestrates complex multi-step workflows automatically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                        <span>Tracks artifacts, memory, and LLM usage per run.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                        <span>Supports pausing and resuming execution (if configured).</span>
                    </li>
                </ul>
            </div>

            <div className="flex items-center gap-2 text-[11px] pt-2 opacity-70">
                <ExternalLink className="w-3 h-3" />
                <span>Documentation link placeholder</span>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recent Runs */}
        <Card className="shadow-sm border-border/60 flex flex-col h-full max-h-[500px]">
          <CardHeader className="shrink-0 border-b border-border/40 bg-muted/30 pb-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        History
                    </CardTitle>
                </div>
                <span className="text-[10px] text-muted-foreground">{runs.length} runs</span>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0 min-h-0 bg-background">
            {runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-4">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <Play className="w-4 h-4 opacity-40" />
                </div>
                <p className="text-xs font-medium">No history yet</p>
                <p className="text-[10px] opacity-70 mt-1">Start a run to see it here.</p>
              </div>
            ) : (
                <div className="divide-y divide-border/40">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 bg-muted/10 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        <span>Run ID</span>
                        <span>Status</span>
                        <span className="text-right">Duration</span>
                    </div>

                    {runs.map((run) => (
                        <div 
                            key={run.run_id} 
                            className="group grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors text-xs"
                        >
                            <span className="font-mono text-foreground/80 truncate min-w-0">
                                <Link to={`/runs/${run.run_id}`} className="hover:text-brand hover:underline">
                                    {run.run_id.slice(0, 8)}
                                </Link>
                            </span>

                            <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border capitalize",
                                getStatusStyles(run.status)
                            )}>
                                {run.status.replace("_", " ")}
                            </span>

                            <span className="text-right font-mono text-muted-foreground text-[10px]">
                                {run.started_at && run.finished_at
                                    ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                                    : "—"
                                }
                            </span>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default PresetRunnerPage;