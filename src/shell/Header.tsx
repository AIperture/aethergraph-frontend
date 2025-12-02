import * as React from "react";
import { Button } from "../components/ui/button";
import { Command, LogIn, Github } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="shrink-0 flex items-center justify-between h-14 px-4 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 text-brand border border-brand/20 shadow-sm">
          <Command className="w-4 h-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-foreground tracking-tight">
            AIperture
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            AetherGraph Orchestrator
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-[10px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">ENV:</span>
          <span className="font-mono text-foreground opacity-80">local</span>
        </div>

        <div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Github className="w-4 h-4" />
        </Button>

        <Button variant="default" size="sm" className="h-8 text-xs gap-2 px-3">
          <LogIn className="w-3.5 h-3.5" />
          Sign in
        </Button>
      </div>
    </header>
  );
};