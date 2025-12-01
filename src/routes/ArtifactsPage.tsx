// src/routes/ArtifactsPage.tsx
import * as React from "react";
import { useShellStore } from "../store/shellStore";
import type { ArtifactMeta } from "../lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { getArtifactContentUrl } from "../lib/api";
import { ArtifactPreview } from "../components/run/ArtifactPreview"; // factor this out as exported

import {
    Star,
    StarOff,
    ExternalLink,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
} from "lucide-react";

const EMPTY_ARTIFACTS: ArtifactMeta[] = [];
type SortKey = "kind" | "scope_id" | "mime_type" | "size" | "created_at";
type SortDir = "asc" | "desc";

const ArtifactsPage: React.FC = () => {
    const loadGlobalArtifacts = useShellStore((s) => s.loadGlobalArtifacts);
    const getGlobalArtifacts = useShellStore((s) => s.getGlobalArtifacts);
    const artifacts = getGlobalArtifacts() ?? EMPTY_ARTIFACTS;

    const selectedGlobalArtifactId = useShellStore((s) => s.selectedGlobalArtifactId);
    const selectGlobalArtifact = useShellStore((s) => s.selectGlobalArtifact);
    const pinArtifact = useShellStore((s) => s.pinArtifact);

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

    React.useEffect(() => {
        // initial load: no filters
        void handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatSize = (bytes: number | null) => {
        if (!bytes || bytes <= 0) return "—";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleRowClick = (artifact: ArtifactMeta) => {
        selectGlobalArtifact(artifact.artifact_id);
    };

    const handlePinClick = async (
        e: React.MouseEvent,
        artifact: ArtifactMeta,
        pinned: boolean
    ) => {
        e.stopPropagation();
        try {
            await pinArtifact(artifact.artifact_id, pinned);
        } catch (err) {
            console.error("Failed to pin artifact", err);
        }
    };

    const sortedArtifacts = React.useMemo(() => {
        if (!artifacts || artifacts.length === 0) return artifacts;

        const copy = [...artifacts];
        copy.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;

            const get = (art: ArtifactMeta, key: SortKey) => {
                switch (key) {
                    case "kind":
                        return (art.kind ?? "").toLowerCase();
                    case "scope_id":
                        return (art.scope_id ?? "").toLowerCase();
                    case "mime_type":
                        return (art.mime_type ?? "").toLowerCase();
                    case "size":
                        return art.size ?? 0;
                    case "created_at":
                        return new Date(art.created_at).getTime();
                }
            };

            const va = get(a, sortKey);
            const vb = get(b, sortKey);

            if (typeof va === "number" && typeof vb === "number") {
                if (va === vb) return 0;
                return va < vb ? -1 * dir : 1 * dir;
            }

            const sa = String(va);
            const sb = String(vb);
            if (sa === sb) return 0;
            return sa < sb ? -1 * dir : 1 * dir;
        });

        return copy;
    }, [artifacts, sortKey, sortDir]);

    const handleHeaderClick = (key: SortKey) => {
        if (sortKey === key) {
            // same column → toggle direction
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            // new column → set key, start with ascending
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const renderSortableHeader = (label: string, key: SortKey, extraClass = "") => {
        const isActive = sortKey === key;

        const icon = !isActive ? (
            <ChevronsUpDown className="h-3 w-3 opacity-60" />
        ) : sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
        ) : (
            <ChevronDown className="h-3 w-3" />
        );

        return (
            <th className={cn("px-3 py-2 font-medium", extraClass)}>
                <button
                    type="button"
                    onClick={() => handleHeaderClick(key)}
                    className={cn(
                        "inline-flex items-center gap-1 text-[11px]",
                        "hover:text-foreground cursor-pointer",
                        isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}
                >
                    <span>{label}</span>
                    {icon}
                </button>
            </th>
        );
    };

    return (
        <div className="h-full bg-background">
            <div className="h-full max-w-6xl mx-auto px-4 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-foreground">Artifacts</h1>
                </div>

                {/* Filters */}
                <Card className="shadow-[var(--ag-shadow-soft)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Search</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="block text-[11px] text-muted-foreground">
                                    Scope ID (e.g. run id)
                                </label>
                                <input
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    value={scopeId}
                                    onChange={(e) => setScopeId(e.target.value)}
                                    placeholder="scope-id or run-id"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] text-muted-foreground">
                                    Kind
                                </label>
                                <input
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    value={kind}
                                    onChange={(e) => setKind(e.target.value)}
                                    placeholder="e.g. plot, log, report"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] text-muted-foreground">
                                    Tags (comma-separated)
                                </label>
                                <input
                                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="tag1,tag2"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-[11px] text-muted-foreground">
                                Showing {artifacts.length} item
                                {artifacts.length === 1 ? "" : "s"}
                            </div>
                            <div className="flex items-center gap-2">
                                {error && (
                                    <div className="text-[11px] text-red-500">
                                        Error: {error}
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    {loading ? "Loading…" : "Search"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results + Preview */}
                <Card className="shadow-[var(--ag-shadow-soft)] h-[480px]">
                    <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
                        {/* Table */}
                        <div className="md:w-2/3 h-1/2 md:h-full overflow-hidden flex flex-col">
                            <div className="border-b bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                                Global artifacts
                            </div>
                            <div className="flex-1 min-h-0 overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 border-b">
                                        <tr className="text-left text-muted-foreground">
                                            <th className="px-3 py-2 w-7"></th>
                                            {renderSortableHeader("Kind", "kind")}
                                            {renderSortableHeader("Scope", "scope_id")}
                                            {renderSortableHeader("Mime", "mime_type")}
                                            {renderSortableHeader("Size", "size")}
                                            <th className="px-3 py-2">Tags</th>
                                            {renderSortableHeader("Created", "created_at")}
                                            <th className="px-3 py-2 w-[90px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedArtifacts.map((a) => {
                                            const isSelected = a.artifact_id === selectedGlobalArtifactId;
                                            return (
                                                <tr
                                                    key={a.artifact_id}
                                                    onClick={() => handleRowClick(a)}
                                                    className={cn(
                                                        "border-b last:border-b-0 hover:bg-muted/40 cursor-pointer",
                                                        isSelected && "bg-muted/60"
                                                    )}
                                                >
                                                    <td className="px-3 py-1.5">
                                                        <button
                                                            className="inline-flex items-center"
                                                            onClick={(e) =>
                                                                handlePinClick(e, a, !(a.pinned ?? false))
                                                            }
                                                            aria-label={a.pinned ? "Unpin" : "Pin"}
                                                        >
                                                            {a.pinned ? (
                                                                <Star className="h-3 w-3 fill-current" />
                                                            ) : (
                                                                <StarOff className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <span className="font-mono text-[11px]">
                                                            {a.kind}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-muted-foreground">
                                                        {a.scope_id || "—"}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-muted-foreground">
                                                        {a.mime_type || "—"}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-muted-foreground">
                                                        {formatSize(a.size)}
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {a.tags?.map((t) => (
                                                                <Badge
                                                                    key={t}
                                                                    variant="outline"
                                                                    className="text-[10px] px-1.5 py-0"
                                                                >
                                                                    {t}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-muted-foreground">
                                                        {new Date(a.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 px-2 text-[11px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(
                                                                    getArtifactContentUrl(a.artifact_id),
                                                                    "_blank",
                                                                    "noopener,noreferrer"
                                                                );
                                                            }}
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            Open
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {artifacts.length === 0 && !loading && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="px-3 py-4 text-center text-xs text-muted-foreground"
                                                >
                                                    No artifacts found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="md:w-1/3 h-1/2 md:h-full">
                            <ArtifactPreview artifact={selectedArtifact} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ArtifactsPage;
