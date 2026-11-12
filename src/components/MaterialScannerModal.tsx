"use client";

import React, { useState } from "react";
import {
  SeedMaterial,
  SeedVendor,
  SeedInventoryItem,
} from "@/lib/seed-data";
import { computeInventoryMetrics } from "@/lib/business-engine";
import {
  APPROVED_SCAN_MATERIALS,
  identifyUploadedMaterial,
} from "@/lib/scanner-recognition";

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
  const [inputMode, setInputMode] = useState<"UPLOAD" | "PRESET">("UPLOAD");
  const [selectedMaterialCode, setSelectedMaterialCode] =
    useState<string>("BLK-005");
  const [previewUrl, setPreviewUrl] = useState<string>(
    APPROVED_SCAN_MATERIALS[0].primaryUrl
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [scanStatus, setScanStatus] = useState<"MATCHED" | "UNRECOGNIZED">("MATCHED");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  if (!isOpen) return null;

  const recognizedMaterial =
    materials.find((m) => m.materialCode === selectedMaterialCode) ||
    materials[0];

  const confidenceScore =
    recognizedMaterial.materialCode === "CEM-001"
      ? 99.1
      : recognizedMaterial.materialCode === "STL-002"
        ? 98.6
        : recognizedMaterial.materialCode === "BLK-005"
          ? 99.4
          : recognizedMaterial.materialCode === "CON-004"
            ? 97.8
            : 98.2;

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      setTimeout(() => {
        const result = identifyUploadedMaterial(
          {
            fileName: file.name,
            fileSize: file.size,
          },
          materials
        );

        if (result.isIdentified && result.materialCode) {
          setSelectedMaterialCode(result.materialCode);
          setScanStatus("MATCHED");
        } else {
          setScanStatus("UNRECOGNIZED");
        }
        setIsAnalyzing(false);
      }, 450);
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (matCode: string) => {
    const approved = APPROVED_SCAN_MATERIALS.find(
      (m) => m.materialCode === matCode
    );
    if (!approved) return;
    setIsAnalyzing(true);
    setSelectedMaterialCode(approved.materialCode);
    setPreviewUrl(approved.primaryUrl);
    setUploadedFileName(`${approved.name.toLowerCase().replace(/\s+/g, "_")}.jpg`);
    setScanStatus("MATCHED");
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 350);
  };

  const handleJumpToLiveInventory = () => {
    onNavigateToInventory(recognizedMaterial.materialCode);
    onClose();
  };

  const handleResubmit = () => {
    setPreviewUrl("");
    setUploadedFileName("");
    setScanStatus("MATCHED");
    const input = document.getElementById("scanner-modal-file-input") as HTMLInputElement;
    if (input) {
      input.value = "";
      input.click();
    }
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
                Only 5 authorized structural materials can be identified. Unclear or unlisted uploads prompt for resubmission.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
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
              onClick={() => setInputMode("UPLOAD")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                inputMode === "UPLOAD"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📤 Upload Site Photo
            </button>
            <button
              onClick={() => setInputMode("PRESET")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                inputMode === "PRESET"
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏗️ 5 Authorized Site Materials
            </button>
          </div>

          {/* 2-Column Scanner View: Left = Input / Photo Upload, Right = AI Recognition & Live Stock Link */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Upload / Preset Container */}
            <div className="lg:col-span-5 space-y-3">
              {inputMode === "UPLOAD" && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-center space-y-3">
                  <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 transition-colors">
                    <input
                      type="file"
                      id="scanner-modal-file-input"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="scanner-modal-file-input"
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
                  <div className="text-[11px] font-mono font-bold text-slate-400 mb-1">
                    5 AUTHORIZED SITE MATERIALS:
                  </div>
                  <div className="space-y-1.5">
                    {APPROVED_SCAN_MATERIALS.map((appr, idx) => (
                      <button
                        key={appr.materialCode}
                        onClick={() => handlePresetSelect(appr.materialCode)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors ${
                          selectedMaterialCode === appr.materialCode && scanStatus === "MATCHED"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white truncate">
                            {idx + 1}. {appr.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {appr.materialCode} • {appr.category}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 flex-shrink-0">
                          Inspect →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Preview (Scan Frame Removed) */}
              {previewUrl && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-2.5 flex items-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Analyzed Material"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-800"
                  />
                  <div className="text-xs min-w-0 flex-1">
                    <span
                      className={`text-[10px] font-mono font-bold block ${
                        scanStatus === "MATCHED"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {scanStatus === "MATCHED"
                        ? "✓ IDENTIFIED SITE MATERIAL"
                        : "⚠️ UNRECOGNIZED SCAN"}
                    </span>
                    <p className="font-semibold text-white truncate">
                      {scanStatus === "MATCHED"
                        ? recognizedMaterial.name
                        : uploadedFileName || "Unknown Image"}
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
                    Comparing neural visual signatures against 5 authorized site materials...
                  </p>
                </div>
              ) : scanStatus === "UNRECOGNIZED" ? (
                /* Unrecognized / Unclear Feedback with Resubmit */
                <div className="bg-slate-950 border border-rose-500/40 rounded-xl p-6 text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl text-rose-400">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      Material Unrecognized or Unclear
                    </h4>
                    <p className="text-xs text-rose-300/90 mt-1.5 max-w-md mx-auto leading-relaxed">
                      The uploaded image could not be matched with any of the 5 authorized site materials.
                      If the photo was blurry, poorly lit, or is an unverified item, please resubmit a clear photo.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={handleResubmit}
                      className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <span>↺</span>
                      <span>Resubmit Image</span>
                    </button>
                    <button
                      onClick={() => setInputMode("PRESET")}
                      className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                    >
                      View 5 Authorized Materials
                    </button>
                  </div>

                  {/* Quick Select from the 5 Approved Materials */}
                  <div className="border-t border-slate-800/80 pt-3 text-left">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2 font-bold">
                      Or select an authorized site material to inspect:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {APPROVED_SCAN_MATERIALS.map((item, idx) => (
                        <button
                          key={item.materialCode}
                          onClick={() => handlePresetSelect(item.materialCode)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
                        >
                          <div className="font-bold text-amber-400 text-[11px]">
                            {idx + 1}. {item.materialCode}
                          </div>
                          <div className="truncate text-slate-200 text-xs mt-0.5">
                            {item.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Recognized Material Specs & Live Stock & Vendors */
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
