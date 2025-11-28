// src/shell/AppShell.tsx
import * as React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { PaneLayout } from "./PaneLayout";

const AppShell: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <div className="flex-1">
          {/* For now we put the routed page into the center pane */}
          <PaneLayout center={<Outlet />} />
        </div>
      </div>
    </div>
  );
};

export default AppShell;
