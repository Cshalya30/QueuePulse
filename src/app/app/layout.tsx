"use client";

import React, { useState } from "react";
import { AppRail } from "@/components/layout/app-rail";
import { AppTopbar } from "@/components/layout/app-topbar";
import { DemoScenarioController } from "@/components/demo/demo-scenario-controller";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Left Navigation Rail */}
      <AppRail />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppTopbar onOpenScenarioModal={() => setIsScenarioModalOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-7">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Guided Demo Scenario Modal */}
      <DemoScenarioController
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
      />
    </div>
  );
}
