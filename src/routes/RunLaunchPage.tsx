import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useShellStore } from "../store/shellStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import type { RunCreateRequest } from "../lib/types";
import { startRun } from "../lib/api";
import { toast } from "sonner";
import { getClientId } from "../utils/clientId";
import { 
  Rocket, 
  ArrowLeft, 
  Settings2, 
  Info, 
  Play, 
  Loader2,
  Cpu
} from "lucide-react";

const RunLaunchPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const getPresetById = useShellStore((s) => s.getPresetById);
  const loadGraphDetail = useShellStore((s) => s.loadGraphDetail);
  const selectGraphDetail = useShellStore((s) => s.getGraphDetail);
  const setRunParamsForRun = useShellStore((s) => s.setRunParamsForRun);

  const preset = getPresetById(appId);
  const graphId = preset?.graphId;
  const graphDetail = selectGraphDetail(graphId);

  // Per-input simple fields, instead of raw JSON
  const [inputValues, setInputValues] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load graph detail on mount
  React.useEffect(() => {
    if (graphId) {
      loadGraphDetail(graphId).catch((err) =>
        console.error("Failed to load graph detail", err)
      );
    }
  }, [graphId, loadGraphDetail]);

  // Initialize per-input defaults when graphDetail arrives
  React.useEffect(() => {
    if (!graphDetail?.inputs) return;

    setInputValues((prev) => {
      const next = { ...prev };
      for (const key of graphDetail.inputs) {
        if (!(key in next)) {
          next[key] = "0"; // default numeric-ish value
        }
      }
      return next;
    });
  }, [graphDetail]);

  if (!preset || !graphId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="p-3 rounded-full bg-muted">
            <Info className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
            <h1 className="text-lg font-semibold text-foreground">Unknown Preset</h1>
            <p className="text-sm text-muted-foreground">No configuration found for ID "{appId}"</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/apps")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>
      </div>
    );
  }

  const handleStart = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Build inputs object from simple fields
      const inputs: Record<string, any> = {};
      const keys = graphDetail?.inputs ?? [];

      for (const key of keys) {
        const raw = (inputValues[key] ?? "").trim();
        if (!raw) continue; // skip empty fields

        // Try to parse as JSON, fall back to string
        let parsed: any = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // If JSON.parse fails and raw looks like a number, coerce to number
          const n = Number(raw);
          parsed = Number.isNaN(n) ? raw : n;
        }
        inputs[key] = parsed;
      }

      // Fixed run config for demo
      const runConfig: Record<string, any> = {
        max_concurrency: 4,
      };

      const body: RunCreateRequest = {
        run_id: null,
        inputs,
        run_config: runConfig,
        tags: [preset.id, `client:${getClientId()}`],
      };

      const resp = await startRun(graphId, body);

      setRunParamsForRun(resp.run_id, {
        run_id: resp.run_id,       // optional, but fine to keep
        inputs,
        run_config: runConfig,
        tags: [preset.id],
      });

      toast.success("Run started", {
        description: `Run ${resp.run_id} has been created.`,
      });

      navigate(`/runs/${resp.run_id}`);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to start run";
      setError(msg);

      toast.error("Failed to start run", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 w-full max-w-[1200px] mx-auto p-4 md:p-6">
      
      {/* 1. Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Launch Application
            </h1>
          </div>
          <p className="text-xs text-muted-foreground ml-9">
            Configure parameters for <span className="font-semibold text-foreground">{preset.name}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/apps")} className="text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 items-start">
        
        {/* Left: Input Configuration */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Configuration Inputs
                </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Parameters</h3>
                {graphDetail && graphDetail.inputs.length > 0 && (
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {graphDetail.inputs.length} fields
                  </span>
                )}
              </div>

              {graphDetail?.inputs?.length ? (
                <div className="grid gap-5">
                  {graphDetail.inputs.map((key) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground font-mono">
                          {key}
                        </label>
                        <span className="text-[10px] text-muted-foreground italic">
                          JSON / Scalar
                        </span>
                      </div>
                      <input
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        value={inputValues[key] ?? ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder='e.g. 1.0, "foo", [1,2,3]'
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                  <span className="text-xs">No explicit inputs defined for this graph.</span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-xs border border-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400">
                Error: {error}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleStart}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            Start Run
                        </>
                    )}
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Meta Information */}
        <div className="space-y-4">
            <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Graph Details
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 text-xs space-y-4">
                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Graph ID</span>
                        <div className="font-mono text-foreground bg-muted/50 px-2 py-1 rounded border border-border/50 break-all">
                            {graphId}
                        </div>
                    </div>
                    
                    {graphDetail?.description && (
                        <div>
                            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Description</span>
                            <p className="text-muted-foreground leading-relaxed">
                                {graphDetail.description}
                            </p>
                        </div>
                    )}

                    <Separator />

                    <div>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Expected Outputs</span>
                        {graphDetail?.outputs?.length ? (
                            <div className="flex flex-wrap gap-1">
                                {graphDetail.outputs.map(out => (
                                    <span key={out} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40">
                                        {out}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">None defined</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        System Config
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Concurrency</span>
                        <span className="font-mono font-medium">4</span>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground/70">
                        Default concurrency limit applied for this environment.
                    </p>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};

export default RunLaunchPage;