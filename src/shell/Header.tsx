// src/shell/Header.tsx
import * as React from "react";
import { Button } from "../components/ui/button";

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-brand shadow-[var(--ag-shadow-soft)]" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            AIperture · AetherGraph
          </span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Demo Shell
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
          ENV:{" "}
          <span className="font-mono text-brand-light">
            local
          </span>
        </span>
        <Button variant="accent" size="sm">
          Sign in
        </Button>
      </div>
    </header>
  );
};
