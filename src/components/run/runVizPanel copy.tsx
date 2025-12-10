// src/components/run/RunVizPanel.tsx
import React from "react";
import { API_BASE } from "@/config";
import { getClientId } from "@/utils/clientId";

import { useVizStore, useRunVizState } from "@/store/vizStore";
import { useRunViz, getTrackKeyFromTrack } from "@/hooks/useRunViz";
import type { VizTrack, VizPoint } from "@/lib/types";

const SERIES_COLORS = [
  "#0ea5e9", // cyan / sky
  "#f97316", // orange
  "#22c55e", // green
  "#a855f7", // purple
  "#e11d48", // red
];

// ---- Small inline icons ----
const LineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "w-3 h-3"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 17 9 11 13 15 21 7" />
  </svg>
);

const ScatterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "w-3 h-3"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="6" cy="18" r="1.5" />
    <circle cx="10" cy="10" r="1.5" />
    <circle cx="18" cy="6" r="1.5" />
    <circle cx="16" cy="16" r="1.5" />
  </svg>
);

const LogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "w-3 h-3"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 20 4 4 20 4" />
    <path d="M6 16c4-6 6-8 12-10" />
  </svg>
);

const LinearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "w-3 h-3"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 20 20 4" />
  </svg>
);

// ---- Chart (using Recharts) ----
// If you don't use Recharts yet, install it: `npm install recharts`
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";


interface RunVizPanelProps {
  runId: string;
}

export const RunVizPanel: React.FC<RunVizPanelProps> = ({ runId }) => {
  const { data, loading, error, activeFigureId } = useRunViz(runId);
  const setActiveFigure = useVizStore((s) => s.setActiveFigure);
  const runState = useRunVizState(runId);
  const trackView = runState?.trackView ?? {};
  const imageView = runState?.imageView ?? {};
  const loadRunViz = useVizStore((s) => s.loadRunViz);

  // Only show the big "Loading" state when we have *no* data yet.
  if (!data && loading) {
    return <div className="p-4 text-sm">Loading visualization…</div>;
  }

  if (error && !data) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="p-4 text-sm">No visualization data yet.</div>;
  }

  const figures = data.figures;
  if (!figures.length) {
    return <div className="p-4 text-sm">No viz tracks recorded for this run.</div>;
  }

  const currentFigure =
    figures.find((f) => f.figure_id === activeFigureId) ?? figures[0];

  return (
    <div className="flex h-full rounded-lg border border-border shadow-sm bg-background">
      {/* Left: figure list */}
      <div className="w-48 border-r border-border p-2 space-y-1 bg-muted/10">
        <div className="px-1 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Panels
        </div>
        <button
          className="text-[10px] px-1.5 py-0.5 border rounded hover:bg-muted"
          onClick={() => loadRunViz(runId, { force: true })}
        >
          Refresh
        </button>
        {loading && (
          <span className="text-[10px] text-muted-foreground animate-pulse">
            syncing…
          </span>
        )}

        {figures.map((fig) => {
          const id = fig.figure_id ?? "default";
          const isActive = id === (activeFigureId ?? "default");
          return (
            <button
              key={id}
              className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              onClick={() => setActiveFigure(runId, fig.figure_id ?? null)}
            >
              {fig.figure_id ?? "Main"}
            </button>
          );
        })}
      </div>

      {/* Right: current figure content */}
      {/* <div className="flex-1 p-3 overflow-auto bg-muted/5"> */}

      <div className="flex-1 p-3 space-y-4 overflow-auto bg-muted/5">
        {currentFigure.tracks.map((track) => {
          const trackKey = getTrackKeyFromTrack(runId, track);
          const tv = trackView[trackKey];
          const iv = imageView[trackKey];

          return (
            <div
              key={trackKey}
              className="border border-border/70 rounded-md bg-card shadow-sm"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/40">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground/90">
                    {track.meta?.label ?? track.track_id}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {track.viz_kind.toUpperCase()} • {track.points.length} points
                  </span>
                </div>

                <TrackControls runId={runId} track={track} trackKey={trackKey} />
              </div>

              <div className="p-3 min-h-[140px]">
                <TrackBody
                  runId={runId}
                  track={track}
                  trackKey={trackKey}
                  chartSettings={tv}
                  imageSettings={iv}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
    // </div>
  );
};

// ---------------- Track controls ----------------

interface TrackControlsProps {
  runId: string;
  track: VizTrack;
  trackKey: string;
}

const TrackControls: React.FC<TrackControlsProps> = ({ runId, track, trackKey }) => {
  const setTrackChartType = useVizStore((s) => s.setTrackChartType);
  const setTrackScale = useVizStore((s) => s.setTrackScale);

  const runState = useRunVizState(runId);
  const tv = runState?.trackView?.[trackKey];

  const suggestedChart = (track.meta as any)?.suggested_chart as
    | "line"
    | "scatter"
    | "image"
    | undefined;
  const suggestedScale = (track.meta as any)?.suggested_scale as
    | "linear"
    | "log"
    | undefined;

  const chartType = tv?.chartType ?? suggestedChart ?? "line";
  const scale = tv?.scale ?? suggestedScale ?? "linear";

  const isNumericLike = track.viz_kind === "scalar" || track.viz_kind === "vector";

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
      {isNumericLike && (
        <>
          <div className="flex items-center gap-1">
            <span className="uppercase tracking-wide">Chart</span>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] ${chartType === "line"
                ? "border-brand bg-brand/10 text-brand"
                : "border-border hover:bg-muted/60"
                }`}
              onClick={() => setTrackChartType(runId, trackKey, "line")}
            >
              <LineIcon className="w-3 h-3" />
              Line
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] ${chartType === "scatter"
                ? "border-brand bg-brand/10 text-brand"
                : "border-border hover:bg-muted/60"
                }`}
              onClick={() => setTrackChartType(runId, trackKey, "scatter")}
            >
              <ScatterIcon className="w-3 h-3" />
              Scatter
            </button>
          </div>

          <div className="h-4 w-px bg-border/60 mx-1" />

          <div className="flex items-center gap-1">
            <span className="uppercase tracking-wide">Scale</span>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] ${scale === "linear"
                ? "border-brand bg-brand/10 text-brand"
                : "border-border hover:bg-muted/60"
                }`}
              onClick={() => setTrackScale(runId, trackKey, "linear")}
            >
              <LinearIcon className="w-3 h-3" />
              Lin
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[10px] ${scale === "log"
                ? "border-brand bg-brand/10 text-brand"
                : "border-border hover:bg-muted/60"
                }`}
              onClick={() => setTrackScale(runId, trackKey, "log")}
            >
              <LogIcon className="w-3 h-3" />
              Log
            </button>
          </div>
        </>
      )}

      {!isNumericLike && (
        <span className="italic text-[10px] text-muted-foreground/80">
          {track.viz_kind === "image" ? "Image sequence" : "Matrix stream"}
        </span>
      )}
    </div>
  );
};

