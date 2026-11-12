"use client";

import React, { useState, useRef } from "react";
import {
  SeedInventoryItem,
  SeedMaterial,
  SeedTransaction,
  SeedQualityInspection,
  SeedDefectRecord,
  SeedVendor,
  SeedProject,
  RoleType,
} from "@/lib/seed-data";
import {
  computeInventoryMetrics,
  getRolePermissions,
} from "@/lib/business-engine";

interface InventoryAndQualityProps {
  activeTab: "M02_INVENTORY" | "M03_QUALITY";
  projectCode: string;
  projects: SeedProject[];
  currentUser: {
    id: string;
    name: string;
    role: RoleType;
  };
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  inventory: SeedInventoryItem[];
  transactions: SeedTransaction[];
  inspections: SeedQualityInspection[];
  defects: SeedDefectRecord[];
  onRecordConsumption: (payload: {
    materialCode: string;
    quantity: number;
    workActivity: string;
    remarks: string;
  }) => void;
  onRecordGoodsReceipt: (payload: {
    materialCode: string;
    vendorCode: string;
    deliveryRef: string;
    acceptedQty: number;
    rejectedQty: number;
    remarks: string;
  }) => void;
  onTransferMaterial: (payload: {
    destProjectCode: string;
    materialCode: string;
    quantity: number;
    remarks: string;
  }) => void;
  onReportDefect: (payload: {
    materialCode: string;
    vendorCode: string;
    deliveryRef: string;
    category: SeedDefectRecord["category"];
    severity: SeedDefectRecord["severity"];
    rejectedQty: number;
    description: string;
    correctiveActionText: string;
    photoUrl?: string;
    defectType?: "VENDOR_DEFECT" | "DELIVERY_DEFECT";
    transporterName?: string;
    lorryPlate?: string;
    bayGate?: string;
    damagedPkgCount?: number;
    driverRemarks?: string;
    batchNumber?: string;
    millCertRef?: string;
  }) => void;
  onValidateDefect?: (
    defectCode: string,
    isApproved: boolean,
    denialReason?: string
  ) => void;
  onUpdateDefectStatus: (
    defectCode: string,
    status: SeedDefectRecord["status"]
  ) => void;
  onSyncInventory?: () => void;
  onNavigateTab?: (tab: string) => void;
}

type SortField =
  | "materialCode"
  | "name"
  | "currentStock"
  | "availableStock"
  | "reorderPoint"
  | "coverageDays"
  | "status";
type SortDirection = "asc" | "desc";

