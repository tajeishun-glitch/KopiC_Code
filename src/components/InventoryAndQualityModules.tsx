"use client";

import React, { useState } from "react";
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
  }) => void;
  onUpdateDefectStatus: (
    defectCode: string,
    status: SeedDefectRecord["status"]
  ) => void;
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
  onUpdateDefectStatus,
}: InventoryAndQualityProps) {
  const perms = getRolePermissions(currentUser.role);

  // M04 Live Stock Table Sorting & Filtering State
  const [sortField, setSortField] = useState<SortField>("materialCode");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>("");

  // M02 Inventory Movement Form State
  const [invModalMode, setInvModalMode] = useState<
    "CONSUMPTION" | "RECEIPT" | "TRANSFER"
  >("CONSUMPTION");
  const [selectedMatCode, setSelectedMatCode] = useState<string>("STL-002");
  const [qtyInput, setQtyInput] = useState<number>(25);
  const [rejectedInput, setRejectedInput] = useState<number>(0);
  const [activityInput, setActivityInput] = useState<string>(
    "Zone B Transfer Beam & Concourse Slab Reinforcement"
  );
  const [deliveryRefInput, setDeliveryRefInput] =
    useState<string>("DO-MTR-9981");
  const [receiptVendorCode, setReceiptVendorCode] = useState<string>("V003");
  const [destProjCode, setDestProjCode] = useState<string>(
    projectCode === "PRJ-ALPHA" ? "PRJ-GAMMA" : "PRJ-ALPHA"
  );
  const [remarksInput, setRemarksInput] = useState<string>(
    "Logged via BuildSmart AI Site Console"
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  // M05 Defect Log Form State
  const [defMatCode, setDefMatCode] = useState<string>("STL-002");
  const [defVendorCode, setDefVendorCode] = useState<string>("V002");
  const [defRef, setDefRef] = useState<string>("DO-APEX-7802");
  const [defCategory, setDefCategory] =
    useState<SeedDefectRecord["category"]>("Damaged materials");
  const [defSeverity, setDefSeverity] =
    useState<SeedDefectRecord["severity"]>("HIGH");
  const [defRejectedQty, setDefRejectedQty] = useState<number>(12);
  const [defDescription, setDefDescription] = useState<string>(
    "Site Worker inspection at unloading bay: 12 MT of T16 rebar bundles arrived bent with severe surface rust scale and missing mill tag."
  );
  const [defCorrective, setDefCorrective] = useState<string>(
    "Quarantine 12 MT in Reject Bay, deduct from accepted GRN, and flag vendor scorecard for future tender review."
  );
  const [defPhotoUrl, setDefPhotoUrl] = useState<string>(
    "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80"
  );
  const [defectFormSuccess, setDefectFormSuccess] = useState<string>("");

  // State for pending defect status edits in table (Confirmation Save Workflow)
  const [pendingStatuses, setPendingStatuses] = useState<{
    [defectCode: string]: SeedDefectRecord["status"];
  }>({});
  const [statusSaveMsg, setStatusSaveMsg] = useState<{ [defectCode: string]: string }>({});

  // Vendor Scorecard Expansion Toggle (Show max 3 by default)
  const [isVendorScorecardExpanded, setIsVendorScorecardExpanded] = useState<boolean>(false);

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
  // M04: LIVE STOCK INVENTORY (WITH SORTING & FILTERING)
  // =========================================================================
  if (activeTab === "M02_INVENTORY") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                MODULE 04 • LIVE STOCK INVENTORY
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Project: <strong className="text-amber-400">{projectCode}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Live Site Stock & Material Consumption Tracker
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time available stock = Current Stock − Reserved Stock. Click table headers to sort; filter by operational status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-amber-400">
              Total Materials: {projInventory.length}
            </span>
          </div>
        </div>

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
                <button
                  onClick={() => setInvModalMode("CONSUMPTION")}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    invModalMode === "CONSUMPTION"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Consumption
                </button>
                <button
                  onClick={() => setInvModalMode("RECEIPT")}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    invModalMode === "RECEIPT"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Goods Receipt
                </button>
                <button
                  onClick={() => setInvModalMode("TRANSFER")}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    invModalMode === "TRANSFER"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Transfer
                </button>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
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
                  {materials.map((m) => (
                    <option key={m.materialCode} value={m.materialCode}>
                      {m.materialCode} – {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {invModalMode === "RECEIPT" ? "Accepted Quantity" : "Quantity"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {invModalMode === "CONSUMPTION" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Site Work Activity / Zone
                  </label>
                  <input
                    type="text"
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              )}

              {invModalMode === "RECEIPT" && (
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
                      value={rejectedInput}
                      onChange={(e) => setRejectedInput(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1">
                      Delivery Order (DO) Reference
                    </label>
                    <input
                      type="text"
                      value={deliveryRefInput}
                      onChange={(e) => setDeliveryRefInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              {invModalMode === "TRANSFER" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Destination Project
                  </label>
                  <select
                    value={destProjCode}
                    onChange={(e) => setDestProjCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                  >
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
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Recorded by: <strong className="text-amber-400">{currentUser.name}</strong> ({currentUser.role})
              </span>
              <button
                onClick={() => {
                  if (invModalMode === "CONSUMPTION") {
                    onRecordConsumption({
                      materialCode: selectedMatCode,
                      quantity: qtyInput,
                      workActivity: activityInput,
                      remarks: remarksInput,
                    });
                    setFeedbackMsg(
                      `✓ Recorded ${qtyInput} consumption of ${selectedMatCode}.`
                    );
                  } else if (invModalMode === "RECEIPT") {
                    if (!perms.canConfirmGoodsReceipt) {
                      setFeedbackMsg(
                        "⚠ RBAC Notice: Site Workers cannot directly confirm Goods Receipts. Switch to Supervisor, Engineer, or PM."
                      );
                      return;
                    }
                    onRecordGoodsReceipt({
                      materialCode: selectedMatCode,
                      vendorCode: receiptVendorCode,
                      deliveryRef: deliveryRefInput,
                      acceptedQty: qtyInput,
                      rejectedQty: rejectedInput,
                      remarks: remarksInput,
                    });
                    setFeedbackMsg(
                      `✓ Goods Receipt ${deliveryRefInput} confirmed: +${qtyInput} added to stock.`
                    );
                  } else {
                    onTransferMaterial({
                      destProjectCode: destProjCode,
                      materialCode: selectedMatCode,
                      quantity: qtyInput,
                      remarks: remarksInput,
                    });
                    setFeedbackMsg(
                      `✓ Transferred ${qtyInput} of ${selectedMatCode} to ${destProjCode}.`
                    );
                  }
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md"
              >
                {invModalMode === "CONSUMPTION"
                  ? "Submit Consumption"
                  : invModalMode === "RECEIPT"
                    ? "Confirm Receipt"
                    : "Execute Transfer"}
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
  // M05: DEFECT LOG & VENDOR SCORE
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            MODULE 05 • SITE DEFECT LOG & VENDOR SCORE
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Site Defect Logging & Live Vendor Performance Scorecard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log site delivery defects with photo attachments. Status updates require confirmation and are recorded in the audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-rose-400">
            Open Defects: {projDefects.filter((d) => d.status === "OPEN" || d.status === "IN_PROGRESS").length}
          </span>
        </div>
      </div>

      {/* Top Section: Split View (Defect Form with Photo Attachment on Left, Active Defect Table with Confirmation Save on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Reflect Vendor Defect Form (With Photo Attachment + 'Submit' button) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div>
            <h3 className="font-extrabold text-white text-base">
              Reflect Vendor / Delivery Defect
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reports defect directly to vendor performance scorecard.
            </p>
          </div>

          {defectFormSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
              {defectFormSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Vendor / Subcontractor
              </label>
              <select
                value={defVendorCode}
                onChange={(e) => setDefVendorCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.vendorCode} value={v.vendorCode}>
                    {v.vendorCode} – {v.name} ({v.performance.overallScore}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Material Affected
              </label>
              <select
                value={defMatCode}
                onChange={(e) => setDefMatCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              >
                {materials.map((m) => (
                  <option key={m.materialCode} value={m.materialCode}>
                    {m.materialCode} – {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Defect Category
              </label>
              <select
                value={defCategory}
                onChange={(e) =>
                  setDefCategory(e.target.value as SeedDefectRecord["category"])
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              >
                <option value="Damaged materials">Damaged materials</option>
                <option value="Incorrect specifications">Incorrect specifications</option>
                <option value="Wrong product delivered">Wrong product delivered</option>
                <option value="Incomplete delivery">Incomplete delivery</option>
                <option value="Poor product quality">Poor product quality</option>
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
                  onChange={(e) => setDefRejectedQty(Number(e.target.value))}
                  placeholder="Rejected Qty"
                  className="w-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Delivery Order / Work Package Ref
              </label>
              <input
                type="text"
                value={defRef}
                onChange={(e) => setDefRef(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Defect Description & Site Observation
              </label>
              <textarea
                rows={2}
                value={defDescription}
                onChange={(e) => setDefDescription(e.target.value)}
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              />
            </div>

            {/* Photo Attachment Field */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">
                Defect Photo Attachment (URL / Upload)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defPhotoUrl}
                  onChange={(e) => setDefPhotoUrl(e.target.value)}
                  placeholder="Paste site defect photo URL..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:outline-none text-xs"
                />
                {defPhotoUrl && (
                  <div className="h-9 w-9 rounded-lg border border-slate-700 overflow-hidden bg-slate-950 flex-shrink-0">
                    <img src={defPhotoUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strictly labeled 'Submit' */}
          <button
            onClick={() => {
              onReportDefect({
                materialCode: defMatCode,
                vendorCode: defVendorCode,
                deliveryRef: defRef,
                category: defCategory,
                severity: defSeverity,
                rejectedQty: defRejectedQty,
                description: defDescription,
                correctiveActionText: defCorrective,
                photoUrl: defPhotoUrl,
              });
              setDefectFormSuccess(`✓ Defect submitted successfully & vendor evaluation score updated.`);
              setTimeout(() => setDefectFormSuccess(""), 4000);
            }}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-md transition-all"
          >
            Submit
          </button>
        </div>

        {/* 2. Site Defect Log List with Status Change + Confirmation Save Button */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base">
              Site Defect Log ({projDefects.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Inspections: {inspections.filter((ins) => ins.projectCode === projectCode).length}
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {projDefects.map((d) => {
              const ven = vendors.find((v) => v.vendorCode === d.vendorCode);
              const currentPendingStatus = pendingStatuses[d.defectCode] ?? d.status;
              const hasStatusChange = currentPendingStatus !== d.status;

              return (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        {d.defectCode}
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

                    {/* Status Dropdown + Confirmation Save Button */}
                    <div className="flex items-center gap-2">
                      <select
                        value={currentPendingStatus}
                        onChange={(e) => {
                          const newSt = e.target.value as SeedDefectRecord["status"];
                          setPendingStatuses((prev) => ({
                            ...prev,
                            [d.defectCode]: newSt,
                          }));
                        }}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-bold text-white focus:outline-none"
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
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] shadow animate-pulse"
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  {statusSaveMsg[d.defectCode] && (
                    <div className="text-[10px] text-emerald-400 font-mono font-bold">
                      ✓ Status updated & recorded by {currentUser.name} ({currentUser.role})
                    </div>
                  )}

                  <div className="font-semibold text-slate-200">
                    Vendor: <strong className="text-white">{ven?.name || d.vendorCode}</strong> ({d.vendorCode}) • Material: {d.materialCode} • Ref: {d.deliveryRef} • Rejected: {d.rejectedQty}
                  </div>
                  <p className="text-slate-400">{d.description}</p>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>
                      Reported by: <strong className="text-slate-300">{d.reportedBy}</strong> ({d.reportedByRole}) on {d.reportedDate}
                    </span>
                    <span className="font-mono text-slate-400">Status: <strong className="text-amber-400">{d.status}</strong></span>
                  </div>

                  {d.correctiveActions.map((ca) => (
                    <div
                      key={ca.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
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
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Vendor Performance Scorecard (Reduced size, max 3 vendors default + 'View More' toggle) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-extrabold text-white text-base">
                Live Vendor Performance Scorecard (Historical & Active Site Data)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Formula: 40% On-Time Delivery + 40% Quality Acceptance + 20% Issue Resolution
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {isVendorScorecardExpanded ? vendors.length : Math.min(3, vendors.length)} of {vendors.length} Vendors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                <th className="py-2.5 px-3">Vendor / Trade</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3">On-Time (40%)</th>
                <th className="py-2.5 px-3">Quality (40%)</th>
                <th className="py-2.5 px-3">Resolution (20%)</th>
                <th className="py-2.5 px-3">Open Defects</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">AI Risk Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(isVendorScorecardExpanded ? vendors : vendors.slice(0, 3)).map((v) => (
                <tr key={v.vendorCode} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white">{v.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{v.vendorCode} • {v.tradeSpecialty}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-extrabold text-amber-400 text-sm">
                    {v.performance.overallScore}%
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-bold text-white">{v.performance.onTimeDeliveryRate}%</div>
                    <div className="text-[10px] text-slate-500">{v.performance.onTimeDeliveries}/{v.performance.totalDeliveries}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <div className="font-bold text-white">{v.performance.qualityAcceptanceRate}%</div>
                    <div className="text-[10px] text-slate-500">{v.performance.rejectedQty} rejected</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {v.performance.issueResolutionRate}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      v.performance.openDefectsCount > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {v.performance.openDefectsCount} open
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] font-mono ${
                      v.performance.evaluationStatus === "PREFERRED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : v.performance.evaluationStatus === "WATCHLIST"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}>
                      {v.performance.evaluationStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                    {v.performance.aiRiskSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View More / View Less Toggle Button */}
        {vendors.length > 3 && (
          <div className="text-center pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsVendorScorecardExpanded(!isVendorScorecardExpanded)}
              className="px-4 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold text-xs border border-slate-700 transition-all"
            >
              {isVendorScorecardExpanded
                ? "▲ Show Less Vendors"
                : `▼ View More (${vendors.length - 3} Remaining Vendors)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
