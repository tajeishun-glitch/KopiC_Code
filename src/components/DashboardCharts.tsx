"use client";

import React, { useState } from "react";
import {
  SeedProject,
  SeedInventoryItem,
  SeedDefectRecord,
  SeedRisk,
} from "@/lib/seed-data";

interface DashboardChartsProps {
  currentProject: SeedProject;
  inventory: SeedInventoryItem[];
  defects: SeedDefectRecord[];
  risks: SeedRisk[];
  accessDomain?: "FULL" | "CONSTRUCTION" | "MATERIAL";
  onNavigateTab: (tab: string) => void;
}

export function DashboardCharts({
  currentProject,
  inventory,
  defects,
  risks,
  accessDomain = "FULL",
  onNavigateTab,
}: DashboardChartsProps) {
  const showConstructionChart =
    accessDomain === "FULL" || accessDomain === "CONSTRUCTION";
  const showMaterialChart =
    accessDomain === "FULL" || accessDomain === "MATERIAL";
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeCurveMonth, setActiveCurveMonth] = useState<number | null>(null);

  // Material Spend Categories for Donut Chart
  const materialSpendData = [
    { name: "BS 4449 Rebar Steel", value: 42, color: "#f59e0b", costRm: "RM 52.3M", code: "STL-002" },
    { name: "C40 Ready-Mix Concrete", value: 28, color: "#0ea5e9", costRm: "RM 34.8M", code: "CON-004" },
    { name: "IBS Precast & Formwork", value: 15, color: "#10b981", costRm: "RM 18.7M", code: "IBS-PRE" },
    { name: "Portland Cement (CEM I)", value: 9, color: "#8b5cf6", costRm: "RM 11.2M", code: "CEM-001" },
    { name: "Station Architectural Finishes", value: 6, color: "#f43f5e", costRm: "RM 7.5M", code: "TIL-003" },
  ];

  // S-Curve Progress Data (Jan 2026 to Dec 2026)
  const sCurveData = [
    { month: "Jan", planned: 8, actual: 8, label: "Site Mobilization & D-Wall" },
    { month: "Feb", planned: 18, actual: 17, label: "Excavation Pit Stage 1" },
    { month: "Mar", planned: 29, actual: 28, label: "Strutting & Earth Retention" },
    { month: "Apr", planned: 39, actual: 38, label: "Base Slab Rebar Cage Fixing" },
    { month: "May", planned: 48, actual: 47, label: "B2 Slab Pour" },
    { month: "Jun", planned: 56, actual: 52, label: "Concourse Wall Shuttering" },
    { month: "Jul", planned: 65, actual: currentProject.actualCompletion, label: "Current Active Stage" },
    { month: "Aug", planned: 74, actual: null, label: "Platform Deck Erection" },
    { month: "Sep", planned: 82, actual: null, label: "MEP Conduit Rough-in" },
    { month: "Oct", planned: 90, actual: null, label: "Architectural Tiling" },
    { month: "Nov", planned: 96, actual: null, label: "System Testing & Commissioning" },
    { month: "Dec", planned: 100, actual: null, label: "Final Station Handover" },
  ];

  // SVG Helper calculation for Donut Chart
  let cumulativeAngle = 0;
  const donutSegments = materialSpendData.map((d, i) => {
    const angle = (d.value / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 100 + 75 * Math.cos(startRad);
    const y1 = 100 + 75 * Math.sin(startRad);
    const x2 = 100 + 75 * Math.cos(endRad);
    const y2 = 100 + 75 * Math.sin(endRad);

    const innerX1 = 100 + 48 * Math.cos(startRad);
    const innerY1 = 100 + 48 * Math.sin(startRad);
    const innerX2 = 100 + 48 * Math.cos(endRad);
    const innerY2 = 100 + 48 * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${innerX1} ${innerY1} L ${x1} ${y1} A 75 75 0 ${largeArc} 1 ${x2} ${y2} L ${innerX2} ${innerY2} A 48 48 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`;

    return { ...d, path, index: i };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. S-CURVE PROJECT PROGRESS & MILESTONE TRACKER (Line/Area Chart) */}
      {showConstructionChart && (
      <div className={`${showMaterialChart ? "lg:col-span-8" : "lg:col-span-12"} bg-slate-900 border border-slate-700/80 rounded-xl p-5 shadow-lg relative overflow-hidden`}>
        {/* Engineering Grid / Blueprint Background Accent */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-mono font-bold text-sm tracking-wide text-amber-400 uppercase">
                Cumulative S-Curve Progress Tracking
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {currentProject.projectCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Baseline Planned S-Curve vs Verified On-Site Physical Completion
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-sky-400">
              <span className="w-3 h-0.5 bg-sky-400 inline-block border-t border-sky-400 border-dashed" />
              <span>Target Baseline</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-1 bg-amber-400 inline-block rounded-full" />
              <span>Actual Verified</span>
            </div>
            <button
              onClick={() => onNavigateTab("M05_PROGRESS")}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline ml-2"
            >
              Update Milestones →
            </button>
          </div>
        </div>

        {/* SVG S-Curve Chart */}
        <div className="relative z-10 bg-slate-950/70 rounded-lg p-4 border border-slate-800">
          <svg viewBox="0 0 700 220" className="w-full h-52 overflow-visible select-none">
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = 190 - (val / 100) * 160;
              return (
                <g key={val}>
                  <line x1="45" y1={y} x2="680" y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
                  <text x="35" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Planned Baseline S-Curve Path */}
            <path
              d={`M ${sCurveData.map((d, i) => `${55 + i * 54},${190 - (d.planned / 100) * 160}`).join(" L ")}`}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="4,3"
            />

            {/* Actual Verified Progress Area + Path (up to Jul) */}
            <path
              d={`M 55,190 L ${sCurveData
                .filter((d) => d.actual !== null)
                .map((d, i) => `${55 + i * 54},${190 - (d.actual! / 100) * 160}`)
                .join(" L ")} L ${55 + 6 * 54},190 Z`}
              fill="url(#amberGradient)"
              opacity="0.2"
            />
            <path
              d={`M ${sCurveData
                .filter((d) => d.actual !== null)
                .map((d, i) => `${55 + i * 54},${190 - (d.actual! / 100) * 160}`)
                .join(" L ")}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
            />

            <defs>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Data Points */}
            {sCurveData.map((d, i) => {
              const x = 55 + i * 54;
              const yPlanned = 190 - (d.planned / 100) * 160;
              const yActual = d.actual !== null ? 190 - (d.actual / 100) * 160 : null;
              const isHovered = activeCurveMonth === i;

              return (
                <g
                  key={d.month}
                  className="cursor-pointer group"
                  onMouseEnter={() => setActiveCurveMonth(i)}
                  onMouseLeave={() => setActiveCurveMonth(null)}
                >
                  {/* Vertical hover column indicator */}
                  {isHovered && (
                    <line x1={x} y1="30" x2={x} y2="190" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                  )}

                  {/* Planned Point */}
                  <circle cx={x} cy={yPlanned} r="3" fill="#0284c7" />

                  {/* Actual Point */}
                  {yActual !== null && (
                    <circle
                      cx={x}
                      cy={yActual}
                      r={isHovered ? 6 : 4}
                      fill="#f59e0b"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  )}

                  {/* Month Label */}
                  <text
                    x={x}
                    y="208"
                    fill={isHovered ? "#fbbf24" : "#94a3b8"}
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {activeCurveMonth !== null && (
            <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-amber-500/40 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-amber-400">
                  {sCurveData[activeCurveMonth].month} 2026:
                </span>
                <span className="text-slate-200">{sCurveData[activeCurveMonth].label}</span>
              </div>
              <div className="flex items-center gap-4 font-mono font-bold">
                <span className="text-sky-400">
                  Target: {sCurveData[activeCurveMonth].planned}%
                </span>
                {sCurveData[activeCurveMonth].actual !== null ? (
                  <span className="text-amber-400">
                    Actual: {sCurveData[activeCurveMonth].actual}% (
                    {sCurveData[activeCurveMonth].actual! - sCurveData[activeCurveMonth].planned}% Var)
                  </span>
                ) : (
                  <span className="text-slate-500">Scheduled Forecast</span>
                )}
              </div>
            </div>
          )}

          {activeCurveMonth === null && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>Status: <strong className="text-rose-400">{currentProject.actualCompletion - currentProject.plannedCompletion}% Behind Schedule</strong> on Structural Work</span>
              {accessDomain === "FULL" ? (
                <span>Project Budget: <strong className="text-slate-200">RM {(currentProject.budgetRm / 1e6).toFixed(1)}M</strong> (Spent: RM {(currentProject.spentRm / 1e6).toFixed(1)}M)</span>
              ) : (
                <span> Scope: <strong className="text-sky-400">Construction &amp; Site Engineering View</strong></span>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* 2. MATERIAL INVENTORY SPEND BREAKDOWN (Interactive Donut / Pie Chart) */}
      {showMaterialChart && (
      <div className={`${showConstructionChart ? "lg:col-span-4" : "lg:col-span-12"} bg-slate-900 border border-slate-700/80 rounded-xl p-5 shadow-lg flex flex-col justify-between`}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <h3 className="font-mono font-bold text-sm tracking-wide text-sky-400 uppercase">
                Material Spend Allocation
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("M02_INVENTORY")}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 underline"
            >
              Live Stock →
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Total Capital Allocation Across Core Construction Trade Packages
          </p>

          {/* Donut SVG */}
          <div className="flex items-center justify-center relative my-2">
            <svg viewBox="0 0 200 200" className="w-44 h-44 select-none">
              {donutSegments.map((seg) => (
                <path
                  key={seg.name}
                  d={seg.path}
                  fill={seg.color}
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  style={{
                    transformOrigin: "100px 100px",
                    transform: activePieIndex === seg.index ? "scale(1.05)" : "scale(1)",
                  }}
                  onMouseEnter={() => setActivePieIndex(seg.index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                />
              ))}

              {/* Inner Center Text */}
              <text x="100" y="93" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                Total Budget
              </text>
              <text x="100" y="112" textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="bold" fontFamily="monospace">
                RM {(currentProject.budgetRm / 1e6).toFixed(1)}M
              </text>
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800 text-xs">
          {materialSpendData.map((item, idx) => (
            <div
              key={item.name}
              onMouseEnter={() => setActivePieIndex(idx)}
              onMouseLeave={() => setActivePieIndex(null)}
              className={`flex items-center justify-between p-1.5 rounded transition-all cursor-pointer ${
                activePieIndex === idx ? "bg-slate-800 border border-slate-600" : "hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-slate-400">{item.costRm}</span>
                <span className="text-amber-400 w-8 text-right">{item.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
