import * as React from "react";
import { useShellStore } from "../../store/shellStore";
import type { ArtifactMeta } from "../../lib/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import {
  Star,
  StarOff,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { getArtifactContentUrl, fetchArtifactTextContent } from "../../lib/api";
import { ArtifactPreview } from "./ArtifactPreview";

const EMPTY_ARTIFACTS: ArtifactMeta[] = [];

interface RunArtifactsPanelProps {
  runId: string;
}

type SortKey = "kind" | "mime_type" | "size" | "created_at";
type SortDir = "asc" | "desc";

export const RunArtifactsPanel: React.FC<RunArtifactsPanelProps> = ({ runId }) => {
  const loadRunArtifacts = useShellStore((s) => s.loadRunArtifacts);
  const selectRunArtifact = useShellStore((s) => s.selectRunArtifact);
  const pinArtifact = useShellStore((s) => s.pinArtifact);

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

  // --- Sorting state ---
  const [sortKey, setSortKey] = React.useState<SortKey>("created_at");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

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

  // --- Derived: sorted artifacts ---
  const sortedArtifacts = React.useMemo(() => {
    if (!artifacts || artifacts.length === 0) return artifacts;

    const copy = [...artifacts];

    copy.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      const get = (art: ArtifactMeta, key: SortKey) => {
        switch (key) {
          case "kind":
            return (art.kind ?? "").toLowerCase();
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

      // numeric compare for size/created_at, string compare for others
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

  const handleRowClick = (artifact: ArtifactMeta) => {
    selectRunArtifact(runId, artifact.artifact_id);
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


  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No artifacts recorded yet for this run.
      </div>
    );
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Artifacts for <span className="font-mono">{runId}</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          {artifacts.length} item{artifacts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="border rounded-md overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Table */}
        <div className="border-b">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium w-7"></th>
                {renderSortableHeader("Kind", "kind")}
                {renderSortableHeader("Mime", "mime_type")}
                {renderSortableHeader("Size", "size")}
                <th className="px-3 py-2 font-medium">Tags</th>
                {renderSortableHeader("Created", "created_at")}
                <th className="px-3 py-2 font-medium w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedArtifacts.map((a) => {
                const isSelected = a.artifact_id === selectedArtifactId;
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
                      <span className="font-mono text-[11px]">{a.kind}</span>
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
            </tbody>
          </table>
        </div>

        {/* Preview */}
        <div className="flex-1 min-h-0">
          <ArtifactPreview artifact={selectedArtifact} />
        </div>
      </div>
    </div>
  );
};
