import * as React from "react";
import { useShellStore } from "../../store/shellStore";
import type { ArtifactMeta } from "../../lib/types";
import { cn } from "../../lib/utils";
import {
  FileText,
  Image as ImageIcon,
  FileJson,
  FileCode,
  File,
  Search,
  ArrowUpDown,
  Star
} from "lucide-react";
import { ArtifactPreview } from "./ArtifactPreview";

const EMPTY_ARTIFACTS: ArtifactMeta[] = [];

interface RunArtifactsPanelProps {
  runId: string;
}

type SortKey = "kind" | "mime_type" | "size" | "created_at";
type SortDir = "asc" | "desc";

// Helper to get icon by mime type
const getFileIcon = (mime: string = "") => {
  if (mime.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />;
  if (mime.includes("json")) return <FileJson className="h-4 w-4 text-orange-500 shrink-0" />;
  if (mime.includes("text/")) return <FileText className="h-4 w-4 text-slate-500 shrink-0" />;
  if (mime.includes("application/javascript") || mime.includes("python")) return <FileCode className="h-4 w-4 text-blue-500 shrink-0" />;
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
};

const formatSize = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const RunArtifactsPanel: React.FC<RunArtifactsPanelProps> = ({ runId }) => {
  const loadRunArtifacts = useShellStore((s) => s.loadRunArtifacts);
  const selectRunArtifact = useShellStore((s) => s.selectRunArtifact);
  const pinArtifact = useShellStore((s) => s.pinArtifact);

  // Force re-render to handle in-place store updates
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const artifacts = useShellStore(
    React.useCallback(
      (s) => (runId ? s.artifactsByRun[runId] ?? EMPTY_ARTIFACTS : EMPTY_ARTIFACTS),
      [runId]
    )
  );

  const selectedArtifactId = useShellStore(
    React.useCallback(
      (s) => (runId ? s.selectedArtifactIdByRun[runId] ?? null : null),
      [runId]
    )
  );

  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    if (!runId) return;
    loadRunArtifacts(runId).catch((err) =>
      console.error("Failed to load artifacts", err)
    );
  }, [runId, loadRunArtifacts]);

  const selectedArtifact = React.useMemo(
    () => artifacts.find((a) => a.artifact_id === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId]
  );

  // --- Handlers ---
  const handlePinClick = async (
    e: React.MouseEvent,
    artifact: ArtifactMeta,
    pinned: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation(); 
    try {
      await pinArtifact(artifact.artifact_id, pinned);
      forceUpdate(); // Triggers re-render to reflect new pin state immediately
    } catch (err) {
      console.error("Failed to pin artifact", err);
    }
  };

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc"); 
    }
  };

  // --- Filter & Sort ---
  const processedArtifacts = React.useMemo(() => {
    let result = [...artifacts];

    // Filter
    if (filter) {
        const lower = filter.toLowerCase();
        result = result.filter(a => 
            a.kind.toLowerCase().includes(lower) || 
            (a.mime_type ?? "").toLowerCase().includes(lower)
        );
    }

    // Sort
    result.sort((a, b) => {
      // Always put Pinned items at the top
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      const dir = sortDir === "asc" ? 1 : -1;
      const get = (art: ArtifactMeta, key: SortKey) => {
        switch (key) {
          case "kind": return (art.kind ?? "").toLowerCase();
          case "mime_type": return (art.mime_type ?? "").toLowerCase();
          case "size": return art.size ?? 0;
          case "created_at": return new Date(art.created_at).getTime();
        }
      };

      const va = get(a, sortKey);
      const vb = get(b, sortKey);

      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return String(va).localeCompare(String(vb)) * dir;
    });

    return result;
  }, [artifacts, sortKey, sortDir, filter]); // artifacts dependency will pick up the re-render from forceUpdate


  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
        <File className="h-10 w-10 mb-2 stroke-1" />
        <p className="text-xs">No artifacts produced yet.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/60">
      
      {/* LEFT PANE: List */}
      <div className="flex flex-col min-h-0 lg:w-[45%] bg-muted/5">
        
        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Files ({processedArtifacts.length})
            </div>
            <div className="relative">
                <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input 
                    className="h-6 w-32 rounded bg-background border border-border px-2 pl-6 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    placeholder="Filter..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>
        </div>

        {/* List Header: [Pin] [Name] [Date] [Size] */}
        <div className="grid grid-cols-[28px_1fr_85px_65px] gap-2 px-3 py-2 border-b border-border/40 bg-background text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <div className="text-center opacity-50"><Star className="h-3 w-3 inline-block" /></div>
            <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleHeaderClick("kind")}>
                Name {sortKey === 'kind' && <ArrowUpDown className="h-2 w-2" />}
            </div>
            <div className="cursor-pointer hover:text-foreground flex items-center justify-end gap-1" onClick={() => handleHeaderClick("created_at")}>
                Date {sortKey === 'created_at' && <ArrowUpDown className="h-2 w-2" />}
            </div>
            <div className="cursor-pointer hover:text-foreground flex items-center justify-end gap-1" onClick={() => handleHeaderClick("size")}>
                Size {sortKey === 'size' && <ArrowUpDown className="h-2 w-2" />}
            </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
            {processedArtifacts.map((a) => {
                const isSelected = a.artifact_id === selectedArtifactId;
                const isPinned = a.pinned ?? false;
                
                return (
                    <div 
                        key={a.artifact_id}
                        onClick={() => selectRunArtifact(runId, a.artifact_id)}
                        className={cn(
                            "group grid grid-cols-[28px_1fr_85px_65px] gap-2 px-3 py-2.5 border-b border-border/40 cursor-pointer text-xs transition-colors",
                            isSelected ? "bg-muted/80" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {/* Col 1: Pin Button */}
                        <div className="flex items-start justify-center pt-0.5 relative z-10">
                            <button
                                onClick={(e) => handlePinClick(e, a, !isPinned)}
                                className={cn(
                                    "transition-all hover:scale-110 focus:outline-none p-0.5 rounded-sm",
                                    isPinned ? "text-amber-400 opacity-100" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted"
                                )}
                                title={isPinned ? "Unpin" : "Pin to top"}
                            >
                                <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                            </button>
                        </div>

                        {/* Col 2: Icon + Name + Mime + Tags */}
                        <div className="flex items-start gap-2.5 min-w-0">
                            <div className="mt-0.5">{getFileIcon(a.mime_type || "")}</div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className={cn("font-medium truncate", isSelected ? "text-foreground" : "text-foreground/90")} title={a.kind}>
                                    {a.kind}
                                </span>
                                
                                <div className="flex items-center gap-2 text-[9px] mt-0.5 min-w-0">
                                    <span className="opacity-60 truncate shrink-0 max-w-[80px]" title={a.mime_type || "unknown"}>
                                        {a.mime_type || "—"}
                                    </span>
                                    {a.tags && a.tags.length > 0 && (
                                        <div className="flex gap-1 min-w-0 overflow-hidden">
                                            {a.tags.slice(0, 2).map((t) => (
                                                <span 
                                                    key={t} 
                                                    className="inline-block truncate px-1 rounded-[2px] bg-foreground/5 text-foreground/70 border border-foreground/5 max-w-[60px]"
                                                    title={t}
                                                >
                                                    #{t}
                                                </span>
                                            ))}
                                            {a.tags.length > 2 && <span className="opacity-50">+{a.tags.length - 2}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Col 3: Date */}
                        <div className="flex items-center justify-end text-[10px] tabular-nums opacity-70 truncate">
                            {new Date(a.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>

                        {/* Col 4: Size */}
                        <div className="flex items-center justify-end text-[10px] font-mono tabular-nums opacity-70 truncate">
                            {formatSize(a.size)}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* RIGHT PANE: Preview */}
      <div className="flex flex-col min-h-0 flex-1 bg-background">
         <ArtifactPreview artifact={selectedArtifact} />
      </div>
    </div>
  );
};