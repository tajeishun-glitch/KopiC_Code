// BuildSmart AI - Deterministic Business Rules, Calculations & AI Copilot Engine
// Implements Sections 3.5, 5, 6, 7, 8, 9, 10 & 14 (BR-001 through BR-020).

import {
  RoleType,
  SeedInventoryItem,
  SeedMaterial,
  SeedVendor,
  SeedEquipment,
  SeedMilestone,
  SeedRisk,
  SeedProject,
  SeedDefectRecord,
} from "./seed-data";

export interface RolePermissions {
  dashboardAccess: "FULL" | "LIMITED_CONSTRUCTION" | "LIMITED_MATERIAL";
  accessDomain: "FULL" | "CONSTRUCTION" | "MATERIAL";
  canViewAlertsAndAudit: boolean;
  canViewProcurementAndYard: boolean;
  canViewDroneSiteProgress: boolean;
  canControlDroneFlightOrCaptures: boolean;
  canUpdateProgress: boolean;
  canScanMaterial: boolean;
  canCompareVendors: boolean;
  canManageInventory: boolean;
  canVerifyConsumption: boolean;
  canSubmitConsumption: boolean;
  canConfirmGoodsReceipt: boolean;
  canTransferMaterialSurplus: boolean;
  canPerformQualityInspection: boolean;
  canReportDefect: boolean;
  canUpdateDefectStatus: boolean;
  canViewVendorPerformance: boolean;
  canManageEquipmentAllocation: boolean;
  canRequestEquipment: boolean;
  canApproveEquipmentTransfer: boolean;
  canManageMaintenance: boolean;
  canAssignRiskActions: boolean;
  canExecuteRiskActions: boolean;
}

export function getRolePermissions(_role?: RoleType): RolePermissions {
  // Full unrestricted access across all modules and actions
  return {
    dashboardAccess: "FULL",
    accessDomain: "FULL",
    canViewAlertsAndAudit: true,
    canViewProcurementAndYard: true,
    canViewDroneSiteProgress: true,
    canControlDroneFlightOrCaptures: true,
    canUpdateProgress: true,
    canScanMaterial: true,
    canCompareVendors: true,
    canManageInventory: true,
    canVerifyConsumption: true,
    canSubmitConsumption: true,
    canConfirmGoodsReceipt: true,
    canTransferMaterialSurplus: true,
    canPerformQualityInspection: true,
    canReportDefect: true,
    canUpdateDefectStatus: true,
    canViewVendorPerformance: true,
    canManageEquipmentAllocation: true,
    canRequestEquipment: true,
    canApproveEquipmentTransfer: true,
    canManageMaintenance: true,
    canAssignRiskActions: true,
    canExecuteRiskActions: true,
  };
}

// FR-M02-001, FR-M02-005, FR-M02-006
export interface ComputedInventoryMetrics {
  availableStock: number;
  reorderPoint: number;
  stockCoverageDays: number | null;
  isBelowReorderPoint: boolean;
  isCriticalShortage: boolean;
  statusLabel: "CRITICAL_SHORTAGE" | "LOW_STOCK" | "HEALTHY" | "EXCESS_SURPLUS";
}

export function computeInventoryMetrics(
  item: SeedInventoryItem
): ComputedInventoryMetrics {
  // BR-004 & FR-M02-001: Available Stock = Current Stock - Reserved Stock (Incoming stock strictly excluded)
  const availableStock = Math.max(0, item.currentStock - item.reservedStock);

  // FR-M02-005: Reorder Point = (Average Daily Consumption * Supplier Lead Time) + Safety Stock
  const reorderPoint =
    item.avgDailyConsumption * item.supplierLeadTimeDays + item.safetyStock;

  // FR-M02-006: Stock Coverage Days = Available Stock / Average Daily Consumption
  // If consumption is 0 or unavailable, return null rather than inventing a period.
  const stockCoverageDays =
    item.avgDailyConsumption > 0
      ? Number((availableStock / item.avgDailyConsumption).toFixed(1))
      : null;

  const isBelowReorderPoint = availableStock < reorderPoint;
  const isCriticalShortage =
    stockCoverageDays !== null &&
    stockCoverageDays <= item.supplierLeadTimeDays;

  let statusLabel: ComputedInventoryMetrics["statusLabel"] = "HEALTHY";
  if (isCriticalShortage) {
    statusLabel = "CRITICAL_SHORTAGE";
  } else if (isBelowReorderPoint) {
    statusLabel = "LOW_STOCK";
  } else if (stockCoverageDays !== null && stockCoverageDays >= 20) {
    statusLabel = "EXCESS_SURPLUS";
  }

  return {
    availableStock,
    reorderPoint,
    stockCoverageDays,
    isBelowReorderPoint,
    isCriticalShortage,
    statusLabel,
  };
}

