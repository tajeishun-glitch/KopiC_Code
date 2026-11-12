"use client";

import React, { useState, useEffect } from "react";
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
  calculateVendorScore,
  getRolePermissions,
} from "@/lib/business-engine";
import { ScannerAndVendorModules } from "@/components/ScannerAndVendorModules";
import { InventoryAndQualityModules } from "@/components/InventoryAndQualityModules";
import { EquipmentProgressRiskModules } from "@/components/EquipmentProgressRiskModules";
import { DashboardCharts } from "@/components/DashboardCharts";
import { DroneVisionModal } from "@/components/DroneVisionModal";
import { MaterialScannerModal } from "@/components/MaterialScannerModal";
import { WhatsAppSiteBotModal } from "@/components/WhatsAppSiteBotModal";
import { ProjectBlueprintModal } from "@/components/ProjectBlueprintModal";
import { LoginPage } from "@/components/LoginPage";
import { AICopilotModal } from "@/components/AICopilotModal";

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

type RegionFilter =
  | "ALL"
  | "Malaysia"
  | "Australia"
  | "Singapore"
  | "United Kingdom"
  | "Taiwan";

export default function BuildSmartAIApp() {
  // Core Reactive Application State
  const [users] = useState<SeedUser[]>(INITIAL_USERS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<SeedUser>(INITIAL_USERS[0]); // Default: Project Manager
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("ALL");
  const [selectedProjectCode, setSelectedProjectCode] =
    useState<string>("PRJ-ALPHA");
  const [activeTab, setActiveTab] = useState<NavTab>("DASHBOARD");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDroneModalOpen, setIsDroneModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<"DARK" | "LIGHT">("DARK");

  const applyTheme = (mode: "DARK" | "LIGHT") => {
    setThemeMode(mode);
    try {
      localStorage.setItem("buildsmart-theme-v2", mode);
    } catch {}
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      if (mode === "LIGHT") {
        html.setAttribute("data-theme", "apple-light");
        html.classList.add("theme-apple-light", "theme-light");
        html.classList.remove("theme-hilti-dark", "theme-dark");
      } else {
        html.setAttribute("data-theme", "hilti-dark");
        html.classList.add("theme-hilti-dark", "theme-dark");
        html.classList.remove("theme-apple-light", "theme-light");
      }
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("buildsmart-theme-v2") as "DARK" | "LIGHT" | null;
      if (saved === "LIGHT" || saved === "DARK") {
        applyTheme(saved);
      } else {
        applyTheme("DARK");
      }
    } catch {
      applyTheme("DARK");
    }
  }, []);

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



  // Region Filter Logic
  const filteredProjects =
    selectedRegion === "ALL"
      ? projects
      : projects.filter((p) => p.region === selectedRegion);

  const handleRegionChange = (region: RegionFilter) => {
    setSelectedRegion(region);
    const validInRegion =
      region === "ALL" ? projects : projects.filter((p) => p.region === region);
    if (
      validInRegion.length > 0 &&
      !validInRegion.some((p) => p.projectCode === selectedProjectCode)
    ) {
      setSelectedProjectCode(validInRegion[0].projectCode);
    }
  };

  // Full Unrestricted Project Access
  const isAuthorizedForProject = true;
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
    (n) => n.projectCode === selectedProjectCode
  );
  const unreadCount = projNotifications.filter((n) => !n.isRead).length;

  // Top 5 Prioritized Critical/High Risks for Dashboard Display
  const top5DashboardRisks = [...projRisks]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

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
    const isVerified = perms.canVerifyConsumption;
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
        : "SUBMIT_ENGINEER_CONSUMPTION",
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
    const srcInv = inventory.find(
      (i) =>
        i.projectCode === selectedProjectCode &&
        i.materialCode === materialCode
    );
    if (!srcInv) return;

    const available = srcInv.currentStock - srcInv.reservedStock;
    if (quantity > available) {
      alert(
        `BR-011 Violation: Transfer quantity (${quantity}) exceeds available surplus (${available}).`
      );
      return;
    }

    setInventory((prev) =>
      prev.map((inv) => {
        if (
          inv.projectCode === selectedProjectCode &&
          inv.materialCode === materialCode
        ) {
          return {
            ...inv,
            currentStock: inv.currentStock - quantity,
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
        destProjectCode,
        recordedBy: currentUser.name,
        recordedByRole: currentUser.role,
        verificationStatus: "VERIFIED",
        remarks: `Cross-project surplus transfer to ${destProjectCode}. ${remarks}`,
        transactionDate: nowTimestamp(),
      },
      ...prev,
    ]);

    pushAudit({
      module: "M02 - Smart Live Inventory",
      action: "TRANSFER_MATERIAL_SURPLUS",
      recordId: txnCode,
      previousValue: `${selectedProjectCode} -> ${destProjectCode}`,
      newValue: `Transferred ${quantity} units of ${materialCode}`,
    });
  };

  // Handlers for M03 Quality & Defects
  const handleReportDefect = (payload: {
    materialCode: string;
    vendorCode: string;
    deliveryRef: string;
    category: SeedDefectRecord["category"];
    severity: SeedDefectRecord["severity"];
    rejectedQty: number;
    description: string;
    correctiveActionText: string;
    photoUrl?: string;
  }) => {
    const defCode = `DEF-2026-${String(defects.length + 106).padStart(3, "0")}`;
    const newDefect: SeedDefectRecord = {
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
      photoUrl: payload.photoUrl,
      status: "OPEN",
      correctiveActions: [
        {
          id: `ca-${Date.now()}`,
          actionDescription: payload.correctiveActionText,
          responsibleParty: `Vendor ${payload.vendorCode} QA Team`,
          targetDate: new Date(Date.now() + 3 * 86400000)
            .toISOString()
            .slice(0, 10),
          status: "OPEN",
        },
      ],
    };

    setDefects((prev) => [newDefect, ...prev]);

    // Recalculate Vendor Score per BR-003 & BR-007
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
      return `BR-012 Conflict: ${target.equipmentCode} is currently ${target.status} (${target.assignedTo || target.currentLocation}). Cannot create conflicting active allocation!`;
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

  // Categorized Sidebar Navigation Items (Full Access)
  const navSections = [
    {
      group: "COMMAND & OVERVIEW",
      items: [
        { id: "DASHBOARD" as NavTab, label: "Dashboard", icon: "📊", badge: undefined },
        {
          id: "NOTIFICATIONS_AUDIT" as NavTab,
          label: "Alerts & Audit Trail",
          icon: "🔔",
          badge: unreadCount,
        },
      ],
    },
    {
      group: "PROCUREMENT & YARD",
      items: [
        { id: "M01_VENDOR" as NavTab, label: "M03: Vendor Finder", icon: "🏢", badge: undefined },
        {
          id: "M02_INVENTORY" as NavTab,
          label: "M04: Live Inventory Info",
          icon: "📦",
          badge: projInventory.filter((i) => computeInventoryMetrics(i).isBelowReorderPoint).length,
        },
      ],
    },
    {
      group: "QUALITY & DEFECTS",
      items: [
        {
          id: "M03_QUALITY" as NavTab,
          label: "M05: Defect Log & Vendor Score",
          icon: "🛡️",
          badge: projDefects.filter((d) => d.status !== "RESOLVED" && d.status !== "CLOSED").length,
        },
      ],
    },
    {
      group: "PROGRESS & RISK",
      items: [
        { id: "M05_PROGRESS" as NavTab, label: "M05: Project & Subcon", icon: "📈", badge: undefined },
        {
          id: "M06_RISK_COPILOT" as NavTab,
          label: "M06: AI Risk & Copilot",
          icon: "🤖",
          badge: projRisks.filter((r) => r.riskLevel === "CRITICAL").length,
        },
      ],
    },
  ];

  const handleSwitchUser = (nextUser: SeedUser) => {
    setCurrentUser(nextUser);
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        themeMode={themeMode}
        onToggleTheme={() => applyTheme(themeMode === "DARK" ? "LIGHT" : "DARK")}
        onSelectTheme={(mode) => applyTheme(mode)}
        onLoginSuccess={(loggedInUser) => {
          handleSwitchUser(loggedInUser);
          setIsAuthenticated(true);
          const loginEntry: SeedAuditLog = {
            id: `aud-${Date.now()}`,
            auditCode: `AUD-2026-${String(auditLogs.length + 1).padStart(3, "0")}`,
            userId: loggedInUser.id,
            userName: loggedInUser.name,
            userRole: loggedInUser.role,
            projectCode: selectedProjectCode,
            module: "Authentication Portal",
            action: "OPERATOR_SIGN_IN",
            recordId: loggedInUser.id,
            previousValue: "Session: Unauthenticated",
            newValue: `Authenticated as ${loggedInUser.name}`,
            timestamp: nowTimestamp(),
          };
          setAuditLogs((prev) => [loginEntry, ...prev]);
        }}
      />
    );
  }

  // Extracted Main Body Content
  const renderMainBody = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ============================================================== */}
      {/* 1. HOME DASHBOARD WITH INTERACTIVE CHARTS & TOP 5 WARNINGS     */}
      {/* ============================================================== */}
      {activeTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Top Industrial Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {currentProject.region.toUpperCase()} REGIONAL HUB
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      [{currentProject.projectCode}] {currentProject.location}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    {currentProject.name}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Budget:{" "}
                    <span className="text-amber-400 font-mono font-bold">
                      RM {(currentProject.budgetRm / 1e6).toFixed(1)}M
                    </span>{" "}
                    • Manager: <strong className="text-white">{currentProject.projectManagerName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Actual Completion</div>
                    <div className="text-2xl font-mono font-black text-amber-400">
                      {currentProject.actualCompletion}%
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-400">Planned End</div>
                    <div className="text-sm font-mono font-bold text-white">
                      {currentProject.plannedEndDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Operational Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  onClick={() => {
                    if (perms.canViewProcurementAndYard) {
                      setActiveTab("M02_INVENTORY");
                    }
                  }}
                  className={`${
                    perms.canViewProcurementAndYard
                      ? "cursor-pointer hover:border-amber-500/60"
                      : "opacity-80 cursor-not-allowed"
                  } bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md transition-all group`}
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Critical Stock Reorder (M04)</span>
                    <span className="text-slate-400 group-hover:text-amber-400">
                      {perms.canViewProcurementAndYard ? "→" : "🔒"}
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono text-rose-400 mt-1">
                    {
                      projInventory.filter(
                        (i) => computeInventoryMetrics(i).isBelowReorderPoint
                      ).length
                    }{" "}
                    <span className="text-xs font-normal text-slate-300">Materials Low</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    Rebar STL-002 (3.0d cover) & CEM-001 Cement
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("M03_QUALITY")}
                  className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 shadow-md transition-all group"
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Open NCR Defects (M05)</span>
                    <span className="text-slate-400 group-hover:text-amber-400">→</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                    {
                      projDefects.filter(
                        (d) => d.status !== "RESOLVED" && d.status !== "CLOSED"
                      ).length
                    }{" "}
                    <span className="text-xs font-normal text-slate-300">Active NCR</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">
                    Apex Steel (54.4% DO_NOT_REHIRE)
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("M06_RISK_COPILOT")}
                  className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 shadow-md transition-all group"
                >
                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                    <span>Predictive AI Risks (M06)</span>
                    <span className="text-slate-400 group-hover:text-amber-400">→</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                    {projRisks.length}{" "}
                    <span className="text-xs font-normal text-slate-300">Identified</span>
                  </div>
                  <div className="text-xs font-bold text-rose-400 mt-1">
                    {projRisks.filter((r) => r.riskLevel === "CRITICAL").length} Critical •{" "}
                    {projRisks.filter((r) => r.riskLevel === "HIGH").length} High Priority
                  </div>
                </div>
              </div>

              {/* VISUAL CHARTS SUITE (S-Curve Line, Spend Donut) */}
              <DashboardCharts
                currentProject={currentProject}
                inventory={projInventory}
                defects={projDefects}
                risks={projRisks}
                accessDomain={perms.accessDomain}
                onNavigateTab={(t) => setActiveTab(t as NavTab)}
                themeMode={themeMode}
              />

              {/* COMPACT TOP 5 PROACTIVE AI RISK WARNINGS SECTION */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="font-mono font-bold text-sm tracking-wide text-rose-400 uppercase">
                        Proactive AI Risk Early Warnings (Top 5 Prioritized)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Multi-stream correlation: stockout probability, subcontractor schedule slippage & defect rates
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("M06_RISK_COPILOT")}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold transition-all"
                  >
                    View All Risks ({projRisks.length}) in M06 →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {top5DashboardRisks.map((r, idx) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between space-y-2 transition-all ${
                        r.riskLevel === "CRITICAL"
                          ? "bg-slate-950/80 border-rose-500/50 shadow-sm"
                          : "bg-slate-950/60 border-slate-800"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            #{idx + 1} [{r.category}]
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                              r.riskLevel === "CRITICAL"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {r.riskLevel} ({r.riskScore}/25)
                          </span>
                        </div>

                        <div className="font-bold text-slate-200 line-clamp-2">
                          {r.title}
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                          {r.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div className="text-[11px] text-amber-300/90 font-medium line-clamp-2">
                          <strong className="text-amber-400 font-mono">AI Action:</strong> {r.recommendedAction}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono text-slate-500">
                            Owner: {r.riskOwner.split(" ")[0]}
                          </span>
                          <button
                            onClick={() => setActiveTab("M06_RISK_COPILOT")}
                            className="text-[11px] font-mono font-bold text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Investigate →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 2 & 3. MODULE 01: AI SCANNER & VENDOR FINDER                   */}
          {/* ============================================================== */}
          {(activeTab === "M01_SCANNER" || activeTab === "M01_VENDOR") && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-900">
              <ScannerAndVendorModules
                activeTab={activeTab}
                projectCode={selectedProjectCode}
                userRole={currentUser.role}
                materials={materials}
                vendors={vendors}
                inventory={inventory}
                defects={defects}
                onNavigateTab={(t) => setActiveTab(t as NavTab)}
                onSubmitPurchaseRequest={(req) => {
                  pushAudit({
                    module: "M03 - Vendor Finder",
                    action: "PURCHASE_REQUEST_TRANSMITTED",
                    recordId: req.vendorCode,
                    previousValue: "None",
                    newValue: `Order ${req.quantity} units of ${req.materialCode} (${req.urgency}) to ${selectedProjectCode}`,
                  });
                }}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 4 & 5. MODULE 02 (INVENTORY) & MODULE 03 (QUALITY/DEFECTS)     */}
          {/* ============================================================== */}
          {(activeTab === "M02_INVENTORY" || activeTab === "M03_QUALITY") && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-900">
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
                onSyncInventory={() => {
                  pushAudit({
                    module: "M04 - Live Inventory info",
                    action: "BACKEND_INVENTORY_SYNC",
                    recordId: selectedProjectCode,
                    previousValue: "Local Cache",
                    newValue: "Synchronized with Site ERP Warehouses",
                  });
                }}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 5 & 6. MODULES 05 (PROGRESS) & 06 (RISK & COPILOT)             */}
          {/* ============================================================== */}
          {(activeTab === "M05_PROGRESS" ||
            activeTab === "M06_RISK_COPILOT") && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-900">
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
                onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
                onUpdateRisk={handleUpdateRisk}
                isCopilotOpen={isCopilotOpen}
                onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* 9. NOTIFICATIONS & AUDIT TRAIL                                 */}
          {/* ============================================================== */}
          {activeTab === "NOTIFICATIONS_AUDIT" && (
            <div className="space-y-6">
              {/* Notifications Center */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                      SECTION 15 • CONFIGURED BUSINESS ALERTS (AL-001 TO AL-010)
                    </span>
                    <h2 className="text-xl font-bold text-white">
                      System Notifications &amp; Operational Alerts
                    </h2>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, isRead: true }))
                      )
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-mono font-semibold"
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
                          ? "bg-slate-950/60 border-slate-800 text-slate-400"
                          : "bg-slate-950 border-l-4 border-l-rose-500 border-slate-800 shadow-md text-slate-200"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {n.alertCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              n.priority === "CRITICAL"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {n.priority}
                          </span>
                          <strong className="text-white text-sm">
                            {n.title}
                          </strong>
                        </div>
                        <p className="text-slate-300">{n.description}</p>
                        <div className="text-[11px] text-slate-500 font-mono">
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
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg font-mono font-bold"
                      >
                        Open {n.targetModule} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Audit Trail */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                    SECTION 18 & BR-019 • IMMUTABLE AUDIT TRAIL
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    System Activity & Record Change Log ({auditLogs.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                        <th className="py-2.5 px-3">Audit ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Operator</th>
                        <th className="py-2.5 px-3">Project & Module</th>
                        <th className="py-2.5 px-3">Action & Record ID</th>
                        <th className="py-2.5 px-3">Previous Value</th>
                        <th className="py-2.5 px-3">New Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {auditLogs.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                            {a.auditCode}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono">
                            {a.timestamp}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            {a.userName}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-amber-300 font-mono">
                              {a.projectCode}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {a.module}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-sky-400">
                              {a.action}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID: {a.recordId}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono">
                            {a.previousValue}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-400 font-mono">
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
        </div>
      );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        themeMode === "LIGHT"
          ? "theme-apple-light theme-light bg-[#F5F5F7] text-[#1D1D1F]"
          : "theme-hilti-dark theme-dark bg-[#1C1917] text-[#FAFAF9]"
      }`}
    >
      {/* Top Global Command Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-mono text-xs font-bold transition-all"
              title="Toggle Navigation Sidebar"
            >
              {isSidebarOpen ? "◀ HIDE" : "▶ MENU"}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-slate-950 text-base shadow-md border border-amber-400/40">
                BS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    BuildSmart <span className="text-amber-400 font-mono font-black">AI</span>
                  </h1>
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    CONSTRUCTION INTELLIGENCE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Gamuda Engineering • Live Stock, Vendor Scoring &amp; Predictive Risk Copilot
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Region Filter, Project Selector, Role Switcher */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* REGION FILTER (International & Local Projects) */}
            <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-amber-500/40 flex items-center gap-1.5 shadow-inner">
              <span className="text-amber-400 font-mono font-bold text-[11px]">🌍 REGION:</span>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value as RegionFilter)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">🌐 All Regions ({projects.length})</option>
                <option value="Malaysia" className="bg-slate-900 text-white">🇲🇾 Malaysia (3)</option>
                <option value="Australia" className="bg-slate-900 text-white">🇦🇺 Australia (1)</option>
                <option value="Singapore" className="bg-slate-900 text-white">🇸🇬 Singapore (1)</option>
                <option value="United Kingdom" className="bg-slate-900 text-white">🇬🇧 United Kingdom (1)</option>
                <option value="Taiwan" className="bg-slate-900 text-white">🇹🇼 Taiwan (1)</option>
              </select>
            </div>

            {/* PROJECT SELECTOR */}
            <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-inner">
              <span className="text-slate-400 font-mono font-medium text-[11px]">PROJECT:</span>
              <select
                value={selectedProjectCode}
                onChange={(e) => setSelectedProjectCode(e.target.value)}
                className="bg-transparent text-amber-400 font-bold focus:outline-none max-w-[200px] sm:max-w-[260px] truncate cursor-pointer"
              >
                {filteredProjects.map((p) => (
                  <option
                    key={p.projectCode}
                    value={p.projectCode}
                    className="bg-slate-900 text-white"
                  >
                    [{p.projectCode}] {p.name.split("–")[1] || p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TOP-RIGHT SCANNER ICON (Across all pages) */}
            <button
              onClick={() => setIsScannerModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group"
              title="Open AI Material Scanner (Camera or Upload)"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">📷</span>
              <span className="hidden sm:inline">Scanner</span>
            </button>

            {/* TOP-RIGHT DRONE ICON (Fleet Blocks: Green Available, Yellow Charging, Red Unavailable) */}
            <button
              onClick={() => setIsDroneModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group"
              title="Open Site Drone Fleet (2 Available, 1 Charging, 1 Unavailable)"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">🛸</span>
              <span className="hidden sm:inline">Drone Fleet</span>
              <span className="flex items-center gap-1 text-[9px] font-mono ml-0.5 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Available (Green)" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Charging (Yellow)" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Unavailable (Red)" />
              </span>
            </button>

            {/* TOP-RIGHT WHATSAPP ICON (Floating Window / Site Bot) */}
            <button
              onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
              className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group ${
                isWhatsAppOpen
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              }`}
              title="Open WhatsApp Web & Site Bot (Floating Window)"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">💬</span>
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline" />
            </button>

            {/* TOP-RIGHT BLUEPRINT ICON (2D Map of Site Zones) */}
            <button
              onClick={() => setIsBlueprintOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group"
              title="Open Project 2D Blueprint Map (Entrance, Zone A, B, C...)"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">🗺️</span>
              <span className="hidden sm:inline">Blueprint</span>
            </button>

            {/* TOP-RIGHT AI COPILOT ICON (Across all pages) */}
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group ${
                isCopilotOpen
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-400 ring-2 ring-indigo-500/40"
                  : "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
              }`}
              title="Open BuildSmart AI Risk Copilot (Accessible across all pages)"
            >
              <span className="text-sm group-hover:scale-110 transition-transform">🤖</span>
              <span className="hidden sm:inline">Ask AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline" />
            </button>

            {/* TOP-RIGHT THEME TOGGLE (Office-to-Field Dual Theme) */}
            <div className="flex items-center p-0.5 rounded-lg border border-slate-700/80 bg-slate-900/90 shadow-md">
              <button
                type="button"
                onClick={() => applyTheme("LIGHT")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  themeMode === "LIGHT"
                    ? "bg-[#0071E3] text-white shadow-sm ring-1 ring-[#0071E3] font-bold apple-keep-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Light Mode — Apple Cupertino Spatial Glass (Office / HQ)"
              >
                <span className="text-xs">☀️</span>
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => applyTheme("DARK")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  themeMode === "DARK"
                    ? "bg-[#F59E0B] text-[#0C0A09] shadow-sm ring-1 ring-[#F59E0B] font-black"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Dark Mode — Hilti / CAT Field-Rugged High-Contrast (Site / Field)"
              >
                <span className="text-xs">🌙</span>
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            {/* SIGN OUT / SWITCH ACCOUNT BUTTON */}
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              title="Sign out and return to the Login Portal"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
          {/* SIDEBAR NAVIGATION (Construction Theme) */}
          {isSidebarOpen && (
            <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-4 px-3 overflow-y-auto shadow-2xl transition-all">
              <div className="space-y-5">
                {navSections.map((section) => (
                  <div key={section.group} className="space-y-1">
                    <div className="px-2 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                      {section.group}
                    </div>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all group ${
                              isActive
                                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className="text-sm">{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black ${
                                  isActive
                                    ? "bg-slate-950 text-amber-400"
                                    : "bg-rose-600 text-white"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Footer User / Project Badge */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1.5 bg-slate-950/50 p-2.5 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">OPERATOR:</span>
                  <span className="text-amber-400 font-bold truncate max-w-[120px]">{currentUser.name}</span>
                </div>
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="w-full mt-2 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          )}

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">
            {renderMainBody()}
          </main>
        </div>

      {/* Global Modals Mounted Across All Pages */}
      <MaterialScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        projectCode={selectedProjectCode}
        materials={materials}
        vendors={vendors}
        inventory={inventory}
        onNavigateToInventory={() => {
          if (perms.canViewProcurementAndYard) {
            setActiveTab("M02_INVENTORY");
          }
        }}
      />

      <DroneVisionModal
        isOpen={isDroneModalOpen}
        onClose={() => setIsDroneModalOpen(false)}
        projectCode={selectedProjectCode}
        userRole={currentUser.role}
        userName={currentUser.name}
      />

      {/* Floating WhatsApp Web & Site Bot Window */}
      <WhatsAppSiteBotModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      {/* 2D Project Blueprint GIS Map Modal */}
      <ProjectBlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />

      {/* Global Floating AI Copilot Window (Accessible Across All Pages) */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        projectCode={selectedProjectCode}
        currentUserName={currentUser.name}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
