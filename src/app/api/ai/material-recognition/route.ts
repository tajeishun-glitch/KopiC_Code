import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { computeInventoryMetrics } from "@/lib/business-engine";

// Section 12.3 & Module 01: POST /api/ai/material-recognition
// Recognizes uploaded construction material photograph AND automatically checks:
// 1) Live Project Stock Quantity & Coverage (M02)
// 2) Linked Vendor Stock, Pricing, Lead Time & Defect/Evaluation Scorecards (M01 + M03)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectCode = "PRJ-ALPHA",
      hintKeyword = "",
      fileName = "",
      description = "",
    } = body;

    const store = getStore();
    const combinedSignal =
      `${hintKeyword} ${fileName} ${description}`.toLowerCase();

    // Match material deterministically from signal or default to Portland Cement / Steel Rebar
    let matchedMaterial = store.materials[0]; // Default CEM-001
    let confidence = 94.8;

    if (
      combinedSignal.includes("steel") ||
      combinedSignal.includes("rebar") ||
      combinedSignal.includes("bar") ||
      combinedSignal.includes("t16") ||
      combinedSignal.includes("stl")
    ) {
      matchedMaterial =
        store.materials.find((m) => m.materialCode === "STL-002") ||
        store.materials[1];
      confidence = 96.2;
    } else if (
      combinedSignal.includes("tile") ||
      combinedSignal.includes("porcelain") ||
      combinedSignal.includes("floor") ||
      combinedSignal.includes("til")
    ) {
      matchedMaterial =
        store.materials.find((m) => m.materialCode === "TIL-003") ||
        store.materials[2];
      confidence = 93.5;
    } else if (
      combinedSignal.includes("concrete") ||
      combinedSignal.includes("readymix") ||
      combinedSignal.includes("tremie") ||
      combinedSignal.includes("c40") ||
      combinedSignal.includes("con")
    ) {
      matchedMaterial =
        store.materials.find((m) => m.materialCode === "CON-004") ||
        store.materials[3];
      confidence = 91.4;
    } else if (
      combinedSignal.includes("block") ||
      combinedSignal.includes("aac") ||
      combinedSignal.includes("brick") ||
      combinedSignal.includes("blk")
    ) {
      matchedMaterial =
        store.materials.find((m) => m.materialCode === "BLK-005") ||
        store.materials[4];
      confidence = 95.1;
    } else if (
      combinedSignal.includes("ggbs") ||
      combinedSignal.includes("eco") ||
      combinedSignal.includes("slag") ||
      combinedSignal.includes("cem-006")
    ) {
      matchedMaterial =
        store.materials.find((m) => m.materialCode === "CEM-006") ||
        store.materials[5];
      confidence = 82.0; // Low-to-moderate confidence example requiring confirmation (BR-002)
    }

    // 1. Live Project Stock Check (Module 02 Integration)
    const projectInv = store.inventory.find(
      (i) =>
        i.projectCode === projectCode &&
        i.materialCode === matchedMaterial.materialCode
    );
    const invMetrics = projectInv ? computeInventoryMetrics(projectInv) : null;

    // Also check other projects for surplus transfer opportunities
    const crossSiteStock = store.inventory
      .filter(
        (i) =>
          i.projectCode !== projectCode &&
          i.materialCode === matchedMaterial.materialCode
      )
      .map((i) => ({
        projectCode: i.projectCode,
        availableStock: computeInventoryMetrics(i).availableStock,
        coverageDays: computeInventoryMetrics(i).stockCoverageDays,
      }));

    // 2. Vendor Info & Historical Defect Evaluation Check (Module 01 + Module 03 Integration)
    const matchingVendors = store.vendors
      .filter((v) =>
        v.products.some((p) => p.materialCode === matchedMaterial.materialCode)
      )
      .map((v) => {
        const prod = v.products.find(
          (p) => p.materialCode === matchedMaterial.materialCode
        )!;
        const vendorDefects = store.defects.filter(
          (d) =>
            d.vendorCode === v.vendorCode &&
            d.materialCode === matchedMaterial.materialCode
        );
        return {
          vendorCode: v.vendorCode,
          vendorName: v.name,
          unitPriceRm: prod.unitPriceRm,
          availableExternalQty: prod.availableExternalQty,
          minOrderQty: prod.minOrderQty,
          leadTimeDays: prod.leadTimeDays,
          distanceKm: v.distanceKm,
          lastUpdated: prod.lastUpdated,
          overallScore: v.performance.overallScore,
          onTimeDeliveryRate: v.performance.onTimeDeliveryRate,
          qualityAcceptanceRate: v.performance.qualityAcceptanceRate,
          evaluationStatus: v.performance.evaluationStatus,
          openDefectsCount: v.performance.openDefectsCount,
          recentMaterialDefectsCount: vendorDefects.length,
          aiRiskSummary: v.performance.aiRiskSummary,
          dataSource: "SIMULATED",
        };
      });

    const alternatives = matchedMaterial.alternativeCodes
      .map((altCode) =>
        store.materials.find((m) => m.materialCode === altCode)
      )
      .filter(Boolean);

    return NextResponse.json({
      recognition_status:
        confidence >= 85 ? "HIGH_CONFIDENCE" : "CONFIRMATION_REQUIRED",
      confidence,
      disclaimer:
        "BR-002 & BR-003: AI visual identification suggests material type only and does not verify structural grade compliance. Confirm technical specifications against mill/batch certificates.",
      predicted_material: {
        materialCode: matchedMaterial.materialCode,
        name: matchedMaterial.name,
        category: matchedMaterial.category,
        brand: matchedMaterial.brand,
        specifications: matchedMaterial.specifications,
        unit: matchedMaterial.unit,
        characteristics: matchedMaterial.aiCharacteristics,
        imageUrl: matchedMaterial.imageUrl,
      },
      alternatives,
      project_live_stock: projectInv
        ? {
            projectCode,
            currentStock: projectInv.currentStock,
            reservedStock: projectInv.reservedStock,
            incomingStock: projectInv.incomingStock,
            availableStock: invMetrics!.availableStock,
            reorderPoint: invMetrics!.reorderPoint,
            stockCoverageDays: invMetrics!.stockCoverageDays,
            avgDailyConsumption: projectInv.avgDailyConsumption,
            statusLabel: invMetrics!.statusLabel,
            lastUpdated: projectInv.lastUpdated,
          }
        : null,
      cross_site_surplus: crossSiteStock,
      matching_vendors: matchingVendors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process AI material recognition", details: String(err) },
      { status: 500 }
    );
  }
}
