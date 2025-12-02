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
import { cn } from "../../lib/utils";

interface RunMemoryPanelProps {
  scopeId: string; // convention: run_id
}

// --- Icons ---
const SearchIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const BrainIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);
const ClockIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const TagIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94 .94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
);

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
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border shadow-sm bg-background">
        
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-4 py-2.5">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                 <div className="p-1.5 rounded-md bg-brand/10 text-brand">
                    <BrainIcon />
                 </div>
                 <span className="text-xs font-semibold text-foreground/80 tracking-wide uppercase">
                    Memory Scope
                 </span>
             </div>
             <div className="h-4 w-px bg-border/60" />
             <div className="font-mono text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                {scopeId}
            </div>
          </div>

          {/* Integrated Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-1 focus-within:ring-ring shadow-sm"
          >
             <SearchIcon />
            <input
              className="w-32 bg-transparent px-1.5 py-0.5 text-xs placeholder:text-muted-foreground/50 focus:outline-none md:w-48"
              placeholder="Search context..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isSearching && <span className="text-[10px] text-muted-foreground animate-pulse">...</span>}
          </form>
        </div>

        {/* Main Body */}
        <div className="flex min-h-0 flex-1 md:flex-row flex-col divide-y md:divide-y-0 md:divide-x divide-border/60 bg-muted/5">
            
            {/* LEFT PANE: Recent Events */}
            <div className="flex flex-col min-h-0 md:w-1/2 lg:w-[55%]">
                <div className="shrink-0 border-b border-border/40 bg-muted/30 px-3 py-2 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider">Recent Events</span>
                    <span className="bg-background border border-border/50 px-1.5 rounded-full">{events.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs opacity-60">
                            <ClockIcon />
                            <span className="mt-2">No events recorded</span>
                        </div>
                    ) : (
                        events.map((evt: MemoryEvent) => (
                            <div key={evt.event_id} className="group relative rounded-lg border border-border/60 bg-card p-3 shadow-sm hover:border-border transition-colors">
                                <div className="mb-2 flex items-start justify-between">
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono text-muted-foreground">
                                            {evt.kind}
                                        </Badge>
                                        <div className="flex flex-wrap gap-1">
                                            {evt.tags?.map((t) => (
                                                <div key={t} className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                                    <TagIcon />
                                                    {t}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                                        {new Date(evt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                    </span>
                                </div>
                                <div className="text-[11px] leading-relaxed text-card-foreground/90 whitespace-pre-wrap font-mono">
                                    {typeof evt.data?.text === "string" ? evt.data.text : JSON.stringify(evt.data)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Summaries & Hits */}
            <div className="flex flex-col min-h-0 md:w-1/2 lg:w-[45%] bg-background">
                
                {/* Top Half: Summaries */}
                <div className="flex flex-col min-h-0 flex-1 border-b border-border/60">
                    <div className="shrink-0 border-b border-border/40 bg-muted/30 px-3 py-2 flex justify-between items-center text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <BrainIcon />
                            <span className="font-semibold uppercase tracking-wider">Long-term Summaries</span>
                        </div>
                        <span className="bg-background border border-border/50 px-1.5 rounded-full">{summaries.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                         {summaries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-20 text-muted-foreground text-[10px] opacity-60">
                                <span>No summaries generated yet</span>
                            </div>
                         ) : (
                            summaries.map((s: MemorySummaryEntry) => (
                                <div key={s.summary_id} className="rounded-md border border-border/60 bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase tracking-wider">
                                            {s.summary_tag}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground">
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] leading-snug text-foreground/90 line-clamp-4">
                                        {s.text}
                                    </p>
                                </div>
                            ))
                         )}
                    </div>
                </div>

                {/* Bottom Half: Search Hits */}
                <div className="flex flex-col min-h-0 flex-1 bg-muted/5">
                    <div className="shrink-0 border-b border-border/40 bg-muted/30 px-3 py-2 flex justify-between items-center text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <SearchIcon />
                            <span className="font-semibold uppercase tracking-wider">Semantic Hits</span>
                        </div>
                        <span className="bg-background border border-border/50 px-1.5 rounded-full">{hits.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {hits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-20 text-muted-foreground text-[10px] opacity-50">
                                {query ? "No results found" : "Enter a search term above"}
                            </div>
                        ) : (
                            hits.map((h: MemorySearchHit, idx) => {
                                const isEvent = !!h.event;
                                const text = isEvent 
                                    ? (typeof h.event?.data?.text === 'string' ? h.event.data.text : JSON.stringify(h.event?.data))
                                    : h.summary?.text;
                                
                                return (
                                    <div key={idx} className="rounded-md border border-brand/20 bg-brand/5 px-2 py-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] font-semibold text-brand uppercase tracking-wider">
                                                {isEvent ? "Event Hit" : "Summary Hit"}
                                            </span>
                                            <span className="text-[9px] font-mono text-muted-foreground">
                                                score: {h.score.toFixed(3)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-foreground/80 line-clamp-2">
                                            {text}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};