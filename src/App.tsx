// src/App.tsx
import * as React from "react";
import { Routes, Route } from "react-router-dom";

import AppShell from "./shell/AppShell";

// Pages
import DashboardPage from "./routes/DashboardPage";
import AppGalleryPage from "./routes/AppGalleryPage";
import PresetRunnerPage from "./routes/PresetRunnerPage";
import RunWorkspacePage from "./routes/RunWorkspacePage";
import RunLaunchPage from "./routes/RunLaunchPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* ✅ Dashboard is the home / holistic overview */}
        <Route index element={<DashboardPage />} />

        {/* ✅ App gallery lives under /apps */}
        <Route path="apps" element={<AppGalleryPage />} />

        {/* ✅ Individual preset page (for starting new runs later) */}
        <Route path="apps/:appId" element={<PresetRunnerPage />} />

        <Route path="/apps/:appId/run" element={<RunLaunchPage />} />



        {/* ✅ Run workspace with tabs (overview / artifacts / memory / chat) */}
        <Route path="runs/:runId" element={<RunWorkspacePage />} />
      </Route>
    </Routes>
  );
};

export default App;