// FR-M03-004: Vendor Performance Calculation
// Delivery reliability: 40% | Quality acceptance: 40% | Issue resolution: 20%
// Missing data is not treated as a zero-performance score.
export function calculateVendorScore(params: {
  totalDeliveries: number;
  onTimeDeliveries: number;
  totalInspectedQty: number;
  acceptedQty: number;
  openDefectsCount: number;
  resolvedDefectsCount: number;
}) {
  const onTimeRate =
    params.totalDeliveries > 0
      ? Number(
          ((params.onTimeDeliveries / params.totalDeliveries) * 100).toFixed(1)
        )
      : null;

  const qualityRate =
    params.totalInspectedQty > 0
      ? Number(
          ((params.acceptedQty / params.totalInspectedQty) * 100).toFixed(1)
        )
      : null;

  const totalDefects = params.openDefectsCount + params.resolvedDefectsCount;
  const resolutionRate =
    totalDefects > 0
      ? Number(((params.resolvedDefectsCount / totalDefects) * 100).toFixed(1))
      : null;

  let weightedSum = 0;
  let totalWeight = 0;

  if (onTimeRate !== null) {
    weightedSum += onTimeRate * 0.4;
    totalWeight += 0.4;
  }
  if (qualityRate !== null) {
    weightedSum += qualityRate * 0.4;
    totalWeight += 0.4;
  }
  if (resolutionRate !== null) {
    weightedSum += resolutionRate * 0.2;
    totalWeight += 0.2;
  }

  const overallScore =
    totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(1)) : 80.0;

  let evaluationStatus: "PREFERRED" | "WATCHLIST" | "DO_NOT_REHIRE" =
    "PREFERRED";
  if (overallScore < 65) {
    evaluationStatus = "DO_NOT_REHIRE";
  } else if (overallScore < 85) {
    evaluationStatus = "WATCHLIST";
  }

  return {
    onTimeDeliveryRate: onTimeRate ?? 100,
    qualityAcceptanceRate: qualityRate ?? 100,
    issueResolutionRate: resolutionRate ?? 100,
    overallScore,
    evaluationStatus,
  };
}

// FR-M04-007: Equipment Utilization Calculation
// Equipment Utilization Rate = Equipment in Use / Total Active Equipment * 100
export function computeEquipmentStats(equipments: SeedEquipment[]) {
  const total = equipments.length;
  const available = equipments.filter((e) => e.status === "AVAILABLE").length;
  const inUse = equipments.filter((e) => e.status === "IN_USE").length;
  const reserved = equipments.filter((e) => e.status === "RESERVED").length;
  const maintenance = equipments.filter(
    (e) => e.status === "MAINTENANCE"
  ).length;
  const damaged = equipments.filter((e) => e.status === "DAMAGED").length;
  const missing = equipments.filter((e) => e.status === "MISSING").length;

  const totalActive = Math.max(1, available + inUse + reserved);
  const utilizationRate = Number(((inUse / totalActive) * 100).toFixed(1));

  return {
    total,
    available,
    inUse,
    reserved,
    maintenance,
    damaged,
    missing,
    totalActive,
    utilizationRate,
  };
}

// FR-M06-004: Risk Scoring (Likelihood 1-5 * Impact 1-5)
export function classifyRiskScore(
  likelihood: number,
  impact: number
): {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
} {
  const score = Math.min(25, Math.max(1, likelihood * impact));
  if (score <= 4) return { score, level: "LOW" };
  if (score <= 9) return { score, level: "MEDIUM" };
  if (score <= 16) return { score, level: "HIGH" };
  return { score, level: "CRITICAL" };
}

// FR-M06-007 & BR-020: What-If Scenario Simulator (Read-Only Non-Mutating Simulation)
export interface SimulationInput {
  projectCode: string;
  scenarioType:
    | "DELIVERY_DELAY"
    | "PRICE_INCREASE"
    | "EQUIPMENT_BREAKDOWN"
    | "CONSUMPTION_SURGE";
  materialCode?: string;
  equipmentCode?: string;
  delayDays?: number;
  percentageChange?: number;
}

export interface SimulationResult {
  scenarioTitle: string;
  projectCode: string;
  isSimulationOnly: true; // BR-020 guarantee
  baselineSummary: string;
  simulatedImpactSummary: string;
  shortageGapDays: number;
  estimatedScheduleDelayDays: number;
  estimatedFinancialImpactRm: number;
  newRiskScore: number;
  newRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mitigationRecommendations: string[];
  explainableDataSources: string[];
}

