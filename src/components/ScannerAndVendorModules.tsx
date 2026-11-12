"use client";

import React, { useState } from "react";
import {
  SeedMaterial,
  SeedVendor,
  SeedInventoryItem,
  SeedDefectRecord,
} from "@/lib/seed-data";
import { computeInventoryMetrics } from "@/lib/business-engine";

interface ScannerAndVendorProps {
  activeTab: "M01_SCANNER" | "M01_VENDOR";
  projectCode: string;
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  inventory: SeedInventoryItem[];
  defects: SeedDefectRecord[];
  onNavigateTab: (tab: string) => void;
}

export function ScannerAndVendorModules({
  activeTab,
  projectCode,
  materials,
  vendors,
  inventory,
  defects,
  onNavigateTab,
}: ScannerAndVendorProps) {
  // M01 Scanner State
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>("STL-002");
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string>(
    materials.find((m) => m.materialCode === "STL-002")?.imageUrl || ""
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    "site_gate_delivery_rebar_t16.jpg"
  );
  const [scanNotes, setScanNotes] = useState<string>(
    "Gate B delivery inspection - checking site stock & approved vendor performance"
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConfirmedByUser, setIsConfirmedByUser] = useState<boolean>(true);
  const [manualOverrideCode, setManualOverrideCode] = useState<string>("");

  // M01 Vendor Finder State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMaterialForVendor, setSelectedMaterialForVendor] =
    useState<string>("STL-002");
  const [recommendationGoal, setRecommendationGoal] = useState<
    "BEST_BALANCE" | "LOWEST_PRICE" | "SHORTEST_LEAD" | "HIGHEST_STOCK" | "BEST_PERFORMANCE"
  >("BEST_BALANCE");

  const activeMaterialCode = manualOverrideCode || selectedPresetCode;
  const recognizedMaterial =
    materials.find((m) => m.materialCode === activeMaterialCode) || materials[0];

  const confidenceScore =
    recognizedMaterial.materialCode === "CEM-006"
      ? 81.5
      : recognizedMaterial.materialCode === "STL-002"
        ? 96.4
        : 94.8;

  // Live Project Stock for Recognized Material
  const projectStockRecord = inventory.find(
    (i) =>
      i.projectCode === projectCode &&
      i.materialCode === recognizedMaterial.materialCode
  );
  const stockMetrics = projectStockRecord
    ? computeInventoryMetrics(projectStockRecord)
    : null;

  // Cross-project surplus check
  const crossProjectStock = inventory.filter(
    (i) =>
      i.projectCode !== projectCode &&
      i.materialCode === recognizedMaterial.materialCode
  );

  // Matching Vendors for Recognized Material
  const matchingScanVendors = vendors.filter((v) =>
    v.products.some((p) => p.materialCode === recognizedMaterial.materialCode)
  );

  const handlePresetSelect = (mat: SeedMaterial) => {
    setIsScanning(true);
    setManualOverrideCode("");
    setSelectedPresetCode(mat.materialCode);
    setUploadedPreviewUrl(mat.imageUrl);
    setUploadedFileName(`site_photo_${mat.materialCode.toLowerCase()}.jpg`);
    setIsConfirmedByUser(mat.materialCode !== "CEM-006");
    setTimeout(() => setIsScanning(false), 350);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("BR-M01-001: Only JPG, JPEG, PNG or WEBP images are supported.");
      return;
    }
    setIsScanning(true);
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPreviewUrl(String(reader.result));
      const lower = file.name.toLowerCase();
      if (lower.includes("cem")) setSelectedPresetCode("CEM-001");
      else if (lower.includes("til")) setSelectedPresetCode("TIL-003");
      else if (lower.includes("con")) setSelectedPresetCode("CON-004");
      else if (lower.includes("blk")) setSelectedPresetCode("BLK-005");
      else setSelectedPresetCode("STL-002");
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  if (activeTab === "M01_SCANNER") {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white rounded-xl p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
                MODULE 01 • AI VISION + LIVE STOCK & VENDOR CHECK
              </span>
              <h2 className="text-2xl font-bold">
                AI Material Scanner & Instant Stock / Vendor Lookup
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                Upload or capture a site product photograph. AI identifies the
                material and immediately checks <strong>{projectCode}</strong>{" "}
                live stock coverage, cross-site surplus, and approved vendor
                defect/performance records.
              </p>
            </div>
            <div className="bg-amber-500/20 border border-amber-400/40 rounded-lg px-3 py-2 text-xs text-amber-200 max-w-xs">
              <strong>BR-002 & BR-003 Rule:</strong> Visual recognition
              identifies material category; engineer must verify mill/batch
              certificates for structural grade equivalence.
            </div>
          </div>
        </div>

        {/* Upload & Sample Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center justify-between">
              <span>1. Upload or Select Site Material Photo</span>
              <span className="text-xs font-normal text-slate-500">
                JPG / PNG (Max 10MB)
              </span>
            </h3>

            {/* Quick Demo Presets for Stage Pitch */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                One-Click Stage Demo Photo Samples (TC-001):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {materials.map((m) => (
                  <button
                    key={m.materialCode}
                    onClick={() => handlePresetSelect(m)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      recognizedMaterial.materialCode === m.materialCode
                        ? "border-teal-600 bg-teal-50/70 text-teal-950 font-semibold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                    }`}
                  >
                    <div className="font-bold text-teal-700">
                      {m.materialCode}
                    </div>
                    <div className="truncate">{m.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* File Input & Image Preview */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
              {uploadedPreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative h-48 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                    <img
                      src={uploadedPreviewUrl}
                      alt={recognizedMaterial.name}
                      className="h-full w-full object-cover opacity-90"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md font-mono">
                      {uploadedFileName}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-teal-600 text-white text-xs px-2.5 py-1 rounded-md font-semibold">
                      AI Confidence: {confidenceScore}%
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium">
                      Replace Photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => {
                        setUploadedPreviewUrl("");
                        setUploadedFileName("");
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium"
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block py-8">
                  <div className="text-sm font-semibold text-slate-700">
                    Click to Upload Construction Material Photo
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Supports JPG, JPEG, PNG • Instant AI Vision + Stock Lookup
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Optional Site Context / Location Notes:
              </label>
              <input
                type="text"
                value={scanNotes}
                onChange={(e) => setScanNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Right Column: AI Recognition + Live Stock + Vendor Info */}
          <div className="lg:col-span-7 space-y-5">
            {isScanning ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent mb-3" />
                <p className="font-semibold text-slate-800">
                  AI Analyzing Material Image & Querying {projectCode} Live
                  Inventory...
                </p>
              </div>
            ) : (
              <>
                {/* 1. AI Material Identification Card (FR-M01-002) */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Step 2 • AI Material Identification Result (FR-M01-002)
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        {recognizedMaterial.name}{" "}
                        <span className="text-sm font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {recognizedMaterial.materialCode}
                        </span>
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          confidenceScore >= 85
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {confidenceScore}% Confidence
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isConfirmedByUser
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isConfirmedByUser
                          ? "✓ User Confirmed (TC-002)"
                          : "⚠ Confirmation Needed (BR-002)"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-500 font-medium">
                        Category & Brand
                      </div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        {recognizedMaterial.category} •{" "}
                        {recognizedMaterial.brand}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-500 font-medium">
                        Unit & Technical Specification
                      </div>
                      <div className="font-semibold text-slate-900 mt-0.5">
                        Unit: {recognizedMaterial.unit} |{" "}
                        {recognizedMaterial.specifications}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Visual Features Detected:{" "}
                      </span>
                      <span className="text-slate-600">
                        {recognizedMaterial.aiCharacteristics.join(" • ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isConfirmedByUser && (
                        <button
                          onClick={() => setIsConfirmedByUser(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                        >
                          Confirm Identification
                        </button>
                      )}
                      <select
                        value={manualOverrideCode}
                        onChange={(e) => {
                          setManualOverrideCode(e.target.value);
                          setIsConfirmedByUser(true);
                        }}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                      >
                        <option value="">
                          Correct / Override Material (BR-002)...
                        </option>
                        {materials.map((m) => (
                          <option key={m.materialCode} value={m.materialCode}>
                            {m.materialCode} – {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Alternative Material Recommendation (FR-M01-007 & BR-003) */}
                  {recognizedMaterial.alternativeCodes.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <strong>
                        Alternative Material Available (FR-M01-007 / BR-003):
                      </strong>{" "}
                      Possible alternative code(s):{" "}
                      <span className="font-mono font-bold">
                        {recognizedMaterial.alternativeCodes.join(", ")}
                      </span>
                      . Must NOT be treated as technically equivalent without
                      Site Engineer specification verification.
                    </div>
                  )}
                </div>

                {/* 2. AUTOMATIC LIVE STOCK QUANTITY CHECK ON UPLOAD */}
                <div className="bg-white rounded-xl border-2 border-teal-600/30 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Step 3 • AI Automatic Live Stock Quantity Check (M02
                        Link)
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        On-Site Stock at {projectCode} for{" "}
                        {recognizedMaterial.materialCode}
                      </h4>
                    </div>
                    {stockMetrics && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          stockMetrics.statusLabel === "CRITICAL_SHORTAGE"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : stockMetrics.statusLabel === "LOW_STOCK"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {stockMetrics.statusLabel.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  {projectStockRecord && stockMetrics ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">
                            Current Stock
                          </div>
                          <div className="text-base font-bold text-slate-900">
                            {projectStockRecord.currentStock}{" "}
                            <span className="text-xs font-normal">
                              {recognizedMaterial.unit}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">
                            Reserved
                          </div>
                          <div className="text-base font-bold text-slate-700">
                            {projectStockRecord.reservedStock}{" "}
                            <span className="text-xs font-normal">
                              {recognizedMaterial.unit}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                          <div className="text-[11px] text-teal-800 font-semibold">
                            Available Stock
                          </div>
                          <div className="text-base font-extrabold text-teal-900">
                            {stockMetrics.availableStock}{" "}
                            <span className="text-xs font-normal">
                              {recognizedMaterial.unit}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">
                            Reorder Point
                          </div>
                          <div className="text-base font-bold text-slate-800">
                            {stockMetrics.reorderPoint}{" "}
                            <span className="text-xs font-normal">
                              {recognizedMaterial.unit}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`p-2.5 rounded-lg border ${
                            stockMetrics.isCriticalShortage
                              ? "bg-rose-50 border-rose-200 text-rose-900"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                        >
                          <div className="text-[11px] opacity-75 font-medium">
                            Stock Coverage
                          </div>
                          <div className="text-base font-extrabold">
                            {stockMetrics.stockCoverageDays ?? "N/A"} days
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                        <span>
                          <strong>Incoming Stock (Separate per FR-M02-001):</strong>{" "}
                          {projectStockRecord.incomingStock}{" "}
                          {recognizedMaterial.unit} |{" "}
                          <strong>Daily Burn:</strong>{" "}
                          {projectStockRecord.avgDailyConsumption}{" "}
                          {recognizedMaterial.unit}/day
                        </span>
                        {crossProjectStock.length > 0 && (
                          <span className="text-teal-700 font-semibold">
                            Cross-Site Stock:{" "}
                            {crossProjectStock
                              .map(
                                (c) =>
                                  `${c.projectCode} has ${computeInventoryMetrics(c).availableStock} ${recognizedMaterial.unit} available`
                              )
                              .join(" • ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                      No active on-site stock record for{" "}
                      {recognizedMaterial.materialCode} at {projectCode}. Check
                      matching external vendors below.
                    </div>
                  )}
                </div>

                {/* 3. AUTOMATIC VENDOR INFO & DEFECT SCORECARD CHECK ON UPLOAD */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Step 4 • Linked Vendor Stock, Price & Defect Evaluation
                        (M01 + M03)
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        Matching Suppliers for {recognizedMaterial.name}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-100 text-amber-900 border border-amber-300">
                      SIMULATED VENDOR DATA (BR-018)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                          <th className="py-2 px-2.5">Vendor</th>
                          <th className="py-2 px-2.5">Unit Price</th>
                          <th className="py-2 px-2.5">
                            External Stock (BR-004/005)
                          </th>
                          <th className="py-2 px-2.5">Lead Time</th>
                          <th className="py-2 px-2.5">
                            Live Evaluation Score (M03)
                          </th>
                          <th className="py-2 px-2.5">Worker/Eng Defects</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchingScanVendors.map((v) => {
                          const prod = v.products.find(
                            (p) =>
                              p.materialCode === recognizedMaterial.materialCode
                          )!;
                          const vendorDefects = defects.filter(
                            (d) => d.vendorCode === v.vendorCode
                          );
                          return (
                            <tr key={v.vendorCode} className="hover:bg-slate-50">
                              <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                                {v.name}{" "}
                                <span className="text-slate-400 font-mono">
                                  ({v.vendorCode})
                                </span>
                                <div className="text-[11px] font-normal text-slate-500">
                                  {v.distanceKm} km away • CIDB {v.cidbGrade}
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 font-bold text-slate-900">
                                RM {prod.unitPriceRm.toLocaleString()}/
                                {recognizedMaterial.unit}
                              </td>
                              <td className="py-2.5 px-2.5">
                                <span className="font-bold text-teal-700">
                                  {prod.availableExternalQty.toLocaleString()}{" "}
                                  {recognizedMaterial.unit}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  As of {prod.lastUpdated}
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 font-semibold">
                                {prod.leadTimeDays} days
                              </td>
                              <td className="py-2.5 px-2.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-bold ${
                                    v.performance.evaluationStatus ===
                                    "PREFERRED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : v.performance.evaluationStatus ===
                                          "WATCHLIST"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {v.performance.overallScore}% •{" "}
                                  {v.performance.evaluationStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-2.5">
                                {vendorDefects.length > 0 ? (
                                  <span className="text-rose-700 font-semibold">
                                    {vendorDefects.length} logged (
                                    {v.performance.openDefectsCount} open)
                                  </span>
                                ) : (
                                  <span className="text-emerald-700">
                                    0 open defects
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => {
                        setSelectedMaterialForVendor(
                          recognizedMaterial.materialCode
                        );
                        onNavigateTab("M01_VENDOR");
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Compare Vendors in Detail →
                    </button>
                    <button
                      onClick={() => onNavigateTab("M03_QUALITY")}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Reflect / Report Delivery Defect (M03) →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // M01_VENDOR: Catalogue Search, Multi-Vendor Comparison & Explainable AI Vendor Recommendation
  const filteredCatalogue = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.materialCode.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.specifications.toLowerCase().includes(q)
    );
  });

  const targetMat =
    materials.find((m) => m.materialCode === selectedMaterialForVendor) ||
    materials[0];

  const comparableVendors = vendors
    .filter((v) =>
      v.products.some((p) => p.materialCode === targetMat.materialCode)
    )
    .map((v) => {
      const prod = v.products.find(
        (p) => p.materialCode === targetMat.materialCode
      )!;
      // Composite balance score for AI recommendation
      const balanceRankScore =
        v.performance.overallScore * 0.55 +
        (100 / Math.max(1, prod.leadTimeDays)) * 0.25 +
        Math.min(100, prod.availableExternalQty / 10) * 0.2;
      return {
        vendor: v,
        product: prod,
        balanceRankScore,
      };
    })
    .sort((a, b) => {
      if (recommendationGoal === "LOWEST_PRICE")
        return a.product.unitPriceRm - b.product.unitPriceRm;
      if (recommendationGoal === "SHORTEST_LEAD")
        return a.product.leadTimeDays - b.product.leadTimeDays;
      if (recommendationGoal === "HIGHEST_STOCK")
        return (
          b.product.availableExternalQty - a.product.availableExternalQty
        );
      if (recommendationGoal === "BEST_PERFORMANCE")
        return (
          b.vendor.performance.overallScore - a.vendor.performance.overallScore
        );
      return b.balanceRankScore - a.balanceRankScore;
    });

  const aiRecommended = comparableVendors[0];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              MODULE 01 • FR-M01-003 TO FR-M01-006
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Material Catalogue & Multi-Vendor Intelligence Comparison
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            DATA SOURCE: SIMULATED MARKETPLACE API (BR-018 / TC-023)
          </span>
        </div>

        {/* Search Input */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search material catalogue by name, code (CEM-001, STL-002), category, brand, or BS/MS spec..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[260px] rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
          <select
            value={selectedMaterialForVendor}
            onChange={(e) => setSelectedMaterialForVendor(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold bg-slate-50"
          >
            {materials.map((m) => (
              <option key={m.materialCode} value={m.materialCode}>
                Compare Vendors for: {m.materialCode} – {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Catalogue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filteredCatalogue.map((m) => (
            <div
              key={m.materialCode}
              onClick={() => setSelectedMaterialForVendor(m.materialCode)}
              className={`cursor-pointer p-3.5 rounded-xl border transition-all text-xs ${
                selectedMaterialForVendor === m.materialCode
                  ? "border-teal-600 bg-teal-50/50 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-teal-700">
                  {m.materialCode}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  Unit: {m.unit}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{m.name}</div>
              <div className="text-slate-500 mt-1">
                {m.category} • {m.brand}
              </div>
              <div className="text-slate-600 mt-1 line-clamp-2">
                {m.specifications}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Comparison & AI Recommendation */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Vendor Comparison for {targetMat.name} ({targetMat.materialCode})
            </h3>
            <p className="text-xs text-slate-500">
              External supplier stock is displayed separately from internal{" "}
              {projectCode} inventory (BR-004) with last-updated timestamps
              (BR-005).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">
              Optimization Criteria (FR-M01-006):
            </span>
            <select
              value={recommendationGoal}
              onChange={(e) =>
                setRecommendationGoal(
                  e.target.value as typeof recommendationGoal
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold bg-slate-50"
            >
              <option value="BEST_BALANCE">Best Overall Balance (AI Default)</option>
              <option value="LOWEST_PRICE">Lowest Unit Price</option>
              <option value="SHORTEST_LEAD">Shortest Delivery Lead Time</option>
              <option value="HIGHEST_STOCK">Highest External Available Stock</option>
              <option value="BEST_PERFORMANCE">
                Best Historical Vendor Performance
              </option>
            </select>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        {aiRecommended && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-700 text-white">
                  ★ AI VENDOR RECOMMENDATION
                </span>
                <span className="text-sm font-bold text-teal-950">
                  {aiRecommended.vendor.name} ({aiRecommended.vendor.vendorCode})
                </span>
              </div>
              <p className="text-xs text-slate-700">
                <strong>Explainable AI Rationale (FR-M01-006):</strong> Selected
                under criterion{" "}
                <span className="font-mono font-semibold">
                  {recommendationGoal}
                </span>
                . Offers{" "}
                <strong>
                  RM {aiRecommended.product.unitPriceRm.toLocaleString()}/
                  {targetMat.unit}
                </strong>
                ,{" "}
                <strong>
                  {aiRecommended.product.availableExternalQty.toLocaleString()}{" "}
                  {targetMat.unit}
                </strong>{" "}
                external stock (updated {aiRecommended.product.lastUpdated}),{" "}
                <strong>{aiRecommended.product.leadTimeDays}-day</strong>{" "}
                delivery lead time, and a historical vendor performance score of{" "}
                <strong>
                  {aiRecommended.vendor.performance.overallScore}% (
                  {aiRecommended.vendor.performance.evaluationStatus})
                </strong>
                . {aiRecommended.vendor.performance.aiRiskSummary}
              </p>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3">Vendor & Contact</th>
                <th className="py-3 px-3">Spec Match</th>
                <th className="py-3 px-3">Unit Price (RM)</th>
                <th className="py-3 px-3">External Stock (BR-004/005)</th>
                <th className="py-3 px-3">MOQ & Lead Time</th>
                <th className="py-3 px-3">Distance</th>
                <th className="py-3 px-3">Vendor Scorecard (M03)</th>
                <th className="py-3 px-3">Future Hiring Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comparableVendors.map(({ vendor, product }, index) => (
                <tr
                  key={vendor.vendorCode}
                  className={index === 0 ? "bg-teal-50/40" : "hover:bg-slate-50"}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {vendor.name}{" "}
                      <span className="font-mono text-slate-500">
                        ({vendor.vendorCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {vendor.contactPerson} • {vendor.contactPhone}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {vendor.address}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {product.isExactSpecMatch ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Exact Match
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        Alternative (Verify Spec)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 text-sm">
                    RM {product.unitPriceRm.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500">
                      /{targetMat.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-teal-800">
                      {product.availableExternalQty.toLocaleString()}{" "}
                      {targetMat.unit}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Updated: {product.lastUpdated} (SIMULATED)
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {product.leadTimeDays} days lead time
                    </div>
                    <div className="text-[11px] text-slate-500">
                      MOQ: {product.minOrderQty} {targetMat.unit}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {vendor.distanceKm} km
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-sm text-slate-900">
                      {vendor.performance.overallScore}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      OTIF: {vendor.performance.onTimeDeliveryRate}% | Quality:{" "}
                      {vendor.performance.qualityAcceptanceRate}%
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        vendor.performance.evaluationStatus === "PREFERRED"
                          ? "bg-emerald-100 text-emerald-800"
                          : vendor.performance.evaluationStatus === "WATCHLIST"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {vendor.performance.evaluationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
