import React from "react";
import { API_BASE } from "@/config";
import { getClientId } from "@/utils/clientId";

import { useVizStore, useRunVizState } from "@/store/vizStore";
import { useRunViz, getTrackKeyFromTrack } from "@/hooks/useRunViz";
import type { VizTrack, VizPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Activity, 
  ImageIcon, 
  Grid3X3, 
} from "lucide-react";

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

const SERIES_COLORS = [
  "#0ea5e9", // cyan
  "#f97316", // orange
  "#22c55e", // green
  "#a855f7", // purple
  "#e11d48", // red
];

// --- Custom Chart Icons (Polished) ---
const LineChartIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-3 h-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

const ScatterChartIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-3 h-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="1.5" /><circle cx="21" cy="21" r="1.5" /><circle cx="15" cy="10" r="1.5" /><circle cx="5" cy="18" r="1.5" /><circle cx="18" cy="5" r="1.5" /></svg>
);

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

  // -- Loading States --
  if (!data && loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <RefreshCw className="w-5 h-5 animate-spin opacity-50" />
            <span className="text-xs">Loading visualization...</span>
        </div>
    );
  }

  if (error && !data) {
    return (
        <div className="flex items-center justify-center h-full text-red-500 text-xs">
            Error: {error}
        </div>
    );
  }

  if (!data) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-60">
            <Activity className="w-8 h-8 stroke-1" />
            <span className="text-xs">No visualization data yet.</span>
        </div>
    );
  }

  const figures = data.figures;
  if (!figures.length) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-60">
            <Activity className="w-8 h-8 stroke-1" />
            <span className="text-xs">No viz tracks recorded for this run.</span>
        </div>
    );
  }

  const currentFigure = figures.find((f) => f.figure_id === activeFigureId) ?? figures[0];

  return (
    <div className="flex h-full rounded-lg border border-border/60 bg-background overflow-hidden shadow-sm">
      
      {/* LEFT: Sidebar (Figure List) */}
      <div className="w-48 flex flex-col border-r border-border/60 bg-muted/5">
        <div className="shrink-0 flex items-center justify-between p-3 border-b border-border/40">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Figures
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => loadRunViz(runId, { force: true })}
                title="Refresh Data"
            >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {figures.map((fig) => {
                const id = fig.figure_id ?? "default";
                const isActive = id === (activeFigureId ?? "default");
                return (
                    <button
                        key={id}
                        className={cn(
                            "w-full text-left px-3 py-1.5 rounded-md text-xs font-medium transition-all truncate",
                            isActive 
                                ? "bg-brand/10 text-brand" 
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                        onClick={() => setActiveFigure(runId, fig.figure_id ?? null)}
                    >
                        {fig.figure_id ?? "Main"}
                    </button>
                );
            })}
        </div>
      </div>

      {/* RIGHT: Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
         {/* Optional Figure Header */}
         <div className="shrink-0 border-b border-border/40 px-4 py-2 flex items-center justify-between bg-muted/10">
             <span className="text-xs font-semibold text-foreground">
                {currentFigure.figure_id ?? "Main Figure"}
             </span>
             <span className="text-[10px] text-muted-foreground">
                {currentFigure.tracks.length} track{currentFigure.tracks.length !== 1 ? 's' : ''}
             </span>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentFigure.tracks.map((track) => {
                const trackKey = getTrackKeyFromTrack(runId, track);
                const tv = trackView[trackKey];
                const iv = imageView[trackKey];

                // Determine Icon based on Viz Kind
                let Icon = Activity;
                if (track.viz_kind === 'image') Icon = ImageIcon;
                if (track.viz_kind === 'matrix') Icon = Grid3X3;

                return (
                    <div key={trackKey} className="border border-border/60 rounded-lg bg-card shadow-sm overflow-hidden">
                        {/* Track Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="p-1 rounded bg-background border border-border/60 text-muted-foreground">
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-medium text-foreground truncate" title={track.meta?.label ?? track.track_id}>
                                        {track.meta?.label ?? track.track_id}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                                        {track.viz_kind} • {track.points.length} pts
                                    </span>
                                </div>
                            </div>
                            <TrackControls runId={runId} track={track} trackKey={trackKey} />
                        </div>

                        {/* Track Content */}
                        <div className="p-4 min-h-[180px]">
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
    </div>
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

  const plotMode = (track.meta as any)?.plot_mode;
  const suggestedChart = (track.meta as any)?.suggested_chart as "line" | "scatter" | "image" | undefined;
  const suggestedScale = (track.meta as any)?.suggested_scale as "linear" | "log" | undefined;

  // Defaults: If plot_mode is "xy_scatter", default to scatter chart.
  const defaultChart = plotMode === "xy_scatter" ? "scatter" : "line";
  const chartType = tv?.chartType ?? suggestedChart ?? defaultChart;
  
  const scale = tv?.scale ?? suggestedScale ?? "linear";

  const isNumericLike = track.viz_kind === "scalar" || track.viz_kind === "vector";

  if (!isNumericLike) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Chart Type Toggle */}
      <div className="flex items-center rounded-md border border-border/60 bg-background p-0.5">
        <button
            type="button"
            title="Line Chart"
            className={cn(
                "p-1 rounded-[3px] transition-colors",
                chartType === "line" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTrackChartType(runId, trackKey, "line")}
        >
            <LineChartIcon className="w-3 h-3" />
        </button>
        <button
            type="button"
            title="Scatter Chart"
            className={cn(
                "p-1 rounded-[3px] transition-colors",
                chartType === "scatter" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTrackChartType(runId, trackKey, "scatter")}
        >
            <ScatterChartIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Scale Toggle */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-muted-foreground uppercase font-medium">Log</span>
        <button
            type="button"
            className={cn(
                "w-8 h-4 rounded-full border transition-colors relative",
                scale === "log" ? "bg-brand border-brand" : "bg-muted border-border"
            )}
            onClick={() => setTrackScale(runId, trackKey, scale === "linear" ? "log" : "linear")}
        >
            <span className={cn(
                "absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                scale === "log" ? "left-[18px]" : "left-[2px]"
            )} />
        </button>
      </div>
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

// 1. FIX: Move ChartWrapper OUTSIDE TrackBody.
// Defining a component inside another component causes it (and its children) to 
// unmount and remount on every parent render, leading to flickering and lost state.
const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-64 min-w-0">{children}</div>
);

const TrackBody: React.FC<TrackBodyProps> = ({
  runId,
  track,
  trackKey,
  chartSettings,
  imageSettings,
}) => {
  if (!track.points || track.points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-muted-foreground italic opacity-70">
        No points logged yet.
      </div>
    );
  }

  switch (track.viz_kind) {
    case "scalar":
      return (
        <ChartWrapper>
            <ScalarTrackChart
                track={track}
                chartType={chartSettings?.chartType ?? "line"}
                scale={chartSettings?.scale ?? "linear"}
            />
        </ChartWrapper>
      );
    case "vector":
      return (
        <ChartWrapper>
            <VectorTrackChart
                track={track}
                chartType={chartSettings?.chartType ?? "line"}
                scale={chartSettings?.scale ?? "linear"}
            />
        </ChartWrapper>
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
        <div className="text-[11px] text-red-500">
          Unsupported visualization kind: {String(track.viz_kind)}
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
  const rawData = track.points.map((p) => ({
    step: p.step,
    value: p.value ?? null,
  }));

  const data = scale === "log"
      ? rawData.filter((d) => d.value != null && d.value > 0)
      : rawData;

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
        No valid values to display{scale === "log" ? " (log scale hides ≤0)." : "."}
      </div>
    );
  }

  const isLine = chartType === "line";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="step"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          scale={scale === "log" ? "log" : "linear"}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{ 
              fontSize: "11px", 
              backgroundColor: "hsl(var(--popover))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "6px",
              color: "hsl(var(--popover-foreground))"
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          labelFormatter={(label) => `Step ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
        <Line
          type="monotone"
          dataKey="value"
          name={track.meta?.label ?? track.track_id}
          stroke={isLine ? SERIES_COLORS[0] : "transparent"}
          dot={
            isLine
              ? { r: 0, strokeWidth: 0 } // cleaner look without dots on line by default
              : { r: 3, strokeWidth: 0, fill: SERIES_COLORS[0] }
          }
          activeDot={{ r: 4, strokeWidth: 0 }}
          strokeWidth={isLine ? 2 : 0}
          isAnimationActive={false} // smoother updates
        />
      </LineChart>
    </ResponsiveContainer>
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
      <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
        No vector values present.
      </div>
    );
  }

  const plotMode = ((track.meta as any)?.plot_mode as "time_series" | "xy_scatter" | undefined) ?? "time_series";

  // --- XY scatter mode ---
  if (plotMode === "xy_scatter") {
    if (dimensionCount < 2) return <div className="text-[11px] text-muted-foreground p-4">XY scatter requires dimensions ≥ 2.</div>;

    const data = track.points
      .map((p) => {
        const v = p.vector ?? [];
        return (typeof v[0] === "number" && typeof v[1] === "number") ? { x: v[0], y: v[1], step: p.step } : null;
      })
      .filter(Boolean) as { x: number; y: number; step: number }[];

    if (!data.length) return <div className="text-[11px] text-muted-foreground p-4">No valid XY data.</div>;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
          <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ strokeDasharray: "3 3" }} 
            contentStyle={{ 
                fontSize: "11px", 
                backgroundColor: "hsl(var(--popover))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "6px"
            }}
          />
          <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
          <Scatter
            name={track.meta?.label ?? track.track_id}
            data={data}
            fill={SERIES_COLORS[0]}
            line={chartType === "line"}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // --- Default: Time Series ---
  const rawData = track.points.map((p) => {
    const obj: Record<string, number | null> = { step: p.step };
    const vec = p.vector ?? [];
    for (let i = 0; i < dimensionCount; i++) {
      obj[`v${i}`] = typeof vec[i] === "number" ? vec[i] : null;
    }
    return obj;
  });

  const keys = Array.from({ length: dimensionCount }, (_, i) => `v${i}`);
  const filteredData = scale === "log"
      ? rawData.filter((row) => keys.some((k) => row[k] != null && (row[k] as number) > 0))
      : rawData;

  if (!filteredData.length) return <div className="text-[11px] text-muted-foreground p-4">No data to display.</div>;

  const isLine = chartType === "line";
  const seriesLabels = ((track.meta as any)?.series_labels as string[] | undefined) ?? keys.map((idx) => `dim[${idx}]`);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={filteredData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="step" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} scale={scale === "log" ? "log" : "linear"} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ fontSize: "11px", backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "6px" }} />
        <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
        {keys.map((k, idx) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            name={seriesLabels[idx] ?? k}
            stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
            strokeWidth={isLine ? 2 : 0}
            strokeOpacity={isLine ? 1 : 0}
            dot={isLine ? { r: 0 } : { r: 3, strokeWidth: 0, fill: SERIES_COLORS[idx % SERIES_COLORS.length] }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
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

  if (!pointsWithArtifacts.length) return <div className="text-[11px] text-muted-foreground p-4">No image frames.</div>;

  const steps = pointsWithArtifacts.map((p) => p.step);
  const minStep = Math.min(...steps);
  const maxStep = Math.max(...steps);
  const currentStep = settings?.selectedStep != null ? settings.selectedStep : maxStep;

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
  const url = new URL(`${API_BASE}/artifacts/${artifactId}/content`, window.location.origin);
  if (clientId) url.searchParams.set("client_id", clientId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center border border-border/40 rounded-lg bg-muted/20 p-4 min-h-[240px]">
        <img
          src={url.toString()}
          alt={`Frame at step ${currentPoint.step}`}
          className="max-h-[400px] max-w-full object-contain rounded-md shadow-sm"
        />
      </div>
      
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground w-12">Step {currentPoint.step}</span>
        <input
          type="range"
          min={minStep}
          max={maxStep}
          step={1}
          value={currentStep}
          onChange={(e) => setImageSelectedStep(runId, trackKey, Number(e.target.value))}
          className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-brand"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{maxStep}</span>
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
    
    // Normalize logic
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
    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
    const range = max - min || 1;
    const cellW = width / cols;
    const cellH = height / rows;

    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < rows; i++) {
      const row = latest[i];
      for (let j = 0; j < cols; j++) {
        const v = row[j];
        // Heatmap: Blue -> Cyan -> Green -> Yellow
        const t = (v - min) / range; 
        const r = Math.min(255, Math.max(0, 255 * Math.max(0, 2 * t - 0.5)));
        const g = Math.min(255, Math.max(0, 255 * t));
        const b = Math.min(255, Math.max(0, 255 * (1 - t)));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1); // +1 to fix sub-pixel gaps
      }
    }
  }, [latest, rows, cols]);

  if (!latest || !rows || !cols) return <div className="text-[11px] text-muted-foreground p-4">No matrix data.</div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span className="font-mono">Shape: {rows} × {cols}</span>
        <span className="uppercase tracking-wide">Latest Frame</span>
      </div>
      <div className="border border-border/60 rounded-lg bg-muted/10 p-4 flex items-center justify-center min-h-[200px]">
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          className="max-h-[300px] w-full object-contain rounded shadow-sm border border-border/40 rendering-pixelated"
          style={{ imageRendering: "pixelated" }} 
        />
      </div>
    </div>
  );
};