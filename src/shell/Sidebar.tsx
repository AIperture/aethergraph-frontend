import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { useChannelStore } from "../store/channelStore";
import { useShellStore } from "../store/shellStore";
import { 
  LayoutDashboard, 
  Grid, 
  Package, 
  Layers, 
  Hash, 
  ChevronRight,
  Settings,
  MoreHorizontal
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const presets = useShellStore((s) => s.presets);
  const location = useLocation();

  const isOnDashboard = location.pathname === "/";
  const isOnAppsRoot = location.pathname === "/apps";
  const isOnArtifacts = location.pathname === "/artifacts";

  const runs = useShellStore((s) => s.runs);
  const unreadByRunId = useChannelStore((s) => s.unreadByRunId);
  const messagesByRunId = useChannelStore((s) => s.messagesByRunId);

  // Helper to detect active preset by path, e.g. /apps/metalens-design
  const activeAppId =
    location.pathname.startsWith("/apps/") && location.pathname.split("/")[2]
      ? location.pathname.split("/")[2]
      : null;

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border/60 bg-muted/5 text-foreground h-full">
      
      {/* Scrollable Nav Area */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        
        {/* Main Navigation */}
        <div className="space-y-1">
          <Link
            to="/"
            className={cn(
              "group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isOnDashboard 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            Dashboard
          </Link>
          <Link
            to="/apps"
            className={cn(
              "group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isOnAppsRoot 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Grid className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            App Gallery
          </Link>
          <Link
            to="/artifacts"
            className={cn(
              "group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isOnArtifacts 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Package className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            Artifacts
          </Link>
        </div>

        {/* Presets Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Installed Apps
            </span>
          </div>
          <ul className="space-y-0.5">
            {presets.map((app) => {
              const isActive = activeAppId === app.id;
              return (
                <li key={app.id}>
                  <Link
                    to={`/apps/${app.id}`} // Default to run tab
                    className={cn(
                      "group flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Layers className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-brand" : "text-muted-foreground/50")} />
                        <span className="truncate">{app.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Channels Section */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Active Channels
            </span>
            <span className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 rounded-full">
                {runs.filter((r) => messagesByRunId[r.run_id]?.length).length}
            </span>
          </div>
          <ul className="space-y-0.5">
            {runs
              .filter((r) => messagesByRunId[r.run_id]?.length) // Only show active channels
              .slice(0, 8) // Limit list size
              .map((r) => {
                const unread = unreadByRunId[r.run_id] ?? 0;
                const shortId = r.run_id.slice(0, 6);
                
                // Active state check logic relies on URL parsing or exact match
                const isActive = location.pathname.includes(r.run_id) && location.search.includes("tab=channel");

                return (
                  <li key={r.run_id}>
                    <Link
                      to={`/runs/${r.run_id}?tab=channel`}
                      className={cn(
                        "group flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all",
                        isActive 
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Hash className="w-3 h-3 opacity-50 shrink-0" />
                        <span className="truncate font-mono opacity-90">run-{shortId}</span>
                      </div>
                      
                      {unread > 0 && (
                        <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-brand text-[9px] font-bold text-white shadow-sm">
                          {unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              
              {runs.filter((r) => messagesByRunId[r.run_id]?.length).length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground/50 italic">
                      No active chats
                  </div>
              )}
          </ul>
        </div>
      </nav>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-border/60 bg-muted/10">
        <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-accent/50 transition-colors text-left group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-600 shadow-sm" />
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground group-hover:text-brand transition-colors">Admin User</div>
                <div className="text-[10px] text-muted-foreground truncate">admin@aether.local</div>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
        </button>
      </div>
    </aside>
  );
};