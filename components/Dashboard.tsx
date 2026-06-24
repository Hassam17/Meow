"use client";

import { DashboardSidebar } from "@/components/Sidebar";
import { RightCompanionPanel } from "@/components/RightCompanionPanel";
import { GridCanvas } from "@/components/GridCanvas";

export function Dashboard() {
  return (
    <div className="dashboard-frame">
      <DashboardSidebar />
      <main className="dashboard-main">
        <GridCanvas />
      </main>
      <RightCompanionPanel />
    </div>
  );
}