export function runScenarioSimulation(
  input: SimulationInput,
  context: {
    project: SeedProject;
    inventory: SeedInventoryItem[];
    materials: SeedMaterial[];
    vendors: SeedVendor[];
    equipments: SeedEquipment[];
    milestones: SeedMilestone[];
  }
): SimulationResult {
  const { project, inventory, materials, vendors, equipments, milestones } =
    context;

  if (input.scenarioType === "DELIVERY_DELAY") {
    const matCode = input.materialCode || "CEM-001";
    const delayDays = input.delayDays ?? 3;
    const mat =
      materials.find((m) => m.materialCode === matCode) || materials[0];
    const inv =
      inventory.find(
        (i) => i.projectCode === project.projectCode && i.materialCode === matCode
      ) || inventory[0];
    const metrics = computeInventoryMetrics(inv);
    const currentCoverage = metrics.stockCoverageDays ?? 0;
    const newEffectiveLeadTime = inv.supplierLeadTimeDays + delayDays;
    const shortageGapDays = Math.max(
      0,
      Number((newEffectiveLeadTime - currentCoverage).toFixed(1))
    );
    const scheduleDelayDays = Math.ceil(shortageGapDays * 0.85);
    const dailyCrewStandbyCostRm = 24000;
    const financialImpact = Math.round(
      shortageGapDays * dailyCrewStandbyCostRm
    );

    // Find backup vendor with fastest lead time & highest score
    const matchingVendors = vendors
      .filter((v) => v.products.some((p) => p.materialCode === matCode))
      .sort((a, b) => b.performance.overallScore - a.performance.overallScore);
    const bestBackup = matchingVendors[0];

    // Check other project surplus
    const surplusItem = inventory.find(
      (i) =>
        i.projectCode !== project.projectCode &&
        i.materialCode === matCode &&
        computeInventoryMetrics(i).availableStock > i.minStock * 2
    );

    const riskCalc = classifyRiskScore(
      shortageGapDays > 0 ? 5 : 3,
      shortageGapDays >= 2 ? 5 : 3
    );

    return {
      scenarioTitle: `What-If: ${mat.name} (${mat.materialCode}) Delivery Delayed by +${delayDays} Days`,
      projectCode: project.projectCode,
      isSimulationOnly: true,
      baselineSummary: `Available Stock: ${metrics.availableStock} ${mat.unit} | Daily Burn: ${inv.avgDailyConsumption} ${mat.unit}/day | Stock Coverage: ${currentCoverage} days | Standard Lead Time: ${inv.supplierLeadTimeDays} days.`,
      simulatedImpactSummary: `With a +${delayDays}-day delivery delay, total wait time reaches ${newEffectiveLeadTime} days while site stock runs out in ${currentCoverage} days—creating a ${shortageGapDays}-day stockout window and an estimated ${scheduleDelayDays}-day slippage on active structural/finishing milestones.`,
      shortageGapDays,
      estimatedScheduleDelayDays: scheduleDelayDays,
      estimatedFinancialImpactRm: financialImpact,
      newRiskScore: riskCalc.score,
      newRiskLevel: riskCalc.level,
      mitigationRecommendations: [
        surplusItem
          ? `Execute Inter-Project Material Transfer (M02) of ${Math.round(inv.avgDailyConsumption * Math.max(2, shortageGapDays))} ${mat.unit} from ${surplusItem.projectCode} (which holds ${computeInventoryMetrics(surplusItem).availableStock} ${mat.unit} available surplus).`
          : `Reallocate non-critical buffer stock across zones to protect critical-path pours.`,
        bestBackup
          ? `Place split call-off with Preferred Vendor ${bestBackup.name} (${bestBackup.vendorCode}, Score: ${bestBackup.performance.overallScore}/100, Lead Time: ${bestBackup.products.find((p) => p.materialCode === matCode)?.leadTimeDays ?? 2} days).`
          : `Request expedited night-shift dispatch from backup supplier.`,
        `Resequence site crew to non-dependent zone activities during the ${shortageGapDays}-day window to avoid RM ${dailyCrewStandbyCostRm.toLocaleString()}/day idle labor burn.`,
      ],
      explainableDataSources: [
        `M02 Inventory Record [${inv.id}] updated ${inv.lastUpdated}`,
        `M01/M03 Simulated Vendor Marketplace & Performance [${bestBackup?.vendorCode ?? "V001"}]`,
        `BR-020 Non-Mutating Simulation Mode Active`,
      ],
    };
  }

  if (input.scenarioType === "PRICE_INCREASE") {
    const matCode = input.materialCode || "STL-002";
    const pct = input.percentageChange ?? 10;
    const mat =
      materials.find((m) => m.materialCode === matCode) || materials[1];
    const inv =
      inventory.find(
        (i) => i.projectCode === project.projectCode && i.materialCode === matCode
      ) || inventory[0];
    const thirtyDayDemand = inv.avgDailyConsumption * 30;
    const baseline30DayCost = thirtyDayDemand * inv.unitCostRm;
    const extraCostRm = Math.round(baseline30DayCost * (pct / 100));

    const cheapestReliableVendor = vendors
      .filter(
        (v) =>
          v.products.some((p) => p.materialCode === matCode) &&
          v.performance.overallScore >= 75
      )
      .sort((a, b) => {
        const pa =
          a.products.find((p) => p.materialCode === matCode)?.unitPriceRm ??
          999999;
        const pb =
          b.products.find((p) => p.materialCode === matCode)?.unitPriceRm ??
          999999;
        return pa - pb;
      })[0];

    const riskCalc = classifyRiskScore(4, pct >= 15 ? 4 : 3);

    return {
      scenarioTitle: `What-If: ${mat.name} (${mat.materialCode}) Market Price Increases by +${pct}%`,
      projectCode: project.projectCode,
      isSimulationOnly: true,
      baselineSummary: `Current Unit Cost: RM ${inv.unitCostRm.toLocaleString()}/${mat.unit} | 30-Day Forecast Demand: ${thirtyDayDemand.toLocaleString()} ${mat.unit} | Baseline 30-Day Spend: RM ${baseline30DayCost.toLocaleString()}.`,
      simulatedImpactSummary: `A +${pct}% unit price increase raises unit rate to RM ${(inv.unitCostRm * (1 + pct / 100)).toFixed(2)}/${mat.unit}, adding RM ${extraCostRm.toLocaleString()} in unbudgeted material cost over the next 30 days on ${project.projectCode}.`,
      shortageGapDays: 0,
      estimatedScheduleDelayDays: 0,
      estimatedFinancialImpactRm: extraCostRm,
      newRiskScore: riskCalc.score,
      newRiskLevel: riskCalc.level,
      mitigationRecommendations: [
        cheapestReliableVendor
          ? `Lock rate with high-scoring vendor ${cheapestReliableVendor.name} (${cheapestReliableVendor.vendorCode}, Score: ${cheapestReliableVendor.performance.overallScore}%) at RM ${cheapestReliableVendor.products.find((p) => p.materialCode === matCode)?.unitPriceRm.toLocaleString()}/${mat.unit}.`
          : `Consolidate multi-site volume across Project Alpha & Project Beta to negotiate bulk price cap.`,
        `Transfer existing paid surplus stock from Project Beta before purchasing at higher spot prices.`,
        mat.alternativeCodes.length > 0
          ? `Evaluate technical specification approval (BR-003) for lower-cost alternative material (${mat.alternativeCodes.join(", ")}) for non-critical elements.`
          : `Audit site consumption variance in M05 to eliminate material wastage.`,
      ],
      explainableDataSources: [
        `M02 Inventory Unit Rate & Burn Rate [${inv.id}]`,
        `M01 Vendor Product Pricing Table (SIMULATED)`,
        `BR-020 Non-Mutating Simulation Mode Active`,
      ],
    };
  }

  if (input.scenarioType === "EQUIPMENT_BREAKDOWN") {
    const eqCode = input.equipmentCode || "EQ-EX-001";
    const downDays = input.delayDays ?? 4;
    const eq =
      equipments.find((e) => e.equipmentCode === eqCode) || equipments[0];
    const backupEq = equipments.find(
      (e) =>
        e.category === eq.category &&
        e.status === "AVAILABLE" &&
        e.equipmentCode !== eq.equipmentCode
    );
    const financialImpact = Math.round(
      downDays * (eq.dailyRentalCostRm + 14500)
    );
    const riskCalc = classifyRiskScore(4, 5);

    return {
      scenarioTitle: `What-If: ${eq.name} (${eq.equipmentCode}) Suffers ${downDays}-Day Breakdown`,
      projectCode: project.projectCode,
      isSimulationOnly: true,
      baselineSummary: `Equipment ${eq.equipmentCode} (${eq.brand} ${eq.model}) is currently ${eq.status} at ${eq.currentLocation} (Daily rate: RM ${eq.dailyRentalCostRm.toLocaleString()}/day).`,
      simulatedImpactSummary: `A ${downDays}-day unplanned breakdown halts dependent zone earthworks/lifting activities, risking a ${Math.ceil(downDays * 0.75)}-day milestone slip and RM ${financialImpact.toLocaleString()} in emergency repair + crew standby cost.`,
      shortageGapDays: downDays,
      estimatedScheduleDelayDays: Math.ceil(downDays * 0.75),
      estimatedFinancialImpactRm: financialImpact,
      newRiskScore: riskCalc.score,
      newRiskLevel: riskCalc.level,
      mitigationRecommendations: [
        backupEq
          ? `Immediately initiate Inter-Project Equipment Transfer (FR-M04-006) of available ${backupEq.name} (${backupEq.equipmentCode}) currently idle at ${backupEq.currentProjectCode} (${backupEq.currentLocation}).`
          : `Mobilize short-term replacement unit from pre-qualified plant hire panel.`,
        `Complete overdue preventive maintenance (FR-M04-008) immediately to prevent catastrophic hydraulic failure.`,
        `Reassign affected site crew to adjacent zone preparation tasks while unit is in repair.`,
      ],
      explainableDataSources: [
        `M04 Equipment Master & Allocation Record [${eq.equipmentCode}]`,
        backupEq
          ? `M04 Cross-Project Available Equipment Match [${backupEq.equipmentCode} at ${backupEq.currentProjectCode}]`
          : `M04 Fleet Utilization Register`,
        `BR-020 Non-Mutating Simulation Mode Active`,
      ],
    };
  }

  // CONSUMPTION_SURGE
  const matCode = input.materialCode || "STL-002";
  const surgePct = input.percentageChange ?? 20;
  const mat =
    materials.find((m) => m.materialCode === matCode) || materials[1];
  const inv =
    inventory.find(
      (i) => i.projectCode === project.projectCode && i.materialCode === matCode
    ) || inventory[0];
  const metrics = computeInventoryMetrics(inv);
  const newDailyBurn = Number(
    (inv.avgDailyConsumption * (1 + surgePct / 100)).toFixed(1)
  );
  const newCoverageDays =
    newDailyBurn > 0
      ? Number((metrics.availableStock / newDailyBurn).toFixed(1))
      : 0;
  const newReorderPoint = Math.ceil(
    newDailyBurn * inv.supplierLeadTimeDays + inv.safetyStock
  );
  const shortageGapDays = Math.max(
    0,
    Number((inv.supplierLeadTimeDays - newCoverageDays).toFixed(1))
  );
  const financialImpact = Math.round(shortageGapDays * 28000);
  const riskCalc = classifyRiskScore(
    shortageGapDays > 0 ? 5 : 3,
    shortageGapDays >= 1.5 ? 5 : 3
  );

  return {
    scenarioTitle: `What-If: ${mat.name} (${mat.materialCode}) Daily Consumption Surges by +${surgePct}%`,
    projectCode: project.projectCode,
    isSimulationOnly: true,
    baselineSummary: `Available Stock: ${metrics.availableStock} ${mat.unit} | Baseline Burn: ${inv.avgDailyConsumption} ${mat.unit}/day (${metrics.stockCoverageDays}d coverage) | Baseline ROP: ${metrics.reorderPoint} ${mat.unit}.`,
    simulatedImpactSummary: `At +${surgePct}% burn (${newDailyBurn} ${mat.unit}/day), stock coverage drops from ${metrics.stockCoverageDays} days to ${newCoverageDays} days, and Reorder Point increases to ${newReorderPoint} ${mat.unit}—leaving a ${shortageGapDays}-day supply gap before standard vendor delivery arrives.`,
    shortageGapDays,
    estimatedScheduleDelayDays: Math.ceil(shortageGapDays),
    estimatedFinancialImpactRm: financialImpact,
    newRiskScore: riskCalc.score,
    newRiskLevel: riskCalc.level,
    mitigationRecommendations: [
      `Update M02 safety stock & trigger immediate replenishment with shortest-lead-time Preferred Vendor (2-day lead time).`,
      `Verify in M05 Visual Progress whether the +${surgePct}% consumption surge matches accelerated physical milestone completion or indicates site rework/wastage (FR-M05-008).`,
      `Transfer buffer stock from Project Beta to bridge the ${shortageGapDays}-day gap.`,
    ],
    explainableDataSources: [
      `M02 Inventory & Consumption Ledger [${inv.id}]`,
      `M05 Milestone Progress vs Material Consumption Check [${ milestones.find((m) => m.projectCode === project.projectCode)?.milestoneCode ?? "MS-ALPHA-02" }]`,
      `BR-020 Non-Mutating Simulation Mode Active`,
    ],
  };
}
