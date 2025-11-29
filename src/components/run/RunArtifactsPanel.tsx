// src/components/run/RunArtifactsPanel.tsx
import * as React from "react";
import { useShellStore } from "../../store/shellStore";
import type { ArtifactMeta } from "../../lib/types";
import { Badge } from "../ui/badge";

interface RunArtifactsPanelProps {
  runId: string;
}

export const RunArtifactsPanel: React.FC<RunArtifactsPanelProps> = ({ runId }) => {
  const loadRunArtifacts = useShellStore((s) => s.loadRunArtifacts);
  const selectArtifacts = useShellStore((s) => s.getRunArtifacts);

  const artifacts = selectArtifacts(runId);

  React.useEffect(() => {
    if (!runId) return;
    loadRunArtifacts(runId).catch((err) =>
      console.error("Failed to load artifacts", err)
    );
  }, [runId, loadRunArtifacts]);

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
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Artifacts for <span className="font-mono">{runId}</span>
        </h2>
        <span className="text-xs text-muted-foreground">
          {artifacts.length} item{artifacts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Mime</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((a: ArtifactMeta) => (
              <tr
                key={a.artifact_id}
                className="border-b last:border-b-0 hover:bg-muted/40"
              >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
