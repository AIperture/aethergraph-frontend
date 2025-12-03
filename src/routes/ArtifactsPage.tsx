import * as React from "react";
import { useShellStore } from "../store/shellStore";
import type { ArtifactMeta } from "../lib/types";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { ArtifactPreview } from "../components/run/ArtifactPreview";

import {
  Star,
  Search,
  ArrowUpDown,
  Filter,
  FileText,
  Image as ImageIcon,
  FileJson,
  FileCode,
  File,
  Loader2,
  X
} from "lucide-react";

const EMPTY_ARTIFACTS: ArtifactMeta[] = [];
type SortKey = "kind" | "scope_id" | "mime_type" | "size" | "created_at";
type SortDir = "asc" | "desc";

// --- Helpers ---
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

const ArtifactsPage: React.FC = () => {
    const loadGlobalArtifacts = useShellStore((s) => s.loadGlobalArtifacts);
    
    // FIX: Subscribe directly to the result of getGlobalArtifacts() 
    // This ensures the component re-renders when the data changes (e.g. after pinning)
    const artifacts = useShellStore((s) => s.getGlobalArtifacts() ?? EMPTY_ARTIFACTS);

    const selectedGlobalArtifactId = useShellStore((s) => s.selectedGlobalArtifactId);
    const selectGlobalArtifact = useShellStore((s) => s.selectGlobalArtifact);
    const pinArtifact = useShellStore((s) => s.pinArtifact);

    // Force update trigger to handle in-place updates
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

    // Filters
    const [scopeId, setScopeId] = React.useState<string>("");
    const [kind, setKind] = React.useState<string>("");
    const [tags, setTags] = React.useState<string>("");

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
    const [sortDir, setSortDir] = React.useState<SortDir>("desc");

    const selectedArtifact = React.useMemo(
        () => artifacts.find((a) => a.artifact_id === selectedGlobalArtifactId) ?? null,
        [artifacts, selectedGlobalArtifactId]
    );

    const handleSearch = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await loadGlobalArtifacts({
                scopeId: scopeId.trim() || undefined,
                kind: kind.trim() || undefined,
                tags: tags.trim() || undefined,
            });
        } catch (err: any) {
            console.error("Failed to load global artifacts", err);
            setError(String(err?.message ?? err));
        } finally {
            setLoading(false);
        }
    }, [loadGlobalArtifacts, scopeId, kind, tags]);

    // Initial load
    React.useEffect(() => {
        void handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePinClick = async (
        e: React.MouseEvent,
        artifact: ArtifactMeta,
        pinned: boolean
    ) => {
        e.preventDefault(); // Prevent default button behavior
        e.stopPropagation(); // Stop row selection
        try {
            await pinArtifact(artifact.artifact_id, pinned);
            forceUpdate(); // Fix for UI not updating immediately
        } catch (err) {
            console.error("Failed to pin artifact", err);
        }
    };

    const handleHeaderClick = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortedArtifacts = React.useMemo(() => {
        if (!artifacts || artifacts.length === 0) return artifacts;

        const copy = [...artifacts];
        copy.sort((a, b) => {
            // Always float pinned to top
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

            const dir = sortDir === "asc" ? 1 : -1;
            const get = (art: ArtifactMeta, key: SortKey) => {
                switch (key) {
                    case "kind": return (art.kind ?? "").toLowerCase();
                    case "scope_id": return (art.scope_id ?? "").toLowerCase();
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

        return copy;
    }, [artifacts, sortKey, sortDir, forceUpdate]); // Added forceUpdate as dependency to re-sort

    const clearFilters = () => {
        setScopeId("");
        setKind("");
        setTags("");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 w-full max-w-[1800px] mx-auto p-4 md:p-6">
            
            {/* 1. Header & Filters */}
            <div className="shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">Global Artifacts</h1>
                        <p className="text-xs text-muted-foreground">Browse and search output files across all runs.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {error && <span className="text-xs text-red-500 mr-2">{error}</span>}
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={handleSearch} 
                            disabled={loading}
                            className="h-8 px-4 text-xs"
                        >
                            {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            Refresh Data
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-2 p-1 bg-muted/40 rounded-lg border border-border/40">
                    <div className="flex-1 flex items-center gap-2 px-2 bg-background border border-border/50 rounded-md focus-within:ring-1 focus-within:ring-ring transition-all">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input 
                            className="flex-1 h-8 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                            placeholder="Filter by Kind (e.g. 'report', 'plot')..."
                            value={kind}
                            onChange={(e) => setKind(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2 bg-background border border-border/50 rounded-md focus-within:ring-1 focus-within:ring-ring transition-all">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <input 
                            className="flex-1 h-8 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                            placeholder="Filter by Tags (comma separated)..."
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <div className="flex-1 flex items-center gap-2 px-2 bg-background border border-border/50 rounded-md focus-within:ring-1 focus-within:ring-ring transition-all">
                        <span className="text-[10px] font-mono text-muted-foreground">ID:</span>
                        <input 
                            className="flex-1 h-8 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 font-mono"
                            placeholder="Scope / Run ID..."
                            value={scopeId}
                            onChange={(e) => setScopeId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    {(scopeId || kind || tags) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFilters} title="Clear filters">
                            <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleSearch} disabled={loading}>
                        Search
                    </Button>
                </div>
            </div>

            {/* 2. Main Content (Split Pane) */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/60 border border-border/60 rounded-lg bg-background overflow-hidden shadow-sm">
                
                {/* LEFT: Artifact List */}
                <div className="flex flex-col min-h-0 lg:w-[50%] bg-muted/5">
                    {/* List Header */}
                    <div className="grid grid-cols-[28px_1fr_100px_85px_65px] gap-2 px-3 py-2 border-b border-border/40 bg-background text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                         <div className="text-center opacity-50"><Star className="h-3 w-3 inline-block" /></div>
                         
                         <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleHeaderClick("kind")}>
                            Name {sortKey === 'kind' && <ArrowUpDown className="h-2 w-2" />}
                         </div>
                         
                         <div className="cursor-pointer hover:text-foreground flex items-center gap-1" onClick={() => handleHeaderClick("scope_id")}>
                            Scope {sortKey === 'scope_id' && <ArrowUpDown className="h-2 w-2" />}
                         </div>

                         <div className="cursor-pointer hover:text-foreground flex items-center justify-end gap-1" onClick={() => handleHeaderClick("created_at")}>
                            Date {sortKey === 'created_at' && <ArrowUpDown className="h-2 w-2" />}
                         </div>
                         
                         <div className="cursor-pointer hover:text-foreground flex items-center justify-end gap-1" onClick={() => handleHeaderClick("size")}>
                            Size {sortKey === 'size' && <ArrowUpDown className="h-2 w-2" />}
                         </div>
                    </div>

                    {/* Scrollable Rows */}
                    <div className="flex-1 overflow-y-auto">
                        {sortedArtifacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-60">
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-xs">Loading artifacts...</span>
                                    </div>
                                ) : (
                                    <>
                                        <File className="h-8 w-8 mb-2 stroke-1" />
                                        <p className="text-xs">No artifacts found matching filters.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            sortedArtifacts.map((a) => {
                                const isSelected = a.artifact_id === selectedGlobalArtifactId;
                                const isPinned = a.pinned ?? false;

                                return (
                                    <div 
                                        key={a.artifact_id}
                                        onClick={() => selectGlobalArtifact(a.artifact_id)}
                                        className={cn(
                                            "group grid grid-cols-[28px_1fr_100px_85px_65px] gap-2 px-3 py-2.5 border-b border-border/40 cursor-pointer text-xs transition-colors",
                                            isSelected ? "bg-muted/80" : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {/* Pin */}
                                        <div className="flex items-start justify-center pt-0.5 relative z-10">
                                            <button
                                                onClick={(e) => handlePinClick(e, a, !isPinned)}
                                                className={cn(
                                                    "transition-all hover:scale-110 focus:outline-none p-0.5 rounded-sm",
                                                    isPinned ? "text-amber-400 opacity-100" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
                                            </button>
                                        </div>

                                        {/* Name + Tags */}
                                        <div className="flex items-start gap-2.5 min-w-0">
                                            <div className="mt-0.5">{getFileIcon(a.mime_type || "")}</div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className={cn("font-medium truncate", isSelected ? "text-foreground" : "text-foreground/90")} title={a.kind}>
                                                    {a.kind}
                                                </span>
                                                <div className="flex items-center gap-2 text-[9px] mt-0.5 min-w-0">
                                                    <span className="opacity-60 truncate shrink-0 max-w-[60px]">{a.mime_type || "—"}</span>
                                                    {a.tags && a.tags.length > 0 && (
                                                        <div className="flex gap-1 min-w-0 overflow-hidden">
                                                            {a.tags.slice(0, 2).map((t) => (
                                                                <span key={t} className="inline-block truncate px-1 rounded-[2px] bg-foreground/5 text-foreground/70 border border-foreground/5 max-w-[50px]">{t}</span>
                                                            ))}
                                                            {a.tags.length > 2 && <span className="opacity-50">+{a.tags.length - 2}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scope (Run ID) */}
                                        <div className="flex items-center min-w-0">
                                            <Badge variant="secondary" className="font-mono text-[9px] h-4 px-1 rounded-[3px] truncate max-w-full hover:bg-muted-foreground/20">
                                                {a.scope_id ? a.scope_id.slice(0, 8) : "—"}
                                            </Badge>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center justify-end text-[10px] tabular-nums opacity-70 truncate">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </div>

                                        {/* Size */}
                                        <div className="flex items-center justify-end text-[10px] font-mono tabular-nums opacity-70 truncate">
                                            {formatSize(a.size)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT: Preview */}
                {/* Added min-w-0 to prevent expansion on large content */}
                <div className="flex flex-col min-h-0 flex-1 bg-background min-w-0">
                    <ArtifactPreview artifact={selectedArtifact} />
                </div>
            </div>
        </div>
    );
};

export default ArtifactsPage;