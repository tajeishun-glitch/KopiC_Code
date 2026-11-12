"use client";

import React, { useState, useRef } from "react";
import {
  SeedMaterial,
  SeedVendor,
  SeedInventoryItem,
  SeedDefectRecord,
  SeedNotification,
  RoleType,
} from "@/lib/seed-data";
import {
  computeInventoryMetrics,
  getRolePermissions,
} from "@/lib/business-engine";
import { PurchaseRequestModal } from "./PurchaseRequestModal";
import {
  APPROVED_SCAN_MATERIALS,
  identifyUploadedMaterial,
} from "@/lib/scanner-recognition";

interface ScannerAndVendorProps {
  activeTab: "M01_SCANNER" | "M01_VENDOR";
  projectCode: string;
  userRole?: RoleType;
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  inventory: SeedInventoryItem[];
  defects: SeedDefectRecord[];
  onNavigateTab: (tab: string) => void;
  onSubmitPurchaseRequest?: (payload: {
    vendorCode: string;
    vendorName: string;
    materialCode: string;
    quantity: number;
    targetDate: string;
    urgency: "NORMAL" | "URGENT" | "EMERGENCY";
    notes: string;
  }) => void;
  onUpdateVendorStatusScore?: (payload: {
    vendorCode: string;
    newStatus: "PREFERRED" | "WATCHLIST" | "DO_NOT_REHIRE";
    newScore: number;
    reason: string;
  }) => void;
  onApprovePurchaseRequest?: (vendor: SeedVendor) => void;
  notifications?: SeedNotification[];
  onApproveNotification?: (notificationId: string) => void;
  onRejectNotification?: (notificationId: string, reason: string) => void;
}

