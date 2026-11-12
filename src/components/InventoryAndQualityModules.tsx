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
  }) => void;
  onUpdateDefectStatus: (
    defectCode: string,
    status: SeedDefectRecord["status"]
  ) => void;
}

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

  // M02 Form State
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

  // M03 Form State (Worker & Engineer Defect Reflection)
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

  const projInventory = inventory.filter((i) => i.projectCode === projectCode);
  const projTransactions = transactions.filter(
    (t) => t.projectCode === projectCode
  );
  const projDefects = defects.filter((d) => d.projectCode === projectCode);
  const projInspections = inspections.filter(
    (ins) => ins.projectCode === projectCode
  );

  if (activeTab === "M02_INVENTORY") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                MODULE 02 • LIVE SITE STOCK & CONSUMPTION (NO BACK-OFFICE PO
                BLOAT)
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Project Live Stock Inventory — {projectCode}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                <strong>FR-M02-001 & BR-004:</strong>{" "}
                <code>Available Stock = Current Stock − Reserved Stock</code>.
                Incoming deliveries are displayed separately and never counted
                as physically available stock.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                Active Role:{" "}
                <strong className="text-teal-700">{currentUser.role}</strong>
              </span>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Reserved</th>
                  <th className="py-3 px-3 bg-teal-50/70 text-teal-900">
                    Available Stock
                  </th>
                  <th className="py-3 px-3">Incoming (Separate)</th>
                  <th className="py-3 px-3">Daily Burn</th>
                  <th className="py-3 px-3">Lead Time & Safety</th>
                  <th className="py-3 px-3">Reorder Point (FR-M02-005)</th>
                  <th className="py-3 px-3">Coverage (FR-M02-006)</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projInventory.map((inv) => {
                  const mat = materials.find(
                    (m) => m.materialCode === inv.materialCode
                  );
                  const metrics = computeInventoryMetrics(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {mat?.name || inv.materialCode}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {inv.materialCode} • {mat?.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {inv.currentStock.toLocaleString()} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {inv.reservedStock.toLocaleString()} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 bg-teal-50/40 font-extrabold text-sm text-teal-950">
                        {metrics.availableStock.toLocaleString()} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 text-blue-700 font-semibold">
                        +{inv.incomingStock.toLocaleString()} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {inv.avgDailyConsumption} {mat?.unit}/day
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        Lead: {inv.supplierLeadTimeDays}d | Safety:{" "}
                        {inv.safetyStock} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {metrics.reorderPoint.toLocaleString()} {mat?.unit}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-sm">
                        {metrics.stockCoverageDays !== null
                          ? `${metrics.stockCoverageDays} days`
                          : "Unavailable (0 burn)"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            metrics.statusLabel === "CRITICAL_SHORTAGE"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : metrics.statusLabel === "LOW_STOCK"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : metrics.statusLabel === "EXCESS_SURPLUS"
                                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                                  : "bg-emerald-100 text-emerald-800"
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

        {/* Interactive Inventory Actions + AI Inventory Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Form */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">
                Record Site Inventory Movement
              </h3>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setInvModalMode("CONSUMPTION")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    invModalMode === "CONSUMPTION"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  1. Consumption (TC-005)
                </button>
                <button
                  onClick={() => setInvModalMode("RECEIPT")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    invModalMode === "RECEIPT"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  2. Goods Receipt (TC-006)
                </button>
                <button
                  onClick={() => setInvModalMode("TRANSFER")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    invModalMode === "TRANSFER"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  3. Site Transfer
                </button>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs font-medium text-teal-900">
                {feedbackMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Material
                </label>
                <select
                  value={selectedMatCode}
                  onChange={(e) => setSelectedMatCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.materialCode} value={m.materialCode}>
                      {m.materialCode} – {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {invModalMode === "RECEIPT"
                    ? "Accepted Quantity (BR-007)"
                    : "Quantity"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={(e) => setQtyInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {invModalMode === "CONSUMPTION" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Site Work Activity / Zone
                  </label>
                  <input
                    type="text"
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              )}

              {invModalMode === "RECEIPT" && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Delivering Vendor
                    </label>
                    <select
                      value={receiptVendorCode}
                      onChange={(e) => setReceiptVendorCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                    >
                      {vendors.map((v) => (
                        <option key={v.vendorCode} value={v.vendorCode}>
                          {v.vendorCode} – {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Rejected Quantity (Excluded per BR-009)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={rejectedInput}
                      onChange={(e) => setRejectedInput(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Delivery Order (DO) Reference
                    </label>
                    <input
                      type="text"
                      value={deliveryRefInput}
                      onChange={(e) => setDeliveryRefInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                </>
              )}

              {invModalMode === "TRANSFER" && (
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destination Project (FR-M02-008)
                  </label>
                  <select
                    value={destProjCode}
                    onChange={(e) => setDestProjCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Recorded by: <strong>{currentUser.name}</strong> (
                {currentUser.role})
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
                      `✓ Recorded ${qtyInput} consumption of ${selectedMatCode} (${currentUser.role === "SITE_WORKER" ? "Submitted for Supervisor Verification per BR-008" : "Verified & Deducted from Stock"}).`
                    );
                  } else if (invModalMode === "RECEIPT") {
                    if (!perms.canConfirmGoodsReceipt) {
                      setFeedbackMsg(
                        "⚠ RBAC Rule 3.5: Site Workers cannot directly confirm Goods Receipts. Switch to Supervisor, Engineer, or PM."
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
                      `✓ Goods Receipt ${deliveryRefInput} confirmed: +${qtyInput} added to stock (${rejectedInput} rejected excluded per BR-009).`
                    );
                  } else {
                    onTransferMaterial({
                      destProjectCode: destProjCode,
                      materialCode: selectedMatCode,
                      quantity: qtyInput,
                      remarks: remarksInput,
                    });
                    setFeedbackMsg(
                      `✓ Transferred ${qtyInput} of ${selectedMatCode} from ${projectCode} to ${destProjCode}.`
                    );
                  }
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-sm"
              >
                {invModalMode === "CONSUMPTION"
                  ? "Submit Consumption Record"
                  : invModalMode === "RECEIPT"
                    ? "Confirm Goods Receipt"
                    : "Execute Inter-Project Transfer"}
              </button>
            </div>
          </div>

          {/* AI Inventory Insights (FR-M02-009) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              FR-M02-009 • AI LIVE INVENTORY INSIGHTS
            </span>
            <h3 className="font-bold text-slate-900">
              AI Stock Coverage & Cross-Site Optimization
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-950">
                <strong>1. Critical Low Coverage (STL-002 Steel Rebar):</strong>{" "}
                Project Alpha has 300 MT available vs 100 MT/day burn (3.0 days
                coverage) against a 5-day lead time.{" "}
                <strong>AI Transfer Opportunity:</strong> Project Beta holds{" "}
                <strong>850 MT available (24.3 days coverage)</strong>—transfer
                200 MT immediately to prevent a 2-day structural halt.
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                <strong>2. Below Reorder Point (CEM-001 Portland Cement):</strong>{" "}
                Available stock (170 bags) is below the 200-bag Reorder Point{" "}
                <code>(50 bags/d × 3d lead time) + 50 safety</code>. Project
                Beta has 1,100 bags surplus available for inter-project
                transfer.
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-950">
                <strong>3. Unusual Consumption Pattern Detected:</strong>{" "}
                Structural concrete & rebar draw on MS-ALPHA-02 is 15.6% higher
                than physical progress completion due to Grid C4-C7 link spacing
                rework and 24 MT rejected Apex Steel batch.
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History (FR-M02-004) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">
            Inventory Transaction History — {projectCode} (FR-M02-004)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Txn ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Activity / DO Ref</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      {t.transactionCode}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {t.transactionDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {t.materialCode}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          t.transactionType === "RECEIPT" ||
                          t.transactionType === "TRANSFER_IN"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold">{t.quantity}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {t.workActivity || t.deliveryRef} —{" "}
                      <span className="text-slate-400">{t.remarks}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {t.recordedBy} ({t.recordedByRole})
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          t.verificationStatus === "VERIFIED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.verificationStatus}
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

  // MODULE 03: QUALITY, WORKER DEFECT REFLECTION & VENDOR PERFORMANCE INTELLIGENCE
  return (
    <div className="space-y-6">
      {/* Live Vendor Evaluation Scorecard Dashboard (FR-M03-004 & FR-M03-005) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              MODULE 03 • WORKER/ENGINEER DEFECT REFLECTION & FUTURE VENDOR
              EVALUATION
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Live Vendor Performance Scorecard & Defect Intelligence
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              <strong>FR-M03-004 Weighted Formula:</strong>{" "}
              <code>
                40% On-Time Delivery + 40% Quality Acceptance + 20% Issue
                Resolution
              </code>
              . Worker & Engineer defect logs automatically update vendor tiers
              for future tender evaluation.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
            HISTORICAL + LIVE SITE EVALUATION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3">Vendor / Subcontractor</th>
                <th className="py-3 px-3">Overall Score</th>
                <th className="py-3 px-3">On-Time Delivery (40%)</th>
                <th className="py-3 px-3">Quality Acceptance (40%)</th>
                <th className="py-3 px-3">Issue Resolution (20%)</th>
                <th className="py-3 px-3">Rejected Qty</th>
                <th className="py-3 px-3">Open Defects</th>
                <th className="py-3 px-3">Future Evaluation Status</th>
                <th className="py-3 px-3">AI Vendor Risk Insight (FR-M03-006)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {vendors.map((v) => (
                <tr key={v.vendorCode} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">
                      {v.name}{" "}
                      <span className="font-mono text-slate-400">
                        ({v.vendorCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {v.tradeSpecialty}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-base font-extrabold text-slate-900">
                      {v.performance.overallScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold">
                      {v.performance.onTimeDeliveryRate}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {v.performance.onTimeDeliveries}/
                      {v.performance.totalDeliveries} on-time (
                      {v.performance.lateDeliveries} late)
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold">
                      {v.performance.qualityAcceptanceRate}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {v.performance.acceptedQty.toLocaleString()}/
                      {v.performance.totalInspectedQty.toLocaleString()} accepted
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {v.performance.issueResolutionRate}%
                  </td>
                  <td className="py-3 px-3 font-bold text-rose-700">
                    {v.performance.rejectedQty.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        v.performance.openDefectsCount > 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {v.performance.openDefectsCount} open
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        v.performance.evaluationStatus === "PREFERRED"
                          ? "bg-emerald-100 text-emerald-800"
                          : v.performance.evaluationStatus === "WATCHLIST"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {v.performance.evaluationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                    {v.performance.aiRiskSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker & Engineer Defect Reflection Form + Active Defect & Corrective Action Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              FR-M03-002 • SITE WORKER & ENGINEER DEFECT LOGGING
            </span>
            <h3 className="font-bold text-slate-900 text-base">
              Reflect Vendor / Delivery Defect (Auto-Updates Vendor Score)
            </h3>
            <p className="text-xs text-slate-500">
              Empowering Site Workers & Engineers to report defective deliveries
              or subcontractor workmanship directly from site for future vendor
              evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Subcontractor
              </label>
              <select
                value={defVendorCode}
                onChange={(e) => setDefVendorCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                {vendors.map((v) => (
                  <option key={v.vendorCode} value={v.vendorCode}>
                    {v.vendorCode} – {v.name} (Score:{" "}
                    {v.performance.overallScore}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Material Affected
              </label>
              <select
                value={defMatCode}
                onChange={(e) => setDefMatCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                {materials.map((m) => (
                  <option key={m.materialCode} value={m.materialCode}>
                    {m.materialCode} – {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Defect Category (FR-M03-002)
              </label>
              <select
                value={defCategory}
                onChange={(e) =>
                  setDefCategory(
                    e.target.value as SeedDefectRecord["category"]
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="Damaged materials">Damaged materials</option>
                <option value="Incorrect specifications">
                  Incorrect specifications
                </option>
                <option value="Wrong product delivered">
                  Wrong product delivered
                </option>
                <option value="Incomplete delivery">Incomplete delivery</option>
                <option value="Poor product quality">
                  Poor product quality
                </option>
                <option value="Packaging damage">Packaging damage</option>
                <option value="Subcontractor workmanship">
                  Subcontractor workmanship
                </option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Severity & Rejected Qty
              </label>
              <div className="flex gap-2">
                <select
                  value={defSeverity}
                  onChange={(e) =>
                    setDefSeverity(
                      e.target.value as SeedDefectRecord["severity"]
                    )
                  }
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 bg-white"
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
                  className="w-1/2 rounded-lg border border-slate-300 px-2 py-2"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Delivery Order / Work Package Ref
              </label>
              <input
                type="text"
                value={defRef}
                onChange={(e) => setDefRef(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Defect Description & Site Observation
              </label>
              <textarea
                rows={2}
                value={defDescription}
                onChange={(e) => setDefDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Required Corrective Action (FR-M03-003)
              </label>
              <input
                type="text"
                value={defCorrective}
                onChange={(e) => setDefCorrective(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={() =>
              onReportDefect({
                materialCode: defMatCode,
                vendorCode: defVendorCode,
                deliveryRef: defRef,
                category: defCategory,
                severity: defSeverity,
                rejectedQty: defRejectedQty,
                description: defDescription,
                correctiveActionText: defCorrective,
              })
            }
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-sm"
          >
            Submit Defect Report & Recalculate Vendor Evaluation Score
          </button>
        </div>

        {/* Defect & Corrective Action List */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Site Defect Logs & Corrective Actions ({projDefects.length})
            </h3>
            <span className="text-xs text-slate-500">
              Inspections Logged: {projInspections.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {projDefects.map((d) => {
              const ven = vendors.find((v) => v.vendorCode === d.vendorCode);
              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {d.defectCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          d.severity === "CRITICAL"
                            ? "bg-rose-600 text-white"
                            : d.severity === "HIGH"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {d.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                        {d.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{d.reportedDate}</span>
                      <select
                        value={d.status}
                        onChange={(e) =>
                          onUpdateDefectStatus(
                            d.defectCode,
                            e.target.value as SeedDefectRecord["status"]
                          )
                        }
                        className="rounded border border-slate-300 px-2 py-0.5 text-[11px] font-bold bg-white"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </div>
                  </div>

                  <div className="font-semibold text-slate-800">
                    Vendor: {ven?.name || d.vendorCode} ({d.vendorCode}) •
                    Material: {d.materialCode} • Ref: {d.deliveryRef} • Rejected
                    Qty: {d.rejectedQty}
                  </div>
                  <p className="text-slate-600">{d.description}</p>
                  <div className="text-[11px] text-slate-500">
                    Reported by: <strong>{d.reportedBy}</strong> (
                    {d.reportedByRole})
                  </div>

                  {d.correctiveActions.map((ca) => (
                    <div
                      key={ca.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px]"
                    >
                      <strong className="text-teal-800">
                        Corrective Action ({ca.status}):
                      </strong>{" "}
                      {ca.actionDescription} —{" "}
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
    </div>
  );
}