// ---------------- Track body (renderers) ----------------

interface TrackBodyProps {
  runId: string;
  track: VizTrack;
  trackKey: string;
  chartSettings?: { chartType?: "line" | "scatter"; scale?: "linear" | "log" };
  imageSettings?: { selectedStep?: number; autoPlay?: boolean };
}

const TrackBody: React.FC<TrackBodyProps> = ({
  runId,
  track,
  trackKey,
  chartSettings,
  imageSettings,
}) => {
  if (!track.points || track.points.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground italic">
        No points logged yet for this track.
      </div>
    );
  }

  switch (track.viz_kind) {
    case "scalar":
      return (
        <ScalarTrackChart
          track={track}
          chartType={chartSettings?.chartType ?? "line"}
          scale={chartSettings?.scale ?? "linear"}
        />
      );
    case "vector":
      return (
        <VectorTrackChart
          track={track}
          chartType={chartSettings?.chartType ?? "line"}
          scale={chartSettings?.scale ?? "linear"}
        />
      );
    case "image":
      return (
        <ImageTrackViewer
          runId={runId}
          track={track}
          trackKey={trackKey}
          settings={imageSettings}
        />
      );
    case "matrix":
      return <MatrixTrackViewer track={track} />;
    default:
      return (
        <div className="text-[11px] text-muted-foreground">
          Unsupported viz kind: {String(track.viz_kind)}
        </div>
      );
  }
};

// ---------------- Scalar chart ----------------

interface ScalarTrackChartProps {
  track: VizTrack;
  chartType: "line" | "scatter";
  scale: "linear" | "log";
}

