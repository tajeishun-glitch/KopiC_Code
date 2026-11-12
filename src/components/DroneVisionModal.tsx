"use client";

import React, { useState } from "react";

interface DroneVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
}

export function DroneVisionModal({
  isOpen,
  onClose,
  projectCode,
}: DroneVisionModalProps) {
  const [droneId, setDroneId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [cameraMode, setCameraMode] = useState<"OPTICAL" | "THERMAL">("OPTICAL");
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleAutofillDemo = () => {
    setDroneId("DRN-GAMUDA-8802");
    setPassword("UAV-SECURE-2026");
    setAuthError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneId.trim()) {
      setAuthError("Please enter a valid Drone ID.");
      return;
    }
    if (!password.trim()) {
      setAuthError("Please enter the Drone Access Password.");
      return;
    }

    setAuthError("");
    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      setIsAuthenticated(true);
    }, 800);
  };

  const handleDisconnect = () => {
    setIsAuthenticated(false);
    setDroneId("");
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-lg">
              🛸
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Site Drone Vision Telemetry
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  UAV AIRSPACE FEED
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Real-time aerial drone surveillance for project{" "}
                <span className="text-amber-400 font-mono font-bold">
                  {projectCode}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Close Drone Vision"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        {!isAuthenticated ? (
          /* Step 1: Drone Authentication */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-inner space-y-5">
              <div className="text-center space-y-1">
                <div className="inline-flex h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center text-2xl mb-1">
                  🔒
                </div>
                <h4 className="text-base font-bold text-white">
                  Authenticate Drone Connection
                </h4>
                <p className="text-xs text-slate-400">
                  Enter authorized UAV flight controller credentials to stream live site aerial feed.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  ⚠️ {authError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    DRONE ID / UAV CALLSIGN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DRN-GAMUDA-8802"
                    value={droneId}
                    onChange={(e) => setDroneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    ACCESS PASSWORD / PIN
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to Drone Telemetry...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to Drone Vision →</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAutofillDemo}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs border border-slate-700 transition-colors"
                  >
                    ⚡ Quick Demo Autofill (DRN-8802)
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Step 2: Drone Live Vision Feed with HUD */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Live Feed Container */}
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
              <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-200 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <strong className="text-white">UAV: {droneId}</strong>
                </div>
                <div className="text-amber-400 font-bold">
                  PROJECT: {projectCode}
                </div>
                <div className="text-slate-400">
                  GPS: 3°08&apos;42.1&quot;N 101°41&apos;22.4&quot;E
                </div>
                <div className="text-sky-300 font-semibold">
                  MODE: AUTONOMOUS PERIMETER PATROL
                </div>
              </div>

              {/* HUD Top Right Telemetry */}
              <div className="absolute top-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-200 text-right space-y-0.5">
                <div>
                  ALT: <strong className="text-amber-400">124.5 m</strong>
                </div>
                <div>
                  SPEED: <strong className="text-white">16.8 km/h</strong>
                </div>
                <div>
                  BATTERY:{" "}
                  <strong className="text-emerald-400">84% [|||||]</strong>
                </div>
                <div>
                  WIND: <strong className="text-sky-300">5.2 m/s NW</strong>
                </div>
              </div>

              {/* HUD Bottom Left Telemetry */}
              <div className="absolute bottom-3 left-3 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-3">
                <span>GIMBAL: -45.0°</span>
                <span>REC: 00:18:42</span>
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
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-slate-700 transition-colors"
                >
                  Disconnect UAV
                </button>
                <button
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
