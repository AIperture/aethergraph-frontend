// src/shell/Sidebar.tsx
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useShellStore } from "../store/shellStore";

export const Sidebar: React.FC = () => {
  const presets = useShellStore((s) => s.presets);
  const location = useLocation();

  const isOnDashboard = location.pathname === "/";
  const isOnAppsRoot = location.pathname === "/apps";

  // Helper to detect active preset by path, e.g. /apps/metalens-design
  const activeAppId =
    location.pathname.startsWith("/apps/") && location.pathname.split("/")[2]
      ? location.pathname.split("/")[2]
      : null;

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Apps & Presets
        </div>
      </div>

      {/* Top links */}
      <div className="px-3 py-2 space-y-1 text-xs">
        <Link
          to="/"
          className={cn(
            "block px-2 py-1 rounded-md hover:bg-sidebar-accent/60",
            isOnDashboard && "bg-sidebar-accent text-sidebar-foreground"
          )}
        >
          Dashboard
        </Link>
        <Link
          to="/apps"
          className={cn(
            "block px-2 py-1 rounded-md hover:bg-sidebar-accent/60",
            isOnAppsRoot && "bg-sidebar-accent text-sidebar-foreground"
          )}
        >
          Apps
        </Link>
      </div>

      {/* Content */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Presets */}
        <div>
          <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Presets
          </div>
          <ul className="space-y-1">
            {presets.map((app) => {
              const isActive = activeAppId === app.id;

              return (
                <li key={app.id}>
                  <Link
                    to={`/apps/${app.id}`}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm",
                      "flex items-center justify-between gap-2 transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground border border-sidebar-border"
                        : "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground text-muted-foreground"
                    )}
                  >
                    <span>{app.name}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full border",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground border-transparent"
                          : "bg-muted text-muted-foreground border-border/60"
                      )}
                    >
                      {app.badge}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Channels (still mock for now) */}
        <div>
          <div className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Channels
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="px-3 py-1 rounded-md hover:bg-sidebar-accent/50 cursor-default">
              # lab-rnd-session-1
            </li>
            <li className="px-3 py-1 rounded-md hover:bg-sidebar-accent/50 cursor-default">
              # demo-metalens
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border text-[11px] text-muted-foreground">
        <div>v0.0.1 · local</div>
        <div className="text-muted-foreground/80">AG Shell prototype</div>
      </div>
    </aside>
  );
};
