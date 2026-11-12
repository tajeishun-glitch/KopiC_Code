"use client";

import React, { useState } from "react";
import { RoleType } from "@/lib/seed-data";

export type DroneAvailabilityStatus = "AVAILABLE" | "CHARGING" | "UNAVAILABLE";

export interface SiteDrone {
  id: string;
  name: string;
  callsign: string;
  model: string;
  status: DroneAvailabilityStatus;
  battery: number;
  altitudeM: number;
  speedKmh: number;
  windSpeed: string;
  assignedZone: string;
  gps: string;
  flightMode: string;
  statusNote: string;
  videoSource?: string;
  dockStation?: string;
  maintenanceReason?: string;
  assignedTechnician?: string;
  etaReady?: string;
}

export const INITIAL_DRONE_FLEET: SiteDrone[] = [
  {
    id: "DRN-GAMUDA-01",
    name: "Drone 01",
    callsign: "SKY-ALPHA-01",
    model: "DJI Matrice 350 RTK",
    status: "AVAILABLE",
    battery: 92,
    altitudeM: 124.5,
    speedKmh: 16.8,
    windSpeed: "5.2 m/s NW",
    assignedZone: "Zone A • Main Tower Core & Crane TC-01",
    gps: `3°08'42.1"N 101°41'22.4"E`,
    flightMode: "AUTONOMOUS AIRBORNE PATROL",
    statusNote: "Airborne • High-resolution site perimeter scan in progress",
    videoSource: "/drone-view-demo.mp4",
  },
  {
    id: "DRN-GAMUDA-02",
    name: "Drone 02",
    callsign: "SKY-BETA-02",
    model: "DJI Mavic 3 Enterprise (Thermal)",
    status: "AVAILABLE",
    battery: 84,
    altitudeM: 86.0,
    speedKmh: 14.1,
    windSpeed: "4.8 m/s NW",
    assignedZone: "Zone B • Rebar Stockpile & Delivery Yard Gate",
    gps: `3°08'49.3"N 101°41'19.1"E`,
    flightMode: "STOCKPILE VOLUMETRIC SURVEY",
    statusNote: "Airborne • Volumetric survey of Steel Rebar & Structural Precast",
    videoSource: "/drone-view-demo.mp4",
  },
  {
    id: "DRN-GAMUDA-03",
    name: "Drone 03",
    callsign: "SKY-GAMMA-03",
    model: "Skydio X2 Construction AI",
    status: "CHARGING",
    battery: 48,
    altitudeM: 0,
    speedKmh: 0,
    windSpeed: "Docked (Sheltered)",
    assignedZone: "Sub-Basement B2 • Automated UAV Dock Station 02",
    gps: `3°08'39.8"N 101°41'25.4"E`,
    flightMode: "DOCKED & FAST-CHARGING",
    statusNote: "Docked at Smart Pad B2 • Fast-charging at 65W (+1.8% / min)",
    dockStation: "Smart Dock Station B2 (Fast Charge Pad #2)",
    etaReady: "approx. 18 minutes to 100%",
  },
  {
    id: "DRN-GAMUDA-04",
    name: "Drone 04",
    callsign: "SKY-DELTA-04",
    model: "Autel EVO Max 4T LiDAR",
    status: "UNAVAILABLE",
    battery: 15,
    altitudeM: 0,
    speedKmh: 0,
    windSpeed: "Hangar (Grounded)",
    assignedZone: "Site Engineering Workshop • UAV Service Bay 04",
    gps: `3°08'34.5"N 101°41'30.8"E`,
    flightMode: "GROUNDED • MAINTENANCE INSPECTION",
    statusNote: "Scheduled 100-Hr Gimbal Overhaul & Obstacle Sensor Recalibration",
    maintenanceReason:
      "Bi-weekly ISO-safety certification and LiDAR optical sensor recalibration in progress per site safety SOP.",
    assignedTechnician: "Ir. Hazim (Lead UAV Field Engineer)",
    etaReady: "Tomorrow, 09:00 AM",
  },
];

interface DroneVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  userRole?: RoleType;
  userName?: string;
}

