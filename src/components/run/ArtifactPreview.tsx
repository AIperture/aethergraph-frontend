import React from "react";
import { ExternalLink } from "lucide-react";
import { getArtifactContentUrl, fetchArtifactTextContent } from "../../lib/api";
import type { ArtifactMeta } from "@/lib/types";
    

interface ArtifactPreviewProps {
  artifact: ArtifactMeta | null;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact }) => {
  const [content, setContent] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const mime = artifact?.mime_type ?? "";
  const uri = artifact?.uri ?? "";
  const kindLower = (artifact?.kind ?? "").toLowerCase();
  const ext = React.useMemo(
    () => (uri ? uri.split(".").pop()?.toLowerCase() ?? "" : ""),
    [uri]
  );

  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);

  const isTextLike =
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime.endsWith("+json") ||
    ["txt", "log", "md", "markdown", "json", "csv"].includes(ext) ||
    ["log", "text", "stdout", "stderr"].some((k) => kindLower.includes(k));

  React.useEffect(() => {
    // reset on artifact change
    setContent(null);
    setError(null);

    if (!artifact || !isTextLike) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchArtifactTextContent(artifact.artifact_id)
      .then((txt) => {
        if (!cancelled) setContent(txt);
      })
      .catch((err: any) => {
        if (!cancelled) setError(String(err?.message ?? err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [artifact?.artifact_id, isTextLike]);

  if (!artifact) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        Select an artifact to preview.
      </div>
    );
  }

  return (
    <div className="p-3 h-full flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center justify-between text-xs">
        <div>
          <div className="font-mono text-[11px]">{artifact.kind}</div>
          <div className="text-muted-foreground">
            {mime || "application/octet-stream"}
          </div>
        </div>
        <a
          href={getArtifactContentUrl(artifact.artifact_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] underline text-muted-foreground hover:text-foreground"
        >
          Download raw  <ExternalLink className="inline-block h-3 w-3 ml-1" />
        </a>
      </div>

      <div className="border rounded-md flex-1 min-h-0 overflow-auto bg-muted/40">
        {isImage && (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={getArtifactContentUrl(artifact.artifact_id)} // click the link triggers backend download
              alt={artifact.kind}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        {isTextLike && (
          <div className="p-3 font-mono text-[11px] whitespace-pre-wrap break-all">
            {loading && (
              <div className="text-muted-foreground">Loading…</div>
            )}
            {error && <div className="text-red-500">Error: {error}</div>}
            {!loading && !error && (content ?? "No content")}
          </div>
        )}

        {!isImage && !isTextLike && (
          <div className="p-3 text-xs text-muted-foreground">
            No inline preview for this type. Use{" "}
            <span className="font-mono">Download raw</span> to open it.
          </div>
        )}
      </div>
    </div>
  );
};