const ScalarTrackChart: React.FC<ScalarTrackChartProps> = ({
  track,
  chartType,
  scale,
}) => {
  // Prepare data
  const rawData = track.points.map((p) => ({
    step: p.step,
    value: p.value ?? null,
  }));

  // For log scale, filter out non-positive or null values
  const data =
    scale === "log"
      ? rawData.filter((d) => d.value != null && d.value > 0)
      : rawData;

  if (!data.length) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No valid values to display{scale === "log"
          ? " (log scale hides non-positive values)."
          : "."}
      </div>
    );
  }

  const isLine = chartType === "line";

  return (
    <div className="w-full h-40 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="step"
            tick={{ fontSize: 10 }}
            label={{ value: "Step", position: "insideBottomRight", offset: -4 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            scale={scale === "log" ? "log" : "linear"}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ fontSize: "11px" }}
            labelFormatter={(label) => `Step ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: "10px" }} />
          <Line
            type="monotone"
            dataKey="value"
            name={track.meta?.label ?? track.track_id}
            // If line: normal stroke & small dots; if scatter: hide line, show only dots
            stroke={isLine ? undefined : "transparent"}
            dot={
              isLine
                ? { r: 1.5 } // small dots over the line
                : { r: 2.5, strokeWidth: 0, fill: "currentColor" } // pure dots, no outline
            }
            activeDot={{ r: 3 }}
            strokeWidth={isLine ? 1.8 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


// ---------------- Vector chart ----------------

interface VectorTrackChartProps {
  track: VizTrack;
  chartType: "line" | "scatter";
  scale: "linear" | "log";
}

const VectorTrackChart: React.FC<VectorTrackChartProps> = ({
  track,
  chartType,
  scale,
}) => {
  const dimensionCount = track.points[0]?.vector?.length ?? 0;

  if (dimensionCount === 0) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No vector values present.
      </div>
    );
  }

  const plotMode =
    ((track.meta as any)?.plot_mode as "time_series" | "xy_scatter" | undefined) ??
    "time_series";

  // --- XY scatter mode: interpret vector as [x, y] ---
  if (plotMode === "xy_scatter") {
    // Require at least 2 dimensions
    if (dimensionCount < 2) {
      return (
        <div className="text-[11px] text-muted-foreground">
          XY scatter mode requires vector dimension ≥ 2.
        </div>
      );
    }

    const data = track.points
      .map((p) => {
        const v = p.vector ?? [];
        const x = v[0];
        const y = v[1];
        if (typeof x !== "number" || typeof y !== "number") return null;
        return { x, y, step: p.step };
      })
      .filter(Boolean) as { x: number; y: number; step: number }[];

    if (!data.length) {
      return (
        <div className="text-[11px] text-muted-foreground">
          No valid (x, y) pairs for XY scatter.
        </div>
      );
    }

    return (
      <div className="w-full h-48 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="x"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="y"
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ fontSize: "11px" }}
              formatter={(value: any, name: any, props: any) => {
                if (name === "x" || name === "y") {
                  return [Number(value).toFixed(3), name];
                }
                if (name === "step") {
                  return [value, "step"];
                }
                return [value, name];
              }}
              labelFormatter={() => track.meta?.label ?? track.track_id}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            <Scatter
              name={track.meta?.label ?? track.track_id}
              data={data}
              fill="currentColor" // Recharts will use theme color; you can override
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // --- Default: time series of each dimension vs step ---
  // Prepare data with keys v0, v1, ...
  const rawData = track.points.map((p) => {
    const obj: Record<string, number | null> = { step: p.step };
    const vec = p.vector ?? [];
    for (let i = 0; i < dimensionCount; i++) {
      obj[`v${i}`] = typeof vec[i] === "number" ? vec[i] : null;
    }
    return obj;
  });

  const keys = Array.from({ length: dimensionCount }, (_, i) => `v${i}`);

  const filteredData =
    scale === "log"
      ? rawData.filter((row) =>
        keys.some((k) => row[k] != null && (row[k] as number) > 0),
      )
      : rawData;

  if (!filteredData.length) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No valid values to display{scale === "log"
          ? " (log scale hides non-positive values)."
          : "."}
      </div>
    );
  }

  const isLine = chartType === "line";

  // Optional: labels per dimension from meta
  const seriesLabels =
    ((track.meta as any)?.series_labels as string[] | undefined) ??
    keys.map((k, idx) => `dim[${idx}]`);

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="step"
            tick={{ fontSize: 10 }}
            label={{ value: "Step", position: "insideBottomRight", offset: -4 }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            scale={scale === "log" ? "log" : "linear"}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ fontSize: "11px" }}
            labelFormatter={(label) => `Step ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: "10px" }} />

          {keys.map((k, idx) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              name={seriesLabels[idx] ?? k}
              stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
              strokeWidth={1.4}
              strokeOpacity={isLine ? 1 : 0}
              dot={
                isLine
                  ? { r: 1.4 }
                  : { r: 2.2, strokeWidth: 0, fill: SERIES_COLORS[idx % SERIES_COLORS.length] }
              }
              activeDot={{ r: 3 }}
            />
          ))}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


