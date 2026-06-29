"use client";

import { DashboardSidebar } from "@/components/Sidebar";
import { RightCompanionPanel } from "@/components/RightCompanionPanel";
import { GridCanvas } from "@/components/GridCanvas";

export function Dashboard() {
  return (
    <div className="dashboard-frame">
      <div className="dashboard-canvas" aria-hidden="true" />
      <DashboardSidebar />
      <main className="dashboard-main">
        <div className="dashboard-main-surface">
          <GridCanvas />
        </div>
      </main>
      <RightCompanionPanel />
    </div>
  );
}
