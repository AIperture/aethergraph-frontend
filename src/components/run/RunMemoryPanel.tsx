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
      console.error("Failed to load memory", err)
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
    <div className="p-4 space-y-4">
      {/* Header + scope info */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Memory for scope <span className="font-mono">{scopeId}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Recent events (hotlog) and long-term summaries. This is where AG’s
            memory services surface for a given run or session.
          </p>
        </div>

        {/* Simple search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            className="h-8 w-40 md:w-56 text-xs"
            placeholder="Search memory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="text-xs px-2 py-1 rounded-md border border-border bg-muted hover:bg-muted/70"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Layout: left = events, right = summaries + search hits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent events */}
        <div className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-foreground">
              Recent events
            </span>
            <span className="text-[11px] text-muted-foreground">
              {events.length} item{events.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No events recorded for this scope.
              </div>
            ) : (
              events.map((evt: MemoryEvent) => (
                <div
                  key={evt.event_id}
                  className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {evt.kind}
                      </Badge>
                      {evt.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1 rounded-full bg-muted text-muted-foreground"
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

        {/* Right column: summaries + search hits */}
        <div className="space-y-3">
          {/* Summaries */}
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">
                Long-term summaries
              </span>
              <span className="text-[11px] text-muted-foreground">
                {summaries.length} summary
                {summaries.length === 1 ? "" : "ies"}
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {summaries.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  No summaries yet. Distillers will populate this over time.
                </div>
              ) : (
                summaries.map((s: MemorySummaryEntry) => (
                  <div
                    key={s.summary_id}
                    className="rounded-md border border-border/60 bg-muted/40 px-2 py-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {s.summary_tag}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-foreground line-clamp-3">
                      {s.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Search hits */}
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">
                Search hits
              </span>
              <span className="text-[11px] text-muted-foreground">
                {hits.length} result{hits.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {hits.length === 0 ? (
                <div className="text-xs text-muted-foreground">
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
                      <div className="mt-1 text-xs text-foreground line-clamp-3">
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
