// BuildSmart AI - Unified Transactional State Store
// Provides consistent, relational, auditable state across all 6 modules and API endpoints.

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
  RoleType,
} from "./seed-data";
import {
  calculateVendorScore,
  computeInventoryMetrics,
} from "./business-engine";

export interface AppState {
  users: SeedUser[];
  projects: SeedProject[];
  materials: SeedMaterial[];
  vendors: SeedVendor[];
  inventory: SeedInventoryItem[];
  transactions: SeedTransaction[];
  inspections: SeedQualityInspection[];
  defects: SeedDefectRecord[];
  equipments: SeedEquipment[];
  milestones: SeedMilestone[];
  progressUpdates: SeedProgressUpdate[];
  photos: SeedPhoto[];
  risks: SeedRisk[];
  notifications: SeedNotification[];
  auditLogs: SeedAuditLog[];
}

const globalForStore = globalThis as unknown as {
  buildSmartState?: AppState;
};

export function getCloneOfInitialState(): AppState {
  return JSON.parse(
    JSON.stringify({
      users: INITIAL_USERS,
      projects: INITIAL_PROJECTS,
      materials: INITIAL_MATERIALS,
      vendors: INITIAL_VENDORS,
      inventory: INITIAL_INVENTORY,
      transactions: INITIAL_TRANSACTIONS,
      inspections: INITIAL_INSPECTIONS,
      defects: INITIAL_DEFECTS,
      equipments: INITIAL_EQUIPMENT,
      milestones: INITIAL_MILESTONES,
      progressUpdates: INITIAL_PROGRESS_UPDATES,
      photos: INITIAL_PHOTOS,
      risks: INITIAL_RISKS,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
    })
  );
}

export function getStore(): AppState {
  if (!globalForStore.buildSmartState) {
    globalForStore.buildSmartState = getCloneOfInitialState();
  }
  return globalForStore.buildSmartState;
}

export function resetStore(): AppState {
  globalForStore.buildSmartState = getCloneOfInitialState();
  return globalForStore.buildSmartState;
}

export function formatNow(): string {
  const now = new Date();
  return now.toISOString().replace("T", " ").slice(0, 16);
}

export function addAuditEntry(params: {
  userId: string;
  userName: string;
  userRole: RoleType;
  projectCode: string;
  module: string;
  action: string;
  recordId: string;
  previousValue: string;
  newValue: string;
}) {
  const store = getStore();
  const num = store.auditLogs.length + 1;
  const entry: SeedAuditLog = {
    id: `aud-${Date.now()}`,
    auditCode: `AUD-2026-${String(num).padStart(3, "0")}`,
    ...params,
    timestamp: formatNow(),
  };
  store.auditLogs.unshift(entry);
  return entry;
}

export function recalculateVendorPerformance(vendorCode: string) {
  const store = getStore();
  const vendor = store.vendors.find((v) => v.vendorCode === vendorCode);
  if (!vendor) return;

  const scores = calculateVendorScore({
    totalDeliveries: vendor.performance.totalDeliveries,
    onTimeDeliveries: vendor.performance.onTimeDeliveries,
    totalInspectedQty: vendor.performance.totalInspectedQty,
    acceptedQty: vendor.performance.acceptedQty,
    openDefectsCount: vendor.performance.openDefectsCount,
    resolvedDefectsCount: vendor.performance.resolvedDefectsCount,
  });

  vendor.performance = {
    ...vendor.performance,
    ...scores,
    lastEvaluatedAt: formatNow(),
  };
}

export function checkAndTriggerLowStockAlert(
  projectCode: string,
  materialCode: string
) {
  const store = getStore();
  const inv = store.inventory.find(
    (i) => i.projectCode === projectCode && i.materialCode === materialCode
  );
  const mat = store.materials.find((m) => m.materialCode === materialCode);
  if (!inv || !mat) return;

  const metrics = computeInventoryMetrics(inv);
  if (metrics.isBelowReorderPoint) {
    const alertId = `not-${Date.now()}`;
    store.notifications.unshift({
      id: alertId,
      alertCode: metrics.isCriticalShortage ? "AL-002" : "AL-001",
      projectCode,
      title: `${metrics.isCriticalShortage ? "Critical Shortage Alert" : "Low Stock Alert"}: ${mat.name} (${mat.materialCode})`,
      description: `Available stock is ${metrics.availableStock} ${mat.unit} (Reorder Point: ${metrics.reorderPoint} ${mat.unit}). Estimated coverage: ${metrics.stockCoverageDays ?? "N/A"} days.`,
      relatedRef: mat.materialCode,
      priority: metrics.isCriticalShortage ? "CRITICAL" : "HIGH",
      targetRoles: ["PROJECT_MANAGER", "SITE_MANAGER"],
      targetModule: "M02",
      isRead: false,
      createdAt: formatNow(),
    });
  }
}
