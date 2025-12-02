// src/shell/AppShell.tsx
import * as React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { PaneLayout } from "./PaneLayout";
import { Toaster } from "../components/ui/sonner";
import { RunsPollingBridge } from "../components/shell/RunsPollingBridge";
import { ChannelHud } from "../components/shell/ChannelHud";

const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground text-[13px]">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="flex-1">
          {/* For now we put the routed page into the center pane */}
          <PaneLayout center={<Outlet />} />
        </div>
        {/* Global toaster for notifications */}
        <Toaster />
        {/* Runs polling bridge */}
        <RunsPollingBridge />
        <ChannelHud />
      </div>
    </div>
  );
};

export default AppShell;
