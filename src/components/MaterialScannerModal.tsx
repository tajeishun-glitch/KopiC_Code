"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  SeedMaterial,
  SeedVendor,
  SeedInventoryItem,
} from "@/lib/seed-data";
import { computeInventoryMetrics } from "@/lib/business-engine";

interface MaterialScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  inventory: SeedInventoryItem[];
  onNavigateToInventory: (materialCode: string) => void;
}

export function MaterialScannerModal({
  isOpen,
  onClose,
  projectCode,
  materials,
  vendors,
  inventory,
  onNavigateToInventory,
}: MaterialScannerModalProps) {
  const [inputMode, setInputMode] = useState<"CAMERA" | "UPLOAD" | "PRESET">(
    "CAMERA"
  );
  const [selectedMaterialCode, setSelectedMaterialCode] =
    useState<string>("STL-002");
  const [previewUrl, setPreviewUrl] = useState<string>(
    materials.find((m) => m.materialCode === "STL-002")?.imageUrl || ""
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera when modal is open and inputMode is CAMERA
  useEffect(() => {
    if (!isOpen || inputMode !== "CAMERA") {
      stopCamera();
      return;
    }

    let isMounted = true;
    setCameraError("");

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Camera access denied or unavailable:", err);
        setCameraError(
          "Camera access not granted or no webcam detected. You can switch to Upload Image or select a Site Sample."
        );
        setIsCameraActive(false);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, inputMode]);

  if (!isOpen) return null;

  const recognizedMaterial =
    materials.find((m) => m.materialCode === selectedMaterialCode) ||
    materials[0];

  const confidenceScore =
    recognizedMaterial.materialCode === "CEM-006"
      ? 84.6
      : recognizedMaterial.materialCode === "STL-002"
        ? 98.2
        : 95.8;

  // Live Project Stock for Recognized Material
  const projectStockRecord = inventory.find(
    (i) =>
      i.projectCode === projectCode &&
      i.materialCode === recognizedMaterial.materialCode
  );
  const stockMetrics = projectStockRecord
    ? computeInventoryMetrics(projectStockRecord)
    : null;

  // Matching Vendors for Recognized Material
  const matchingVendors = vendors.filter((v) =>
    v.products.some((p) => p.materialCode === recognizedMaterial.materialCode)
  );

  const handleCaptureSnapshot = () => {
    if (videoRef.current) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg");
          setPreviewUrl(dataUrl);
        }
      } catch (err) {
        console.error("Snapshot capture error:", err);
      }
    }
    runAnalysis();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      runAnalysis();
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (mat: SeedMaterial) => {
    setSelectedMaterialCode(mat.materialCode);
    setPreviewUrl(mat.imageUrl);
    runAnalysis();
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 450);
  };

  const handleJumpToLiveInventory = () => {
    onNavigateToInventory(recognizedMaterial.materialCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-lg">
              📷
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  AI Material Scanner
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CV MATERIAL RECOGNITION
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Activate mobile or laptop camera, or upload photo to identify specs, verified vendors & live stock.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Close Scanner"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
            <button
              onClick={() => setInputMode("CAMERA")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                inputMode === "CAMERA"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📹 Live Camera
            </button>
            <button
              onClick={() => setInputMode("UPLOAD")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                inputMode === "UPLOAD"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📤 Upload Image
            </button>
            <button
              onClick={() => setInputMode("PRESET")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                inputMode === "PRESET"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏗️ Site Sample Presets
            </button>
          </div>

          {/* 2-Column Scanner View: Left = Input / Camera Feed, Right = AI Recognition & Live Stock Link */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Camera / Upload Container */}
            <div className="lg:col-span-5 space-y-3">
              {inputMode === "CAMERA" && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-3">
                  <div className="relative aspect-video sm:aspect-square w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-700">
                    {isCameraActive ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-4 text-center space-y-2 text-xs text-slate-400">
                        <div className="text-3xl">📷</div>
                        <p>{cameraError || "Initializing laptop/mobile camera..."}</p>
                      </div>
                    )}

                    {/* Camera Viewfinder Overlay */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-dashed border-amber-400/80 rounded-lg flex items-center justify-center">
                          <span className="bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-300">
                            ALIGN MATERIAL HERE
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCaptureSnapshot}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    📸 Capture & Analyze Material
                  </button>
                </div>
              )}

              {inputMode === "UPLOAD" && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-center space-y-3">
                  <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 transition-colors">
                    <input
                      type="file"
                      id="scanner-modal-upload"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="scanner-modal-upload"
                      className="cursor-pointer space-y-2 block"
                    >
                      <div className="text-3xl">🖼️</div>
                      <div className="text-xs font-bold text-white">
                        Click to upload material photo
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Supports JPG, PNG, WEBP from your device
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {inputMode === "PRESET" && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-400 mb-1">
                    SELECT STANDARD SITE SAMPLE:
                  </div>
                  <div className="space-y-1.5">
                    {materials.slice(0, 4).map((m) => (
                      <button
                        key={m.materialCode}
                        onClick={() => handlePresetSelect(m)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedMaterialCode === m.materialCode
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">{m.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {m.materialCode} • {m.category}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400">
                          Inspect →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Thumbnail */}
              {previewUrl && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-2.5 flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Analyzed Material"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                  />
                  <div className="text-xs">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      CAPTURED SCAN FRAME
                    </span>
                    <p className="font-semibold text-white truncate max-w-[180px]">
                      {recognizedMaterial.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: AI Results & Live Stock Bridge */}
            <div className="lg:col-span-7 space-y-4">
              {isAnalyzing ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mb-3" />
                  <p className="font-semibold text-white text-xs">
                    AI Vision Model identifying structural grade & cataloging...
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. Recognized Material Specifications */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                          AI IDENTIFIED MATERIAL SPECIFICATION
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">
                          {recognizedMaterial.name}{" "}
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {recognizedMaterial.materialCode}
                          </span>
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ✓ {confidenceScore}% Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Category</div>
                        <div className="font-bold text-white mt-0.5">
                          {recognizedMaterial.category} • {recognizedMaterial.brand}
                        </div>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Unit & Standard</div>
                        <div className="font-bold text-white mt-0.5">
                          {recognizedMaterial.unit} | {recognizedMaterial.specifications}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <span className="text-slate-400">Features Detected: </span>
                      <span className="text-amber-300 font-medium">
                        {recognizedMaterial.aiCharacteristics.join(" • ")}
                      </span>
                    </div>
                  </div>

                  {/* 2. Automated Live Stock Inventory Linkage */}
                  <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                          AUTOMATED INVENTORY STATUS
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          On-Site Stock at {projectCode}
                        </h4>
                      </div>
                      {stockMetrics && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            stockMetrics.statusLabel === "CRITICAL_SHORTAGE"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : stockMetrics.statusLabel === "LOW_STOCK"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {stockMetrics.statusLabel.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {projectStockRecord && stockMetrics ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400 text-[10px]">Current Stock</div>
                            <div className="text-sm font-black font-mono text-white mt-0.5">
                              {projectStockRecord.currentStock} {recognizedMaterial.unit}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <div className="text-amber-400 text-[10px] font-bold">Available</div>
                            <div className="text-sm font-black font-mono text-amber-300 mt-0.5">
                              {stockMetrics.availableStock} {recognizedMaterial.unit}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-slate-400 text-[10px]">Reorder Point</div>
                            <div className="text-sm font-black font-mono text-slate-300 mt-0.5">
                              {stockMetrics.reorderPoint} {recognizedMaterial.unit}
                            </div>
                          </div>
                        </div>

                        {/* DIRECT LINK BUTTON TO LIVE INVENTORY INFO */}
                        <button
                          onClick={handleJumpToLiveInventory}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                        >
                          📦 View in Live Inventory Info Module →
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        No active stock record found for {recognizedMaterial.materialCode} in {projectCode}.
                      </div>
                    )}
                  </div>

                  {/* 3. Provider Info */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                        APPROVED SUPPLIERS FOR THIS MATERIAL ({matchingVendors.length})
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {matchingVendors.map((v) => {
                        const prod = v.products.find(
                          (p) => p.materialCode === recognizedMaterial.materialCode
                        );
                        return (
                          <div
                            key={v.vendorCode}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{v.name}</span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                  [{v.performance.evaluationStatus}]
                                </span>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                Lead Time: {prod?.leadTimeDays ?? 3} days • Min Order: {prod?.minOrderQty ?? 10} {recognizedMaterial.unit}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black font-mono text-amber-400">
                                RM {prod?.unitPriceRm.toFixed(2) ?? "—"}
                              </span>
                              <span className="text-slate-400 text-[10px] block">
                                per {recognizedMaterial.unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