export function InventoryAndQualityModules({
  activeTab,
  projectCode,
  projects,
  currentUser,
  materials,
  vendors,
  inventory,
  transactions,
  inspections,
  defects,
  onRecordConsumption,
  onRecordGoodsReceipt,
  onTransferMaterial,
  onReportDefect,
  onValidateDefect,
  onUpdateDefectStatus,
  onSyncInventory,
  onNavigateTab,
}: InventoryAndQualityProps) {
  const perms = getRolePermissions(currentUser.role);
  const defectFileInputRef = useRef<HTMLInputElement>(null);
  const [defectPhotoModal, setDefectPhotoModal] = useState<{
    url: string;
    defectCode: string;
    vendorName: string;
    desc: string;
  } | null>(null);

  // Synchronization state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");
  const [syncNotice, setSyncNotice] = useState<string>("");

  const handleSyncClick = () => {
    setIsSyncing(true);
    setSyncNotice("Synchronizing with project warehouses & central ERP...");
    setTimeout(() => {
      setIsSyncing(false);
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastSyncTime(timeStr);
      setSyncNotice("Inventory synchronized successfully with site warehouses!");
      if (onSyncInventory) onSyncInventory();
      setTimeout(() => setSyncNotice(""), 3500);
    }, 1100);
  };

  // M04 Live Stock Table Sorting & Filtering State
  const [sortField, setSortField] = useState<SortField>("materialCode");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");

  // M02 Inventory Movement Form State
  const defaultInvMode = perms.canSubmitConsumption ? "CONSUMPTION" : "RECEIPT";
  const [invModalMode, setInvModalMode] = useState<
    "CONSUMPTION" | "RECEIPT" | "TRANSFER"
  >(defaultInvMode);
  const effectiveInvMode =
    invModalMode === "CONSUMPTION" && !perms.canSubmitConsumption
      ? "RECEIPT"
      : invModalMode === "RECEIPT" && !perms.canConfirmGoodsReceipt
        ? "CONSUMPTION"
        : invModalMode === "TRANSFER" && !perms.canTransferMaterialSurplus
          ? defaultInvMode
          : invModalMode;

  // Movement inputs start plain/empty at first
  const [selectedMatCode, setSelectedMatCode] = useState<string>("");
  const [qtyInput, setQtyInput] = useState<string>("");
  const [rejectedInput, setRejectedInput] = useState<string>("");
  const [activityInput, setActivityInput] = useState<string>("");
  const [deliveryRefInput, setDeliveryRefInput] = useState<string>("");
  const [receiptVendorCode, setReceiptVendorCode] = useState<string>("");
  const [destProjCode, setDestProjCode] = useState<string>("");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  // Helper to switch inventory request type and reset all form inputs ("data gone on switch")
  const handleSwitchInvMode = (mode: "CONSUMPTION" | "RECEIPT" | "TRANSFER") => {
    setInvModalMode(mode);
    setSelectedMatCode("");
    setQtyInput("");
    setRejectedInput("");
    setActivityInput("");
    setDeliveryRefInput("");
    setReceiptVendorCode("");
    setDestProjCode("");
    setRemarksInput("");
    setFeedbackMsg("");
  };

  // M05 Form Selection: Separate Vendor Defect vs Delivery Defect Forms
  const [activeDefectForm, setActiveDefectForm] = useState<"VENDOR" | "DELIVERY">("VENDOR");

  // M05 Plain Vendor Defect Form State (Empty by default)
  const [defMatCode, setDefMatCode] = useState<string>("");
  const [defVendorCode, setDefVendorCode] = useState<string>("");
  const [defRef, setDefRef] = useState<string>("");
  const [defBatchNumber, setDefBatchNumber] = useState<string>("");
  const [defMillCert, setDefMillCert] = useState<string>("");
  const [defCategory, setDefCategory] = useState<string>("");
  const [defSeverity, setDefSeverity] = useState<SeedDefectRecord["severity"]>("HIGH");
  const [defRejectedQty, setDefRejectedQty] = useState<string>("");
  const [defDescription, setDefDescription] = useState<string>("");
  const [defCorrective, setDefCorrective] = useState<string>("");
  const [defPhotoUrl, setDefPhotoUrl] = useState<string>("");

  // M05 Plain Delivery Defect Form State (Empty by default)
  const [delRef, setDelRef] = useState<string>("");
  const [delTransporter, setDelTransporter] = useState<string>("");
  const [delLorryPlate, setDelLorryPlate] = useState<string>("");
  const [delBayGate, setDelBayGate] = useState<string>("");
  const [delCategory, setDelCategory] = useState<string>("");
  const [delSeverity, setDelSeverity] = useState<SeedDefectRecord["severity"]>("MEDIUM");
  const [delDamagedPkgs, setDelDamagedPkgs] = useState<string>("");
  const [delDriverRemarks, setDelDriverRemarks] = useState<string>("");
  const [delAction, setDelAction] = useState<string>("");
  const [delPhotoUrl, setDelPhotoUrl] = useState<string>("");

  const [defectFormSuccess, setDefectFormSuccess] = useState<string>("");

  // Manager Defect Denial Modal State
  const [denyModalDefectCode, setDenyModalDefectCode] = useState<string | null>(null);
  const [denialReasonText, setDenialReasonText] = useState<string>("");

  // State for pending defect status edits in table (Confirmation Save Workflow)
  const [pendingStatuses, setPendingStatuses] = useState<{
    [defectCode: string]: SeedDefectRecord["status"];
  }>({});
  const [statusSaveMsg, setStatusSaveMsg] = useState<{ [defectCode: string]: string }>({});

  const clearVendorForm = () => {
    setDefMatCode("");
    setDefVendorCode("");
    setDefRef("");
    setDefBatchNumber("");
    setDefMillCert("");
    setDefCategory("");
    setDefSeverity("HIGH");
    setDefRejectedQty("");
    setDefDescription("");
    setDefCorrective("");
    setDefPhotoUrl("");
  };

  const clearDeliveryForm = () => {
    setDelRef("");
    setDelTransporter("");
    setDelLorryPlate("");
    setDelBayGate("");
    setDelCategory("");
    setDelSeverity("MEDIUM");
    setDelDamagedPkgs("");
    setDelDriverRemarks("");
    setDelAction("");
    setDelPhotoUrl("");
  };

  const handleSwitchDefectForm = (form: "VENDOR" | "DELIVERY") => {
    setActiveDefectForm(form);
    setDefectFormSuccess("");
  };

  const projInventory = inventory.filter((i) => i.projectCode === projectCode);
  const projTransactions = transactions.filter(
    (t) => t.projectCode === projectCode
  );
  const projDefects = defects.filter((d) => d.projectCode === projectCode);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered & Sorted Live Stock Inventory
  const processedInventory = [...projInventory]
    .filter((item) => {
      const mat = materials.find((m) => m.materialCode === item.materialCode);
      const metrics = computeInventoryMetrics(item);
      const matchesSearch =
        item.materialCode.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
        (mat?.name.toLowerCase() || "").includes(materialSearchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || metrics.statusLabel === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const matA = materials.find((m) => m.materialCode === a.materialCode);
      const matB = materials.find((m) => m.materialCode === b.materialCode);
      const metricsA = computeInventoryMetrics(a);
      const metricsB = computeInventoryMetrics(b);

      let valA: any;
      let valB: any;

      switch (sortField) {
        case "materialCode":
          valA = a.materialCode;
          valB = b.materialCode;
          break;
        case "name":
          valA = matA?.name || "";
          valB = matB?.name || "";
          break;
        case "currentStock":
          valA = a.currentStock;
          valB = b.currentStock;
          break;
        case "availableStock":
          valA = metricsA.availableStock;
          valB = metricsB.availableStock;
          break;
        case "reorderPoint":
          valA = metricsA.reorderPoint;
          valB = metricsB.reorderPoint;
          break;
        case "coverageDays":
          valA = metricsA.stockCoverageDays ?? 999;
          valB = metricsB.stockCoverageDays ?? 999;
          break;
        case "status":
          valA = metricsA.statusLabel;
          valB = metricsB.statusLabel;
          break;
        default:
          valA = a.materialCode;
          valB = b.materialCode;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // =========================================================================
  // M04: LIVE INVENTORY INFO (WITH SORTING, FILTERING & SYNC)
  // =========================================================================
  if (activeTab === "M02_INVENTORY") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                MODULE 04 • LIVE INVENTORY INFO
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Project: <strong className="text-amber-400">{projectCode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Live Inventory info
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time available stock = Current Stock − Reserved Stock. Click table headers to sort; filter by operational status.
            </p>
          </div>

          {/* Sync Status & Sync Action on Top Right */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold">
                <span className={`inline-block w-2 h-2 rounded-full ${isSyncing ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                <span className={isSyncing ? "text-amber-300" : "text-emerald-400"}>
                  {isSyncing ? "Syncing..." : "Synced"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Last sync: {lastSyncTime}
              </div>
            </div>

            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-md group"
              title="Synchronize inventory with project ERP and site warehouses"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isSyncing ? "animate-spin text-amber-400" : "group-hover:rotate-180"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-xs font-mono font-bold hidden md:inline">
                {isSyncing ? "Synchronizing..." : "Sync Stock"}
              </span>
            </button>

            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-amber-400">
              Total Items: {projInventory.length}
            </span>
          </div>
        </div>

        {/* Sync Notification Banner */}
        {syncNotice && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <span>🔄 {syncNotice}</span>
            <span className="text-[10px] font-mono text-emerald-400">Verified by BuildSmart Engine</span>
          </div>
        )}

        {/* Filter Bar & Header Sorting Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <input
              type="text"
              placeholder="Search material code or description..."
              value={materialSearchQuery}
              onChange={(e) => setMaterialSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 min-w-[220px] focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono font-bold text-[11px]">FILTER STATUS:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-amber-400 font-bold rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses ({projInventory.length})</option>
                <option value="HEALTHY">Healthy Stock</option>
                <option value="LOW_STOCK">Low Stock (Reorder Alert)</option>
                <option value="CRITICAL_SHORTAGE">Critical Shortage</option>
                <option value="EXCESS_SURPLUS">Excess Surplus</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Sorted by: <span className="text-amber-400 font-bold">{sortField.toUpperCase()} ({sortDirection.toUpperCase()})</span>
          </div>
        </div>

        {/* Live Stock Table with Clickable Sort Headers */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                  <th
                    onClick={() => handleSort("materialCode")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Material Code</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "materialCode" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Description</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "name" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("currentStock")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Current Stock</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "currentStock" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-slate-400">Reserved</th>
                  <th
                    onClick={() => handleSort("availableStock")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <span>Available</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "availableStock" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("reorderPoint")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Reorder Pt</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "reorderPoint" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("coverageDays")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Coverage (Days)</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "coverageDays" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-slate-400">Incoming</th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-3 cursor-pointer hover:text-amber-400 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <span className="text-amber-400 font-bold">
                        {sortField === "status" ? (sortDirection === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {processedInventory.map((item) => {
                  const mat = materials.find(
                    (m) => m.materialCode === item.materialCode
                  );
                  const metrics = computeInventoryMetrics(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {item.materialCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{mat?.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {mat?.brand} • {mat?.specifications}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        {item.currentStock} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {item.reservedStock} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-amber-400 bg-amber-500/5">
                        {metrics.availableStock} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {metrics.reorderPoint} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            metrics.isCriticalShortage
                              ? "text-rose-400"
                              : metrics.isBelowReorderPoint
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }`}
                        >
                          {metrics.stockCoverageDays ?? "N/A"} days
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-400 font-medium">
                        {item.incomingStock} {mat?.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] font-mono ${
                            metrics.statusLabel === "CRITICAL_SHORTAGE"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : metrics.statusLabel === "LOW_STOCK"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : metrics.statusLabel === "EXCESS_SURPLUS"
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {metrics.statusLabel.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movement Action Form & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Form */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                Record Site Inventory Movement
              </h3>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg text-xs border border-slate-800">
                {perms.canSubmitConsumption && (
                  <button
                    onClick={() => handleSwitchInvMode("CONSUMPTION")}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      effectiveInvMode === "CONSUMPTION"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Consumption
                  </button>
                )}
                {perms.canConfirmGoodsReceipt && (
                  <button
                    onClick={() => handleSwitchInvMode("RECEIPT")}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      effectiveInvMode === "RECEIPT"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Goods Receipt
                  </button>
                )}
                {perms.canTransferMaterialSurplus && (
                  <button
                    onClick={() => handleSwitchInvMode("TRANSFER")}
                    className={`px-2.5 py-1 rounded font-semibold transition-all ${
                      effectiveInvMode === "TRANSFER"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Transfer
                  </button>
                )}
              </div>
            </div>

            {feedbackMsg && (
              <div className={`p-3 rounded-lg border text-xs font-semibold ${
                feedbackMsg.startsWith("⚠")
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}>
                {feedbackMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Material
                </label>
                <select
                  value={selectedMatCode}
                  onChange={(e) => setSelectedMatCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">-- Select Material --</option>
                  {materials.map((m) => (
                    <option key={m.materialCode} value={m.materialCode}>
                      {m.materialCode} – {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {effectiveInvMode === "RECEIPT" ? "Accepted Quantity" : "Quantity"}
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Enter quantity..."
                  value={qtyInput}
                  onChange={(e) => setQtyInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none placeholder-slate-600"
                />
              </div>

              {effectiveInvMode === "CONSUMPTION" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Site Work Activity / Zone
                  </label>
                  <input
                    type="text"
                    placeholder="Enter site work activity / zone..."
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none placeholder-slate-600"
                  />
                </div>
              )}

              {effectiveInvMode === "RECEIPT" && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Delivering Vendor
                    </label>
                    <select
                      value={receiptVendorCode}
                      onChange={(e) => setReceiptVendorCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="">-- Select Delivering Vendor --</option>
                      {vendors.map((v) => (
                        <option key={v.vendorCode} value={v.vendorCode}>
                          {v.vendorCode} – {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Rejected Quantity
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={rejectedInput}
                      onChange={(e) => setRejectedInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none placeholder-slate-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1">
                      Delivery Order (DO) Reference
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Delivery Order (DO) reference..."
                      value={deliveryRefInput}
                      onChange={(e) => setDeliveryRefInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none placeholder-slate-600"
                    />
                  </div>
                </>
              )}

              {effectiveInvMode === "TRANSFER" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Destination Project
                  </label>
                  <select
                    value={destProjCode}
                    onChange={(e) => setDestProjCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Destination Project --</option>
                    {projects
                      .filter((p) => p.projectCode !== projectCode)
                      .map((p) => (
                        <option key={p.projectCode} value={p.projectCode}>
                          {p.projectCode} – {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  placeholder="Enter remarks or movement notes..."
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none placeholder-slate-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Recorded by: <strong className="text-amber-400">{currentUser.name}</strong>
              </span>
              <button
                onClick={() => {
                  const numQty = Number(qtyInput);
                  if (!selectedMatCode) {
                    setFeedbackMsg("⚠ Please select a material to record movement.");
                    return;
                  }
                  if (!qtyInput || isNaN(numQty) || numQty <= 0) {
                    setFeedbackMsg("⚠ Please enter a valid quantity greater than 0.");
                    return;
                  }

                  if (effectiveInvMode === "CONSUMPTION") {
                    onRecordConsumption({
                      materialCode: selectedMatCode,
                      quantity: numQty,
                      workActivity: activityInput || "Site General Installation Works",
                      remarks: remarksInput || "Logged via Site Console",
                    });
                    setFeedbackMsg(
                      perms.canVerifyConsumption
                        ? `✓ Recorded & verified ${numQty} consumption of ${selectedMatCode}.`
                        : `✓ Submitted ${numQty} consumption of ${selectedMatCode} (Pending Site Manager/PM verification).`
                    );
                    setSelectedMatCode("");
                    setQtyInput("");
                    setActivityInput("");
                    setRemarksInput("");
                  } else if (effectiveInvMode === "RECEIPT") {
                    if (!perms.canConfirmGoodsReceipt) {
                      setFeedbackMsg(
                        "⚠ RBAC Notice: Only Procurement or Project Manager roles can confirm Goods Receipts."
                      );
                      return;
                    }
                    if (!receiptVendorCode) {
                      setFeedbackMsg("⚠ Please select the delivering vendor.");
                      return;
                    }
                    const numRejected = Number(rejectedInput) || 0;
                    onRecordGoodsReceipt({
                      materialCode: selectedMatCode,
                      vendorCode: receiptVendorCode,
                      deliveryRef: deliveryRefInput || `DO-${Date.now().toString().slice(-4)}`,
                      acceptedQty: numQty,
                      rejectedQty: numRejected,
                      remarks: remarksInput || "Goods receipt accepted on site",
                    });
                    setFeedbackMsg(
                      `✓ Goods Receipt confirmed: +${numQty} of ${selectedMatCode} added to stock.`
                    );
                    setSelectedMatCode("");
                    setQtyInput("");
                    setRejectedInput("");
                    setReceiptVendorCode("");
                    setDeliveryRefInput("");
                    setRemarksInput("");
                  } else {
                    if (!perms.canTransferMaterialSurplus) {
                      setFeedbackMsg(
                        "⚠ RBAC Notice: Only Project Manager or Procurement Manager can execute inter-project transfers."
                      );
                      return;
                    }
                    if (!destProjCode) {
                      setFeedbackMsg("⚠ Please select the destination project.");
                      return;
                    }
                    onTransferMaterial({
                      destProjectCode: destProjCode,
                      materialCode: selectedMatCode,
                      quantity: numQty,
                      remarks: remarksInput || "Inter-project material transfer",
                    });
                    setFeedbackMsg(
                      `✓ Transferred ${numQty} of ${selectedMatCode} to ${destProjCode}.`
                    );
                    setSelectedMatCode("");
                    setQtyInput("");
                    setDestProjCode("");
                    setRemarksInput("");
                  }
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md"
              >
                {effectiveInvMode === "CONSUMPTION"
                  ? perms.canVerifyConsumption
                    ? "Verify & Record Consumption"
                    : "Submit Consumption (Pending)"
                  : effectiveInvMode === "RECEIPT"
                    ? "Confirm Goods Receipt"
                    : "Execute Surplus Transfer"}
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
            <h3 className="font-bold text-white text-sm">
              Recent Transactions — {projectCode}
            </h3>
            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2 px-2.5">Txn ID</th>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Material</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {projTransactions.slice(0, 8).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50">
                      <td className="py-2 px-2.5 font-mono text-amber-400 font-bold">{t.transactionCode}</td>
                      <td className="py-2 px-2.5 text-slate-400">{t.transactionDate.slice(0, 10)}</td>
                      <td className="py-2 px-2.5 font-semibold text-white">{t.materialCode}</td>
                      <td className="py-2 px-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.transactionType === "RECEIPT" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-white">{t.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // M05: MATERIAL & VENDOR PERFORMANCE
  // =========================================================================
  // Real-Time Defect & Quality Intelligence Analytics (Reflects live data real-time)
  const totalDefectsCount = projDefects.length;
  const validatedDefectsCount = projDefects.filter((d) => d.validationStatus === "VALIDATED").length;
  const pendingDefectsCount = projDefects.filter((d) => d.validationStatus === "PENDING" || !d.validationStatus).length;
  const deniedDefectsCount = projDefects.filter((d) => d.validationStatus === "DENIED").length;
  const vendorDefectsCount = projDefects.filter((d) => d.defectType === "VENDOR_DEFECT" || !d.defectType).length;
  const deliveryDefectsCount = projDefects.filter((d) => d.defectType === "DELIVERY_DEFECT").length;
  const criticalDefectsCount = projDefects.filter((d) => d.severity === "CRITICAL").length;
  const highDefectsCount = projDefects.filter((d) => d.severity === "HIGH").length;
  const mediumLowDefectsCount = projDefects.filter((d) => d.severity === "MEDIUM" || d.severity === "LOW").length;
  const validationRatePct = totalDefectsCount > 0 ? Math.round((validatedDefectsCount / totalDefectsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            MODULE 05 • MATERIAL & VENDOR PERFORMANCE
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Material & Vendor Performance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quality defect verification, delivery defect tracking, and manager-validated vendor scorecard impact.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-white">
            Total Defects: <strong className="text-amber-400">{totalDefectsCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-emerald-500/40 text-emerald-400">
            Validated (In Score): {validatedDefectsCount}
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-amber-500/40 text-amber-300">
            Pending Validation: {pendingDefectsCount}
          </span>
        </div>
      </div>

      {/* Real-Time Quality & Defect Intelligence Chart (Reflects live data whenever defects are logged or validated) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-extrabold text-white text-sm">
              Live Defect & Vendor Quality Analytics (Real-Time Reactive Graph)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Manager Validation Rate: <strong className="text-emerald-400">{validationRatePct}%</strong>
            </span>
            <span className="text-slate-400">
              Excluded/Denied: <strong className="text-rose-400">{deniedDefectsCount}</strong>
            </span>
          </div>
        </div>

        {/* Real-Time Metrics & SVG Breakdown Bars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">🏢 Vendor Material Defects</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between">
              <span>{vendorDefectsCount}</span>
              <span className="text-[10px] text-amber-400 font-normal">
                {totalDefectsCount > 0 ? Math.round((vendorDefectsCount / totalDefectsCount) * 100) : 0}% of total
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalDefectsCount > 0 ? (vendorDefectsCount / totalDefectsCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">🚚 Delivery / Logistics Defects</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between">
              <span>{deliveryDefectsCount}</span>
              <span className="text-[10px] text-sky-400 font-normal">
                {totalDefectsCount > 0 ? Math.round((deliveryDefectsCount / totalDefectsCount) * 100) : 0}% of total
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalDefectsCount > 0 ? (deliveryDefectsCount / totalDefectsCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">✓ Validated (Impacts Score)</div>
            <div className="text-lg font-bold text-emerald-400 flex items-baseline justify-between">
              <span>{validatedDefectsCount}</span>
              <span className="text-[10px] text-emerald-300 font-normal">{validationRatePct}% valid</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${validationRatePct}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">⚠️ Critical / High Severity</div>
            <div className="text-lg font-bold text-rose-400 flex items-baseline justify-between">
              <span>{criticalDefectsCount + highDefectsCount}</span>
              <span className="text-[10px] text-rose-300 font-normal">
                {totalDefectsCount > 0 ? Math.round(((criticalDefectsCount + highDefectsCount) / totalDefectsCount) * 100) : 0}% severe
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalDefectsCount > 0 ? ((criticalDefectsCount + highDefectsCount) / totalDefectsCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time SVG Defect Proportional Distribution */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>REAL-TIME SEVERITY & VALIDATION SPECTRUM:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Critical ({criticalDefectsCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> High ({highDefectsCount})</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Medium/Low ({mediumLowDefectsCount})</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex">
            {totalDefectsCount > 0 ? (
              <>
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(criticalDefectsCount / totalDefectsCount) * 100}%` }}
                  title={`Critical: ${criticalDefectsCount}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${(highDefectsCount / totalDefectsCount) * 100}%` }}
                  title={`High: ${highDefectsCount}`}
                />
                <div
                  className="bg-sky-500 h-full transition-all duration-500"
                  style={{ width: `${(mediumLowDefectsCount / totalDefectsCount) * 100}%` }}
                  title={`Medium/Low: ${mediumLowDefectsCount}`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-800 h-full" />
            )}
          </div>
        </div>
      </div>

      {/* Top Section: Split View (Separated Defect Forms on Left, Active Defect Table with Confirmation on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Switcher & Plain Entry Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          {/* Form Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchDefectForm("VENDOR")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeDefectForm === "VENDOR"
                    ? "bg-rose-600 text-white shadow"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>🏢 Vendor Defect Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchDefectForm("DELIVERY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeDefectForm === "DELIVERY"
                    ? "bg-amber-600 text-white shadow"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>🚚 Delivery Defect Form</span>
              </button>
            </div>

            <button
              type="button"
              onClick={activeDefectForm === "VENDOR" ? clearVendorForm : clearDeliveryForm}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors"
              title="Reset all fields to plain empty form"
            >
              ↺ Clear Form
            </button>
          </div>

          {defectFormSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
              {defectFormSuccess}
            </div>
          )}

          {/* FORM 1: REFLECT VENDOR DEFECT FORM (Vendor Material Quality, Mill Specs, Rejected Batches) */}
          {activeDefectForm === "VENDOR" && (
            <div className="space-y-3.5 text-xs animate-fadeIn">
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] leading-relaxed">
                <strong>Vendor Defect Policy:</strong> Submissions start as <em>Pending Validation</em>. Only validated defects by a Project or Site Manager affect the vendor evaluation score.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Vendor / Subcontractor <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defVendorCode}
                    onChange={(e) => setDefVendorCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.vendorCode} value={v.vendorCode}>
                        {v.vendorCode} – {v.name} ({v.performance.overallScore}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Material Affected <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defMatCode}
                    onChange={(e) => setDefMatCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Material --</option>
                    {materials.map((m) => (
                      <option key={m.materialCode} value={m.materialCode}>
                        {m.materialCode} – {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Defect Quality Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={defCategory}
                    onChange={(e) => setDefCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Poor product quality">Poor product quality</option>
                    <option value="Incorrect specifications">Incorrect specifications</option>
                    <option value="Damaged materials">Damaged materials</option>
                    <option value="Subcontractor workmanship">Subcontractor workmanship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Severity & Rejected Qty
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={defSeverity}
                      onChange={(e) =>
                        setDefSeverity(e.target.value as SeedDefectRecord["severity"])
                      }
                      className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-white focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={defRejectedQty}
                      onChange={(e) => setDefRejectedQty(e.target.value)}
                      placeholder="Rejected Qty"
                      className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Batch / Heat Number
                  </label>
                  <input
                    type="text"
                    value={defBatchNumber}
                    onChange={(e) => setDefBatchNumber(e.target.value)}
                    placeholder="e.g. BATCH-2026-X8"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Mill Test Certificate Ref
                  </label>
                  <input
                    type="text"
                    value={defMillCert}
                    onChange={(e) => setDefMillCert(e.target.value)}
                    placeholder="e.g. MTC-APEX-9921"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Delivery Order (DO) / Call-Off Ref
                  </label>
                  <input
                    type="text"
                    value={defRef}
                    onChange={(e) => setDefRef(e.target.value)}
                    placeholder="e.g. DO-APEX-7802"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Defect Description & Mill Observation <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={defDescription}
                    onChange={(e) => setDefDescription(e.target.value)}
                    placeholder="Describe specific quality or dimensional failure observed on site..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Required Corrective Action
                  </label>
                  <input
                    type="text"
                    value={defCorrective}
                    onChange={(e) => setDefCorrective(e.target.value)}
                    placeholder="e.g. Quarantine in Reject Bay, issue Non-Conformance Report (NCR)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Defect Photo Attachment Field (Real File Upload + Empty Plain State) */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-semibold text-slate-300">
                    Defect Evidence Photo (Starts Plain & Empty)
                  </label>

                  {/* Hidden Real File Input */}
                  <input
                    type="file"
                    ref={defectFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setDefPhotoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => defectFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <span>📷</span>
                      <span>Upload Defect Photo</span>
                    </button>

                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={defPhotoUrl}
                        onChange={(e) => setDefPhotoUrl(e.target.value)}
                        placeholder="Or paste site photo URL (optional)..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  {defPhotoUrl && (
                    <div className="relative rounded-lg border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                      <div className="h-14 w-16 rounded-md overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                        <img
                          src={defPhotoUrl}
                          alt="Vendor Defect Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-rose-400">Photo Attached</span>
                        </div>
                        <div className="text-[11px] text-amber-300 font-medium truncate">
                          Vendor: <strong className="text-white">{vendors.find((v) => v.vendorCode === defVendorCode)?.name || defVendorCode || "Unassigned"}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDefPhotoUrl("")}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                        title="Remove Photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!defVendorCode || !defMatCode || !defDescription) {
                    alert("Please fill in Vendor, Material, and Defect Description.");
                    return;
                  }
                  onReportDefect({
                    materialCode: defMatCode,
                    vendorCode: defVendorCode,
                    deliveryRef: defRef || "DO-PENDING",
                    category: (defCategory as SeedDefectRecord["category"]) || "Poor product quality",
                    severity: defSeverity,
                    rejectedQty: Number(defRejectedQty) || 0,
                    description: defDescription,
                    correctiveActionText: defCorrective || "Quarantine and issue Vendor Non-Conformance Report",
                    photoUrl: defPhotoUrl || undefined,
                    defectType: "VENDOR_DEFECT",
                    batchNumber: defBatchNumber || undefined,
                    millCertRef: defMillCert || undefined,
                  });
                  clearVendorForm();
                  setDefectFormSuccess("✓ Vendor defect reported with status PENDING. Vendor score will only be affected after Manager Validation.");
                  setTimeout(() => setDefectFormSuccess(""), 4500);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>🏢</span>
                <span>Submit Vendor Defect (Pending Manager Validation)</span>
              </button>
            </div>
          )}

          {/* FORM 2: REFLECT DELIVERY DEFECT FORM (Site Logistics, DO, Transporter, Lorry Plate, Offloading Bay) */}
          {activeDefectForm === "DELIVERY" && (
            <div className="space-y-3.5 text-xs animate-fadeIn">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                <strong>Site Delivery & Logistics Defect:</strong> Tracks transit damage, short shipments, carrier haulage details, and unloading bay congestion. Does not impact supplier mill scorecard unless validated.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Delivery Order (DO) Ref <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={delRef}
                    onChange={(e) => setDelRef(e.target.value)}
                    placeholder="e.g. DO-TRN-4491"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Transporter / Haulier Company <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={delTransporter}
                    onChange={(e) => setDelTransporter(e.target.value)}
                    placeholder="e.g. Swift Haulage / City Logistics"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Lorry / Vehicle Plate No
                  </label>
                  <input
                    type="text"
                    value={delLorryPlate}
                    onChange={(e) => setDelLorryPlate(e.target.value)}
                    placeholder="e.g. WXY 8812"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Unloading Bay / Site Gate
                  </label>
                  <input
                    type="text"
                    value={delBayGate}
                    onChange={(e) => setDelBayGate(e.target.value)}
                    placeholder="e.g. Bay 2 (Zone B Rebar Yard)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Logistics Defect Category <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={delCategory}
                    onChange={(e) => setDelCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Packaging damage">Packaging damage / Broken Straps</option>
                    <option value="Incomplete delivery">Incomplete delivery / Short shipment</option>
                    <option value="Damaged materials">Transit crushed packaging / Weather exposure</option>
                    <option value="Wrong product delivered">Wrong product delivered to bay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Severity & Damaged Packages
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={delSeverity}
                      onChange={(e) =>
                        setDelSeverity(e.target.value as SeedDefectRecord["severity"])
                      }
                      className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-white focus:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={delDamagedPkgs}
                      onChange={(e) => setDelDamagedPkgs(e.target.value)}
                      placeholder="Damaged Pkgs"
                      className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Transporter Driver Remarks / Site Gate Note <span className="text-amber-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={delDriverRemarks}
                    onChange={(e) => setDelDriverRemarks(e.target.value)}
                    placeholder="Driver statement, offloading incident, or gate pass discrepancy..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Site Logistics Action Taken
                  </label>
                  <input
                    type="text"
                    value={delAction}
                    onChange={(e) => setDelAction(e.target.value)}
                    placeholder="e.g. Endorsed short shipment on Delivery Order, notified freight coordinator"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Delivery Photo Attachment Field */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-semibold text-slate-300">
                    Delivery / Lorry Offloading Photo (Starts Plain & Empty)
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => defectFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <span>📷</span>
                      <span>Upload Delivery Photo</span>
                    </button>

                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={delPhotoUrl}
                        onChange={(e) => setDelPhotoUrl(e.target.value)}
                        placeholder="Or paste transit photo URL (optional)..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {delPhotoUrl && (
                    <div className="relative rounded-lg border border-slate-700 bg-slate-950 p-2 flex items-center gap-3">
                      <div className="h-14 w-16 rounded-md overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0">
                        <img
                          src={delPhotoUrl}
                          alt="Delivery Defect Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-amber-400">Delivery Photo Attached</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium truncate">
                          Carrier: {delTransporter || "Unassigned"} • Lorry: {delLorryPlate || "N/A"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDelPhotoUrl("")}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                        title="Remove Photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!delRef || !delTransporter || !delDriverRemarks) {
                    alert("Please fill in Delivery Order Ref, Transporter, and Driver Remarks.");
                    return;
                  }
                  onReportDefect({
                    materialCode: "LOGISTICS-TRANSIT",
                    vendorCode: "DELIVERY-HAULIER",
                    deliveryRef: delRef,
                    category: (delCategory as SeedDefectRecord["category"]) || "Packaging damage",
                    severity: delSeverity,
                    rejectedQty: Number(delDamagedPkgs) || 0,
                    description: `Transporter: ${delTransporter} | Lorry: ${delLorryPlate || "N/A"} | Bay: ${delBayGate || "N/A"} — ${delDriverRemarks}`,
                    correctiveActionText: delAction || "Notify site logistics and note claim on carrier delivery ticket",
                    photoUrl: delPhotoUrl || undefined,
                    defectType: "DELIVERY_DEFECT",
                    transporterName: delTransporter,
                    lorryPlate: delLorryPlate,
                    bayGate: delBayGate,
                    damagedPkgCount: Number(delDamagedPkgs) || 0,
                    driverRemarks: delDriverRemarks,
                  });
                  clearDeliveryForm();
                  setDefectFormSuccess("✓ Delivery defect logged successfully for site logistics and gate records.");
                  setTimeout(() => setDefectFormSuccess(""), 4500);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>🚚</span>
                <span>Submit Delivery Defect (Site Logistics Record)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Site Defect Log List with Manager Validation Buttons */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">
                Defect Verification & Audit Log ({projDefects.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Only validated vendor defects impact vendor scores. Managers can validate or deny records below.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Project: {projectCode}
            </span>
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {projDefects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                No defects logged for this project yet. Use the form on the left to submit a Vendor or Delivery defect.
              </div>
            ) : (
              projDefects.map((d) => {
                const ven = vendors.find((v) => v.vendorCode === d.vendorCode);
                const currentPendingStatus = pendingStatuses[d.defectCode] ?? d.status;
                const hasStatusChange = currentPendingStatus !== d.status;
                const isValidated = d.validationStatus === "VALIDATED";
                const isDenied = d.validationStatus === "DENIED";
                const isPendingValidation = !d.validationStatus || d.validationStatus === "PENDING";
                const isManager = perms.canManageInventory || currentUser.role === "PROJECT_MANAGER" || currentUser.role === "SITE_MANAGER";

                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-xl border space-y-2.5 text-xs transition-all ${
                      isValidated
                        ? "border-emerald-500/30 bg-slate-950/80"
                        : isDenied
                          ? "border-rose-500/30 bg-slate-950/60 opacity-80"
                          : "border-amber-500/40 bg-slate-950/90"
                    }`}
                  >
                    {/* Top Row: Defect Code, Type Badge, Validation Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-400">
                          {d.defectCode}
                        </span>

                        {/* Defect Type Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          d.defectType === "DELIVERY_DEFECT"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}>
                          {d.defectType === "DELIVERY_DEFECT" ? "🚚 DELIVERY DEFECT" : "🏢 VENDOR DEFECT"}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            d.severity === "CRITICAL"
                              ? "bg-rose-600 text-white"
                              : d.severity === "HIGH"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {d.severity}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {d.category}
                        </span>
                      </div>

                      {/* Validation Status Badge */}
                      <div>
                        {isValidated ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[10px] flex items-center gap-1 shadow-sm">
                            <span>✓ VALIDATED</span>
                            <span className="text-[9px] text-emerald-400/80">(In Vendor Score)</span>
                          </span>
                        ) : isDenied ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-[10px] flex items-center gap-1">
                            <span>✕ DENIED</span>
                            <span className="text-[9px] text-rose-400/80">(Excluded)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-[10px] flex items-center gap-1 animate-pulse">
                            <span>⏳ PENDING VALIDATION</span>
                            <span className="text-[9px] text-amber-400/80">(Not in Score)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Manager Validation Controls (Requirement 4: Only manager can validate/deny) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                      <div className="text-slate-400">
                        {isPendingValidation ? (
                          <span className="text-amber-300">
                            <strong>Awaiting Review:</strong> Defect will NOT impact vendor score until validated by a Manager.
                          </span>
                        ) : isValidated ? (
                          <span className="text-emerald-400">
                            <strong>Validated:</strong> Confirmed by {d.validatedBy || "Site Manager"} on {d.validatedDate || d.reportedDate}.
                          </span>
                        ) : (
                          <span className="text-rose-400">
                            <strong>Denied:</strong> {d.denialReason || "Defect rejected upon reinspection. Vendor score unaffected."}
                          </span>
                        )}
                      </div>

                      {/* Manager Action Buttons */}
                      {isManager ? (
                        <div className="flex items-center gap-2">
                          {isPendingValidation && onValidateDefect && (
                            <>
                              <button
                                type="button"
                                onClick={() => onValidateDefect(d.defectCode, true)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow transition-all flex items-center gap-1"
                              >
                                <span>✓ Validate</span>
                                <span>(Include in Score)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDenyModalDefectCode(d.defectCode);
                                  setDenialReasonText("");
                                }}
                                className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px] shadow transition-all flex items-center gap-1"
                              >
                                <span>✕ Deny</span>
                                <span>(Exclude)</span>
                              </button>
                            </>
                          )}
                          {!isPendingValidation && onValidateDefect && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isValidated) {
                                  setDenyModalDefectCode(d.defectCode);
                                  setDenialReasonText("");
                                } else {
                                  onValidateDefect(d.defectCode, true);
                                }
                              }}
                              className="text-[10px] text-slate-400 hover:text-amber-400 underline font-mono"
                            >
                              Re-evaluate Decision
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          🔒 Manager approval required to validate
                        </span>
                      )}
                    </div>

                    {/* Defect Specific Attributes */}
                    {d.defectType === "DELIVERY_DEFECT" ? (
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono">
                        <div>DO: <strong className="text-white">{d.deliveryRef}</strong></div>
                        <div>Haulier: <strong className="text-white">{d.transporterName || "N/A"}</strong></div>
                        <div>Lorry Plate: <strong className="text-white">{d.lorryPlate || "N/A"}</strong></div>
                        <div>Bay/Gate: <strong className="text-white">{d.bayGate || "N/A"}</strong></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          🏢 Vendor: <strong className="text-white">{ven?.name || d.vendorCode}</strong> ({d.vendorCode})
                        </span>
                        <span className="text-slate-400 font-mono">
                          Material: {d.materialCode} • Ref: {d.deliveryRef} • Rejected: {d.rejectedQty} units
                        </span>
                        {d.batchNumber && (
                          <span className="text-amber-300 font-mono text-[10px]">
                            Batch: {d.batchNumber}
                          </span>
                        )}
                        {d.millCertRef && (
                          <span className="text-sky-300 font-mono text-[10px]">
                            MTC: {d.millCertRef}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Photo Thumbnail + Description */}
                    <div className="flex gap-3 items-start">
                      {d.photoUrl && (
                        <div
                          onClick={() =>
                            setDefectPhotoModal({
                              url: d.photoUrl!,
                              defectCode: d.defectCode,
                              vendorName: ven?.name || d.vendorCode || "Site Logistics",
                              desc: d.description,
                            })
                          }
                          className="h-16 w-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 cursor-pointer hover:border-amber-400 hover:opacity-90 transition-all relative group"
                          title="Click to zoom defect photo"
                        >
                          <img
                            src={d.photoUrl}
                            alt={d.defectCode}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            🔍
                          </div>
                        </div>
                      )}
                      <p className="text-slate-300 flex-1 leading-relaxed">{d.description}</p>
                    </div>

                    {/* Status & Operational Lifecycle dropdown */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>
                        Reported by: <strong className="text-slate-300">{d.reportedBy}</strong> ({d.reportedByRole}) on {d.reportedDate}
                      </span>

                      <div className="flex items-center gap-2">
                        {perms.canUpdateDefectStatus ? (
                          <>
                            <select
                              value={currentPendingStatus}
                              onChange={(e) => {
                                const newSt = e.target.value as SeedDefectRecord["status"];
                                setPendingStatuses((prev) => ({
                                  ...prev,
                                  [d.defectCode]: newSt,
                                }));
                              }}
                              className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white focus:outline-none"
                            >
                              <option value="OPEN">OPEN</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="RESOLVED">RESOLVED</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>

                            {hasStatusChange && (
                              <button
                                onClick={() => {
                                  onUpdateDefectStatus(d.defectCode, currentPendingStatus);
                                  setStatusSaveMsg((prev) => ({
                                    ...prev,
                                    [d.defectCode]: `Saved by ${currentUser.name}`,
                                  }));
                                  setTimeout(() => {
                                    setStatusSaveMsg((prev) => {
                                      const copy = { ...prev };
                                      delete copy[d.defectCode];
                                      return copy;
                                    });
                                  }, 3000);
                                }}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] shadow"
                              >
                                Save Status
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="font-mono text-slate-400">
                            Lifecycle: <strong className="text-amber-400">{d.status}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {statusSaveMsg[d.defectCode] && (
                      <div className="text-[10px] text-emerald-400 font-mono font-bold">
                        ✓ Status updated & recorded by {currentUser.name}
                      </div>
                    )}

                    {d.correctiveActions.map((ca) => (
                      <div
                        key={ca.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                      >
                        <strong className="text-amber-400">Corrective Action ({ca.status}):</strong>{" "}
                        <span className="text-slate-300">{ca.actionDescription}</span> —{" "}
                        <span className="text-slate-500">
                          Owner: {ca.responsibleParty} (Target: {ca.targetDate})
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Manager Denial Modal */}
      {denyModalDefectCode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-base">✕</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Deny Defect & Exclude from Score</h4>
                  <span className="text-[10px] font-mono text-amber-400">{denyModalDefectCode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDenyModalDefectCode(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Denying this defect will mark it as <strong className="text-rose-400">DENIED</strong>. The vendor scorecard will <strong className="text-emerald-400">NOT be affected</strong>. Please specify the manager verification reason below:
            </p>

            <textarea
              rows={3}
              value={denialReasonText}
              onChange={(e) => setDenialReasonText(e.target.value)}
              placeholder="e.g. Re-inspection passed; third-party lab mill cert confirms tensile specs met. Internal transit handling issue."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDenyModalDefectCode(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onValidateDefect?.(denyModalDefectCode, false, denialReasonText || "Denied by Manager review");
                  setDenyModalDefectCode(null);
                  setDenialReasonText("");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Confirm Defect Denial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defect Photo Lightbox Modal */}
      {defectPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {defectPhotoModal.defectCode}
                </span>
                <h4 className="font-bold text-white text-sm">Defect Evidence Photo</h4>
                <div className="text-[11px] text-rose-300 font-medium">
                  Reflects Vendor: {defectPhotoModal.vendorName}
                </div>
              </div>
              <button
                onClick={() => setDefectPhotoModal(null)}
                className="text-slate-400 hover:text-white font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[420px] overflow-hidden">
              <img
                src={defectPhotoModal.url}
                alt={defectPhotoModal.defectCode}
                className="max-h-[400px] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-300">
              <p className="italic">{defectPhotoModal.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
