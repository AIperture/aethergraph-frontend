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
      [runId]
    )
  );
  const sendMessage = useChannelStore((s) => s.sendMessage);
  const markRead = useChannelStore((s) => s.markRead);

  const [input, setInput] = React.useState("");
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  // 🔔 mark messages as read whenever we're viewing this panel & messages change
  React.useEffect(() => {
    if (!runId) return;
    markRead(runId);
  }, [runId, messages.length, markRead]);

  // 🔽 auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (!viewportRef.current) return;
    const el = viewportRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

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
      isUser ? "justify-end" : "justify-start"
    );

    const bubbleClass = cn(
      "rounded-md px-2 py-1 max-w-[80%] shadow-sm",
      isUser ? "bg-brand text-white" : "bg-muted text-foreground"
    );

    const headerClass = cn(
      "text-[10px] mb-0.5 opacity-80",
      isUser ? "text-white/80 text-right" : "text-muted-foreground"
    );

    const bodyClass = cn(
      "text-xs whitespace-pre-wrap",
      isUser ? "text-white" : "text-foreground"
    );

    return (
      <div key={ev.id} className={wrapperClass}>
        <div className={bubbleClass}>
          <div className={headerClass}>
            <span className="font-semibold">{label}</span>{" "}
            <span>·</span>{" "}
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
    <div className="flex flex-col h-[420px] min-h-0">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Run Channel
        </div>
        <div className="text-[11px] text-muted-foreground">
          # ui-run-{runId.slice(0, 6)}
        </div>
      </div>

      <div className="border rounded-md flex-1 flex flex-col overflow-hidden min-h-0">
        <ScrollArea className="flex-1 h-full p-3">
          <div ref={viewportRef}>
            {messages.length === 0 ? (
              <div className="text-[11px] text-muted-foreground">
                No channel events yet. When this run asks for input or sends
                messages, they will appear here.
              </div>
            ) : (
              <div className="space-y-2">{messages.map(renderEvent)}</div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSend}
          className="border-t bg-muted/40 flex items-center gap-2 px-2 py-1.5"
        >
          <input
            className={cn(
              "flex-1 text-xs bg-transparent px-2 py-1 rounded border",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-brand"
            )}
            placeholder="Send a message to this run..."
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
