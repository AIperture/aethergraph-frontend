// src/components/run/RunMemoryPanel.tsx
import * as React from "react";
import { useShellStore } from "../../store/shellStore";
import type {
  MemoryEvent,
  MemorySummaryEntry,
  MemorySearchHit,
} from "../../lib/types";

import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface RunMemoryPanelProps {
  scopeId: string; // convention: run_id
}

export const RunMemoryPanel: React.FC<RunMemoryPanelProps> = ({ scopeId }) => {
  const loadMemoryForScope = useShellStore((s) => s.loadMemoryForScope);
  const getEvents = useShellStore((s) => s.getMemoryEvents);
  const getSummaries = useShellStore((s) => s.getMemorySummaries);
  const searchMemory = useShellStore((s) => s.searchMemory);
  const getHits = useShellStore((s) => s.getMemorySearchHits);

  const events = getEvents(scopeId) ?? [];
  const summaries = getSummaries(scopeId) ?? [];
  const hits = getHits(scopeId) ?? [];

  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    if (!scopeId) return;
    loadMemoryForScope(scopeId).catch((err) =>
      console.error("Failed to load memory", err),
    );
  }, [scopeId, loadMemoryForScope]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      await searchMemory(scopeId, query);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3 lg:p-4">
      {/* Header + search */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Memory for scope{" "}
            <span className="font-mono text-xs">{scopeId}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Hotlog events, long-term summaries, and semantic search for this
            run&apos;s memory scope.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 text-xs"
        >
          <Input
            className="h-8 w-40 text-xs md:w-56"
            placeholder="Search memory…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] hover:bg-muted/70"
            disabled={isSearching}
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      {/* Body: 2 columns, scrollable panes */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.5fr,1.2fr]">
        {/* Left: recent events */}
        <div className="flex min-h-0 flex-col rounded-md border border-border/60 bg-background/40 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Recent events
            </span>
            <span className="text-[11px] text-muted-foreground">
              {events.length} item{events.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-auto text-xs">
            {events.length === 0 ? (
              <div className="text-[11px] text-muted-foreground">
                No events recorded for this scope.
              </div>
            ) : (
              events.map((evt: MemoryEvent) => (
                <div
                  key={evt.event_id}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {evt.kind}
                      </Badge>
                      {evt.tags?.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-1 text-[10px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(evt.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-foreground">
                    {typeof evt.data?.text === "string"
                      ? evt.data.text
                      : JSON.stringify(evt.data)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: summaries + search hits */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Summaries */}
          <div className="flex min-h-0 flex-1 flex-col rounded-md border border-border/60 bg-background/40 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Long-term summaries
              </span>
              <span className="text-[11px] text-muted-foreground">
                {summaries.length} summary
                {summaries.length === 1 ? "" : "ies"}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-auto text-xs">
              {summaries.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">
                  No summaries yet. Distillers will populate this over time.
                </div>
              ) : (
                summaries.map((s: MemorySummaryEntry) => (
                  <div
                    key={s.summary_id}
                    className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {s.summary_tag}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-3 text-xs text-foreground">
                      {s.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Search hits */}
          <div className="flex min-h-0 flex-1 flex-col rounded-md border border-border/60 bg-background/40 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Search hits
              </span>
              <span className="text-[11px] text-muted-foreground">
                {hits.length} result{hits.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-auto text-xs">
              {hits.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">
                  No hits yet. Try a keyword like <code>metalens</code>.
                </div>
              ) : (
                hits.map((h: MemorySearchHit, idx) => {
                  const label = h.event ? "Event" : "Summary";
                  const text =
                    h.event && h.event.data
                      ? (h.event.data["text"] as string) ??
                        JSON.stringify(h.event.data)
                      : h.summary?.text ?? "";

                  return (
                    <div
                      key={`${label}-${idx}`}
                      className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            score {h.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 line-clamp-3 text-xs text-foreground">
                        {text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
