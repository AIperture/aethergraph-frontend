// src/components/run/RunChannelPanel.tsx
import * as React from "react";
import { useChannelStore } from "../../store/channelStore";
import type { RunChannelEvent } from "../../lib/types";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";

interface RunChannelPanelProps {
  runId: string;
}

const EMPTY_EVENTS: RunChannelEvent[] = [];

const SendIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const FileIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export const RunChannelPanel: React.FC<RunChannelPanelProps> = ({ runId }) => {
  const messages = useChannelStore(
    React.useCallback(
      (s) => s.messagesByRunId[runId] || EMPTY_EVENTS,
      [runId],
    ),
  );

  const sendMessage = useChannelStore((s) => s.sendMessage);
  const markRead = useChannelStore((s) => s.markRead);
  const pollMs = 1500;

  const [input, setInput] = React.useState("");

  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  // Polling loop
  React.useEffect(() => {
    if (!runId) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const fetchNewEvents = useChannelStore.getState().fetchNewEvents;
        await fetchNewEvents(runId);
      } catch (err) {
        console.error("Failed to fetch channel events for run", runId, err);
      }
    };

    void tick();
    const id = window.setInterval(tick, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [runId, pollMs]);

  // Mark read when viewing this panel
  React.useEffect(() => {
    if (!runId) return;
    markRead(runId);
  }, [runId, markRead]);

  // Auto-scroll to bottom when new messages come in
  React.useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, runId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    await sendMessage(runId, text);
    setInput("");
  };

  const renderEvent = (ev: RunChannelEvent) => {
    const hasButtons = (ev.buttons?.length ?? 0) > 0;

    // "Approval-like" events (session.* with buttons)
    const isApproval = ev.type.startsWith("session.") && hasButtons;

    const isSystem =
      (ev.type.startsWith("session.") && !hasButtons) ||
      ev.type === "agent.progress.update";
    const isAgent =
      isApproval ||
      ev.type.startsWith("agent.") ||
      ev.type.startsWith("link.");
    const isUser =
      ev.type === "user.message" ||
      ev.meta?.direction === "inbound" ||
      ev.meta?.role === "user";

    const timestamp = Number.isFinite(ev.ts)
      ? new Date(ev.ts * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    // 1. Plain system chip (non-interactive)
    if (isSystem) {
      return (
        <div
          key={ev.id}
          className="my-3 flex justify-center animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <div className="rounded-full border border-border/20 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground/60">
            {ev.text || ev.type}
          </div>
        </div>
      );
    }

    // 2. Chat bubbles (agent / user / approval)
    const label = isApproval
      ? "System"
      : isUser
        ? "You"
        : isAgent
          ? "Agent"
          : "Event";

    const wrapperClass = cn(
      "mb-3 flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start",
    );

    const bubbleClass = cn(
      "relative max-w-[85%] overflow-hidden rounded-2xl border px-3 py-2 text-xs shadow-sm",
      isUser
        ? "rounded-tr-sm border-brand bg-brand text-white"
        : "rounded-tl-sm border-border/60 bg-background text-foreground",
    );

    return (
      <div key={ev.id} className={wrapperClass}>
        <div className={bubbleClass}>
          {/* Header */}
          <div className="mb-1 flex items-center justify-between gap-4 text-[10px] opacity-70">
            <span className="font-semibold tracking-tight">{label}</span>
            {timestamp && (
              <span className="font-mono text-[9px] opacity-80">
                {timestamp}
              </span>
            )}
          </div>

          {/* Text */}
          {ev.text && (
            <div
              className={cn(
                "break-words whitespace-pre-wrap leading-relaxed [word-break:break-word]",
                isUser ? "text-white/95" : "text-foreground/90",
              )}
            >
              {ev.text}
            </div>
          )}

          {/* Buttons for approvals, etc. */}
          {hasButtons && (
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-1">
              {ev.buttons!.map((b, idx) => (
                <Button
                  key={`${ev.id}-btn-${idx}`}
                  size="sm"
                  variant={isUser ? "secondary" : "outline"}
                  className={cn(
                    "h-6 px-2 text-[10px] transition-all hover:scale-105 active:scale-95",
                    isUser
                      ? "border-transparent bg-white/20 text-white hover:bg-white/30"
                      : "bg-transparent",
                  )}
                  onClick={() =>
                    sendMessage(runId, b.value || b.label || "")
                  }
                >
                  {b.label ?? b.value ?? "Action"}
                </Button>
              ))}
            </div>
          )}

          {/* File attachment */}
          {ev.file && (
            <div
              className={cn(
                "mt-2 flex max-w-full items-center gap-1.5 rounded border px-2 py-1 text-[10px]",
                isUser
                  ? "border-white/20 bg-white/10"
                  : "border-border/50 bg-muted/50",
              )}
            >
              <span className="shrink-0">
                <FileIcon />
              </span>
              {ev.file.url ? (
                <a
                  href={ev.file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate break-all underline underline-offset-2 hover:opacity-80"
                >
                  {ev.file.name ?? "Attachment"}
                </a>
              ) : (
                <span className="truncate break-all">
                  {ev.file.name ?? "file"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* 🔴 removed overflow-hidden here */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-background shadow-sm">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
              Live Channel
            </span>
          </div>
          <div className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
            ID: {runId.slice(0, 8)}
          </div>
        </div>

        {/* Messages area wrapper so ScrollArea can shrink properly */}
        <div className="flex min-h-0 flex-1">
          <ScrollArea className="h-full w-full bg-muted/5">
            <div className="flex flex-col px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                  <p className="text-sm">No activity yet</p>
                  <p className="mt-1 text-[11px]">
                    Events will appear here automatically
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-1">
                  {messages.map(renderEvent)}
                  {/* anchor for auto-scroll */}
                  <div ref={bottomRef} className="h-1" />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-background p-3">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1 shadow-sm transition-all focus-within:ring-1 focus-within:ring-ring"
          >
            <input
              className="flex-1 bg-transparent px-2 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none"
              placeholder="Type a message to run..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-7 w-7 shrink-0 rounded-sm"
              variant={input.trim() ? "default" : "ghost"}
            >
              <SendIcon />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
