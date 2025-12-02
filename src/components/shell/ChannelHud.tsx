import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useShellStore } from "../../store/shellStore";
import { useChannelStore } from "../../store/channelStore";
import type { RunSummary } from "../../lib/types";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

// Small helper: label for a run (preset name > graph_id > short run_id)
function getRunLabel(
  run: RunSummary,
  getPresetByGraphId: (id: string | undefined) => any
) {
  const preset = getPresetByGraphId(run.graph_id);
  if (preset?.name) return preset.name;
  if (run.graph_id) return run.graph_id;
  return run.run_id.slice(0, 8);
}

export const ChannelHud: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const runs = useShellStore((s) => s.runs);
  const getPresetByGraphId = useShellStore((s) => s.getPresetByGraphId);

  const getUnreadForRun = useChannelStore((s) => s.getUnreadForRun);
  const markRead = useChannelStore((s) => s.markRead);

  const [open, setOpen] = React.useState(false);

  // Compute unread per run
  const unreadRuns = React.useMemo(() => {
    if (!runs || runs.length === 0) return [];

    const withUnread = runs
      .map((run) => {
        const unread = getUnreadForRun(run.run_id);
        return { run, unread };
      })
      .filter((e) => e.unread > 0);

    // Sort by most recent activity desc
    withUnread.sort((a, b) => {
      const ta =
        (a.run.finished_at
          ? new Date(a.run.finished_at).getTime()
          : a.run.started_at
          ? new Date(a.run.started_at).getTime()
          : 0) || 0;
      const tb =
        (b.run.finished_at
          ? new Date(b.run.finished_at).getTime()
          : b.run.started_at
          ? new Date(b.run.started_at).getTime()
          : 0) || 0;
      return tb - ta;
    });

    return withUnread;
  }, [runs, getUnreadForRun]);

  const totalUnread = React.useMemo(
    () => unreadRuns.reduce((sum, e) => sum + e.unread, 0),
    [unreadRuns]
  );

  // Close HUD automatically when there are no unread messages anymore
  React.useEffect(() => {
    if (totalUnread === 0 && open) {
      setOpen(false);
    }
  }, [totalUnread, open]);

  // Optional: close panel on route change
  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // If nothing unread, render nothing.
  if (totalUnread === 0) {
    return null;
  }

  const handleOpenRun = (runId: string) => {
    // Optimistically mark as read
    markRead(runId);
    // Navigate to Channel tab
    navigate(`/runs/${runId}?tab=channel`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
      {/* Collapsed bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5",
            "bg-brand text-white shadow-lg shadow-black/20",
            "hover:bg-brand/90 transition-colors text-[11px]"
          )}
        >
          <MessageCircle className="h-3 w-3" />
          <span>
            {totalUnread} new message{totalUnread > 1 ? "s" : ""}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="pointer-events-auto w-72 rounded-xl border border-border bg-popover shadow-xl shadow-black/20 text-xs overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/60">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3 text-brand" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-foreground">
                  Channel activity
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {totalUnread} unread message
                  {totalUnread > 1 ? "s" : ""} in {unreadRuns.length} run
                  {unreadRuns.length > 1 ? "s" : ""}.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted"
                aria-label="Collapse"
              >
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-auto px-2 py-2 space-y-1.5">
            {unreadRuns.slice(0, 6).map(({ run, unread }) => {
              const label = getRunLabel(run, getPresetByGraphId);
              const shortId = run.run_id.slice(0, 8);

              return (
                <div
                  key={run.run_id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                  onClick={() => handleOpenRun(run.run_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground truncate text-[11px]">
                        {label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({shortId})
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {run.status === "running"
                        ? "Run is running"
                        : run.status === "pending"
                        ? "Run is pending"
                        : `Run is ${run.status}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] px-2 py-0.5">
                      {unread}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRun(run.run_id);
                      }}
                    >
                      Open channel
                    </Button>
                  </div>
                </div>
              );
            })}

            {unreadRuns.length > 6 && (
              <div className="text-[10px] text-muted-foreground px-1 pt-1">
                + {unreadRuns.length - 6} more run
                {unreadRuns.length - 6 > 1 ? "s" : ""} with unread messages
              </div>
            )}
          </div>

          <div className="border-t border-border/60 px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground bg-muted/40">
            <span>New messages arrive via global polling.</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ChevronUp className="h-3 w-3" />
              <span>Hide</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
