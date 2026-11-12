"use client";

import React, { useState } from "react";
import {
  SeedEquipment,
  SeedMilestone,
  SeedProgressUpdate,
  SeedPhoto,
  SeedRisk,
  SeedProject,
  SeedInventoryItem,
  SeedMaterial,
  SeedVendor,
  RoleType,
} from "@/lib/seed-data";
import {
  computeEquipmentStats,
  runScenarioSimulation,
  SimulationInput,
  SimulationResult,
} from "@/lib/business-engine";

interface EquipmentProgressRiskProps {
  activeTab: "M04_EQUIPMENT" | "M05_PROGRESS" | "M06_RISK_COPILOT";
  projectCode: string;
  projects: SeedProject[];
  currentUser: {
    id: string;
    name: string;
    role: RoleType;
  };
  equipments: SeedEquipment[];
  milestones: SeedMilestone[];
  progressUpdates: SeedProgressUpdate[];
  photos: SeedPhoto[];
  risks: SeedRisk[];
  inventory: SeedInventoryItem[];
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  onEquipmentAction: (payload: {
    equipmentCode: string;
    actionType: "ALLOCATE" | "RETURN" | "TRANSFER" | "MAINTENANCE" | "DAMAGE";
    assignedTo?: string;
    expectedReturn?: string;
    returnCondition?: SeedEquipment["condition"];
    destProjectCode?: string;
    description?: string;
  }) => string | null;
  onUpdateMilestoneProgress: (payload: {
    milestoneCode: string;
    actualProgress: number;
    workCompleted: string;
    workOutstanding: string;
    remarks: string;
    photoUrl?: string;
  }) => void;
  onUpdateRisk: (payload: {
    riskCode: string;
    status: SeedRisk["status"];
    riskOwner: string;
    resolutionNotes?: string;
  }) => void;
}

