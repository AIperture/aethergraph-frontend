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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    await sendMessage(runId, text);
    setInput("");
  };

  const renderEvent = (ev: RunChannelEvent) => {
    const isSystem =
      ev.type.startsWith("session.") || ev.type === "agent.progress.update";
    const isAgent =
      ev.type.startsWith("agent.") || ev.type.startsWith("link.");
    const isUser =
      ev.type === "user.message" ||
      ev.meta?.direction === "inbound" ||
      ev.meta?.role === "user";

    const label = isUser
      ? "user"
      : isSystem
        ? "system"
        : isAgent
          ? "agent"
          : "event";

    const wrapperClass = cn(
      "mb-2 flex",
      isUser ? "justify-end" : "justify-start",
    );

    const bubbleClass = cn(
      "max-w-[80%] rounded-md px-2 py-1 text-xs shadow-sm",
      isUser ? "bg-brand text-white" : "bg-muted text-foreground",
    );

    const headerClass = cn(
      "mb-0.5 text-[10px] opacity-80",
      isUser ? "text-white/80 text-right" : "text-muted-foreground",
    );

    const bodyClass = cn(
      "whitespace-pre-wrap",
      isUser ? "text-white" : "text-foreground",
    );

    return (
      <div key={ev.id} className={wrapperClass}>
        <div className={bubbleClass}>
          <div className={headerClass}>
            <span className="font-semibold">{label}</span> ·{" "}
            <span>
              {Number.isFinite(ev.ts)
                ? new Date(ev.ts * 1000).toLocaleTimeString()
                : ""}
            </span>
          </div>

          {ev.text && <div className={bodyClass}>{ev.text}</div>}

          {ev.buttons && ev.buttons.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {ev.buttons.map((b, idx) => (
                <Button
                  key={`${ev.id}-btn-${idx}`}
                  size="sm"
                  variant={isUser ? "secondary" : "outline"}
                  className="h-6 px-2 text-[11px]"
                  onClick={() =>
                    sendMessage(runId, b.value || b.label || "")
                  }
                >
                  {b.label ?? b.value ?? "Button"}
                </Button>
              ))}
            </div>
          )}

          {ev.file && (
            <div className="mt-1 text-[11px] opacity-80">
              📎{" "}
              {ev.file.url ? (
                <a
                  href={ev.file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {ev.file.name ?? ev.file.url}
                </a>
              ) : (
                <span>{ev.file.name ?? "file"}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[360px] flex-col lg:h-[420px]">
      <div className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-md border border-border/60 bg-background/40">
        {/* Small header bar inside the pane */}
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="font-medium uppercase tracking-wide">
            Run channel
          </div>
          <div className="font-mono text-[10px]">
            # ui-run-{runId.slice(0, 6)}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 h-full px-3 py-2">
          {messages.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">
              No channel events yet. When this run asks for input or sends
              messages, they will appear here.
            </div>
          ) : (
            <div className="space-y-2">{messages.map(renderEvent)}</div>
          )}
        </ScrollArea>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border/60 bg-muted/40 px-2 py-1.5"
        >
          <input
            className={cn(
              "flex-1 rounded border bg-transparent px-2 py-1 text-xs",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-brand",
            )}
            placeholder="Send a message to this run…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" size="sm" className="text-xs">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
