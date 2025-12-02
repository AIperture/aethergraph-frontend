// src/shell/PaneLayout.tsx
import * as React from "react";
import { cn } from "../lib/utils"; // shadcn usually generates this

interface PaneLayoutProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const PaneLayout: React.FC<PaneLayoutProps> = ({ left, center, right }) => {
  return (
    <div className="flex h-full">
      {left && (
        <aside className="hidden md:flex w-72 border-r border-border bg-card">
          <div className="flex-1 overflow-y-auto p-4">{left}</div>
        </aside>
      )}
      <main className={cn("flex-1 flex flex-col", right ? "md:flex-row" : "")}>
        <section
          className={cn(
            "flex-1 overflow-y-auto",
            right && "md:border-r border-border"
          )}
        >
          {/* Add a centered, padded content container */}
          <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
            {center}
          </div>
        </section>
        {right && (
          <aside className="w-full md:w-80 border-l border-border bg-card">
            <div className="h-full overflow-y-auto p-4">{right}</div>
          </aside>
        )}
      </main>
    </div>
  );
};
