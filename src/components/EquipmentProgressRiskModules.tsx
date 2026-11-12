"use client";

import React, { useState, useRef } from "react";
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
  getRolePermissions,
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
  isCopilotOpen?: boolean;
  onToggleCopilot?: () => void;
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
  isCopilotOpen,
  onToggleCopilot,
}: EquipmentProgressRiskProps) {
  const perms = getRolePermissions(currentUser.role);
  // M05 Progress State
  const projMilestones = milestones.filter(
    (m) => m.projectCode === projectCode
  );
  const [selectedMsCode, setSelectedMsCode] = useState<string>(
    projMilestones[1]?.milestoneCode ||
      projMilestones[0]?.milestoneCode ||
      "MS-ALPHA-02"
  );
  const [newCompletionPct, setNewCompletionPct] = useState<number>(0);
  const [workDoneText, setWorkDoneText] = useState<string>("");
  const [workOutText, setWorkOutText] = useState<string>("");
  const [msRemarks, setMsRemarks] = useState<string>("");
  const [msPhotoUrl, setMsPhotoUrl] = useState<string>("");
  const [msSuccessMsg, setMsSuccessMsg] = useState<string>("");
  const progressFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<SeedPhoto | null>(null);

  const handleClearMilestoneForm = () => {
    setNewCompletionPct(0);
    setWorkDoneText("");
    setWorkOutText("");
    setMsRemarks("");
    setMsPhotoUrl("");
    setMsSuccessMsg("");
    if (progressFileInputRef.current) {
      progressFileInputRef.current.value = "";
    }
  };

  // Photo gallery toggle (Max 3 visible by default)
  const [isPhotoGalleryExpanded, setIsPhotoGalleryExpanded] = useState<boolean>(false);

  // M06 Floating AI Copilot & Simulation State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
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

  const defaultSimType: SimulationInput["scenarioType"] =
    perms.accessDomain === "CONSTRUCTION"
      ? "EQUIPMENT_BREAKDOWN"
      : "DELIVERY_DELAY";
  const [simType, setSimType] =
    useState<SimulationInput["scenarioType"]>(defaultSimType);
  const [simMatCode, setSimMatCode] = useState<string>("STL-002");
  const [simEqCode, setSimEqCode] = useState<string>("EQ-EX-001");
  const [simDelayDays, setSimDelayDays] = useState<number>(3);
  const [simPctChange, setSimPctChange] = useState<number>(15);

  const currentProject =
    projects.find((p) => p.projectCode === projectCode) || projects[0];

  // Dynamic live progress calculation from milestone updates
  const liveActualCompletion =
    projMilestones.length > 0
      ? Math.round(
          projMilestones.reduce((acc, m) => acc + m.actualProgress, 0) /
            projMilestones.length
        )
      : currentProject.actualCompletion;

  // Dynamic SVG Y-coordinate for Nov Actual Pin (scale: 0% = 180px, 100% = 20px)
  const currentActualY = Math.max(
    20,
    Math.min(180, 180 - (liveActualCompletion / 100) * 160)
  );

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

        {/* Attractive Visual Dashboard Charts Section (S-Curve Progress & Milestone Analytics) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="font-extrabold text-white text-base">
                  Physical Progress S-Curve & Milestone Performance Dashboard
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Earned Value Management (EVM) tracking Planned Progress baseline against Actual Verified Physical Completion.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-3 h-0.5 bg-sky-400 inline-block border-t-2 border-dashed border-sky-400" />
                <span>Planned Baseline S-Curve</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-1 bg-amber-400 rounded-full inline-block" />
                <span>Actual Verified Progress</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Overall Completion</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-extrabold text-amber-400">{liveActualCompletion}%</span>
                <span className="text-[11px] text-slate-500 font-mono">/ {currentProject.plannedCompletion}% Target</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${liveActualCompletion}%` }} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Schedule Variance</span>
              <div className="text-xl font-mono font-extrabold text-rose-400">
                {liveActualCompletion - currentProject.plannedCompletion}%
              </div>
              <span className="text-[10px] text-rose-300 font-mono">
                {liveActualCompletion >= currentProject.plannedCompletion ? "Ahead or On-Track" : "~14 Days Behind Critical Path"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Trade Packages</span>
              <div className="text-xl font-mono font-extrabold text-white">
                {projMilestones.filter((m) => m.actualProgress >= m.plannedProgress).length} / {projMilestones.length}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                On-Track or Completed
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Active Subcontractors</span>
              <div className="text-xl font-mono font-extrabold text-indigo-300">
                {new Set(projMilestones.map((m) => m.subcontractorCode)).size} Trades
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {projPhotos.length} site inspection photos
              </span>
            </div>
          </div>

          {/* S-Curve SVG Chart */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Earned Value Cumulative Progress S-Curve (12 Months)</span>
              <span className="text-[10px] font-mono text-slate-400">Cut-Off Date: November 2026</span>
            </div>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 700 200" className="w-full h-44 min-w-[550px] overflow-visible">
                <defs>
                  <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[180, 140, 100, 60, 20].map((y, idx) => (
                  <g key={y}>
                    <line x1="45" y1={y} x2="680" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x="35" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                      {idx * 25}%
                    </text>
                  </g>
                ))}

                {/* Month labels along x-axis */}
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                  (m, i) => {
                    const x = 55 + i * 54;
                    return (
                      <text key={m} x={x} y="195" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                        {m}
                      </text>
                    );
                  }
                )}

                {/* S-Curve Planned Baseline Area & Line */}
                <path
                  d="M 55,180 C 160,175 250,150 350,105 C 450,60 550,28 650,22 L 650,180 L 55,180 Z"
                  fill="url(#plannedGrad)"
                />
                <path
                  d="M 55,180 C 160,175 250,150 350,105 C 450,60 550,28 650,22"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Actual Verified Progress Line up to Month 11 (Nov) - Dynamically reacts to submitted progress */}
                <path
                  d={`M 55,180 C 160,176 250,155 350,120 C 430,95 520,${Math.round((85 + currentActualY) / 2)} 595,${currentActualY} L 595,180 L 55,180 Z`}
                  fill="url(#actualGrad)"
                />
                <path
                  d={`M 55,180 C 160,176 250,155 350,120 C 430,95 520,${Math.round((85 + currentActualY) / 2)} 595,${currentActualY}`}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                />

                {/* Data Points on Actual */}
                {[
                  { x: 55, y: 180 },
                  { x: 109, y: 178 },
                  { x: 163, y: 172 },
                  { x: 217, y: 162 },
                  { x: 271, y: 148 },
                  { x: 325, y: 128 },
                  { x: 379, y: 110 },
                  { x: 433, y: 95 },
                  { x: 487, y: 85 },
                  { x: 541, y: Math.round((85 + currentActualY) / 2) },
                  { x: 595, y: currentActualY },
                ].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f59e0b" stroke="#0f172a" strokeWidth="1" />
                ))}

                {/* Current Actual Pin (Nov) - Dynamically positioned */}
                <circle cx="595" cy={currentActualY} r="5" fill="#f59e0b" className="animate-ping opacity-60" />
                <circle cx="595" cy={currentActualY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <rect x="545" y={Math.max(10, currentActualY - 29)} width="100" height="20" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                <text x="595" y={Math.max(10, currentActualY - 29) + 14} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  Actual: {liveActualCompletion}% (Nov)
                </text>
              </svg>
            </div>
          </div>

          {/* Subcontractor Package Completion Visual Bar Breakdown */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-300">
              Subcontractor Trade Packages Planned vs Actual Progress
            </span>
            <div className="space-y-3">
              {projMilestones.map((ms) => {
                const isBehind = ms.actualProgress < ms.plannedProgress;
                return (
                  <div key={ms.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">
                        <span className="text-amber-400 font-mono">[{ms.milestoneCode}]</span> {ms.name}{" "}
                        <span className="text-slate-400 font-normal">({ms.subcontractorName})</span>
                      </span>
                      <span className="font-mono text-xs">
                        <span className="text-sky-400 mr-2">Plan: {ms.plannedProgress}%</span>
                        <strong className={isBehind ? "text-rose-400" : "text-emerald-400"}>
                          Act: {ms.actualProgress}% ({ms.actualProgress >= ms.plannedProgress ? `+${ms.actualProgress - ms.plannedProgress}%` : `${ms.actualProgress - ms.plannedProgress}%`})
                        </strong>
                      </span>
                    </div>
                    <div className="h-4 w-full bg-slate-950 rounded-lg p-0.5 border border-slate-800 flex flex-col justify-center gap-0.5">
                      {/* Planned Bar */}
                      <div
                        className="h-1 bg-sky-500/70 rounded-full transition-all"
                        style={{ width: `${ms.plannedProgress}%` }}
                      />
                      {/* Actual Bar */}
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isBehind ? "bg-rose-500" : "bg-amber-400"
                        }`}
                        style={{ width: `${ms.actualProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Split: Left = Update Milestone Section, Right = Planned Vs Actual Milestone Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Update Milestone Section (With Image Attachment Upload) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-start justify-between gap-3">
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
              <button
                type="button"
                onClick={handleClearMilestoneForm}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Reset all form fields to blank"
              >
                ↺ Clear Form
              </button>
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

              {/* Working Photo Attachment Upload Section */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block font-semibold text-slate-300">
                  Site Progress Photo Attachment
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={progressFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setMsPhotoUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => progressFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <span>📷</span>
                    <span>Upload Site Photo</span>
                  </button>

                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      value={msPhotoUrl}
                      onChange={(e) => setMsPhotoUrl(e.target.value)}
                      placeholder="Or enter progress photo URL..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Sample Site Photos Quick Select */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Quick Samples:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: "🏗️ Rebar Cage Fix",
                        url: "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80",
                      },
                      {
                        label: "🏢 Slab Concrete Pour",
                        url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80",
                      },
                      {
                        label: "🧱 Precast Wall Mount",
                        url: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
                      },
                    ].map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => setMsPhotoUrl(sample.url)}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Card */}
                {msPhotoUrl && (
                  <div className="relative rounded-lg border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                    <div className="h-16 w-20 rounded-md overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                      <img
                        src={msPhotoUrl}
                        alt="Progress Attachment Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400">Progress Photo Attached</span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        Linked Milestone: <strong>{selectedMsCode}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Will appear in Construction Progress gallery upon submission
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMsPhotoUrl("")}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleClearMilestoneForm}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  ↺ Clear Form
                </button>
                <button
                  onClick={() => {
                    onUpdateMilestoneProgress({
                      milestoneCode: selectedMsCode,
                      actualProgress: newCompletionPct,
                      workCompleted: workDoneText,
                      workOutstanding: workOutText,
                      remarks: msRemarks,
                      photoUrl: msPhotoUrl || undefined,
                    });
                    setMsSuccessMsg(`✓ Milestone ${selectedMsCode} updated to ${newCompletionPct}% with photo.`);
                    setTimeout(() => setMsSuccessMsg(""), 3500);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all"
                >
                  Submit Milestone Update
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Planned vs Actual Milestone Details */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Planned Vs Actual Milestone Section
                </h3>
                <p className="text-xs text-slate-400">
                  Subcontractor trade packages, verified progress, and timeline delivery status.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {projMilestones.length} Active Packages
              </span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Construction Progress Photos ({projPhotos.length})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Site photographs captured and linked to milestone verification. Showing up to 3 photos initially.
              </p>
            </div>
            {projPhotos.length > 3 && (
              <button
                onClick={() => setIsPhotoGalleryExpanded(!isPhotoGalleryExpanded)}
                className="px-4 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-slate-700 shadow transition-all flex items-center gap-1.5"
              >
                <span>{isPhotoGalleryExpanded ? "▲ Show 3 Photos Only" : `▼ View More (${projPhotos.length - 3} More Photos)`}</span>
              </button>
            )}
          </div>

          {/* Photo Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visiblePhotos.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPhotoModal(p)}
                className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 text-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all group"
              >
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={p.photoUrl}
                    alt={p.description}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/85 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                    {p.milestoneCode}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    🔍 Click to Enlarge
                  </div>
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="font-bold text-white text-xs truncate">
                    {p.milestoneName}
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{p.description}</p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                    <span>By {p.uploadedBy}</span>
                    <span className="font-mono">{p.uploadDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projPhotos.length > 3 && !isPhotoGalleryExpanded && (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsPhotoGalleryExpanded(true)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-slate-800 hover:border-amber-400/50 transition-all"
              >
                ▼ Click to View All {projPhotos.length} Construction Progress Photos
              </button>
            </div>
          )}
        </div>

        {/* Construction Photo Lightbox Modal */}
        {selectedPhotoModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {selectedPhotoModal.milestoneCode} • {selectedPhotoModal.milestoneName}
                  </span>
                  <h4 className="font-bold text-white text-sm">Site Progress Documentation</h4>
                </div>
                <button
                  onClick={() => setSelectedPhotoModal(null)}
                  className="text-slate-400 hover:text-white font-bold p-1 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="p-2 bg-black flex items-center justify-center max-h-[460px] overflow-hidden">
                <img
                  src={selectedPhotoModal.photoUrl}
                  alt={selectedPhotoModal.description}
                  className="max-h-[440px] w-auto object-contain rounded-lg"
                />
              </div>
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs space-y-1">
                <p className="text-slate-300 font-medium">{selectedPhotoModal.description}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Uploaded by {selectedPhotoModal.uploadedBy} on {selectedPhotoModal.uploadDate}
                </div>
              </div>
            </div>
          </div>
        )}
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
          onClick={() => {
            if (onToggleCopilot) {
              onToggleCopilot();
            } else {
              setIsChatOpen(!isChatOpen);
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <span>🤖</span>
          <span>
            {(onToggleCopilot ? isCopilotOpen : isChatOpen)
              ? "Close AI Copilot Window"
              : "Open Floating AI Copilot"}
          </span>
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
              {(perms.accessDomain === "FULL" ||
                perms.accessDomain === "MATERIAL") && (
                <>
                  <option value="DELIVERY_DELAY">
                    1. Material Delivery Delay (+N Days)
                  </option>
                  <option value="PRICE_INCREASE">
                    2. Material Unit Price Surge (+X%)
                  </option>
                </>
              )}
              {(perms.accessDomain === "FULL" ||
                perms.accessDomain === "CONSTRUCTION") && (
                <>
                  <option value="EQUIPMENT_BREAKDOWN">
                    3. Critical Plant Breakdown
                  </option>
                  <option value="CONSUMPTION_SURGE">
                    4. Site Consumption Surge (+X%)
                  </option>
                </>
              )}
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
                  {perms.canAssignRiskActions ? (
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
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-amber-400">
                      {r.status} (Manager Control)
                    </span>
                  )}
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

      {/* Floating AI Copilot Launcher Button (when minimized, if not using global copilot) */}
      {!onToggleCopilot && !isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 border-2 border-indigo-400/60 hover:scale-105 transition-all"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-sm">🤖</span>
          <span>Ask AI Risk Copilot 💬</span>
        </button>
      )}

      {/* Floating AI Copilot Chat Window (Fallback when not using global copilot) */}
      {!onToggleCopilot && isChatOpen && (
        <div className="fixed bottom-6 right-6 w-[94vw] sm:w-[500px] md:w-[560px] h-[75vh] min-h-[540px] max-h-[88vh] bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-md animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-4 py-3 border-b border-indigo-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <span>BuildSmart AI Risk Copilot</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                    75% Height
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Live unified risk graph • Project: {projectCode}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1.5 rounded-lg hover:bg-slate-800 text-sm transition-all"
                title="Minimize Copilot Window"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="p-2.5 bg-slate-950 border-b border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 font-bold">Quick Risk Queries:</div>
            <div className="flex flex-wrap gap-1.5">
              {presetQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskCopilot(q)}
                  className="text-left text-[10px] bg-slate-900 hover:bg-indigo-900/60 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-all truncate max-w-[240px]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Body (Takes full remaining vertical space with generous height) */}
          <div className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto bg-slate-950/95 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl whitespace-pre-line shadow-md ${
                  msg.role === "USER"
                    ? "bg-indigo-600 text-white ml-10 font-medium"
                    : "bg-slate-900 border border-slate-800 text-slate-200 mr-6"
                }`}
              >
                <div className="font-bold text-[10px] text-slate-400 uppercase mb-1 flex items-center justify-between">
                  <span>{msg.role === "USER" ? currentUser.name : "🤖 AI Risk Copilot"}</span>
                  <span className="font-mono text-[9px] text-slate-500">Live DB</span>
                </div>
                <div className="leading-relaxed">{msg.text}</div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-slate-500">Sources:</span>
                    {msg.sources.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[9px]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sticky Input Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI Copilot about site risks, delay impacts, or mitigation..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskCopilot(chatInput)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={() => handleAskCopilot(chatInput)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow transition-all flex items-center gap-1"
            >
              <span>Send</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
