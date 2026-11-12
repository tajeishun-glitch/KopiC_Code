"use client";

import React, { useState } from "react";

interface ProjectBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SiteZone {
  id: string;
  name: string;
  code: string;
  type: "CORE" | "LOGISTICS" | "SECURITY" | "ADMIN" | "DEFECT";
  status: "ACTIVE" | "INSPECTION" | "RESTRICTED" | "CLEAR";
  workers: number;
  equipment: string;
  inventory: string;
  hazards: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

export const ProjectBlueprintModal: React.FC<ProjectBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("ZONE_A");
  const [mapStyle, setMapStyle] = useState<"CAD" | "GOOGLE_MAPS">("GOOGLE_MAPS");
  const [showHazards, setShowHazards] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen) return null;

  const siteZones: SiteZone[] = [
    {
      id: "ENTRANCE",
      name: "Main Site Entrance & Security Weighbridge",
      code: "GATE-01",
      type: "SECURITY",
      status: "CLEAR",
      workers: 6,
      equipment: "Biometric Turnstile, 80-Ton Truck Weighbridge, Automated Boom Gate",
      inventory: "2x Ready-Mix Mixers Inbound (ETA 12m)",
      hazards: "Heavy vehicle movement, blind spot warning",
      x: 30,
      y: 380,
      w: 120,
      h: 80,
      color: "#0284c7",
    },
    {
      id: "ZONE_A",
      name: "Zone A: Tower 1 Substructure & Deep Excavation",
      code: "ZONE-A",
      type: "CORE",
      status: "ACTIVE",
      workers: 38,
      equipment: "Tower Crane TC-01 (Working), Hydraulic Rig HR-02, Dewatering Pumps",
      inventory: "High-Tensile Rebar (Y25): 85 MT, Formwork Panels",
      hazards: "Deep basement pit (18m), active crane suspended loads",
      x: 200,
      y: 120,
      w: 180,
      h: 150,
      color: "#f59e0b",
    },
    {
      id: "ZONE_B",
      name: "Zone B: Transfer Beam & Concourse Slab",
      code: "ZONE-B",
      type: "CORE",
      status: "ACTIVE",
      workers: 45,
      equipment: "Mobile Concrete Pump MP-04, Post-Tensioning Jacks, Laser Screed",
      inventory: "Ready-Mix Concrete C40 (120 m³ scheduled), PT Strand Bundles",
      hazards: "High-pressure concrete lines, edge fall hazard at Level 2",
      x: 420,
      y: 120,
      w: 200,
      h: 150,
      color: "#10b981",
    },
    {
      id: "ZONE_C",
      name: "Zone C: Precast Yard & Steel Bending Facility",
      code: "ZONE-C",
      type: "LOGISTICS",
      status: "CLEAR",
      workers: 24,
      equipment: "Overhead Gantry Crane (25T), CNC Rebar Cutter, Bending Tables",
      inventory: "Fabricated Precast Beams: 28 Units, Deformed Bar Stock: 140 MT",
      hazards: "Flying sparks, heavy lifting travel path",
      x: 660,
      y: 100,
      w: 190,
      h: 180,
      color: "#8b5cf6",
    },
    {
      id: "ZONE_D",
      name: "Zone D: Material Laydown & Batching Yard",
      code: "ZONE-D",
      type: "LOGISTICS",
      status: "ACTIVE",
      workers: 18,
      equipment: "Dry Batching Silo, Wheel Loader CAT-950, Heavy Forklift",
      inventory: "Bulk Portland Cement: 95 MT, Sand Aggregate: 420 MT",
      hazards: "Airborne dust, heavy equipment reversing zones",
      x: 220,
      y: 310,
      w: 220,
      h: 150,
      color: "#06b6d4",
    },
    {
      id: "ZONE_E",
      name: "Zone E: Site Admin Office & Safety Induction Center",
      code: "ZONE-E",
      type: "ADMIN",
      status: "CLEAR",
      workers: 14,
      equipment: "Site Command Server, First Aid Clinic, HSE Induction Hall",
      inventory: "Emergency PPE Reserve (150 helmets, 200 vests)",
      hazards: "None (Designated Green Safe Zone & Assembly Point #1)",
      x: 480,
      y: 320,
      w: 180,
      h: 140,
      color: "#3b82f6",
    },
    {
      id: "REJECT_BAY",
      name: "Quarantine & Quality Reject Bay",
      code: "BAY-DEFECT",
      type: "DEFECT",
      status: "RESTRICTED",
      workers: 4,
      equipment: "Lockout Boundary, Ultrasonic Thickness Tester",
      inventory: "6x Rejected Concrete Test Cubes, 12x Rust-Exceeded Y32 Rebar Bundles",
      hazards: "Awaiting vendor return dispatch (Southern Steel Works)",
      x: 700,
      y: 320,
      w: 150,
      h: 140,
      color: "#ef4444",
    },
  ];

  const activeZone = siteZones.find((z) => z.id === selectedZoneId) || siteZones[1];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xl text-sky-400">
              🗺️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">
                  Project 2D Blueprint &amp; GIS Site Map
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                  GPS: 3°08&apos;24.2&quot;N 101°41&apos;15.8&quot;E
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gamuda Central Concourse • Lot 488 Autonomous Site Logistics Plan
              </p>
            </div>
          </div>

          {/* Controls on Header */}
          <div className="flex items-center gap-2">
            {/* Map Style Toggle */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                onClick={() => setMapStyle("GOOGLE_MAPS")}
                className={`px-2.5 py-1 rounded font-mono font-bold transition-all ${
                  mapStyle === "GOOGLE_MAPS"
                    ? "bg-sky-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🗺️ Google Maps Style
              </button>
              <button
                onClick={() => setMapStyle("CAD")}
                className={`px-2.5 py-1 rounded font-mono font-bold transition-all ${
                  mapStyle === "CAD"
                    ? "bg-sky-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📐 CAD Blueprint
              </button>
            </div>

            {/* Hazards Overlay Toggle */}
            <button
              onClick={() => setShowHazards(!showHazards)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all flex items-center gap-1 ${
                showHazards
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <span>⚠️ Hazards</span>
              <span>{showHazards ? "ON" : "OFF"}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors border border-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Content Layout: 2D Map on Left, Zone Inspector on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* 2D Interactive Map Container */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col p-4 items-center justify-center select-none">
            {/* Map Canvas Background */}
            <div
              className={`w-full max-w-[880px] h-[480px] rounded-xl border relative shadow-2xl transition-all duration-300 overflow-hidden ${
                mapStyle === "GOOGLE_MAPS"
                  ? "bg-[#1a2332] border-slate-700"
                  : "bg-[#0b1329] border-sky-900/60"
              }`}
              style={{
                backgroundImage:
                  mapStyle === "CAD"
                    ? "radial-gradient(#1e3a8a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)"
                    : "linear-gradient(#202d42 1px, transparent 1px), linear-gradient(to right, #202d42 1px, transparent 1px)",
                backgroundSize: mapStyle === "CAD" ? "20px 20px" : "40px 40px",
              }}
            >
              {/* Compass Rose */}
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-center z-10 shadow-lg">
                <span className="text-red-400 font-bold font-mono text-xs block">▲ N</span>
                <span className="text-[10px] text-slate-400 font-mono">SITE 1</span>
              </div>

              {/* Entrance Access Road */}
              <div className="absolute left-0 top-[390px] w-24 h-12 bg-slate-700/60 border-y border-dashed border-amber-400/50 flex items-center justify-center text-[10px] text-amber-300 font-mono font-bold">
                JALAN SITE ➔
              </div>

              {/* Assembly Point 1 */}
              <div className="absolute left-[450px] top-[290px] flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono z-10">
                <span>🟢</span>
                <span>Assembly Point #1</span>
              </div>

              {/* Interactive SVG Zones */}
              <svg className="w-full h-full" viewBox="0 0 880 480">
                {/* Site Perimeter Boundary */}
                <rect
                  x="15"
                  y="15"
                  width="850"
                  height="450"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.5"
                />

                {/* Crane Swivel Radii */}
                <circle
                  cx="290"
                  cy="195"
                  r="130"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.35"
                />
                <text x="280" y="75" fill="#f59e0b" fontSize="10" fontFamily="monospace" opacity="0.8">
                  TC-01 RADIUS (55M)
                </text>

                {/* Internal Logistics Haul Road */}
                <path
                  d="M 150 420 L 220 420 L 220 280 L 640 280 L 640 380 L 850 380"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.4"
                />
                <path
                  d="M 150 420 L 220 420 L 220 280 L 640 280 L 640 380 L 850 380"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="2"
                  strokeDasharray="10 8"
                  opacity="0.8"
                />

                {/* Render Each Zone */}
                {siteZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className="cursor-pointer transition-all duration-200 group"
                    >
                      {/* Zone Box */}
                      <rect
                        x={zone.x}
                        y={zone.y}
                        width={zone.w}
                        height={zone.h}
                        rx="8"
                        fill={zone.color}
                        fillOpacity={isSelected ? 0.35 : 0.15}
                        stroke={zone.color}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="group-hover:fill-opacity-30 transition-all"
                      />

                      {/* Zone Code Tag */}
                      <rect
                        x={zone.x + 8}
                        y={zone.y + 8}
                        width="68"
                        height="20"
                        rx="4"
                        fill={zone.color}
                      />
                      <text
                        x={zone.x + 14}
                        y={zone.y + 22}
                        fill="#020617"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {zone.code}
                      </text>

                      {/* Zone Title */}
                      <text
                        x={zone.x + 10}
                        y={zone.y + 46}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {zone.name.split(":")[0]}
                      </text>

                      {/* Subtitle / Activity */}
                      <text
                        x={zone.x + 10}
                        y={zone.y + 64}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {zone.workers} Workers • {zone.status}
                      </text>

                      {/* Hazard Icon Badge if ON */}
                      {showHazards && zone.type === "DEFECT" && (
                        <circle
                          cx={zone.x + zone.w - 18}
                          cy={zone.y + 18}
                          r="10"
                          fill="#ef4444"
                          className="animate-ping"
                        />
                      )}
                      {showHazards && (
                        <text
                          x={zone.x + zone.w - 24}
                          y={zone.y + 22}
                          fontSize="12"
                        >
                          {zone.type === "DEFECT"
                            ? "⛔"
                            : zone.type === "CORE"
                            ? "⚠️"
                            : "✓"}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Map Scale Footer */}
              <div className="absolute bottom-2 left-3 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Scale: 1:500</span>
                <span className="w-12 h-1.5 bg-slate-400 inline-block"></span>
                <span>50m</span>
              </div>
            </div>
          </div>

          {/* Zone Detail Inspector Sidebar */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span
                  className="text-xs px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider inline-block mb-1.5"
                  style={{
                    backgroundColor: `${activeZone.color}25`,
                    color: activeZone.color,
                    border: `1px solid ${activeZone.color}60`,
                  }}
                >
                  {activeZone.code} • {activeZone.status}
                </span>
                <h4 className="text-white font-bold text-base leading-snug">
                  {activeZone.name}
                </h4>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[10px]">ACTIVE WORKERS</div>
                  <div className="text-amber-400 font-bold text-lg">
                    👷 {activeZone.workers} Pax
                  </div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[10px]">ZONE TYPE</div>
                  <div className="text-sky-400 font-bold text-sm mt-0.5">
                    {activeZone.type}
                  </div>
                </div>
              </div>

              {/* Equipment Assigned */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-slate-400 font-mono text-[11px] font-bold mb-1 flex items-center gap-1">
                  <span>🚜</span>
                  <span>Assigned Heavy Equipment:</span>
                </div>
                <p className="text-slate-200">{activeZone.equipment}</p>
              </div>

              {/* Live Inventory Stock */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="text-emerald-400 font-mono text-[11px] font-bold mb-1 flex items-center gap-1">
                  <span>📦</span>
                  <span>Live Material Allocation:</span>
                </div>
                <p className="text-slate-200">{activeZone.inventory}</p>
              </div>

              {/* HSE Hazard Profile */}
              <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-600/30 text-xs">
                <div className="text-amber-400 font-mono text-[11px] font-bold mb-1 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Safety Risk &amp; Permits:</span>
                </div>
                <p className="text-amber-200/90">{activeZone.hazards}</p>
              </div>
            </div>

            {/* Quick Actions at Bottom */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 font-mono">
                SELECT OTHER ZONES:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {siteZones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                      selectedZoneId === z.id
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {z.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
