import * as React from "react";
import { cn } from "../lib/utils";

interface PaneLayoutProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const PaneLayout: React.FC<PaneLayoutProps> = ({ left, center, right }) => {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      
      {/* Left Sidebar (Navigation/Context) */}
      {left && (
        <aside className="hidden md:flex w-64 lg:w-72 flex-col border-r border-border/60 bg-muted/5 shrink-0">
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 min-h-0">
            {left}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex flex-1 flex-col min-w-0 min-h-0", 
        right ? "lg:flex-row" : ""
      )}>
        
        {/* Center Panel (The Workspace) */}
        <section className="flex-1 overflow-y-auto min-h-0 relative scroll-smooth">
          {/* Updated max-w to 1600px to match the Dashboard/RunWorkspace density.
             Added min-h-full to ensure bg colors stretch if needed.
          */}
          <div className="w-full max-w-[1600px] mx-auto px-4 py-4 md:px-6 md:py-6 min-h-full flex flex-col">
            {center}
          </div>
        </section>

        {/* Right Sidebar (Details/Inspectors) */}
        {right && (
          <aside className="w-full lg:w-80 xl:w-96 flex-col border-t lg:border-t-0 lg:border-l border-border/60 bg-muted/5 shrink-0">
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 min-h-0">
              {right}
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};