// ---------------- Image viewer ----------------

interface ImageTrackViewerProps {
  runId: string;
  track: VizTrack;
  trackKey: string;
  settings?: { selectedStep?: number; autoPlay?: boolean };
}

const ImageTrackViewer: React.FC<ImageTrackViewerProps> = ({
  runId,
  track,
  trackKey,
  settings,
}) => {
  const setImageSelectedStep = useVizStore((s) => s.setImageSelectedStep);
  const pointsWithArtifacts = track.points.filter((p) => p.artifact_id);
  const clientId = getClientId();

  if (!pointsWithArtifacts.length) {
    return (
      <div className="text-[11px] text-muted-foreground">
        No image frames logged for this track.
      </div>
    );
  }

  const steps = pointsWithArtifacts.map((p) => p.step);
  const minStep = Math.min(...steps);
  const maxStep = Math.max(...steps);

  // Determine current step (default = latest)
  const currentStep =
    settings?.selectedStep != null ? settings.selectedStep : maxStep;

  // Find nearest point for currentStep
  let currentPoint: VizPoint = pointsWithArtifacts[0];
  let bestDist = Number.MAX_SAFE_INTEGER;
  for (const p of pointsWithArtifacts) {
    const d = Math.abs(p.step - currentStep);
    if (d < bestDist) {
      bestDist = d;
      currentPoint = p;
    }
  }

  const artifactId = currentPoint.artifact_id!;
  const url = new URL(
    `${API_BASE}/artifacts/${artifactId}/content`,
    window.location.origin,
  );
  if (clientId) {
    url.searchParams.set("client_id", clientId);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="uppercase tracking-wide">Frame</span>
        <input
          type="range"
          min={minStep}
          max={maxStep}
          step={1}
          value={currentStep}
          onChange={(e) =>
            setImageSelectedStep(runId, trackKey, Number(e.target.value))
          }
          className="flex-1"
        />
        <span className="tabular-nums text-[10px] bg-muted px-1.5 py-0.5 rounded">
          step {currentPoint.step}
        </span>
      </div>
      <div className="flex items-center justify-center border border-border/60 rounded bg-background p-2">
        <img
          src={url.toString()}
          alt={`Frame at step ${currentPoint.step}`}
          className="max-h-64 max-w-full object-contain rounded"
        />
      </div>
    </div>
  );
};

// ---------------- Matrix viewer (canvas heatmap) ----------------

interface MatrixTrackViewerProps {
  track: VizTrack;
}

const MatrixTrackViewer: React.FC<MatrixTrackViewerProps> = ({ track }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Use the latest matrix frame
  const latest = track.points[track.points.length - 1]?.matrix;
  const rows = latest?.length ?? 0;
  const cols = rows > 0 ? latest![0].length : 0;

  React.useEffect(() => {
    if (!latest || !rows || !cols) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Compute min/max for normalization
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < rows; i++) {
      const row = latest[i];
      for (let j = 0; j < cols; j++) {
        const v = row[j];
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (!isFinite(min) || !isFinite(max)) {
      min = 0;
      max = 1;
    }
    const range = max - min || 1;

    const cellW = width / cols;
    const cellH = height / rows;

    // Simple colormap: v in [0,1] → rgb
    const getColor = (v: number): string => {
      const t = (v - min) / range; // 0..1
      // blue → cyan → green → yellow
      const r = Math.min(255, Math.max(0, 255 * Math.max(0, 2 * t - 0.5)));
      const g = Math.min(255, Math.max(0, 255 * t));
      const b = Math.min(255, Math.max(0, 255 * (1 - t)));
      return `rgb(${r}, ${g}, ${b})`;
    };

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < rows; i++) {
      const row = latest[i];
      for (let j = 0; j < cols; j++) {
        const v = row[j];
        ctx.fillStyle = getColor(v);
        ctx.fillRect(j * cellW, (rows - 1 - i) * cellH, cellW + 1, cellH + 1);
      }
    }
  }, [latest, rows, cols]);

  if (!latest || !rows || !cols) {
    return (
      <div className="text-[11px] text-muted-foreground italic">
        No matrix data to visualize yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Latest matrix shape:{" "}
          <span className="font-mono">
            {rows} × {cols}
          </span>
        </span>
        <span className="italic">heatmap preview</span>
      </div>
      <div className="border border-border/60 rounded bg-background flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          className="max-h-64 max-w-full object-contain rounded"
        />
      </div>
    </div>
  );
};
