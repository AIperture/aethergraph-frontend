// src/routes/RunLaunchPage.tsx
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useShellStore } from "../store/shellStore";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import type { RunCreateRequest } from "../lib/types";
import { startRun } from "../lib/api";
import { Toaster, toast } from "sonner";

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
      <div className="space-y-2 text-xs text-muted-foreground">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Unknown preset
        </h1>
        <p>No preset or graph found for this route.</p>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          type="button"
          onClick={() => navigate("/apps")}
        >
          Back to App Gallery
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
        tags: [preset.id],
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
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Launch: {preset.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Configure inputs and start a new run for graph{" "}
          <span className="font-mono">{graphId}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.5fr] gap-4">
        {/* Left: config & inputs */}
        <Card className="shadow-[var(--ag-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Inputs &amp; run config
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Graph inputs as fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Inputs
                </span>
                {graphDetail && graphDetail.inputs.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {graphDetail.inputs.length} parameter
                    {graphDetail.inputs.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {graphDetail?.inputs?.length ? (
                <div className="space-y-2">
                  {graphDetail.inputs.map((key) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-muted-foreground">
                          {key}
                        </label>
                        <span className="text-[10px] text-muted-foreground/80">
                          JSON or scalar
                        </span>
                      </div>
                      <input
                        className="w-full h-7 rounded border border-input bg-background px-2 font-mono text-[11px]"
                        value={inputValues[key] ?? ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder='e.g. 1.0, "foo", [1,2,3]'
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  This graph has no declared inputs. You can still start the run.
                </div>
              )}
            </div>

            <Separator />

            {/* Fixed run_config preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Run config
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Fixed for demo
                </span>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] text-muted-foreground">
                  max_concurrency
                </label>
                <input
                  className="w-full h-7 rounded border border-input bg-muted px-2 font-mono text-[11px] text-muted-foreground"
                  value="4"
                  readOnly
                  disabled
                />
                <p className="text-[10px] text-muted-foreground/80">
                  Hard-coded for this demo. Future versions can make this configurable.
                </p>
              </div>
            </div>

            {error && (
              <div className="text-[11px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="button"
                className="text-xs"
                onClick={handleStart}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Starting..." : "Start run"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: graph meta */}
        <Card className="shadow-[var(--ag-shadow-soft)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Graph details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground">
                {graphDetail?.name ?? graphId}
              </div>
              {graphDetail?.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {graphDetail.description}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="font-medium text-[11px] uppercase tracking-wide">
                Inputs
              </div>
              {graphDetail?.inputs?.length ? (
                <ul className="list-disc list-inside">
                  {graphDetail.inputs.map((inp) => (
                    <li key={inp}>
                      <code>{inp}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  No explicit inputs defined.
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-medium text-[11px] uppercase tracking-wide">
                Outputs
              </div>
              {graphDetail?.outputs?.length ? (
                <ul className="list-disc list-inside">
                  {graphDetail.outputs.map((out) => (
                    <li key={out}>
                      <code>{out}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  No explicit outputs defined.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RunLaunchPage;