export function ScannerAndVendorModules({
  activeTab,
  projectCode,
  userRole = "PROJECT_MANAGER",
  materials,
  vendors,
  inventory,
  defects,
  onNavigateTab,
  onSubmitPurchaseRequest,
  onUpdateVendorStatusScore,
  onApprovePurchaseRequest,
  notifications = [],
  onApproveNotification,
  onRejectNotification,
}: ScannerAndVendorProps) {
  const perms = getRolePermissions(userRole);
  const isManager = userRole === "PROJECT_MANAGER" || userRole === "SITE_MANAGER";
  // M02 Scanner State
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>("BLK-005");
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string>(
    APPROVED_SCAN_MATERIALS[0].primaryUrl
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    "site_aac_lightweight_blocks.jpg"
  );
  const [scanStatus, setScanStatus] = useState<"MATCHED" | "UNRECOGNIZED">("MATCHED");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualOverrideCode, setManualOverrideCode] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // M03 Supplier Management State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedEvaluationStatus, setSelectedEvaluationStatus] = useState<string>("ALL");
  const [purchaseVendor, setPurchaseVendor] = useState<SeedVendor | null>(null);

  // Manager Reason Form Modal State
  const [statusOverrideVendor, setStatusOverrideVendor] = useState<SeedVendor | null>(null);
  const [targetStatus, setTargetStatus] = useState<"PREFERRED" | "WATCHLIST" | "DO_NOT_REHIRE">("WATCHLIST");
  const [targetScore, setTargetScore] = useState<number>(75);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [reasonError, setReasonError] = useState<string>("");
  const [approvedVendorNotice, setApprovedVendorNotice] = useState<string>("");

  const activeMaterialCode = manualOverrideCode || selectedPresetCode;
  const recognizedMaterial =
    materials.find((m) => m.materialCode === activeMaterialCode) || materials[0];

  const confidenceScore =
    recognizedMaterial.materialCode === "CEM-001"
      ? 99.2
      : recognizedMaterial.materialCode === "STL-002"
        ? 98.7
        : recognizedMaterial.materialCode === "BLK-005"
          ? 99.4
          : recognizedMaterial.materialCode === "CON-004"
            ? 97.9
            : 98.3;

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
  const matchingVendors = vendors.filter((v) =>
    v.products.some((p) => p.materialCode === recognizedMaterial.materialCode)
  );

  const handlePresetSelect = (apprCode: string) => {
    const appr = APPROVED_SCAN_MATERIALS.find((a) => a.materialCode === apprCode);
    if (!appr) return;
    setIsScanning(true);
    setManualOverrideCode("");
    setSelectedPresetCode(appr.materialCode);
    setUploadedPreviewUrl(appr.primaryUrl);
    setUploadedFileName(appr.name.toLowerCase().replace(/\s+/g, "_") + ".jpg");
    setScanStatus("MATCHED");
    setTimeout(() => setIsScanning(false), 300);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPG, PNG, or WEBP).");
      return;
    }
    setIsScanning(true);
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setUploadedPreviewUrl(dataUrl);

      setTimeout(() => {
        const result = identifyUploadedMaterial(
          {
            fileName: file.name,
            fileSize: file.size,
          },
          materials
        );

        if (result.isIdentified && result.materialCode) {
          setManualOverrideCode("");
          setSelectedPresetCode(result.materialCode);
          setScanStatus("MATCHED");
        } else {
          setScanStatus("UNRECOGNIZED");
        }
        setIsScanning(false);
      }, 400);
    };
    reader.readAsDataURL(file);
  };

  const handleResubmit = () => {
    setUploadedPreviewUrl("");
    setUploadedFileName("");
    setScanStatus("MATCHED");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Filtered Vendors for M03 Vendor Finder
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tradeSpecialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" ||
      v.products.some((p) => {
        const mat = materials.find((m) => m.materialCode === p.materialCode);
        return mat?.category === selectedCategory;
      });
    const matchesStatus =
      selectedEvaluationStatus === "ALL" ||
      v.performance.evaluationStatus === selectedEvaluationStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // =========================================================================
  // M02: AI MATERIAL SCANNER (STREAMLINED SMALL FEATURE)
  // =========================================================================
  if (activeTab === "M01_SCANNER") {
    return (
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                MODULE 02 • AI MATERIAL SCANNER
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Project: <strong className="text-amber-400">{projectCode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold">AI Material Recognition & Live Inventory Bridge</h2>
            <p className="text-slate-400 text-xs mt-1">
              Upload a site photo to automatically identify material specs, approved vendor providers, and live project inventory.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("M02_INVENTORY")}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
          >
            📦 Go to Live Stock Inventory →
          </button>
        </div>

        {/* 2-Column Compact Scanner Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Image Upload & Samples (Left) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wide">
                1. Upload Site Photo
              </h3>
              <span className="text-[11px] text-slate-400">JPG, PNG, WEBP</span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-xl p-4 text-center bg-slate-950/60 transition-all">
              {uploadedPreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative h-44 w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                    <img
                      src={uploadedPreviewUrl}
                      alt={recognizedMaterial.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 text-amber-400 text-[10px] px-2 py-0.5 rounded font-mono border border-slate-700">
                      {uploadedFileName}
                    </div>
                    <div
                      className={`absolute bottom-2 right-2 text-white text-[11px] px-2 py-0.5 rounded font-bold shadow ${
                        scanStatus === "MATCHED" ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    >
                      {scanStatus === "MATCHED"
                        ? `AI Match: ${confidenceScore}%`
                        : "Unrecognized / Unclear"}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleResubmit}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      {scanStatus === "MATCHED" ? "Change Photo" : "↺ Resubmit Photo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedPreviewUrl("");
                        setUploadedFileName("");
                        setScanStatus("MATCHED");
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer block py-8"
                >
                  <div className="text-3xl mb-2">📸</div>
                  <div className="text-xs font-bold text-slate-200">
                    Click to Upload Construction Material Photo
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Instant AI Visual Recognition + Inventory Link
                  </div>
                </label>
              )}
            </div>

            {/* 5 Authorized Site Material Samples */}
            <div>
              <p className="text-[11px] font-mono font-bold uppercase text-slate-400 mb-2">
                5 Authorized Site Materials:
              </p>
              <div className="space-y-1.5">
                {APPROVED_SCAN_MATERIALS.map((appr, idx) => (
                  <button
                    key={appr.materialCode}
                    onClick={() => handlePresetSelect(appr.materialCode)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      recognizedMaterial.materialCode === appr.materialCode && scanStatus === "MATCHED"
                        ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                        : "border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950/40"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-mono text-amber-400 text-[11px]">
                        {idx + 1}. {appr.materialCode}
                      </div>
                      <div className="truncate text-xs font-semibold">{appr.name}</div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono flex-shrink-0">
                      Inspect →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Recognized Material & Provider Info & Live Stock Bridge (Right) */}
          <div className="lg:col-span-7 space-y-4">
            {isScanning ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-md">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mb-3" />
                <p className="font-semibold text-white text-sm">
                  AI Analyzing Material & Cross-referencing {projectCode} Stock...
                </p>
              </div>
            ) : scanStatus === "UNRECOGNIZED" ? (
              /* Unrecognized or Unclear Material Banner */
              <div className="bg-slate-900 border border-rose-500/40 rounded-xl p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl text-rose-400">
                  ⚠️
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    Material Unrecognized or Unclear
                  </h4>
                  <p className="text-xs text-rose-300/90 mt-1.5 max-w-md mx-auto leading-relaxed">
                    The uploaded image could not be matched with any of the 5 authorized site materials.
                    If the photo is unclear, has insufficient lighting, or contains an unauthorized item, please resubmit.
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
                </div>

                {/* Quick Inspection of 5 Authorized Materials */}
                <div className="border-t border-slate-800/80 pt-4 text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2 font-bold">
                    Or select an authorized site material to inspect:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {APPROVED_SCAN_MATERIALS.map((item, idx) => (
                      <button
                        key={item.materialCode}
                        onClick={() => handlePresetSelect(item.materialCode)}
                        className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs transition-colors"
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
              <>
                {/* A. Identified Material Specifications */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-amber-400">
                        AI RECOGNIZED MATERIAL
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        {recognizedMaterial.name}{" "}
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {recognizedMaterial.materialCode}
                        </span>
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ {confidenceScore}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 font-medium">Category & Brand</div>
                      <div className="font-bold text-white mt-0.5">
                        {recognizedMaterial.category} • {recognizedMaterial.brand}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400 font-medium">Unit & Specification</div>
                      <div className="font-bold text-white mt-0.5">
                        Unit: {recognizedMaterial.unit} | {recognizedMaterial.specifications}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400">Visual Features Detected: </span>
                      <span className="text-amber-300 font-medium">
                        {recognizedMaterial.aiCharacteristics.join(" • ")}
                      </span>
                    </div>
                    <select
                      value={manualOverrideCode}
                      onChange={(e) => setManualOverrideCode(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Manual Override / Correct Material...</option>
                      {materials.map((m) => (
                        <option key={m.materialCode} value={m.materialCode}>
                          {m.materialCode} – {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* B. Live Stock Inventory Status (Direct Link) */}
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                        AUTOMATIC LIVE STOCK INVENTORY STATUS
                      </span>
                      <h4 className="text-base font-bold text-white">
                        On-Site Stock at {projectCode}
                      </h4>
                    </div>
                    {stockMetrics && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-slate-400 text-[11px]">Current Stock</div>
                          <div className="text-base font-black font-mono text-white mt-0.5">
                            {projectStockRecord.currentStock} {recognizedMaterial.unit}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-slate-400 text-[11px]">Reserved</div>
                          <div className="text-base font-black font-mono text-slate-300 mt-0.5">
                            {projectStockRecord.reservedStock} {recognizedMaterial.unit}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <div className="text-amber-400 text-[11px] font-bold">Available Stock</div>
                          <div className="text-base font-black font-mono text-amber-300 mt-0.5">
                            {stockMetrics.availableStock} {recognizedMaterial.unit}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-slate-400 text-[11px]">Stock Coverage</div>
                          <div className="text-base font-black font-mono text-white mt-0.5">
                            {stockMetrics.stockCoverageDays ?? "N/A"} Days
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-400">
                          Daily Burn: <strong className="text-slate-200">{projectStockRecord.avgDailyConsumption} {recognizedMaterial.unit}/day</strong> • Reorder Point: <strong className="text-slate-200">{stockMetrics.reorderPoint} {recognizedMaterial.unit}</strong>
                        </span>
                        <button
                          onClick={() => onNavigateTab("M02_INVENTORY")}
                          className="text-amber-400 hover:text-amber-300 font-bold underline"
                        >
                          View Full Stock & Movements →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      No stock record found for {recognizedMaterial.materialCode} in {projectCode}. Check approved suppliers below.
                    </div>
                  )}
                </div>

                {/* C. Approved Providers / Suppliers for this Material */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">
                        APPROVED PROVIDERS & SUPPLIERS
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Suppliers for {recognizedMaterial.name} ({matchingVendors.length})
                      </h4>
                    </div>
                    <button
                      onClick={() => onNavigateTab("M01_VENDOR")}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline font-bold"
                    >
                      Compare All Vendors →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {matchingVendors.map((v) => {
                      const prod = v.products.find(
                        (p) => p.materialCode === recognizedMaterial.materialCode
                      );
                      return (
                        <div
                          key={v.vendorCode}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{v.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({v.vendorCode})</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Score: {v.performance.overallScore}%
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              Lead Time: <strong className="text-slate-200">{prod?.leadTimeDays ?? v.products[0]?.leadTimeDays ?? 3} days</strong> • Min Order: <strong className="text-slate-200">{prod?.minOrderQty ?? 10} {recognizedMaterial.unit}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black font-mono text-amber-400">
                              RM {prod?.unitPriceRm.toFixed(2) ?? "—"} / {recognizedMaterial.unit}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-bold">
                              {v.performance.evaluationStatus} TIER
                            </div>
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
    );
  }

  // =========================================================================
  // M03: SUPPLIER MANAGEMENT
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            MODULE 03 • SUPPLIER MANAGEMENT
          </span>
          <h2 className="text-xl font-extrabold mt-1">
            Construction Supplier Management & Multi-Criteria Evaluation
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage approved contractors and material suppliers across price, lead time, historical defect rate, and quality score.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab("M03_QUALITY")}
          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
        >
          🛡️ View Defect Log & Vendor Score →
        </button>
      </div>

      {/* Notification Banner */}
      {approvedVendorNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-between animate-fadeIn">
          <span>{approvedVendorNotice}</span>
          <button
            onClick={() => setApprovedVendorNotice("")}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center gap-3 text-xs">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Search supplier name, code, trade specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Steel">Steel & Rebar</option>
            <option value="Concrete">Concrete & Aggregates</option>
            <option value="Cement">Cement</option>
            <option value="Finishes">Finishes & Architectural</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Evaluation Tier:</span>
          <select
            value={selectedEvaluationStatus}
            onChange={(e) => setSelectedEvaluationStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-2 focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="PREFERRED">PREFERRED Tier</option>
            <option value="WATCHLIST">WATCHLIST Tier</option>
            <option value="RESTRICTED">RESTRICTED Tier (Do Not Rehire)</option>
          </select>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((v) => (
          <div
            key={v.vendorCode}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {v.vendorCode}
                  </span>
                  <h3 className="font-extrabold text-white text-base mt-1">
                    {v.name}
                  </h3>
                  <div className="text-xs text-slate-400">{v.tradeSpecialty}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    v.performance.evaluationStatus === "PREFERRED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : v.performance.evaluationStatus === "WATCHLIST"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {v.performance.evaluationStatus === "DO_NOT_REHIRE"
                    ? "DO NOT REHIRE"
                    : v.performance.evaluationStatus}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-800">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Score</div>
                  <div className="text-base font-black font-mono text-amber-400">
                    {v.performance.overallScore}%
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">On-Time</div>
                  <div className="text-base font-black font-mono text-white">
                    {v.performance.onTimeDeliveryRate}%
                  </div>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Quality</div>
                  <div className="text-base font-black font-mono text-emerald-400">
                    {v.performance.qualityAcceptanceRate}%
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Standard Lead Time:</span>
                  <strong className="text-white">{v.products[0]?.leadTimeDays ?? 3} days</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Open Site Defects:</span>
                  <strong className={v.performance.openDefectsCount > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {v.performance.openDefectsCount} defects
                  </strong>
                </div>
              </div>
            </div>

            {/* AI Risk Summary */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-amber-400">AI Risk Note:</strong> {v.performance.aiRiskSummary}
            </div>

            {/* Manager Evaluation & Status Control */}
            {isManager && (
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <span>⚙️</span> Manager Control
                  </span>
                  <button
                    onClick={() => {
                      setStatusOverrideVendor(v);
                      setTargetStatus(v.performance.evaluationStatus);
                      setTargetScore(v.performance.overallScore);
                      setOverrideReason("");
                      setReasonError("");
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all"
                  >
                    Edit Status / Score
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Status: <strong className="text-white">{v.performance.evaluationStatus === "DO_NOT_REHIRE" ? "Do Not Rehire" : v.performance.evaluationStatus}</strong></span>
                  <span>Score: <strong className="text-amber-400 font-mono">{v.performance.overallScore}%</strong></span>
                </div>
              </div>
            )}

            {/* Pending Purchase Request Status & Actions */}
            {(() => {
              const pendingPR = notifications.find(
                (n) =>
                  n.purchaseRequest &&
                  n.purchaseRequest.vendorCode === v.vendorCode &&
                  n.purchaseRequest.status === "PENDING"
              );

              return (
                <div className="space-y-2 mt-2">
                  {pendingPR && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>PR PENDING APPROVAL</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {pendingPR.purchaseRequest?.quantity} Units
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {pendingPR.purchaseRequest?.materialCode} requested by{" "}
                        <strong className="text-white">{pendingPR.purchaseRequest?.requesterName}</strong>
                      </div>

                      {/* Manager Direct Action Buttons */}
                      {isManager ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onApproveNotification) {
                                onApproveNotification(pendingPR.id);
                              } else if (onApprovePurchaseRequest) {
                                onApprovePurchaseRequest(v);
                              }
                              setApprovedVendorNotice(
                                `✓ Approved Purchase Request for ${v.name} (${v.vendorCode}). Transmitted to ERP Procurement.`
                              );
                              setTimeout(() => setApprovedVendorNotice(""), 3500);
                            }}
                            className="flex-1 py-1 px-2 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow transition-all"
                          >
                            ✓ Approve PR
                          </button>
                          {onRejectNotification && (
                            <button
                              type="button"
                              onClick={() => {
                                onRejectNotification(
                                  pendingPR.id,
                                  "Rejected by Project Manager during supplier review."
                                );
                              }}
                              className="py-1 px-2 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition-all"
                            >
                              ✕ Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-400/90 font-sans italic pt-0.5">
                          ⏳ Waiting for Project Manager review &amp; sign-off
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send Purchase Request Button (Worker / Staff / All Roles) */}
                  {v.performance.evaluationStatus === "PREFERRED" && perms.canCompareVendors && (
                    <button
                      type="button"
                      onClick={() => setPurchaseVendor(v)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>📨 Send Purchase Request</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Reason Form Modal for Manager Vendor Status & Score Override */}
      {statusOverrideVendor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-lg">
                  ⚖️
                </span>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Supplier Evaluation & Status Override Form
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {statusOverrideVendor.name} ({statusOverrideVendor.vendorCode}) • CIDB {statusOverrideVendor.cidbGrade}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusOverrideVendor(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!overrideReason.trim() || overrideReason.trim().length < 5) {
                  setReasonError("A detailed reason (min 5 characters) is required for audit and governance compliance.");
                  return;
                }
                if (onUpdateVendorStatusScore) {
                  onUpdateVendorStatusScore({
                    vendorCode: statusOverrideVendor.vendorCode,
                    newStatus: targetStatus,
                    newScore: targetScore,
                    reason: overrideReason.trim(),
                  });
                }
                setApprovedVendorNotice(`✓ Updated ${statusOverrideVendor.name} to ${targetStatus} (${targetScore}%). Audit trail recorded.`);
                setTimeout(() => setApprovedVendorNotice(""), 3500);
                setStatusOverrideVendor(null);
              }}
              className="p-5 space-y-4 text-xs"
            >
              {reasonError && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-xs">
                  {reasonError}
                </div>
              )}

              {/* Status Select */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Vendor Status / Evaluation Tier <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["PREFERRED", "WATCHLIST", "DO_NOT_REHIRE"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`p-2 rounded-lg font-bold text-center border transition-all text-xs ${
                        targetStatus === st
                          ? st === "PREFERRED"
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20"
                            : st === "WATCHLIST"
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20"
                              : "bg-rose-500 text-white border-rose-400 font-black shadow-md shadow-rose-500/20"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {st === "DO_NOT_REHIRE" ? "DO NOT REHIRE" : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Score Slider / Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-300">
                    Vendor Quality Score Control
                  </label>
                  <span className="font-mono font-bold text-amber-400 text-sm">{targetScore}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>0% (Restricted / Defective)</span>
                  <span>50% (Watchlist / Audit)</span>
                  <span>100% (Exemplary Preferred)</span>
                </div>
              </div>

              {/* Reason Form Field */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Reason for Status / Score Change <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="State the justification, CIDB audit finding, quality inspection result, or managerial reinstatement..."
                  value={overrideReason}
                  onChange={(e) => {
                    setOverrideReason(e.target.value);
                    if (reasonError) setReasonError("");
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * Submission is immutably logged into the Audit Trail with operator timestamp.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusOverrideVendor(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg transition-all"
                >
                  Submit Reason & Confirm Override →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      <PurchaseRequestModal
        isOpen={!!purchaseVendor}
        onClose={() => setPurchaseVendor(null)}
        vendor={purchaseVendor}
        projectCode={projectCode}
        materials={materials}
        onSubmitRequest={(payload) => {
          if (onSubmitPurchaseRequest) {
            onSubmitPurchaseRequest(payload);
          }
        }}
      />
    </div>
  );
}
