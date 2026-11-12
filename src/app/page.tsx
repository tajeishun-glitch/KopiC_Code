"use client";

import React, { useState } from "react";
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_MATERIALS,
  INITIAL_VENDORS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  INITIAL_INSPECTIONS,
  INITIAL_DEFECTS,
  INITIAL_EQUIPMENT,
  INITIAL_MILESTONES,
  INITIAL_PROGRESS_UPDATES,
  INITIAL_PHOTOS,
  INITIAL_RISKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  SeedUser,
  SeedProject,
  SeedMaterial,
  SeedVendor,
  SeedInventoryItem,
  SeedTransaction,
  SeedQualityInspection,
  SeedDefectRecord,
  SeedEquipment,
  SeedMilestone,
  SeedProgressUpdate,
  SeedPhoto,
  SeedRisk,
  SeedNotification,
  SeedAuditLog,
} from "@/lib/seed-data";
import {
  computeInventoryMetrics,
  computeEquipmentStats,
  calculateVendorScore,
  getRolePermissions,
} from "@/lib/business-engine";
import { ScannerAndVendorModules } from "@/components/ScannerAndVendorModules";
import { InventoryAndQualityModules } from "@/components/InventoryAndQualityModules";
import { EquipmentProgressRiskModules } from "@/components/EquipmentProgressRiskModules";

type NavTab =
  | "DASHBOARD"
  | "M01_SCANNER"
  | "M01_VENDOR"
  | "M02_INVENTORY"
  | "M03_QUALITY"
  | "M04_EQUIPMENT"
  | "M05_PROGRESS"
  | "M06_RISK_COPILOT"
  | "NOTIFICATIONS_AUDIT";

