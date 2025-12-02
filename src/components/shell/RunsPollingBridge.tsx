// src/components/shell/RunsPollingBridge.tsx
import * as React from "react";
import { useRunsPolling } from "../../hooks/useRunsPolling"; 

export const RunsPollingBridge: React.FC = () => {
  useRunsPolling(4000); // 4s is fine for demo; tweak as needed
  return null;
};
