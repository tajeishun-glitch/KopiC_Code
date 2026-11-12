import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

// Section 12.3: GET /api/vendors/products/{materialCode}
export async function GET(
  _req: NextRequest,
  { params }: { params: { materialCode: string } }
) {
  const store = getStore();
  const code = params.materialCode.toUpperCase();
  const material = store.materials.find((m) => m.materialCode === code);

  if (!material) {
    return NextResponse.json(
      { error: `Material ${code} not found in catalogue.` },
      { status: 404 }
    );
  }

  const matchingVendors = store.vendors
    .filter((v) => v.products.some((p) => p.materialCode === code))
    .map((v) => {
      const prod = v.products.find((p) => p.materialCode === code)!;
      return {
        vendor_id: v.vendorCode,
        vendor_name: v.name,
        trade_specialty: v.tradeSpecialty,
        address: v.address,
        contact_person: v.contactPerson,
        contact_phone: v.contactPhone,
        distance_km: v.distanceKm,
        cidb_grade: v.cidbGrade,
        unit_price: prod.unitPriceRm,
        available_stock: prod.availableExternalQty,
        min_order_qty: prod.minOrderQty,
        lead_time_days: prod.leadTimeDays,
        is_exact_spec_match: prod.isExactSpecMatch,
        last_updated: prod.lastUpdated,
        performance_score: v.performance.overallScore,
        on_time_delivery_rate: v.performance.onTimeDeliveryRate,
        quality_acceptance_rate: v.performance.qualityAcceptanceRate,
        open_defects: v.performance.openDefectsCount,
        evaluation_status: v.performance.evaluationStatus,
        ai_risk_summary: v.performance.aiRiskSummary,
        data_source: "SIMULATED",
      };
    });

  return NextResponse.json({
    material_code: material.materialCode,
    material_name: material.name,
    category: material.category,
    specifications: material.specifications,
    unit: material.unit,
    data_source: "SIMULATED",
    vendors: matchingVendors,
  });
}