export function DroneVisionModal({
  isOpen,
  onClose,
  projectCode,
  userRole = "PROJECT_MANAGER",
  userName = "Ir. Razak Ahmad",
}: DroneVisionModalProps) {
  const [drones] = useState<SiteDrone[]>(INITIAL_DRONE_FLEET);
  const [selectedDroneId, setSelectedDroneId] = useState<string>("DRN-GAMUDA-01");
  // User selects drone first before enter!
  const [viewStage, setViewStage] = useState<"SELECT_DRONE" | "ENTERED_FEED">("SELECT_DRONE");
  const [cameraMode, setCameraMode] = useState<"OPTICAL" | "THERMAL">("OPTICAL");
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);
  const [captureNotice, setCaptureNotice] = useState<string>("");

  if (!isOpen) return null;

  const currentDrone =
    drones.find((d) => d.id === selectedDroneId) || drones[0];

  // Helper status color styling for Green (Available), Yellow (Charging), Red (Unavailable)
  const getStatusBadge = (status: DroneAvailabilityStatus) => {
    switch (status) {
      case "AVAILABLE":
        return {
          pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/60",
          text: "Available",
          dot: "bg-emerald-400",
          border: "border-emerald-500/60",
          headerBorder: "border-emerald-500/40",
          glow: "shadow-emerald-500/10",
          blockBg: "bg-emerald-950/20 hover:bg-emerald-900/30",
          activeRing: "ring-2 ring-emerald-500 border-emerald-400 bg-emerald-950/45",
          btnColor: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
          textColor: "text-emerald-400",
        };
      case "CHARGING":
        return {
          pill: "bg-amber-500/20 text-amber-300 border-amber-500/60",
          text: "Charging",
          dot: "bg-amber-400",
          border: "border-amber-500/60",
          headerBorder: "border-amber-500/40",
          glow: "shadow-amber-500/10",
          blockBg: "bg-amber-950/20 hover:bg-amber-900/30",
          activeRing: "ring-2 ring-amber-500 border-amber-400 bg-amber-950/45",
          btnColor: "bg-amber-500 hover:bg-amber-400 text-slate-950",
          textColor: "text-amber-400",
        };
      case "UNAVAILABLE":
        return {
          pill: "bg-rose-500/20 text-rose-300 border-rose-500/60",
          text: "Unavailable",
          dot: "bg-rose-500",
          border: "border-rose-500/60",
          headerBorder: "border-rose-500/40",
          glow: "shadow-rose-500/10",
          blockBg: "bg-rose-950/20 hover:bg-rose-900/30",
          activeRing: "ring-2 ring-rose-500 border-rose-400 bg-rose-950/45",
          btnColor: "bg-rose-600 hover:bg-rose-500 text-white",
          textColor: "text-rose-400",
        };
    }
  };

  const availableCount = drones.filter((d) => d.status === "AVAILABLE").length;
  const chargingCount = drones.filter((d) => d.status === "CHARGING").length;
  const unavailableCount = drones.filter((d) => d.status === "UNAVAILABLE").length;

  const handleEnterDrone = () => {
    setViewStage("ENTERED_FEED");
  };

  const handleBackToSelect = () => {
    setViewStage("SELECT_DRONE");
  };

  const selectedBadge = getStatusBadge(currentDrone.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* ============================================================== */}
        {/* MODAL HEADER                                                   */}
        {/* ============================================================== */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xl shadow-inner">
              🛸
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-white text-base tracking-tight">
                  {viewStage === "SELECT_DRONE"
                    ? "Select Site Drone (Fleet Overview)"
                    : `Drone Telemetry Feed • ${currentDrone.name}`}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  UAV AIRSPACE
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Project{" "}
                <span className="text-amber-400 font-mono font-bold">
                  [{projectCode}]
                </span>{" "}
                • Operator: <strong className="text-white">{userName}</strong>
              </p>
            </div>
          </div>

          {/* Quick Fleet Availability Summary: Green, Yellow, Red */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-bold hidden md:inline">FLEET STATUS:</span>
              <span
                className="flex items-center gap-1.5 text-emerald-400 font-semibold"
                title="Available (Green)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{availableCount} Available</span>
              </span>
              <span className="text-slate-600">|</span>
              <span
                className="flex items-center gap-1.5 text-amber-400 font-semibold"
                title="Charging (Yellow)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>{chargingCount} Charging</span>
              </span>
              <span className="text-slate-600">|</span>
              <span
                className="flex items-center gap-1.5 text-rose-400 font-semibold"
                title="Unavailable (Red)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>{unavailableCount} Unavailable</span>
              </span>
            </div>

            <button
              onClick={() => {
                setViewStage("SELECT_DRONE");
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm font-bold w-8 h-8 flex items-center justify-center"
              title="Close Drone Vision"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* STAGE 1: DRONE SELECTION SCREEN (SELECT FIRST BEFORE ENTER)    */}
        {/* ============================================================== */}
        {viewStage === "SELECT_DRONE" ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Guide Banner */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🧭</span>
                  <span>Step 1: Select a Drone Unit from the Fleet</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Each block below indicates 1 registered drone with live availability:{" "}
                  <strong className="text-emerald-400">Available (Green)</strong>,{" "}
                  <strong className="text-amber-400">Charging (Yellow)</strong>, or{" "}
                  <strong className="text-rose-400">Unavailable (Red)</strong>.
                </p>
              </div>

              {/* Color Legend Bar */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>GREEN: AVAILABLE</span>
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>YELLOW: CHARGING</span>
                </span>
                <span className="px-2 py-1 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>RED: UNAVAILABLE</span>
                </span>
              </div>
            </div>

            {/* DRONE BLOCKS GRID (1 BLOCK = 1 DRONE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {drones.map((drone) => {
                const isSelected = drone.id === selectedDroneId;
                const statusCfg = getStatusBadge(drone.status);

                return (
                  <div
                    key={drone.id}
                    onClick={() => setSelectedDroneId(drone.id)}
                    onDoubleClick={handleEnterDrone}
                    className={`cursor-pointer rounded-2xl border-2 p-4 flex flex-col justify-between transition-all relative overflow-hidden group shadow-lg ${
                      isSelected
                        ? `${statusCfg.activeRing} scale-[1.02]`
                        : `${statusCfg.border} ${statusCfg.blockBg} opacity-85 hover:opacity-100 hover:scale-[1.01]`
                    }`}
                  >
                    {/* Selected Active Ribbon */}
                    {isSelected && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-2.5 py-0.5 rounded-bl-lg shadow-sm">
                          SELECTED
                        </div>
                      </div>
                    )}

                    {/* Block Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl p-1.5 rounded-lg bg-slate-900 border border-slate-700">
                            🛸
                          </span>
                          <div>
                            <div className="text-sm font-black text-white font-mono leading-tight">
                              {drone.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {drone.id}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AVAILABILITY BADGE: Green / Yellow / Red */}
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${statusCfg.pill}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${statusCfg.dot} ${
                              drone.status === "AVAILABLE" ? "animate-ping" : ""
                            }`}
                          />
                          <span>{statusCfg.text.toUpperCase()}</span>
                        </span>
                      </div>

                      {/* Drone Model & Specs */}
                      <div className="pt-1">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {drone.model}
                        </div>
                        <div className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                          Callsign: {drone.callsign}
                        </div>
                      </div>

                      {/* Location / Zone */}
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono space-y-1">
                        <div className="text-slate-400 text-[9px]">ASSIGNED LOCATION:</div>
                        <div className="font-semibold text-slate-200 line-clamp-2">
                          {drone.assignedZone}
                        </div>
                      </div>
                    </div>

                    {/* Block Footer: Battery & Enter Button */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">BATTERY:</span>
                        <span className={`font-black flex items-center gap-1 ${statusCfg.textColor}`}>
                          {drone.status === "CHARGING" ? "⚡ " : ""}
                          {drone.battery}%
                        </span>
                      </div>

                      {/* Mini Battery Fill Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 p-0.5 border border-slate-700/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            drone.status === "AVAILABLE"
                              ? "bg-emerald-500"
                              : drone.status === "CHARGING"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${drone.battery}%` }}
                        />
                      </div>

                      {/* Enter Drone Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDroneId(drone.id);
                          handleEnterDrone();
                        }}
                        className={`w-full py-2 rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? statusCfg.btnColor
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                      >
                        {drone.status === "AVAILABLE" ? (
                          <>
                            <span>Enter Drone Feed</span>
                            <span>→</span>
                          </>
                        ) : drone.status === "CHARGING" ? (
                          <>
                            <span>View Dock Status</span>
                            <span>→</span>
                          </>
                        ) : (
                          <>
                            <span>View Diagnostics</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Selection Confirmation & Direct Enter CTA */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-xs font-mono text-slate-400">CURRENT SELECTION:</div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>{currentDrone.name} ({currentDrone.model})</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${selectedBadge.pill}`}
                    >
                      {selectedBadge.text.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentDrone.statusNote}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleEnterDrone}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center gap-2 ${selectedBadge.btnColor}`}
                >
                  {currentDrone.status === "AVAILABLE" ? (
                    <>
                      <span>Enter Live Drone Telemetry &amp; Camera</span>
                      <span className="text-sm">→</span>
                    </>
                  ) : currentDrone.status === "CHARGING" ? (
                    <>
                      <span>Enter Dock Station Telemetry</span>
                      <span className="text-sm">→</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Grounded Maintenance Report</span>
                      <span className="text-sm">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* STAGE 2: ENTERED DRONE TELEMETRY & LIVE CAMERA FEED            */
          /* ============================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Top Toolbar: Back Button & Quick Switcher Blocks */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToSelect}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs shadow-md transition-colors flex items-center gap-1.5"
                  title="Return to Drone Fleet Selection"
                >
                  <span>←</span>
                  <span>Select Another Drone</span>
                </button>

                <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

                {/* Quick Blocks Switcher */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400">SWITCH:</span>
                  {drones.map((d) => {
                    const isCur = d.id === selectedDroneId;
                    const st = getStatusBadge(d.status);
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDroneId(d.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all flex items-center gap-1 ${
                          isCur
                            ? `${st.pill} ring-1 ring-amber-400`
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span>{d.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Drone Tag */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">ACTIVE:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {currentDrone.name} [{currentDrone.id}]
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black border ${selectedBadge.pill}`}
                >
                  {selectedBadge.text.toUpperCase()}
                </span>
              </div>
            </div>

            {/* DRONE STATUS 1: AVAILABLE (LIVE STREAM & HUD) */}
            {currentDrone.status === "AVAILABLE" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Live Video Feed Container with HUD */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-2xl flex items-center justify-center">
                  {/* Drone Camera Video Background */}
                  {cameraMode === "OPTICAL" ? (
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-950/40 via-slate-900 to-slate-950 flex items-center justify-center">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        poster="https://images.unsplash.com/photo-1541888946425-d0fbb186241a?auto=format&fit=crop&w=1200&q=80"
                      >
                        <source src="/drone-view-demo.mp4" type="video/mp4" />
                        <source
                          src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-construction-site-41221-large.mp4"
                          type="video/mp4"
                        />
                      </video>
                    </div>
                  ) : (
                    /* Thermal Infrared Vision Simulation with live drone feed */
                    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover filter contrast-200 invert hue-rotate-180 brightness-110"
                      >
                        <source src="/drone-view-demo.mp4" type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-purple-900/40 to-amber-700/50 mix-blend-color pointer-events-none" />
                    </div>
                  )}

                  {/* Crosshair Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-24 h-24 border border-white/20 rounded-full flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-amber-400" />
                      <div className="h-4 w-0.5 bg-amber-400 absolute" />
                    </div>
                  </div>

                  {/* MANDATORY: EXAMPLE BADGE IN THE MIDDLE OF VIDEO */}
                  <div className="absolute z-20 pointer-events-none px-6 py-2.5 rounded-xl bg-slate-950/80 border-2 border-amber-400 text-amber-300 font-mono font-black text-xl sm:text-2xl tracking-widest shadow-2xl backdrop-blur-sm animate-pulse flex items-center gap-3">
                    <span className="text-red-500 text-base">🔴 LIVE</span>
                    <span>EXAMPLE</span>
                    <span className="text-xs text-slate-300 font-normal hidden sm:inline">
                      (DRONE VISION DEMO)
                    </span>
                  </div>

                  {/* HUD Top Left Telemetry */}
                  <div className="absolute top-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-200 space-y-0.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <strong className="text-white">UAV: {currentDrone.id}</strong>
                      <span className="text-[10px] text-amber-400">({currentDrone.callsign})</span>
                    </div>
                    <div className="text-amber-400 font-bold">
                      PROJECT: {projectCode}
                    </div>
                    <div className="text-slate-400">
                      GPS: {currentDrone.gps}
                    </div>
                    <div className="text-sky-300 font-semibold">
                      MODE: {currentDrone.flightMode}
                    </div>
                  </div>

                  {/* HUD Top Right Telemetry */}
                  <div className="absolute top-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-200 text-right space-y-0.5 shadow-lg">
                    <div>
                      ALT: <strong className="text-amber-400">{currentDrone.altitudeM} m</strong>
                    </div>
                    <div>
                      SPEED: <strong className="text-white">{currentDrone.speedKmh} km/h</strong>
                    </div>
                    <div>
                      BATTERY:{" "}
                      <strong className="text-emerald-400">{currentDrone.battery}% [|||||]</strong>
                    </div>
                    <div>
                      WIND: <strong className="text-sky-300">{currentDrone.windSpeed}</strong>
                    </div>
                  </div>

                  {/* HUD Bottom Left Telemetry */}
                  <div className="absolute bottom-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-3">
                    <span>GIMBAL: -45.0°</span>
                    <span>REC: 00:23:18</span>
                    <span className="text-emerald-400 font-bold">4K 60FPS</span>
                  </div>

                  {/* AI Detection Bounding Boxes Overlay */}
                  {showAiOverlay && (
                    <div className="absolute inset-0 pointer-events-none p-8 flex items-center justify-between">
                      <div className="border border-amber-400/80 bg-amber-400/10 px-2 py-1 rounded text-[10px] font-mono text-amber-300 self-start mt-12">
                        [TOWER CRANE TC-01] • 98.4%
                      </div>
                      <div className="border border-emerald-400/80 bg-emerald-400/10 px-2 py-1 rounded text-[10px] font-mono text-emerald-300 self-end mb-8">
                        [STEEL REBAR STOCKYARD] • 96.2%
                      </div>
                    </div>
                  )}
                </div>

                {/* Drone Controls Toolbar */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">Camera Mode:</span>
                    <button
                      onClick={() => setCameraMode("OPTICAL")}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-colors ${
                        cameraMode === "OPTICAL"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      📷 Optical 4K
                    </button>
                    <button
                      onClick={() => setCameraMode("THERMAL")}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-colors ${
                        cameraMode === "THERMAL"
                          ? "bg-purple-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      🌡️ Thermal FLIR
                    </button>
                    <button
                      onClick={() => setShowAiOverlay(!showAiOverlay)}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono transition-colors ${
                        showAiOverlay
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {showAiOverlay ? "✓ AI BBoxes ON" : "AI BBoxes OFF"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCaptureNotice(
                          `✓ High-res aerial progress frame captured from ${currentDrone.name} (${currentDrone.id}) by ${userName} for project [${projectCode}]`
                        );
                        setTimeout(() => setCaptureNotice(""), 3500);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40 transition-colors"
                    >
                      📸 Capture Progress Frame
                    </button>
                    <button
                      onClick={() => {
                        setViewStage("SELECT_DRONE");
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {captureNotice && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold text-center animate-fadeIn">
                    {captureNotice}
                  </div>
                )}
              </div>
            )}

            {/* DRONE STATUS 2: CHARGING (YELLOW THEMED TELEMETRY & DOCK VIEW) */}
            {currentDrone.status === "CHARGING" && (
              <div className="bg-slate-950 border-2 border-amber-500/60 rounded-xl p-6 space-y-6 animate-fadeIn shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-2xl font-black">
                      ⚡
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white">
                          {currentDrone.name} [{currentDrone.id}]
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/50">
                          🟡 CHARGING
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Model: <strong className="text-white">{currentDrone.model}</strong> • Callsign:{" "}
                        <span className="text-amber-400 font-mono">{currentDrone.callsign}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400 block">DOCK LOCATION</span>
                    <span className="text-xs font-bold text-amber-300">{currentDrone.dockStation}</span>
                  </div>
                </div>

                {/* Charging Battery Visualizer */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-sm font-mono">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <strong>Rapid Battery Recharging Progress:</strong>
                    </span>
                    <span className="text-amber-400 font-black text-lg">
                      {currentDrone.battery}% Charged
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-700 animate-pulse"
                      style={{ width: `${currentDrone.battery}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">CHARGING RATE</div>
                      <div className="text-white font-bold mt-0.5">+1.8% / min (65W)</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">TIME TO FULL</div>
                      <div className="text-amber-300 font-bold mt-0.5">{currentDrone.etaReady}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">CELL TEMP</div>
                      <div className="text-emerald-400 font-bold mt-0.5">28.4°C (Optimal)</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">CYCLES</div>
                      <div className="text-slate-300 font-bold mt-0.5">42 / 500</div>
                    </div>
                  </div>
                </div>

                {/* Status Note & Quick Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="text-xs text-slate-300 max-w-xl">
                    ℹ️ <strong className="text-amber-300">Dock Notice:</strong> {currentDrone.statusNote}.{" "}
                    Switch to an available airborne drone to resume live video feed.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDroneId("DRN-GAMUDA-01")}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <span>🟢 Switch to Drone 01 (Available)</span>
                    </button>
                    <button
                      onClick={() => setSelectedDroneId("DRN-GAMUDA-02")}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition-colors"
                    >
                      <span>Switch to Drone 02</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DRONE STATUS 3: UNAVAILABLE (RED THEMED DIAGNOSTIC PANEL) */}
            {currentDrone.status === "UNAVAILABLE" && (
              <div className="bg-slate-950 border-2 border-rose-500/60 rounded-xl p-6 space-y-6 animate-fadeIn shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center text-2xl font-black">
                      🛠️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white">
                          {currentDrone.name} [{currentDrone.id}]
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/50">
                          🔴 UNAVAILABLE
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Model: <strong className="text-white">{currentDrone.model}</strong> • Callsign:{" "}
                        <span className="text-amber-400 font-mono">{currentDrone.callsign}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400 block">CURRENT LOCATION</span>
                    <span className="text-xs font-bold text-rose-300">{currentDrone.assignedZone}</span>
                  </div>
                </div>

                {/* Maintenance Reason & Safety Governance */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide flex items-center gap-2">
                    <span>⚠️ GROUNDED FOR SCHEDULED SERVICING &amp; CALIBRATION</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentDrone.maintenanceReason}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">LEAD TECHNICIAN</div>
                      <div className="text-white font-bold mt-0.5">{currentDrone.assignedTechnician}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">ESTIMATED READY</div>
                      <div className="text-rose-300 font-bold mt-0.5">{currentDrone.etaReady}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">TELEMETRY LINK</div>
                      <div className="text-rose-400 font-bold mt-0.5">DISCONNECTED</div>
                    </div>
                  </div>
                </div>

                {/* Fallback Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="text-xs text-slate-300 max-w-xl">
                    🛑 <strong className="text-rose-300">Airspace Safety Lockout:</strong> This UAV unit is not cleared for flight. To observe ongoing site operations, please switch to an available active drone.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDroneId("DRN-GAMUDA-01")}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <span>🟢 Switch to Drone 01 (Available)</span>
                    </button>
                    <button
                      onClick={() => setSelectedDroneId("DRN-GAMUDA-02")}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition-colors"
                    >
                      <span>Switch to Drone 02</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}