export default function BuildSmartAIApp() {
  // Core Reactive Application State (Initialized from Canonical Seed Data)
  const [users] = useState<SeedUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<SeedUser>(INITIAL_USERS[0]); // Default: Project Manager
  const [selectedProjectCode, setSelectedProjectCode] =
    useState<string>("PRJ-ALPHA");
  const [activeTab, setActiveTab] = useState<NavTab>("DASHBOARD");

  const [projects, setProjects] = useState<SeedProject[]>(INITIAL_PROJECTS);
  const [materials] = useState<SeedMaterial[]>(INITIAL_MATERIALS);
  const [vendors, setVendors] = useState<SeedVendor[]>(INITIAL_VENDORS);
  const [inventory, setInventory] =
    useState<SeedInventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] =
    useState<SeedTransaction[]>(INITIAL_TRANSACTIONS);
  const [inspections] =
    useState<SeedQualityInspection[]>(INITIAL_INSPECTIONS);
  const [defects, setDefects] = useState<SeedDefectRecord[]>(INITIAL_DEFECTS);
  const [equipments, setEquipments] =
    useState<SeedEquipment[]>(INITIAL_EQUIPMENT);
  const [milestones, setMilestones] =
    useState<SeedMilestone[]>(INITIAL_MILESTONES);
  const [progressUpdates, setProgressUpdates] = useState<SeedProgressUpdate[]>(
    INITIAL_PROGRESS_UPDATES
  );
  const [photos, setPhotos] = useState<SeedPhoto[]>(INITIAL_PHOTOS);
  const [risks, setRisks] = useState<SeedRisk[]>(INITIAL_RISKS);
  const [notifications, setNotifications] = useState<SeedNotification[]>(
    INITIAL_NOTIFICATIONS
  );
  const [auditLogs, setAuditLogs] =
    useState<SeedAuditLog[]>(INITIAL_AUDIT_LOGS);

  const nowTimestamp = () =>
    new Date().toISOString().replace("T", " ").slice(0, 16);

  const pushAudit = (params: {
    module: string;
    action: string;
    recordId: string;
    previousValue: string;
    newValue: string;
  }) => {
    const newEntry: SeedAuditLog = {
      id: `aud-${Date.now()}`,
      auditCode: `AUD-2026-${String(auditLogs.length + 1).padStart(3, "0")}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      projectCode: selectedProjectCode,
      timestamp: nowTimestamp(),
      ...params,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Reset Demo State for Live Pitch
  const handleResetDemo = () => {
    setProjects(JSON.parse(JSON.stringify(INITIAL_PROJECTS)));
    setVendors(JSON.parse(JSON.stringify(INITIAL_VENDORS)));
    setInventory(JSON.parse(JSON.stringify(INITIAL_INVENTORY)));
    setTransactions(JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)));
    setDefects(JSON.parse(JSON.stringify(INITIAL_DEFECTS)));
    setEquipments(JSON.parse(JSON.stringify(INITIAL_EQUIPMENT)));
    setMilestones(JSON.parse(JSON.stringify(INITIAL_MILESTONES)));
    setProgressUpdates(JSON.parse(JSON.stringify(INITIAL_PROGRESS_UPDATES)));
    setPhotos(JSON.parse(JSON.stringify(INITIAL_PHOTOS)));
    setRisks(JSON.parse(JSON.stringify(INITIAL_RISKS)));
    setNotifications(JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)));
    setAuditLogs(JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)));
  };

  // RBAC Check (BR-001 & TC-021): Users can only access projects assigned to them
  const isAuthorizedForProject =
    currentUser.assignedProjectCodes.includes(selectedProjectCode);
  const perms = getRolePermissions(currentUser.role);

  const currentProject =
    projects.find((p) => p.projectCode === selectedProjectCode) || projects[0];
  const projInventory = inventory.filter(
    (i) => i.projectCode === selectedProjectCode
  );
  const projRisks = risks.filter((r) => r.projectCode === selectedProjectCode);
  const projMilestones = milestones.filter(
    (m) => m.projectCode === selectedProjectCode
  );
  const projDefects = defects.filter(
    (d) => d.projectCode === selectedProjectCode
  );
  const projNotifications = notifications.filter(
    (n) =>
      n.projectCode === selectedProjectCode &&
      n.targetRoles.includes(currentUser.role)
  );
  const unreadCount = projNotifications.filter((n) => !n.isRead).length;

  // Handlers for M02 Inventory
  const handleRecordConsumption = ({
    materialCode,
    quantity,
    workActivity,
    remarks,
  }: {
    materialCode: string;
    quantity: number;
    workActivity: string;
    remarks: string;
  }) => {
    const isVerified = currentUser.role !== "SITE_WORKER";
    setInventory((prev) =>
      prev.map((inv) => {
        if (
          inv.projectCode === selectedProjectCode &&
          inv.materialCode === materialCode
        ) {
          const avail = inv.currentStock - inv.reservedStock;
          if (quantity > avail) {
            alert(
              `BR-010 Violation: Cannot consume ${quantity} (Only ${avail} available).`
            );
            return inv;
          }
          return {
            ...inv,
            currentStock: isVerified
              ? inv.currentStock - quantity
              : inv.currentStock,
            reservedStock: isVerified
              ? inv.reservedStock
              : inv.reservedStock + quantity,
            lastUpdated: nowTimestamp(),
          };
        }
        return inv;
      })
    );

    const txnCode = `TXN-2026-${String(transactions.length + 895).padStart(4, "0")}`;
    setTransactions((prev) => [
      {
        id: `txn-${Date.now()}`,
        transactionCode: txnCode,
        projectCode: selectedProjectCode,
        materialCode,
        transactionType: "CONSUMPTION",
        quantity,
        workActivity,
        recordedBy: currentUser.name,
        recordedByRole: currentUser.role,
        verificationStatus: isVerified ? "VERIFIED" : "PENDING_VERIFICATION",
        remarks,
        transactionDate: nowTimestamp(),
      },
      ...prev,
    ]);

    pushAudit({
      module: "M02 - Smart Live Inventory",
      action: isVerified
        ? "RECORD_VERIFIED_CONSUMPTION"
        : "SUBMIT_WORKER_CONSUMPTION",
      recordId: txnCode,
      previousValue: `${materialCode} consumption logged`,
      newValue: `-${quantity} ${materialCode} (${workActivity})`,
    });
  };

  const handleRecordGoodsReceipt = ({
    materialCode,
    vendorCode,
    deliveryRef,
    acceptedQty,
    rejectedQty,
    remarks,
  }: {
    materialCode: string;
    vendorCode: string;
    deliveryRef: string;
    acceptedQty: number;
    rejectedQty: number;
    remarks: string;
  }) => {
    setInventory((prev) =>
      prev.map((inv) => {
        if (
          inv.projectCode === selectedProjectCode &&
          inv.materialCode === materialCode
        ) {
          return {
            ...inv,
            currentStock: inv.currentStock + acceptedQty,
            incomingStock: Math.max(
              0,
              inv.incomingStock - (acceptedQty + rejectedQty)
            ),
            lastUpdated: nowTimestamp(),
          };
        }
        return inv;
      })
    );

    const ven = vendors.find((v) => v.vendorCode === vendorCode);
    const txnCode = `TXN-2026-${String(transactions.length + 895).padStart(4, "0")}`;
    setTransactions((prev) => [
      {
        id: `txn-${Date.now()}`,
        transactionCode: txnCode,
        projectCode: selectedProjectCode,
        materialCode,
        transactionType: "RECEIPT",
        quantity: acceptedQty,
        deliveryRef,
        vendorName: ven?.name || vendorCode,
        recordedBy: currentUser.name,
        recordedByRole: currentUser.role,
        verificationStatus: "VERIFIED",
        remarks:
          rejectedQty > 0
            ? `Accepted ${acceptedQty}, Rejected ${rejectedQty} excluded per BR-009. ${remarks}`
            : remarks,
        transactionDate: nowTimestamp(),
      },
      ...prev,
    ]);

    pushAudit({
      module: "M02 - Smart Live Inventory",
      action: "CONFIRM_GOODS_RECEIPT",
      recordId: txnCode,
      previousValue: `Delivery ${deliveryRef}`,
      newValue: `+${acceptedQty} ${materialCode} confirmed (${rejectedQty} rejected excluded)`,
    });
  };

  const handleTransferMaterial = ({
    destProjectCode,
    materialCode,
    quantity,
    remarks,
  }: {
    destProjectCode: string;
    materialCode: string;
    quantity: number;
    remarks: string;
  }) => {
    setInventory((prev) =>
      prev.map((inv) => {
        if (
          inv.projectCode === selectedProjectCode &&
          inv.materialCode === materialCode
        ) {
          return {
            ...inv,
            currentStock: Math.max(0, inv.currentStock - quantity),
            lastUpdated: nowTimestamp(),
          };
        }
        if (
          inv.projectCode === destProjectCode &&
          inv.materialCode === materialCode
        ) {
          return {
            ...inv,
            currentStock: inv.currentStock + quantity,
            lastUpdated: nowTimestamp(),
          };
        }
        return inv;
      })
    );

    const txnCode = `TXN-2026-${String(transactions.length + 895).padStart(4, "0")}`;
    setTransactions((prev) => [
      {
        id: `txn-${Date.now()}`,
        transactionCode: txnCode,
        projectCode: selectedProjectCode,
        materialCode,
        transactionType: "TRANSFER_OUT",
        quantity,
        workActivity: `Inter-Project Transfer to ${destProjectCode}`,
        recordedBy: currentUser.name,
        recordedByRole: currentUser.role,
        verificationStatus: "VERIFIED",
        remarks,
        transactionDate: nowTimestamp(),
      },
      ...prev,
    ]);

    pushAudit({
      module: "M02 - Smart Live Inventory",
      action: "INTER_PROJECT_TRANSFER",
      recordId: txnCode,
      previousValue: `${selectedProjectCode} -> ${destProjectCode}`,
      newValue: `Transferred ${quantity} ${materialCode}`,
    });
  };

  // Handlers for M03 Quality & Worker Defect Reflection
  const handleReportDefect = (payload: {
    materialCode: string;
    vendorCode: string;
    deliveryRef: string;
    category: SeedDefectRecord["category"];
    severity: SeedDefectRecord["severity"];
    rejectedQty: number;
    description: string;
    correctiveActionText: string;
  }) => {
    const defCode = `DEF-2026-${String(defects.length + 101).padStart(3, "0")}`;
    const newDef: SeedDefectRecord = {
      id: `def-${Date.now()}`,
      defectCode: defCode,
      projectCode: selectedProjectCode,
      materialCode: payload.materialCode,
      vendorCode: payload.vendorCode,
      deliveryRef: payload.deliveryRef,
      category: payload.category,
      severity: payload.severity,
      rejectedQty: payload.rejectedQty,
      description: payload.description,
      reportedBy: currentUser.name,
      reportedByRole: currentUser.role,
      reportedDate: nowTimestamp().slice(0, 10),
      status: "OPEN",
      correctiveActions: [
        {
          id: `ca-${Date.now()}`,
          actionDescription: payload.correctiveActionText,
          responsibleParty: currentUser.name,
          targetDate: "2026-11-19",
          status: "OPEN",
        },
      ],
    };
    setDefects((prev) => [newDef, ...prev]);

    // Recalculate Vendor Performance Score Live!
    setVendors((prev) =>
      prev.map((v) => {
        if (v.vendorCode !== payload.vendorCode) return v;
        const newOpen = v.performance.openDefectsCount + 1;
        const newInsp =
          v.performance.totalInspectedQty + Math.max(20, payload.rejectedQty);
        const newRej = v.performance.rejectedQty + payload.rejectedQty;
        const newTotalDel =
          payload.category === "Incomplete delivery"
            ? v.performance.totalDeliveries + 1
            : v.performance.totalDeliveries;
        const newLateDel =
          payload.category === "Incomplete delivery"
            ? v.performance.lateDeliveries + 1
            : v.performance.lateDeliveries;

        const calc = calculateVendorScore({
          totalDeliveries: newTotalDel,
          onTimeDeliveries: v.performance.onTimeDeliveries,
          totalInspectedQty: newInsp,
          acceptedQty: v.performance.acceptedQty,
          openDefectsCount: newOpen,
          resolvedDefectsCount: v.performance.resolvedDefectsCount,
        });

        return {
          ...v,
          performance: {
            ...v.performance,
            totalDeliveries: newTotalDel,
            lateDeliveries: newLateDel,
            totalInspectedQty: newInsp,
            rejectedQty: newRej,
            openDefectsCount: newOpen,
            ...calc,
            lastEvaluatedAt: nowTimestamp(),
          },
        };
      })
    );

    pushAudit({
      module: "M03 - Quality & Vendor Intelligence",
      action: "REFLECT_VENDOR_DEFECT",
      recordId: defCode,
      previousValue: `Vendor ${payload.vendorCode}`,
      newValue: `Logged ${defCode} (${payload.category}, Rejected: ${payload.rejectedQty}) & recalculated Vendor Evaluation Score`,
    });
  };

  const handleUpdateDefectStatus = (
    defectCode: string,
    status: SeedDefectRecord["status"]
  ) => {
    setDefects((prev) =>
      prev.map((d) => (d.defectCode === defectCode ? { ...d, status } : d))
    );
    pushAudit({
      module: "M03 - Quality & Vendor Intelligence",
      action: "UPDATE_DEFECT_STATUS",
      recordId: defectCode,
      previousValue: "OPEN",
      newValue: status,
    });
  };

  // Handlers for M04 Equipment
  const handleEquipmentAction = (payload: {
    equipmentCode: string;
    actionType: "ALLOCATE" | "RETURN" | "TRANSFER" | "MAINTENANCE" | "DAMAGE";
    assignedTo?: string;
    expectedReturn?: string;
    returnCondition?: SeedEquipment["condition"];
    destProjectCode?: string;
    description?: string;
  }): string | null => {
    const target = equipments.find(
      (e) => e.equipmentCode === payload.equipmentCode
    );
    if (!target) return "Equipment not found.";

    if (
      payload.actionType === "ALLOCATE" &&
      target.status !== "AVAILABLE" &&
      target.status !== "RESERVED"
    ) {
      return `BR-012 & TC-022 Conflict Prevented: ${target.equipmentCode} is currently ${target.status} (${target.assignedTo || target.currentLocation}). Cannot create conflicting active allocation!`;
    }

    if (payload.actionType === "TRANSFER" && target.status === "IN_USE") {
      return `BR-012 Violation: Cannot transfer ${target.equipmentCode} while actively IN_USE. Return equipment first.`;
    }

    setEquipments((prev) =>
      prev.map((e) => {
        if (e.equipmentCode !== payload.equipmentCode) return e;
        if (payload.actionType === "ALLOCATE") {
          return {
            ...e,
            status: "IN_USE",
            assignedTo: payload.assignedTo,
            allocationDate: nowTimestamp().slice(0, 10),
            expectedReturn: payload.expectedReturn,
          };
        }
        if (payload.actionType === "RETURN") {
          const cond = payload.returnCondition || "GOOD";
          return {
            ...e,
            condition: cond,
            status: cond === "DAMAGED" ? "DAMAGED" : "AVAILABLE",
            assignedTo: undefined,
            expectedReturn: undefined,
          };
        }
        if (payload.actionType === "TRANSFER") {
          const dest = payload.destProjectCode || "PRJ-ALPHA";
          return {
            ...e,
            currentProjectCode: dest,
            currentLocation: `${dest} Main Plant Yard`,
            movementHistory: [
              {
                id: `mov-${Date.now()}`,
                sourceProjectCode: e.currentProjectCode,
                destProjectCode: dest,
                transferDate: nowTimestamp().slice(0, 10),
                approvedBy: currentUser.name,
                movementStatus: "COMPLETED",
                remarks: payload.description,
              },
              ...e.movementHistory,
            ],
          };
        }
        if (payload.actionType === "MAINTENANCE") {
          return {
            ...e,
            status: "MAINTENANCE",
            maintenanceHistory: [
              {
                id: `mnt-${Date.now()}`,
                maintenanceType: "PREVENTIVE",
                scheduledDate: nowTimestamp().slice(0, 10),
                costRm: 1500,
                description: payload.description || "Scheduled maintenance",
                status: "SCHEDULED",
              },
              ...e.maintenanceHistory,
            ],
          };
        }
        // DAMAGE
        return {
          ...e,
          status: "DAMAGED",
          condition: "DAMAGED",
          incidents: [
            {
              id: `inc-${Date.now()}`,
              projectCode: selectedProjectCode,
              incidentType: "DAMAGED",
              description: payload.description || "Reported damaged on site",
              reportedBy: currentUser.name,
              reportedDate: nowTimestamp().slice(0, 10),
              status: "OPEN",
            },
            ...e.incidents,
          ],
        };
      })
    );

    pushAudit({
      module: "M04 - On-Site Tools & Equipment",
      action: `EQUIPMENT_${payload.actionType}`,
      recordId: payload.equipmentCode,
      previousValue: `Status: ${target.status}`,
      newValue: `Executed ${payload.actionType} (${payload.description || ""})`,
    });

    return null;
  };

  // Handlers for M05 Milestone Progress
  const handleUpdateMilestoneProgress = (payload: {
    milestoneCode: string;
    actualProgress: number;
    workCompleted: string;
    workOutstanding: string;
    remarks: string;
    photoUrl?: string;
  }) => {
    const targetMs = milestones.find(
      (m) => m.milestoneCode === payload.milestoneCode
    );
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.milestoneCode !== payload.milestoneCode) return m;
        const status =
          payload.actualProgress >= 100
            ? "COMPLETED"
            : payload.actualProgress < m.plannedProgress
              ? "DELAYED"
              : "ON_TRACK";
        return {
          ...m,
          actualProgress: payload.actualProgress,
          status,
        };
      })
    );

    setProgressUpdates((prev) => [
      {
        id: `prg-${Date.now()}`,
        projectCode: selectedProjectCode,
        milestoneCode: payload.milestoneCode,
        milestoneName: targetMs?.name || payload.milestoneCode,
        progressDate: nowTimestamp().slice(0, 10),
        completionPct: payload.actualProgress,
        workCompleted: payload.workCompleted,
        workOutstanding: payload.workOutstanding,
        remarks: payload.remarks,
        updatedBy: currentUser.name,
        photoUrl: payload.photoUrl,
      },
      ...prev,
    ]);

    if (payload.photoUrl) {
      setPhotos((prev) => [
        {
          id: `pht-${Date.now()}`,
          projectCode: selectedProjectCode,
          milestoneCode: payload.milestoneCode,
          milestoneName: targetMs?.name || payload.milestoneCode,
          photoUrl: payload.photoUrl!,
          description: payload.workCompleted,
          uploadedBy: currentUser.name,
          uploadDate: nowTimestamp().slice(0, 10),
        },
        ...prev,
      ]);
    }

    pushAudit({
      module: "M05 - Visual Progress Monitoring",
      action: "UPDATE_MILESTONE_PROGRESS",
      recordId: payload.milestoneCode,
      previousValue: `Actual: ${targetMs?.actualProgress ?? 0}%`,
      newValue: `Actual: ${payload.actualProgress}% (${payload.workCompleted})`,
    });
  };

  // Handlers for M06 Risk Update
  const handleUpdateRisk = (payload: {
    riskCode: string;
    status: SeedRisk["status"];
    riskOwner: string;
  }) => {
    setRisks((prev) =>
      prev.map((r) =>
        r.riskCode === payload.riskCode
          ? { ...r, status: payload.status, riskOwner: payload.riskOwner }
          : r
      )
    );
    pushAudit({
      module: "M06 - AI Risk Copilot",
      action: "UPDATE_RISK_STATUS",
      recordId: payload.riskCode,
      previousValue: "OPEN",
      newValue: payload.status,
    });
  };

  const navItems: { id: NavTab; label: string; badge?: number }[] = [
    { id: "DASHBOARD", label: "1. Dashboard" },
    { id: "M01_SCANNER", label: "2. M01: AI Material Scanner" },
    { id: "M01_VENDOR", label: "3. M01: Vendor Finder" },
    { id: "M02_INVENTORY", label: "4. M02: Live Stock Inventory" },
    { id: "M03_QUALITY", label: "5. M03: Defect Log & Vendor Score" },
    { id: "M04_EQUIPMENT", label: "6. M04: Tools & Equipment (QR)" },
    { id: "M05_PROGRESS", label: "7. M05: Project & Subcon Progress" },
    {
      id: "M06_RISK_COPILOT",
      label: "8. M06: AI Risk Copilot",
      badge: projRisks.filter((r) => r.riskLevel === "CRITICAL").length,
    },
    {
      id: "NOTIFICATIONS_AUDIT",
      label: "9. Alerts & Audit Trail",
      badge: unreadCount,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Global Command Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-600 to-teal-500 flex items-center justify-center font-black text-lg shadow">
              BS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight">
                  BuildSmart AI
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  SIMULATED DEMO DATA (BR-018)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gamuda Berhad • Site Intelligence, Live Stock, Vendor Defect
                Evaluation & AI Risk Copilot
              </p>
            </div>
          </div>

          {/* Role & Project Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Project Selector */}
            <div className="bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
              <span className="text-slate-400 font-medium">Project:</span>
              <select
                value={selectedProjectCode}
                onChange={(e) => setSelectedProjectCode(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none"
              >
                {projects.map((p) => (
                  <option
                    key={p.projectCode}
                    value={p.projectCode}
                    className="bg-slate-900 text-white"
                  >
                    {p.projectCode} — {p.name.split("–")[1] || p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Role Switcher (PM, Engineer, Supervisor, Worker) */}
            <div className="bg-slate-800 px-2.5 py-1.5 rounded-lg border border-teal-500/40 flex items-center gap-2">
              <span className="text-teal-300 font-medium">Role:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = users.find((u) => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="bg-transparent text-white font-bold focus:outline-none"
              >
                {users.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    className="bg-slate-900 text-white"
                  >
                    {u.role.replace("_", " ")} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleResetDemo}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold transition-colors"
              title="Reset all demo data to initial state for stage presentation"
            >
              ↺ Reset Demo
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  activeTab === item.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* RBAC Project Authorization Gate (BR-001 & TC-021) */}
        {!isAuthorizedForProject ? (
          <div className="bg-white rounded-2xl border-2 border-rose-300 p-8 text-center max-w-xl mx-auto my-8 shadow-md space-y-4">
            <div className="inline-flex h-14 w-14 rounded-full bg-rose-100 text-rose-700 items-center justify-center text-2xl font-bold">
              🔒
            </div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-rose-600">
              BR-001 & TEST SCENARIO TC-021 VERIFIED
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              Access Denied to Unauthorized Project ({selectedProjectCode})
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              User <strong>{currentUser.name}</strong> (Role:{" "}
              <strong>{currentUser.role}</strong>) is only assigned to project(s):{" "}
              <span className="font-mono font-bold text-teal-800">
                {currentUser.assignedProjectCodes.join(", ")}
              </span>
              . Per Business Rule <strong>BR-001</strong>, users cannot access
              projects outside their authorized assignment.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() =>
                  setSelectedProjectCode(currentUser.assignedProjectCodes[0])
                }
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
              >
                Switch Back to Authorized Project (
                {currentUser.assignedProjectCodes[0]})
              </button>
              <button
                onClick={() => setCurrentUser(users[0])}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
              >
                Switch Role to Project Manager (Ir. Razak Ahmad)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* 1. HOME DASHBOARD (Role-Tailored Overview - Section 13.2)      */}
            {/* ============================================================== */}
            {activeTab === "DASHBOARD" && (
              <div className="space-y-6">
                {/* Role Welcome & Access Matrix Banner */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900">
                        ACTIVE ROLE: {currentUser.role.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {currentUser.title} • Dashboard Access:{" "}
                        <strong>{perms.dashboardAccess}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      {currentProject.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {currentProject.location} • Project Manager:{" "}
                      {currentProject.projectManagerName} • Authorized Projects:{" "}
                      {currentUser.assignedProjectCodes.join(", ")}
                    </p>
                  </div>

                  {/* Quick Workflow Shortcuts */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setActiveTab("M01_SCANNER")}
                      className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                    >
                      📸 Scan Material & Check Stock (M01)
                    </button>
                    <button
                      onClick={() => setActiveTab("M03_QUALITY")}
                      className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                    >
                      ⚠ Reflect Vendor Defect (M03)
                    </button>
                    <button
                      onClick={() => setActiveTab("M06_RISK_COPILOT")}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                    >
                      🤖 Open AI Risk Copilot (M06)
                    </button>
                  </div>
                </div>

                {/* Top 4 KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() => setActiveTab("M05_PROGRESS")}
                    className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-500 transition-all"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      Project Progress (M05)
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {currentProject.actualCompletion}%{" "}
                      <span className="text-xs font-normal text-slate-500">
                        vs {currentProject.plannedCompletion}% Planned
                      </span>
                    </div>
                    <div className="text-xs font-bold text-rose-600 mt-1">
                      {currentProject.actualCompletion -
                        currentProject.plannedCompletion}
                      % Schedule Variance • {currentProject.status}
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("M02_INVENTORY")}
                    className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-500 transition-all"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      Live Stock Alerts (M02)
                    </div>
                    <div className="text-2xl font-extrabold text-rose-600 mt-1">
                      {
                        projInventory.filter(
                          (i) => computeInventoryMetrics(i).isBelowReorderPoint
                        ).length
                      }{" "}
                      Materials Low
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      STL-002 Rebar (3.0d cover) & CEM-001 Cement (&lt;200 ROP)
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("M03_QUALITY")}
                    className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-500 transition-all"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      Vendor Defects & Evaluation (M03)
                    </div>
                    <div className="text-2xl font-extrabold text-amber-600 mt-1">
                      {
                        projDefects.filter(
                          (d) => d.status !== "RESOLVED" && d.status !== "CLOSED"
                        ).length
                      }{" "}
                      Open Defects
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Apex Steel (V002) at 54.4% (DO_NOT_REHIRE)
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab("M06_RISK_COPILOT")}
                    className="cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-500 transition-all"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      AI Active Risks (M06)
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-700 mt-1">
                      {projRisks.length} Identified Risks
                    </div>
                    <div className="text-xs font-bold text-rose-600 mt-1">
                      {
                        projRisks.filter((r) => r.riskLevel === "CRITICAL")
                          .length
                      }{" "}
                      Critical •{" "}
                      {projRisks.filter((r) => r.riskLevel === "HIGH").length}{" "}
                      High Priority
                    </div>
                  </div>
                </div>

                {/* Main Dashboard Grid: Live Stock Snapshot + Critical Risks + Subcontractor Progress */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Critical AI Risks & Early Warnings */}
                  <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">
                        Proactive AI Risk Warnings — {selectedProjectCode}
                      </h3>
                      <button
                        onClick={() => setActiveTab("M06_RISK_COPILOT")}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Run What-If Simulator →
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {projRisks.map((r) => (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              [{r.category}] {r.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                                r.riskLevel === "CRITICAL"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {r.riskLevel} ({r.riskScore}/25)
                            </span>
                          </div>
                          <p className="text-slate-600">{r.description}</p>
                          <div className="text-teal-800 font-medium">
                            <strong>AI Action:</strong> {r.recommendedAction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Live Stock & Subcontractor Milestone Snapshot */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">
                          Live Material Stock Coverage (M02)
                        </h3>
                        <button
                          onClick={() => setActiveTab("M02_INVENTORY")}
                          className="text-xs font-bold text-teal-700 hover:underline"
                        >
                          Manage Stock →
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        {projInventory.map((inv) => {
                          const mat = materials.find(
                            (m) => m.materialCode === inv.materialCode
                          );
                          const m = computeInventoryMetrics(inv);
                          return (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                            >
                              <div>
                                <div className="font-bold text-slate-900">
                                  {mat?.name || inv.materialCode}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Available: {m.availableStock} {mat?.unit} |
                                  ROP: {m.reorderPoint} {mat?.unit}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-extrabold text-slate-900">
                                  {m.stockCoverageDays ?? "N/A"} days
                                </div>
                                <span
                                  className={`text-[10px] font-bold ${
                                    m.isBelowReorderPoint
                                      ? "text-rose-600"
                                      : "text-emerald-700"
                                  }`}
                                >
                                  {m.statusLabel.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">
                          Subcontractor & Milestone Status (M05)
                        </h3>
                        <button
                          onClick={() => setActiveTab("M05_PROGRESS")}
                          className="text-xs font-bold text-teal-700 hover:underline"
                        >
                          Update Progress →
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        {projMilestones.map((ms) => (
                          <div
                            key={ms.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                          >
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{ms.name}</span>
                              <span>
                                {ms.actualProgress}% / {ms.plannedProgress}%
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Subcon: {ms.subcontractorName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 2 & 3. MODULE 01: AI SCANNER & VENDOR FINDER                   */}
            {/* ============================================================== */}
            {(activeTab === "M01_SCANNER" || activeTab === "M01_VENDOR") && (
              <ScannerAndVendorModules
                activeTab={activeTab}
                projectCode={selectedProjectCode}
                materials={materials}
                vendors={vendors}
                inventory={inventory}
                defects={defects}
                onNavigateTab={(t) => setActiveTab(t as NavTab)}
              />
            )}

            {/* ============================================================== */}
            {/* 4 & 5. MODULE 02 (INVENTORY) & MODULE 03 (QUALITY/DEFECTS)     */}
            {/* ============================================================== */}
            {(activeTab === "M02_INVENTORY" || activeTab === "M03_QUALITY") && (
              <InventoryAndQualityModules
                activeTab={activeTab}
                projectCode={selectedProjectCode}
                projects={projects}
                currentUser={currentUser}
                materials={materials}
                vendors={vendors}
                inventory={inventory}
                transactions={transactions}
                inspections={inspections}
                defects={defects}
                onRecordConsumption={handleRecordConsumption}
                onRecordGoodsReceipt={handleRecordGoodsReceipt}
                onTransferMaterial={handleTransferMaterial}
                onReportDefect={handleReportDefect}
                onUpdateDefectStatus={handleUpdateDefectStatus}
              />
            )}

            {/* ============================================================== */}
            {/* 6, 7 & 8. MODULES 04 (EQUIPMENT), 05 (PROGRESS), 06 (COPILOT)  */}
            {/* ============================================================== */}
            {(activeTab === "M04_EQUIPMENT" ||
              activeTab === "M05_PROGRESS" ||
              activeTab === "M06_RISK_COPILOT") && (
              <EquipmentProgressRiskModules
                activeTab={activeTab}
                projectCode={selectedProjectCode}
                projects={projects}
                currentUser={currentUser}
                equipments={equipments}
                milestones={milestones}
                progressUpdates={progressUpdates}
                photos={photos}
                risks={risks}
                inventory={inventory}
                materials={materials}
                vendors={vendors}
                onEquipmentAction={handleEquipmentAction}
                onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
                onUpdateRisk={handleUpdateRisk}
              />
            )}

            {/* ============================================================== */}
            {/* 9. NOTIFICATIONS (AL-001 to AL-010) & AUDIT TRAIL (SECTION 18) */}
            {/* ============================================================== */}
            {activeTab === "NOTIFICATIONS_AUDIT" && (
              <div className="space-y-6">
                {/* Notifications Center */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        SECTION 15 • CONFIGURED BUSINESS ALERTS (AL-001 TO
                        AL-010)
                      </span>
                      <h2 className="text-xl font-bold text-slate-900">
                        Role Notifications for {currentUser.name} (
                        {currentUser.role})
                      </h2>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, isRead: true }))
                        )
                      }
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
                    >
                      Mark All as Read
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {projNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-3 ${
                          n.isRead
                            ? "bg-slate-50 border-slate-200 text-slate-600"
                            : "bg-white border-l-4 border-l-rose-600 border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">
                              {n.alertCode}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                n.priority === "CRITICAL"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {n.priority}
                            </span>
                            <strong className="text-slate-900 text-sm">
                              {n.title}
                            </strong>
                          </div>
                          <p>{n.description}</p>
                          <div className="text-[11px] text-slate-400">
                            Ref: {n.relatedRef} • Created: {n.createdAt}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id
                                  ? { ...item, isRead: true }
                                  : item
                              )
                            );
                            const mapTab: Record<string, NavTab> = {
                              M01: "M01_SCANNER",
                              M02: "M02_INVENTORY",
                              M03: "M03_QUALITY",
                              M04: "M04_EQUIPMENT",
                              M05: "M05_PROGRESS",
                              M06: "M06_RISK_COPILOT",
                            };
                            setActiveTab(mapTab[n.targetModule] || "DASHBOARD");
                          }}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg font-bold"
                        >
                          Open {n.targetModule} →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immutable Audit Trail (Section 18) */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      SECTION 18 & BR-019 • IMMUTABLE AUDIT TRAIL
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      System Activity & Record Change Log ({auditLogs.length})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="py-2.5 px-3">Audit ID</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">User & Role</th>
                          <th className="py-2.5 px-3">Project & Module</th>
                          <th className="py-2.5 px-3">Action & Record ID</th>
                          <th className="py-2.5 px-3">Previous Value</th>
                          <th className="py-2.5 px-3">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {a.auditCode}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {a.timestamp}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">
                                {a.userName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {a.userRole}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-teal-800">
                                {a.projectCode}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {a.module}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-slate-800">
                                {a.action}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                ID: {a.recordId}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {a.previousValue}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {a.newValue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
