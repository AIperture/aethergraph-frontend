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
    // Use h-screen + overflow-hidden to force the app to fill the viewport exactly.
    // This allows inner components (like Sidebar and PaneLayout) to handle their own scrolling.
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground text-sm antialiased">
      
      {/* Sidebar stays fixed on the left */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Header stays fixed at the top */}
        <Header />
        
        {/* Content area fills remaining space */}
        <div className="flex-1 min-h-0 relative">
          {/* PaneLayout provides the structure for the page content */}
          <PaneLayout center={<Outlet />} />
        </div>

        {/* Overlays */}
        <Toaster />
        <RunsPollingBridge />
        <ChannelHud />
      </div>
    </div>
  );
};

export default AppShell;