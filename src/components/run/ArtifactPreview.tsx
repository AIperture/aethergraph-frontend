import React from "react";
import { ExternalLink, Download, FileText, Code, Maximize2 } from "lucide-react";
import { getArtifactContentUrl, fetchArtifactTextContent } from "../../lib/api";
import type { ArtifactMeta } from "../../lib/types"; 
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

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
    ["txt", "log", "md", "markdown", "json", "csv", "js", "ts", "py"].includes(ext) ||
    ["log", "text", "stdout", "stderr", "code"].some((k) => kindLower.includes(k));

  React.useEffect(() => {
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-2">
        <Maximize2 className="h-8 w-8 stroke-1" />
        <p className="text-xs">Select a file to preview</p>
      </div>
    );
  }

  const downloadUrl = getArtifactContentUrl(artifact.artifact_id);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
            <div className="h-3 w-px bg-border/60 mx-1" />
            <span className="font-mono text-xs text-foreground truncate max-w-[200px]" title={artifact.kind}>
                {artifact.kind}
            </span>
        </div>
        
        <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(downloadUrl, "_blank")}
        >
            <Download className="h-3 w-3" />
            Download
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto bg-muted/10 p-4 w-full">
        {isImage && (
          <div className="flex items-center justify-center min-h-full w-full">
            <div className="relative rounded-lg border border-border shadow-sm overflow-hidden bg-[url('https://transparenttextures.com/patterns/subtle-grey.png')] bg-white/50 max-w-full">
                <img
                    src={downloadUrl}
                    alt={artifact.kind}
                    className="max-h-[60vh] max-w-full object-contain"
                />
            </div>
          </div>
        )}

        {isTextLike && (
          <div className="relative min-h-full w-full max-w-full">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-md">
                <span className="text-xs text-muted-foreground animate-pulse">Loading content...</span>
              </div>
            )}
            
            {error ? (
               <div className="p-4 rounded border border-red-200 bg-red-50 text-red-600 text-xs dark:bg-red-900/10 dark:border-red-900/30">
                 Error loading content: {error}
               </div>
            ) : (
                <div className="rounded-md border border-border/60 bg-card shadow-sm overflow-hidden w-full max-w-full">
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 border-b border-border/40 text-[10px] text-muted-foreground font-mono">
                         <Code className="h-3 w-3" />
                         <span>Source Viewer</span>
                    </div>
                    
                    {/* Wrap PRE in a div with overflow-x-auto to contain wide text */}
                    <div className="overflow-x-auto w-full">
                        <pre className="p-3 text-[11px] font-mono leading-relaxed text-foreground/90 tabular-nums">
                            {content || <span className="opacity-50 italic">Empty file</span>}
                        </pre>
                    </div>
                </div>
            )}
          </div>
        )}

        {!isImage && !isTextLike && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
             <div className="p-3 rounded-full bg-muted/50">
                <FileText className="h-8 w-8 opacity-50" />
             </div>
             <div className="text-center">
                <p className="text-xs font-medium text-foreground">No preview available</p>
                <p className="text-[10px] mt-1">Binary or unsupported file type.</p>
             </div>
             <Button variant="outline" size="sm" className="h-7 text-xs gap-2" onClick={() => window.open(downloadUrl, "_blank")}>
                <ExternalLink className="h-3 w-3" />
                Open External
             </Button>
          </div>
        )}
      </div>
    </div>
  );
};