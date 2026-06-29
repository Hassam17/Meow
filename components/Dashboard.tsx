"use client";

import { GridCanvas } from "@/components/GridCanvas";

export function Dashboard() {
  return (
    <div className="dashboard-frame">
      <div className="dashboard-canvas" aria-hidden="true" />
      <main className="dashboard-main">
        <div className="dashboard-main-surface">
          <GridCanvas />
        </div>
      </main>
    </div>
  );
}