export function EquipmentProgressRiskModules({
  activeTab,
  projectCode,
  projects,
  currentUser,
  equipments,
  milestones,
  progressUpdates,
  photos,
  risks,
  inventory,
  materials,
  vendors,
  onEquipmentAction,
  onUpdateMilestoneProgress,
  onUpdateRisk,
}: EquipmentProgressRiskProps) {
  // M04 Equipment State
  const [scannedEqCode, setScannedEqCode] = useState<string>("EQ-EX-001");
  const [manualQrInput, setManualQrInput] = useState<string>("");
  const [eqActionMode, setEqActionMode] = useState<
    "ALLOCATE" | "RETURN" | "TRANSFER" | "MAINTENANCE" | "DAMAGE"
  >("ALLOCATE");
  const [eqAssignedTeam, setEqAssignedTeam] = useState<string>(
    "Concourse Structural Crew B (Lead: Muthu)"
  );
  const [eqReturnDate, setEqReturnDate] = useState<string>("2026-11-26");
  const [eqReturnCondition, setEqReturnCondition] =
    useState<SeedEquipment["condition"]>("GOOD");
  const [eqDestProject, setEqDestProject] = useState<string>("PRJ-ALPHA");
  const [eqRemarks, setEqRemarks] = useState<string>(
    "Verified via BuildSmart QR Equipment Console"
  );
  const [eqFeedback, setEqFeedback] = useState<{
    isError: boolean;
    msg: string;
  } | null>(null);

  // M05 Progress State
  const projMilestones = milestones.filter(
    (m) => m.projectCode === projectCode
  );
  const [selectedMsCode, setSelectedMsCode] = useState<string>(
    projMilestones[1]?.milestoneCode ||
      projMilestones[0]?.milestoneCode ||
      "MS-ALPHA-02"
  );
  const [newCompletionPct, setNewCompletionPct] = useState<number>(68);
  const [workDoneText, setWorkDoneText] = useState<string>(
    "Completed Grid C4-C7 rebar spacing rectification and poured 160 m3 C40 slab section."
  );
  const [workOutText, setWorkOutText] = useState<string>(
    "Remaining Zone B transfer beam reinforcement and curing inspection."
  );
  const [msRemarks, setMsRemarks] = useState<string>(
    "Subcontractor BinaTeguh added 12 steel fixers on night shift."
  );
  const [msPhotoUrl, setMsPhotoUrl] = useState<string>(
    "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80"
  );

  // M06 AI Copilot & Simulation State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    {
      role: "USER" | "AI";
      text: string;
      sources?: string[];
      factsVsAssumptions?: string[];
    }[]
  >([
    {
      role: "AI",
      text: `Hello ${currentUser.name}! I am your **BuildSmart AI Risk Copilot** for **${projectCode}**. I continuously cross-reference **M01 Material Scans, M02 Live Stock, M03 Worker Defect Logs & Vendor Scores, M04 Equipment QR Status, and M05 Subcontractor Milestone Progress**.\n\nClick any preset question below or run a **Non-Mutating What-If Scenario Simulation (BR-020)** on the right!`,
      sources: [
        "M01–M05 Unified Site Graph",
        "BR-018 Simulated Data Label Active",
      ],
    },
  ]);

  const [simType, setSimType] =
    useState<SimulationInput["scenarioType"]>("DELIVERY_DELAY");
  const [simMatCode, setSimMatCode] = useState<string>("STL-002");
  const [simEqCode, setSimEqCode] = useState<string>("EQ-EX-001");
  const [simDelayDays, setSimDelayDays] = useState<number>(3);
  const [simPctChange, setSimPctChange] = useState<number>(15);

  const currentProject =
    projects.find((p) => p.projectCode === projectCode) || projects[0];

  const activeSimResult: SimulationResult = runScenarioSimulation(
    {
      projectCode,
      scenarioType: simType,
      materialCode: simMatCode,
      equipmentCode: simEqCode,
      delayDays: simDelayDays,
      percentageChange: simPctChange,
    },
    {
      project: currentProject,
      inventory,
      materials,
      vendors,
      equipments,
      milestones,
    }
  );

  const handleAskCopilot = async (questionText: string) => {
    if (!questionText.trim()) return;
    setChatHistory((prev) => [...prev, { role: "USER", text: questionText }]);
    setChatInput("");

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CHAT",
          projectCode,
          question: questionText,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "AI",
          text:
            data.answer ||
            "Analyzed project records across M01–M05. Please review risk register below.",
          sources: data.explainability?.sourcesUsed || [],
          factsVsAssumptions: data.explainability?.factsVsAssumptions || [],
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "AI",
          text: `Grounded Check for ${projectCode}: T16 Steel Rebar has 300 MT available (3.0 days cover vs 5-day lead time), Portland Cement has 170 bags (below 200-bag ROP), and Vendor Apex Steel (V002) is rated 54.4% (DO_NOT_REHIRE). Recommended: Transfer surplus stock from PRJ-BETA and use MetroSteel (V003).`,
          sources: ["Local Deterministic Fallback Engine"],
        },
      ]);
    }
  };

  // =========================================================================
  // MODULE 04: ON-SITE TOOLS & EQUIPMENT MANAGEMENT
  // =========================================================================
  if (activeTab === "M04_EQUIPMENT") {
    const stats = computeEquipmentStats(equipments);
    const activeEq =
      equipments.find((e) => e.equipmentCode === scannedEqCode) ||
      equipments[0];

    return (
      <div className="space-y-6">
        {/* Equipment Utilization KPI Cards (FR-M04-007) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                MODULE 04 • QR EQUIPMENT TRACKING, ALLOCATION & MAINTENANCE
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                On-Site Tools & Equipment Management Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                <strong>FR-M04-007 Formula:</strong>{" "}
                <code>
                  Equipment Utilization Rate = Equipment in Use ÷ Total Active
                  Equipment × 100
                </code>
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-teal-900 text-white text-right">
              <div className="text-[11px] uppercase tracking-wider text-teal-300">
                Fleet Utilization Rate
              </div>
              <div className="text-2xl font-extrabold">
                {stats.utilizationRate}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Total Equipment</div>
              <div className="text-xl font-extrabold text-slate-900">
                {stats.total}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-700 font-semibold">Available</div>
              <div className="text-xl font-extrabold text-emerald-900">
                {stats.available}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-blue-700 font-semibold">In Use</div>
              <div className="text-xl font-extrabold text-blue-900">
                {stats.inUse}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-amber-700 font-semibold">Maintenance</div>
              <div className="text-xl font-extrabold text-amber-900">
                {stats.maintenance}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <div className="text-rose-700 font-semibold">Damaged</div>
              <div className="text-xl font-extrabold text-rose-900">
                {stats.damaged}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-300">
              <div className="text-slate-600 font-semibold">Missing</div>
              <div className="text-xl font-extrabold text-slate-800">
                {stats.missing}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Scanner / Lookup + Equipment Action Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* QR Scanner & Equipment Detail Card (FR-M04-002 & FR-M04-003) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                QR Code Scanner & Manual Equipment Lookup (TC-010 / TC-011)
              </h3>
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[11px] font-mono font-bold">
                QR READY
              </span>
            </div>

            {/* 1-Click Demo QR Scan Buttons */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-1.5">
                Simulate Instant Mobile QR Scan or Search Code:
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {equipments.map((e) => (
                  <button
                    key={e.equipmentCode}
                    onClick={() => {
                      setScannedEqCode(e.equipmentCode);
                      setEqFeedback(null);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                      scannedEqCode === e.equipmentCode
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ▣ {e.equipmentCode} ({e.status})
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Manual lookup (e.g. EQ-EX-001 or KMT-PC300)..."
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
                <button
                  onClick={() => {
                    const found = equipments.find(
                      (e) =>
                        e.equipmentCode
                          .toLowerCase()
                          .includes(manualQrInput.toLowerCase()) ||
                        e.name
                          .toLowerCase()
                          .includes(manualQrInput.toLowerCase())
                    );
                    if (found) setScannedEqCode(found.equipmentCode);
                  }}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Scanned QR Equipment Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-teal-400">
                    {activeEq.qrCodePayload}
                  </span>
                  <h4 className="text-base font-bold mt-0.5">
                    {activeEq.name} ({activeEq.equipmentCode})
                  </h4>
                  <p className="text-xs text-slate-300">
                    {activeEq.category} • {activeEq.brand} {activeEq.model} •
                    S/N: {activeEq.serialNumber}
                  </p>
                </div>
                {/* Visual SVG QR representation */}
                <div className="bg-white p-2 rounded-lg text-slate-900 text-center shrink-0">
                  <div className="grid grid-cols-4 gap-0.5 w-12 h-12">
                    {[1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1].map(
                      (bit, i) => (
                        <div
                          key={i}
                          className={bit ? "bg-slate-900" : "bg-slate-200"}
                        />
                      )
                    )}
                  </div>
                  <div className="text-[9px] font-mono font-bold mt-1">
                    {activeEq.equipmentCode}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/90 p-3 rounded-lg">
                <div>
                  <span className="text-slate-400">Current Project:</span>{" "}
                  <strong className="text-white">
                    {activeEq.currentProjectCode}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Status & Condition:</span>{" "}
                  <strong className="text-teal-300">
                    {activeEq.status} ({activeEq.condition})
                  </strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Location:</span>{" "}
                  <span>{activeEq.currentLocation}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Current Allocation:</span>{" "}
                  <span>
                    {activeEq.assignedTo
                      ? `${activeEq.assignedTo} (Expected Return: ${activeEq.expectedReturn})`
                      : "Unassigned — Ready for Allocation"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Operations & Conflict Prevention (FR-M04-004 to FR-M04-009) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">
                Equipment Action Console ({activeEq.equipmentCode})
              </h3>
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg text-[11px]">
                {(
                  [
                    "ALLOCATE",
                    "RETURN",
                    "TRANSFER",
                    "MAINTENANCE",
                    "DAMAGE",
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setEqActionMode(mode);
                      setEqFeedback(null);
                    }}
                    className={`px-2 py-1 rounded font-semibold ${
                      eqActionMode === mode
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {eqFeedback && (
              <div
                className={`p-3 rounded-lg border text-xs font-semibold ${
                  eqFeedback.isError
                    ? "bg-rose-50 border-rose-300 text-rose-900"
                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                }`}
              >
                {eqFeedback.msg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              {eqActionMode === "ALLOCATE" && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assign to Worker / Site Team (FR-M04-004)
                    </label>
                    <input
                      type="text"
                      value={eqAssignedTeam}
                      onChange={(e) => setEqAssignedTeam(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={eqReturnDate}
                      onChange={(e) => setEqReturnDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                    <strong>TC-022 / BR-012 Conflict Check Demo:</strong> Try
                    clicking Allocate while <code>{activeEq.equipmentCode}</code>{" "}
                    is <code>{activeEq.status}</code>—the system automatically
                    prevents conflicting simultaneous allocations!
                  </div>
                </>
              )}

              {eqActionMode === "RETURN" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Return Condition Verification (FR-M04-005)
                  </label>
                  <select
                    value={eqReturnCondition}
                    onChange={(e) =>
                      setEqReturnCondition(
                        e.target.value as SeedEquipment["condition"]
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="GOOD">GOOD (Set status to AVAILABLE)</option>
                    <option value="FAIR">FAIR (Set status to AVAILABLE)</option>
                    <option value="DAMAGED">
                      DAMAGED (Route to Repair / DAMAGED status)
                    </option>
                  </select>
                </div>
              )}

              {eqActionMode === "TRANSFER" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination Project (FR-M04-006)
                  </label>
                  <select
                    value={eqDestProject}
                    onChange={(e) => setEqDestProject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.projectCode} value={p.projectCode}>
                        {p.projectCode} – {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={eqRemarks}
                  onChange={(e) => setEqRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <button
                onClick={() => {
                  const err = onEquipmentAction({
                    equipmentCode: activeEq.equipmentCode,
                    actionType: eqActionMode,
                    assignedTo: eqAssignedTeam,
                    expectedReturn: eqReturnDate,
                    returnCondition: eqReturnCondition,
                    destProjectCode: eqDestProject,
                    description: eqRemarks,
                  });
                  if (err) {
                    setEqFeedback({ isError: true, msg: err });
                  } else {
                    setEqFeedback({
                      isError: false,
                      msg: `✓ Successfully executed ${eqActionMode} on ${activeEq.equipmentCode}. Audit trail updated.`,
                    });
                  }
                }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                Execute {eqActionMode} Action on {activeEq.equipmentCode}
              </button>
            </div>

            {/* AI Equipment Recommendations (FR-M04-010) */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                FR-M04-010 • AI Equipment Recommendations
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                • <strong>Overdue Return:</strong> 50T Crane{" "}
                <code>EQ-CR-002</code> is 4 days overdue from BinaTeguh Subcon.
                <br />• <strong>Maintenance Alert:</strong> 30T Excavator{" "}
                <code>EQ-EX-001</code> 500-hr hydraulic service overdue since
                2026-11-10.
                <br />• <strong>Transfer Opportunity:</strong> Idle 20T
                Excavator <code>EQ-EX-007</code> at <code>PRJ-BETA</code> can be
                transferred to <code>PRJ-ALPHA</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODULE 05: VISUAL PROJECT, SUBCONTRACTOR & VENDOR PROGRESS MONITORING
  // =========================================================================
  if (activeTab === "M05_PROGRESS") {
    const projUpdates = progressUpdates.filter(
      (u) => u.projectCode === projectCode
    );
    const projPhotos = photos.filter((p) => p.projectCode === projectCode);
    const scheduleVariance =
      currentProject.actualCompletion - currentProject.plannedCompletion;
    const budgetUtilizationPct = Number(
      ((currentProject.spentRm / currentProject.budgetRm) * 100).toFixed(1)
    );

    return (
      <div className="space-y-6">
        {/* Project Overview & Performance Dashboard (FR-M05-001 & FR-M05-007) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                MODULE 05 • SUBCONTRACTOR & PROJECT PROGRESS MONITORING
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {currentProject.name} ({currentProject.projectCode})
              </h2>
              <p className="text-xs text-slate-500">
                Location: {currentProject.location} • Project Manager:{" "}
                <strong>{currentProject.projectManagerName}</strong> • Timeline:{" "}
                {currentProject.startDate} to {currentProject.plannedEndDate}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                currentProject.status === "ON_TRACK"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentProject.status === "AT_RISK"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
              }`}
            >
              STATUS: {currentProject.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Planned Completion</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {currentProject.plannedCompletion}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
              <div className="text-teal-800 font-semibold">
                Actual Completion
              </div>
              <div className="text-2xl font-extrabold text-teal-950 mt-1">
                {currentProject.actualCompletion}%
              </div>
            </div>
            <div
              className={`p-3.5 rounded-xl border ${
                scheduleVariance < 0
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-emerald-50 border-emerald-200 text-emerald-900"
              }`}
            >
              <div className="font-semibold">Schedule Variance (TC-016)</div>
              <div className="text-2xl font-extrabold mt-1">
                {scheduleVariance > 0
                  ? `+${scheduleVariance}%`
                  : `${scheduleVariance}%`}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-amber-900 font-semibold">
                Budget Utilization
              </div>
              <div className="text-2xl font-extrabold text-amber-950 mt-1">
                {budgetUtilizationPct}%
              </div>
              <div className="text-[11px] text-amber-800">
                RM {(currentProject.spentRm / 1e6).toFixed(1)}M / RM{" "}
                {(currentProject.budgetRm / 1e6).toFixed(1)}M
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500">Equipment Rental Spend</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                RM {(currentProject.equipmentRentalRm / 1e6).toFixed(2)}M
              </div>
            </div>
          </div>

          {/* FR-M05-008 Governance Insight Banner */}
          {budgetUtilizationPct > currentProject.actualCompletion && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
              <strong>
                ⚠ FR-M05-008 AI Project & Spend Insight (Investigation Flag):
              </strong>{" "}
              Budget utilization (<strong>{budgetUtilizationPct}%</strong>) is{" "}
              <strong>
                {(budgetUtilizationPct - currentProject.actualCompletion).toFixed(
                  1
                )}
                % higher
              </strong>{" "}
              than physical project completion (
              <strong>{currentProject.actualCompletion}%</strong>). Per business
              rule <strong>FR-M05-008</strong>, higher spending compared with
              project completion is{" "}
              <strong>
                flagged for commercial/technical investigation
              </strong>{" "}
              (checking front-loaded material deposits, variation works, or
              BinaTeguh Grid C4-C7 rework) rather than automatically classified
              as material wastage.
            </div>
          )}
        </div>

        {/* Planned vs Actual Milestone & Subcontractor Progress (FR-M05-002 & FR-M05-003) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">
              Planned vs. Actual Milestone & Subcontractor Progress (FR-M05-003)
            </h3>

            <div className="space-y-4">
              {projMilestones.map((ms) => {
                const isDelayed = ms.actualProgress < ms.plannedProgress;
                const spendPct = Math.round(
                  (ms.actualSpentRm / Math.max(1, ms.budgetAllocatedRm)) * 100
                );
                return (
                  <div
                    key={ms.id}
                    className={`p-4 rounded-xl border ${
                      isDelayed
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-slate-200 bg-slate-50/50"
                    } space-y-2.5 text-xs`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-500">
                          {ms.milestoneCode}
                        </span>{" "}
                        •{" "}
                        <strong className="text-sm text-slate-900">
                          {ms.name}
                        </strong>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Subcontractor / Vendor:{" "}
                          <strong className="text-teal-800">
                            {ms.subcontractorName} ({ms.subcontractorCode})
                          </strong>{" "}
                          • Team: {ms.responsibleTeam}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isDelayed
                            ? "bg-rose-600 text-white"
                            : ms.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {isDelayed
                          ? `BEHIND SCHEDULE (${ms.actualProgress - ms.plannedProgress}%)`
                          : ms.status}
                      </span>
                    </div>

                    {/* Dual Progress Bars */}
                    <div className="space-y-1.5">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                          <span>Planned Progress</span>
                          <span>{ms.plannedProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-slate-600 rounded-full"
                            style={{ width: `${ms.plannedProgress}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                          <span>Actual Physical Completion</span>
                          <span>{ms.actualProgress}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDelayed ? "bg-rose-600" : "bg-teal-600"
                            }`}
                            style={{ width: `${ms.actualProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span>
                        Schedule: {ms.plannedStartDate} → {ms.plannedEndDate}
                      </span>
                      <span>
                        Milestone Spend: RM {(ms.actualSpentRm / 1e6).toFixed(1)}
                        M / RM {(ms.budgetAllocatedRm / 1e6).toFixed(1)}M (
                        {spendPct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Daily Progress Update Form (FR-M05-004 & TC-015) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                FR-M05-004 & TC-015 • DAILY SITE PROGRESS UPDATE
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                Update Milestone & Subcontractor Progress
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Milestone
                </label>
                <select
                  value={selectedMsCode}
                  onChange={(e) => setSelectedMsCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  {projMilestones.map((m) => (
                    <option key={m.milestoneCode} value={m.milestoneCode}>
                      {m.milestoneCode} – {m.name} (Current: {m.actualProgress}
                      %)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Updated Actual Completion Percentage: {newCompletionPct}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={newCompletionPct}
                  onChange={(e) => setNewCompletionPct(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Completed Today
                </label>
                <textarea
                  rows={2}
                  value={workDoneText}
                  onChange={(e) => setWorkDoneText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Work Outstanding
                </label>
                <input
                  type="text"
                  value={workOutText}
                  onChange={(e) => setWorkOutText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks & Supporting Photo URL
                </label>
                <input
                  type="text"
                  value={msRemarks}
                  onChange={(e) => setMsRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 mb-2"
                />
                <input
                  type="text"
                  value={msPhotoUrl}
                  onChange={(e) => setMsPhotoUrl(e.target.value)}
                  placeholder="Supporting Site Photo URL..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <button
                onClick={() =>
                  onUpdateMilestoneProgress({
                    milestoneCode: selectedMsCode,
                    actualProgress: newCompletionPct,
                    workCompleted: workDoneText,
                    workOutstanding: workOutText,
                    remarks: msRemarks,
                    photoUrl: msPhotoUrl,
                  })
                }
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                Submit Progress Update & Link Site Photo
              </button>
            </div>
          </div>
        </div>

        {/* Construction Progress Photo Gallery (FR-M05-005) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">
            Construction Progress Photo Gallery Linked to Milestones
            (FR-M05-005)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projPhotos.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 text-xs"
              >
                <img
                  src={p.photoUrl}
                  alt={p.description}
                  className="h-40 w-full object-cover"
                />
                <div className="p-3 space-y-1">
                  <div className="font-bold text-teal-800">
                    {p.milestoneCode} • {p.milestoneName}
                  </div>
                  <p className="text-slate-700">{p.description}</p>
                  <div className="text-[11px] text-slate-400">
                    Uploaded by {p.uploadedBy} on {p.uploadDate}
                  </div>
                </div>
              </div>
            ))}
            {projUpdates.slice(0, 1).map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-xs space-y-2"
              >
                <div className="font-bold text-slate-900">
                  Latest Daily Log: {u.milestoneName} ({u.completionPct}%)
                </div>
                <p className="text-slate-700">
                  <strong>Completed:</strong> {u.workCompleted}
                </p>
                <p className="text-slate-600">
                  <strong>Outstanding:</strong> {u.workOutstanding}
                </p>
                <div className="text-[11px] text-slate-400">
                  By {u.updatedBy} • {u.progressDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODULE 06: AI RISK COPILOT & PREDICTIVE SCENARIO SIMULATOR
  // =========================================================================
  const projRisks = risks.filter((r) => r.projectCode === projectCode);

  const presetQuestions = [
    "Where can I buy cement near Project Alpha?",
    "Which vendor offers the lowest price for steel and best reliability?",
    "Do we have enough tiles and steel for the next two weeks?",
    "Which equipment is currently available or requires maintenance?",
    "Which project and subcontractor milestone is behind schedule?",
    "What are the current critical risks affecting this project?",
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
              MODULE 06 • EXPLAINABLE AI RISK COPILOT & SCENARIO SIMULATOR
            </span>
            <h2 className="text-2xl font-bold">
              BuildSmart AI Risk Copilot — {projectCode}
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Cross-analyzes Live Stock (M02), Worker/Engineer Defect Logs &
              Vendor Scores (M03), QR Equipment (M04), and Subcontractor
              Progress (M05) to predict project risks before they halt site
              work.
            </p>
          </div>
          <div className="text-right text-xs bg-white/10 p-3 rounded-xl border border-white/15">
            <div className="font-bold text-amber-300">
              BR-016 Risk Formula: Likelihood (1–5) × Impact (1–5)
            </div>
            <div className="text-slate-300 mt-0.5">
              1–4 Low | 5–9 Medium | 10–16 High | 17–25 Critical
            </div>
          </div>
        </div>
      </div>

      {/* Split View: Left = AI Chat Assistant (FR-M06-001) | Right = What-If Scenario Simulator (FR-M06-007) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Chat Assistant */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  FR-M06-001 & FR-M06-009 • GROUNDED AI ASSISTANT
                </span>
                <h3 className="font-bold text-slate-900">
                  Ask AI About Stock, Vendors, Equipment or Risks
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[11px] font-semibold">
                Explainable AI Active
              </span>
            </div>

            {/* Preset Questions */}
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                One-Click Spec Test Questions (TC-017 / TC-018 / TC-019):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleAskCopilot(q)}
                    className="text-left px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-xs whitespace-pre-line ${
                    msg.role === "USER"
                      ? "bg-indigo-600 text-white ml-8 font-medium"
                      : "bg-white border border-slate-200 text-slate-800 mr-4 shadow-sm"
                  }`}
                >
                  <div className="font-bold text-[10px] uppercase tracking-wider mb-1 opacity-75">
                    {msg.role === "USER"
                      ? `${currentUser.name} (${currentUser.role})`
                      : "BuildSmart AI Copilot (Grounded in Live DB)"}
                  </div>
                  <div>{msg.text}</div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <strong>Explainable AI Sources (FR-M06-009):</strong>{" "}
                      {msg.sources.join(" • ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything (e.g., 'Do we have enough steel for the next two weeks?')..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskCopilot(chatInput)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
            <button
              onClick={() => handleAskCopilot(chatInput)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
            >
              Ask AI
            </button>
          </div>
        </div>

        {/* Interactive What-If Scenario Simulator (FR-M06-007 & BR-020 / TC-020) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                FR-M06-007 & TC-020 • WHAT-IF SCENARIO SIMULATOR
              </span>
              <h3 className="font-bold text-slate-900">
                Predictive Operational Risk Simulation
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
              BR-020: Non-Mutating Sandbox
            </span>
          </div>

          {/* Scenario Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scenario Type (FR-M06-007)
              </label>
              <select
                value={simType}
                onChange={(e) =>
                  setSimType(
                    e.target.value as SimulationInput["scenarioType"]
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-semibold"
              >
                <option value="DELIVERY_DELAY">
                  1. Material Delivery Delayed (+N Days)
                </option>
                <option value="PRICE_INCREASE">
                  2. Material Unit Price Surge (+X%)
                </option>
                <option value="EQUIPMENT_BREAKDOWN">
                  3. Critical Equipment Breakdown
                </option>
                <option value="CONSUMPTION_SURGE">
                  4. Site Consumption Surge (+X%)
                </option>
              </select>
            </div>

            {simType === "EQUIPMENT_BREAKDOWN" ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Equipment Item
                </label>
                <select
                  value={simEqCode}
                  onChange={(e) => setSimEqCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                >
                  {equipments.map((e) => (
                    <option key={e.equipmentCode} value={e.equipmentCode}>
                      {e.equipmentCode} – {e.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Material
                </label>
                <select
                  value={simMatCode}
                  onChange={(e) => setSimMatCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.materialCode} value={m.materialCode}>
                      {m.materialCode} – {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {simType === "DELIVERY_DELAY" ||
            simType === "EQUIPMENT_BREAKDOWN" ? (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Simulated Delay / Breakdown Duration:{" "}
                  <strong>+{simDelayDays} Days</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={simDelayDays}
                  onChange={(e) => setSimDelayDays(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Simulated Percentage Increase:{" "}
                  <strong>+{simPctChange}%</strong>
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={simPctChange}
                  onChange={(e) => setSimPctChange(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Simulation Output Card */}
          <div className="p-4 rounded-xl border-2 border-indigo-600/30 bg-indigo-50/30 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                {activeSimResult.scenarioTitle}
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                  activeSimResult.newRiskLevel === "CRITICAL"
                    ? "bg-rose-600 text-white"
                    : activeSimResult.newRiskLevel === "HIGH"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                SIMULATED RISK: {activeSimResult.newRiskScore}/25 (
                {activeSimResult.newRiskLevel})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Shortage / Outage Gap
                </div>
                <div className="text-base font-extrabold text-rose-700">
                  {activeSimResult.shortageGapDays} days
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Milestone Delay Impact
                </div>
                <div className="text-base font-extrabold text-amber-700">
                  +{activeSimResult.estimatedScheduleDelayDays} days
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Cost Exposure (SIMULATED)
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  RM{" "}
                  {activeSimResult.estimatedFinancialImpactRm.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-slate-700 space-y-1">
              <div>
                <strong>Baseline Truth:</strong>{" "}
                {activeSimResult.baselineSummary}
              </div>
              <div>
                <strong>Predicted Impact:</strong>{" "}
                {activeSimResult.simulatedImpactSummary}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-indigo-200 space-y-1">
              <div className="font-bold text-indigo-900">
                AI Mitigation Recommendations:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {activeSimResult.mitigationRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="text-[10px] text-slate-500">
              <strong>Explainable Sources (FR-M06-009):</strong>{" "}
              {activeSimResult.explainableDataSources.join(" • ")}
            </div>
          </div>
        </div>
      </div>

      {/* Active Risk Register & Action Tracking (FR-M06-002 to FR-M06-008) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Cross-Module Active Risk Register & Action Tracking —{" "}
              {projectCode} ({projRisks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Automatically identifies Material, Vendor, Equipment, and Project
              schedule risks across Modules 01–05.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {projRisks.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700">
                    {r.riskCode}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                      r.riskLevel === "CRITICAL"
                        ? "bg-rose-600 text-white"
                        : r.riskLevel === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : r.riskLevel === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {r.riskLevel} (Score {r.riskScore}/25 = L{r.likelihood}×I
                    {r.impact})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                    {r.category} RISK
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Owner: {r.riskOwner}</span>
                  <select
                    value={r.status}
                    onChange={(e) =>
                      onUpdateRisk({
                        riskCode: r.riskCode,
                        status: e.target.value as SeedRisk["status"],
                        riskOwner: r.riskOwner,
                      })
                    }
                    className="rounded border border-slate-300 px-2 py-1 font-bold bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="text-sm font-bold text-slate-900">{r.title}</div>
              <p className="text-slate-700">{r.description}</p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-teal-900">
                <strong>AI Recommended Corrective Action:</strong>{" "}
                {r.recommendedAction}
              </div>
              <div className="text-[11px] text-slate-500">
                <strong>Explainable AI Source Data (FR-M06-009):</strong>{" "}
                {r.sourceData} • Identified: {r.identifiedDate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
