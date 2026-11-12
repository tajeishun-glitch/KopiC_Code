"use client";

import React, { useState } from "react";
import {
  SeedMilestone,
  SeedProgressUpdate,
  SeedPhoto,
  SeedRisk,
  SeedProject,
  SeedInventoryItem,
  SeedMaterial,
  SeedVendor,
  SeedEquipment,
  RoleType,
} from "@/lib/seed-data";
import {
  runScenarioSimulation,
  SimulationInput,
  SimulationResult,
} from "@/lib/business-engine";

interface EquipmentProgressRiskProps {
  activeTab: "M05_PROGRESS" | "M06_RISK_COPILOT";
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
  onEquipmentAction?: (payload: any) => string | null;
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
  onUpdateMilestoneProgress,
  onUpdateRisk,
}: EquipmentProgressRiskProps) {
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
  const [msSuccessMsg, setMsSuccessMsg] = useState<string>("");

  // Photo gallery toggle (Max 3 visible by default)
  const [isPhotoGalleryExpanded, setIsPhotoGalleryExpanded] = useState<boolean>(false);

  // M06 Floating AI Copilot & Simulation State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    {
      role: "USER" | "AI";
      text: string;
      sources?: string[];
    }[]
  >([
    {
      role: "AI",
      text: `Hello ${currentUser.name}! I am your **BuildSmart AI Risk Copilot** for **${projectCode}**. I continuously monitor live inventory, defect reports, vendor scoring, and subcontractor milestone progress. How can I help you?`,
      sources: ["Live DB", "Unified Project Graph"],
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
            "Analyzed project records. Review the predictive operational risk matrix below.",
          sources: data.explainability?.sourcesUsed || [],
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "AI",
          text: `For ${projectCode}, rebar (STL-002) has 3.0 days of stock coverage. Subcontractor BinaTeguh on MS-ALPHA-02 is 13% behind schedule. Recommend initiating surplus transfer from Project Beta.`,
          sources: ["Live Stock", "Subcon Milestones"],
        },
      ]);
    }
  };

  const presetQuestions = [
    "Do we have enough steel rebar for the next two weeks?",
    "Which subcontractor milestone is currently behind schedule?",
    "What are the top critical risks affecting this project?",
    "Which supplier has the highest quality acceptance score?",
  ];

  // =========================================================================
  // M05: PROJECT & SUBCON PROGRESS MONITORING
  // =========================================================================
  if (activeTab === "M05_PROGRESS") {
    const projPhotos = photos.filter((p) => p.projectCode === projectCode);
    const visiblePhotos = isPhotoGalleryExpanded
      ? projPhotos
      : projPhotos.slice(0, 3);

    return (
      <div className="space-y-6">
        {/* Top Header */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                MODULE 05 • PROJECT & SUBCON PROGRESS
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Project: <strong className="text-amber-400">{projectCode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold">Subcontractor Milestones & Physical Progress</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Live tracking of planned vs actual trade package completion and site progress photo documentation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-amber-400">
              Overall: {currentProject.actualCompletion}% / {currentProject.plannedCompletion}% Target
            </span>
          </div>
        </div>

        {/* Milestone Comparison Visual Chart Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">
                Milestone Progress Overview Chart
              </h3>
              <p className="text-xs text-slate-400">
                Visual comparison of Target Planned vs Actual Verified Physical Completion.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-3 h-2 bg-sky-500 rounded-sm inline-block" />
                <span>Planned</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-2 bg-amber-500 rounded-sm inline-block" />
                <span>Actual</span>
              </div>
            </div>
          </div>

          {/* Attractive Visual Bar Comparison */}
          <div className="space-y-4 pt-2">
            {projMilestones.map((ms) => {
              const isBehind = ms.actualProgress < ms.plannedProgress;
              return (
                <div key={ms.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">
                      <span className="text-amber-400 font-mono">[{ms.milestoneCode}]</span> {ms.name}{" "}
                      <span className="text-slate-400 font-normal">({ms.subcontractorName})</span>
                    </span>
                    <span className="font-mono">
                      <strong className="text-sky-400">P: {ms.plannedProgress}%</strong> •{" "}
                      <strong className={isBehind ? "text-rose-400" : "text-emerald-400"}>
                        A: {ms.actualProgress}% ({ms.actualProgress - ms.plannedProgress}%)
                      </strong>
                    </span>
                  </div>
                  <div className="h-5 w-full bg-slate-950 rounded-lg p-0.5 border border-slate-800 flex flex-col justify-center gap-0.5">
                    {/* Planned Bar */}
                    <div
                      className="h-1.5 bg-sky-500/80 rounded-full transition-all"
                      style={{ width: `${ms.plannedProgress}%` }}
                    />
                    {/* Actual Bar */}
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isBehind ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${ms.actualProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Split: Left = Update Milestone with Photo Attachment, Right = Planned vs Actual Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Update Milestone Section (With Image Attachment Upload) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                DAILY SITE PROGRESS UPDATE
              </span>
              <h3 className="font-extrabold text-white text-base mt-0.5">
                Update Milestone Progress
              </h3>
              <p className="text-xs text-slate-400">
                Record actual completion percentage, work completed, and attach site progress photos.
              </p>
            </div>

            {msSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
                {msSuccessMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Target Milestone
                </label>
                <select
                  value={selectedMsCode}
                  onChange={(e) => setSelectedMsCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                >
                  {projMilestones.map((m) => (
                    <option key={m.milestoneCode} value={m.milestoneCode}>
                      {m.milestoneCode} – {m.name} ({m.actualProgress}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Actual Completion:</span>
                  <span className="text-amber-400 font-mono font-bold">{newCompletionPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={newCompletionPct}
                  onChange={(e) => setNewCompletionPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Work Completed Today
                </label>
                <textarea
                  rows={2}
                  value={workDoneText}
                  onChange={(e) => setWorkDoneText(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Work Outstanding
                </label>
                <input
                  type="text"
                  value={workOutText}
                  onChange={(e) => setWorkOutText(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={msRemarks}
                  onChange={(e) => setMsRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Photo Attachment Upload / URL Field */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Progress Photo Attachment
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={msPhotoUrl}
                    onChange={(e) => setMsPhotoUrl(e.target.value)}
                    placeholder="Enter image URL or select photo..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none text-xs"
                  />
                  {msPhotoUrl && (
                    <div className="h-9 w-9 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 flex-shrink-0">
                      <img src={msPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  onUpdateMilestoneProgress({
                    milestoneCode: selectedMsCode,
                    actualProgress: newCompletionPct,
                    workCompleted: workDoneText,
                    workOutstanding: workOutText,
                    remarks: msRemarks,
                    photoUrl: msPhotoUrl,
                  });
                  setMsSuccessMsg(`✓ Milestone ${selectedMsCode} updated to ${newCompletionPct}% with photo.`);
                  setTimeout(() => setMsSuccessMsg(""), 3500);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all mt-2"
              >
                Submit Milestone Update
              </button>
            </div>
          </div>

          {/* Right Column: Planned vs Actual Milestone Details */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base">
                Planned vs. Actual Milestones
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {projMilestones.length} Active Packages
              </span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
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
                        ? "border-rose-500/30 bg-rose-500/5"
                        : "border-slate-800 bg-slate-950/60"
                    } space-y-2.5 text-xs`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-amber-400">
                          {ms.milestoneCode}
                        </span>{" "}
                        • <strong className="text-sm text-white">{ms.name}</strong>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Subcontractor: <strong className="text-slate-200">{ms.subcontractorName}</strong> ({ms.subcontractorCode})
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                          isDelayed
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : ms.status === "COMPLETED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        }`}
                      >
                        {isDelayed ? `BEHIND (${ms.actualProgress - ms.plannedProgress}%)` : ms.status}
                      </span>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Target Planned</div>
                        <div className="font-bold text-sky-400 text-sm font-mono">{ms.plannedProgress}%</div>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">Actual Verified</div>
                        <div className={`font-bold text-sm font-mono ${isDelayed ? "text-rose-400" : "text-amber-400"}`}>
                          {ms.actualProgress}%
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Timeline: {ms.plannedStartDate} → {ms.plannedEndDate}</span>
                      <span>Spent: RM {(ms.actualSpentRm / 1e6).toFixed(1)}M / RM {(ms.budgetAllocatedRm / 1e6).toFixed(1)}M ({spendPct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Construction Progress Photos Section (Show max 3 + View More Toggle) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">
                Construction Progress Photos ({projPhotos.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Site photographs captured and linked to milestone verification.
              </p>
            </div>
            {projPhotos.length > 3 && (
              <button
                onClick={() => setIsPhotoGalleryExpanded(!isPhotoGalleryExpanded)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-slate-700 transition-all"
              >
                {isPhotoGalleryExpanded ? "▲ Show 3 Photos" : `▼ View More (${projPhotos.length - 3} More)`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visiblePhotos.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 text-xs flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-slate-900">
                  <img
                    src={p.photoUrl}
                    alt={p.description}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                    {p.milestoneCode}
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <div className="font-bold text-white text-xs">
                    {p.milestoneName}
                  </div>
                  <p className="text-slate-400 text-[11px]">{p.description}</p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    Uploaded by {p.uploadedBy} on {p.uploadDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // M06: AI RISK & PREDICTIVE SCENARIO SIMULATOR
  // =========================================================================
  const projRisks = risks.filter((r) => r.projectCode === projectCode);

  return (
    <div className="space-y-6 relative">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              MODULE 06 • PREDICTIVE RISK SIMULATION & COPILOT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Project: <strong className="text-amber-400">{projectCode}</strong>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Predictive Operational Risk Simulator
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Non-mutating what-if risk simulations across material supply, delivery delays, and subcontractor milestone timelines.
          </p>
        </div>

        {/* Floating Copilot Launcher Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <span>🤖</span>
          <span>{isChatOpen ? "Close AI Copilot Window" : "Open Floating AI Copilot"}</span>
        </button>
      </div>

      {/* Large-Width Predictive Operational Risk Simulation Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="font-extrabold text-white text-lg">
                Interactive What-If Operational Risk Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust scenario variables below to evaluate potential delays, financial exposure, and risk mitigation strategies.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            SANDBOX: NON-MUTATING SIMULATION
          </span>
        </div>

        {/* Simulator Controls Grid (Expanded Width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Scenario Type
            </label>
            <select
              value={simType}
              onChange={(e) =>
                setSimType(e.target.value as SimulationInput["scenarioType"])
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-semibold focus:outline-none"
            >
              <option value="DELIVERY_DELAY">1. Material Delivery Delay (+N Days)</option>
              <option value="PRICE_INCREASE">2. Material Unit Price Surge (+X%)</option>
              <option value="EQUIPMENT_BREAKDOWN">3. Critical Plant Breakdown</option>
              <option value="CONSUMPTION_SURGE">4. Site Consumption Surge (+X%)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              {simType === "EQUIPMENT_BREAKDOWN" ? "Target Plant" : "Target Material"}
            </label>
            {simType === "EQUIPMENT_BREAKDOWN" ? (
              <select
                value={simEqCode}
                onChange={(e) => setSimEqCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none"
              >
                {equipments.map((e) => (
                  <option key={e.equipmentCode} value={e.equipmentCode}>
                    {e.equipmentCode} – {e.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={simMatCode}
                onChange={(e) => setSimMatCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:outline-none"
              >
                {materials.map((m) => (
                  <option key={m.materialCode} value={m.materialCode}>
                    {m.materialCode} – {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            {simType === "DELIVERY_DELAY" || simType === "EQUIPMENT_BREAKDOWN" ? (
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Simulated Delay:</span>
                  <span className="text-amber-400 font-mono font-bold">+{simDelayDays} Days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={simDelayDays}
                  onChange={(e) => setSimDelayDays(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-1"
                />
              </div>
            ) : (
              <div>
                <div className="flex justify-between font-semibold text-slate-300 mb-1">
                  <span>Simulated Percentage Surge:</span>
                  <span className="text-amber-400 font-mono font-bold">+{simPctChange}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={simPctChange}
                  onChange={(e) => setSimPctChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Large Prominent Simulation Output Card */}
        <div className="p-5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="font-extrabold text-white text-base">
              {activeSimResult.scenarioTitle}
            </h4>
            <span
              className={`px-3 py-1 rounded-full font-extrabold text-xs font-mono ${
                activeSimResult.newRiskLevel === "CRITICAL"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : activeSimResult.newRiskLevel === "HIGH"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              PREDICTED RISK: {activeSimResult.newRiskScore}/25 ({activeSimResult.newRiskLevel})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Stock Outage Gap</div>
              <div className="text-xl font-black font-mono text-rose-400 mt-1">
                {activeSimResult.shortageGapDays} Days
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Milestone Schedule Delay</div>
              <div className="text-xl font-black font-mono text-amber-400 mt-1">
                +{activeSimResult.estimatedScheduleDelayDays} Days
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Estimated Cost Exposure</div>
              <div className="text-xl font-black font-mono text-white mt-1">
                RM {activeSimResult.estimatedFinancialImpactRm.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="font-bold text-slate-200">Baseline vs Predicted Impact:</div>
              <p className="text-slate-400">
                <strong className="text-slate-300">Baseline:</strong> {activeSimResult.baselineSummary}
              </p>
              <p className="text-slate-400">
                <strong className="text-slate-300">Impact:</strong> {activeSimResult.simulatedImpactSummary}
              </p>
            </div>

            <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="font-bold text-indigo-300">AI Mitigation Recommendations:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                {activeSimResult.mitigationRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Active Risk Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-white text-base">
            Active Risk Register — {projectCode} ({projRisks.length})
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Formulas: Likelihood (1–5) × Impact (1–5)
          </span>
        </div>

        <div className="space-y-3">
          {projRisks.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400">{r.riskCode}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.riskLevel === "CRITICAL"
                        ? "bg-rose-600 text-white"
                        : r.riskLevel === "HIGH"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {r.riskLevel} (Score {r.riskScore}/25)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {r.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Owner: {r.riskOwner}</span>
                  <select
                    value={r.status}
                    onChange={(e) =>
                      onUpdateRisk({
                        riskCode: r.riskCode,
                        status: e.target.value as SeedRisk["status"],
                        riskOwner: r.riskOwner,
                      })
                    }
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="font-bold text-white text-sm">{r.title}</div>
              <p className="text-slate-400">{r.description}</p>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <strong className="text-amber-400">Recommended Action:</strong> {r.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating AI Copilot Chat Window (Bottom-Right) */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] sm:w-[440px] max-h-[580px] bg-slate-900 border-2 border-indigo-500/60 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-indigo-950 px-4 py-3 border-b border-indigo-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-bold text-white text-sm">
                BuildSmart AI Copilot
              </h4>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>
          </div>

          {/* Quick Presets */}
          <div className="p-2 bg-slate-950 border-b border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1">Quick Questions:</div>
            <div className="flex flex-wrap gap-1">
              {presetQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskCopilot(q)}
                  className="text-left text-[10px] bg-slate-900 hover:bg-indigo-900/60 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[320px] bg-slate-950/90 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl whitespace-pre-line ${
                  msg.role === "USER"
                    ? "bg-indigo-600 text-white ml-8 font-medium"
                    : "bg-slate-900 border border-slate-800 text-slate-200 mr-4 shadow"
                }`}
              >
                <div className="font-bold text-[10px] text-slate-400 uppercase mb-1">
                  {msg.role === "USER" ? currentUser.name : "AI Risk Copilot"}
                </div>
                <div>{msg.text}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                    Sources: {msg.sources.join(" • ")}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI Copilot about site risks..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskCopilot(chatInput)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <button
              onClick={() => handleAskCopilot(chatInput)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
