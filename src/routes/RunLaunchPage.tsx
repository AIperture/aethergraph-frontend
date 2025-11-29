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

const RunLaunchPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  const getPresetById = useShellStore((s) => s.getPresetById);
  const loadGraphDetail = useShellStore((s) => s.loadGraphDetail);
  const selectGraphDetail = useShellStore((s) => s.getGraphDetail);

  const preset = getPresetById(appId);
  const graphId = preset?.graphId;
  const graphDetail = selectGraphDetail(graphId);

  const [inputsText, setInputsText] = React.useState<string>('{\n  "vals": [1, 2, 3, 4, 5]\n}');
  const [runConfigText, setRunConfigText] = React.useState<string>('{}');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // load graph detail on mount
  React.useEffect(() => {
    if (graphId) {
      loadGraphDetail(graphId).catch((err) =>
        console.error("Failed to load graph detail", err)
      );
    }
  }, [graphId, loadGraphDetail]);

  if (!preset || !graphId) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Unknown preset.
      </div>
    );
  }

  const handleStart = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      let inputs: Record<string, any>;
      let runConfig: Record<string, any>;

      try {
        inputs = JSON.parse(inputsText || "{}");
      } catch {
        throw new Error("Inputs must be valid JSON");
      }
      try {
        runConfig = JSON.parse(runConfigText || "{}");
      } catch {
        throw new Error("Run config must be valid JSON");
      }

      const body: RunCreateRequest = {
        run_id: null,
        inputs,
        run_config: runConfig,
        tags: [preset.id],
      };

      const resp = await startRun(graphId, body);
      navigate(`/runs/${resp.run_id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start run");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-background">
      <div className="h-full max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            Launch: {preset.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure inputs and start a new run for graph{" "}
            <span className="font-mono">{graphId}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.5fr] gap-4">
          {/* Config card */}
          <Card className="shadow-[var(--ag-shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-card-foreground">
                Inputs & run config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Inputs (JSON)
                  </span>
                  {graphDetail && graphDetail.inputs.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Expected keys:{" "}
                      {graphDetail.inputs.map((k) => (
                        <code key={k} className="px-1">
                          {k}
                        </code>
                      ))}
                    </span>
                  )}
                </div>
                <Textarea
                  className="font-mono text-xs min-h-[120px]"
                  value={inputsText}
                  onChange={(e) => setInputsText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Run config (JSON)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Optional
                  </span>
                </div>
                <Textarea
                  className="font-mono text-xs min-h-[80px]"
                  value={runConfigText}
                  onChange={(e) => setRunConfigText(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleStart}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Starting..." : "Start run"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Graph meta card */}
          <Card className="shadow-[var(--ag-shadow-soft)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-card-foreground">
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
    </div>
  );
};

export default RunLaunchPage;
