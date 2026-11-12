import { NextRequest, NextResponse } from "next/server";
import {
  getStore,
  addAuditEntry,
  formatNow,
  checkAndTriggerLowStockAlert,
  recalculateVendorPerformance,
} from "@/lib/store";
import { computeInventoryMetrics } from "@/lib/business-engine";
import { RoleType } from "@/lib/seed-data";

// Section 12.3: GET & POST /api/projects/{projectId}/inventory
export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const store = getStore();
  const projectCode = params.projectId.toUpperCase();

  const items = store.inventory
    .filter((i) => i.projectCode === projectCode)
    .map((inv) => {
      const mat = store.materials.find(
        (m) => m.materialCode === inv.materialCode
      )!;
      const metrics = computeInventoryMetrics(inv);
      return {
        ...inv,
        materialName: mat.name,
        category: mat.category,
        unit: mat.unit,
        specifications: mat.specifications,
        ...metrics,
      };
    });

  const transactions = store.transactions.filter(
    (t) => t.projectCode === projectCode
  );

  return NextResponse.json({
    project_code: projectCode,
    inventory: items,
    transactions,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const store = getStore();
    const projectCode = params.projectId.toUpperCase();
    const body = await req.json();
    const {
      actionType, // CONSUMPTION | GOODS_RECEIPT | TRANSFER
      materialCode,
      quantity,
      workActivity,
      deliveryRef,
      vendorCode,
      rejectedQty = 0,
      destProjectCode,
      userId = "usr-sup-01",
      userName = "Ahmad Faiz Zulkifli",
      userRole = "SITE_SUPERVISOR" as RoleType,
      remarks = "",
    } = body;

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number." },
        { status: 400 }
      );
    }

    const inv = store.inventory.find(
      (i) => i.projectCode === projectCode && i.materialCode === materialCode
    );
    if (!inv) {
      return NextResponse.json(
        { error: `Inventory record for ${materialCode} at ${projectCode} not found.` },
        { status: 404 }
      );
    }

    const metrics = computeInventoryMetrics(inv);

    // 1. CONSUMPTION RECORDING (FR-M02-002, BR-008, BR-010)
    if (actionType === "CONSUMPTION") {
      if (numQty > metrics.availableStock) {
        return NextResponse.json(
          {
            error: `BR-010 Violation: Insufficient available stock (${metrics.availableStock} available vs ${numQty} requested). Inventory cannot become negative.`,
          },
          { status: 400 }
        );
      }

      const prevStock = inv.currentStock;
      // Site Workers submit consumption for supervisor/PM verification; Supervisors/PMs/Engineers verify directly
      const isAutoVerified = userRole !== "SITE_WORKER";
      if (isAutoVerified) {
        inv.currentStock = Number((inv.currentStock - numQty).toFixed(2));
      } else {
        inv.reservedStock = Number((inv.reservedStock + numQty).toFixed(2));
      }
      inv.lastUpdated = formatNow();

      const txnCode = `TXN-2026-${String(store.transactions.length + 895).padStart(4, "0")}`;
      store.transactions.unshift({
        id: `txn-${Date.now()}`,
        transactionCode: txnCode,
        projectCode,
        materialCode,
        transactionType: "CONSUMPTION",
        quantity: numQty,
        workActivity: workActivity || "Daily Site Zone Consumption",
        recordedBy: userName,
        recordedByRole: userRole,
        verificationStatus: isAutoVerified
          ? "VERIFIED"
          : "PENDING_VERIFICATION",
        remarks,
        transactionDate: formatNow(),
      });

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M02 - Smart Live Inventory",
        action: isAutoVerified
          ? "RECORD_VERIFIED_CONSUMPTION"
          : "SUBMIT_WORKER_CONSUMPTION",
        recordId: txnCode,
        previousValue: `${materialCode} Current Stock: ${prevStock}`,
        newValue: isAutoVerified
          ? `${materialCode} Current Stock: ${inv.currentStock} (-${numQty})`
          : `${materialCode} Pending Verification (-${numQty} reserved)`,
      });

      checkAndTriggerLowStockAlert(projectCode, materialCode);

      return NextResponse.json({
        status: "SUCCESS",
        transactionCode: txnCode,
        updatedInventory: { ...inv, ...computeInventoryMetrics(inv) },
      });
    }

    // 2. GOODS RECEIPT RECORDING (FR-M02-003, BR-007, BR-009)
    if (actionType === "GOODS_RECEIPT") {
      if (userRole === "SITE_WORKER") {
        return NextResponse.json(
          {
            error:
              "RBAC 3.5 Violation: Site Workers cannot directly authorize or confirm goods receipts into confirmed inventory.",
          },
          { status: 403 }
        );
      }

      const prevStock = inv.currentStock;
      const numRejected = Math.max(0, Number(rejectedQty));
      // BR-007 & BR-009: Only confirmed accepted quantities increase physical inventory!
      inv.currentStock = Number((inv.currentStock + numQty).toFixed(2));
      inv.incomingStock = Math.max(
        0,
        Number((inv.incomingStock - (numQty + numRejected)).toFixed(2))
      );
      inv.lastUpdated = formatNow();

      const vendor = store.vendors.find((v) => v.vendorCode === vendorCode);
      const txnCode = `TXN-2026-${String(store.transactions.length + 895).padStart(4, "0")}`;

      store.transactions.unshift({
        id: `txn-${Date.now()}`,
        transactionCode: txnCode,
        projectCode,
        materialCode,
        transactionType: "RECEIPT",
        quantity: numQty,
        deliveryRef: deliveryRef || `DO-${Date.now().toString().slice(-4)}`,
        vendorName: vendor?.name || vendorCode,
        recordedBy: userName,
        recordedByRole: userRole,
        verificationStatus: "VERIFIED",
        remarks:
          numRejected > 0
            ? `Accepted: ${numQty}, Rejected: ${numRejected} (Excluded from stock per BR-009). ${remarks}`
            : remarks || "Confirmed Goods Receipt.",
        transactionDate: formatNow(),
      });

      if (vendor) {
        vendor.performance.totalDeliveries += 1;
        vendor.performance.onTimeDeliveries += 1;
        vendor.performance.totalInspectedQty += numQty + numRejected;
        vendor.performance.acceptedQty += numQty;
        vendor.performance.rejectedQty += numRejected;
        if (numRejected > 0) {
          vendor.performance.openDefectsCount += 1;
        }
        recalculateVendorPerformance(vendor.vendorCode);
      }

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M02 - Smart Live Inventory",
        action: "CONFIRM_GOODS_RECEIPT",
        recordId: txnCode,
        previousValue: `${materialCode} Current Stock: ${prevStock}`,
        newValue: `${materialCode} Current Stock: ${inv.currentStock} (+${numQty} accepted, ${numRejected} rejected excluded)`,
      });

      return NextResponse.json({
        status: "SUCCESS",
        transactionCode: txnCode,
        updatedInventory: { ...inv, ...computeInventoryMetrics(inv) },
      });
    }

    // 3. INTER-PROJECT MATERIAL TRANSFER (FR-M02-008)
    if (actionType === "TRANSFER") {
      if (!destProjectCode || destProjectCode === projectCode) {
        return NextResponse.json(
          { error: "Valid destination project is required for transfer." },
          { status: 400 }
        );
      }
      if (numQty > metrics.availableStock) {
        return NextResponse.json(
          {
            error: `FR-M02-008 Violation: Source project ${projectCode} lacks sufficient available stock (${metrics.availableStock} available vs ${numQty} requested).`,
          },
          { status: 400 }
        );
      }

      let destInv = store.inventory.find(
        (i) =>
          i.projectCode === destProjectCode && i.materialCode === materialCode
      );
      if (!destInv) {
        destInv = {
          id: `inv-${destProjectCode.toLowerCase()}-${materialCode.toLowerCase()}`,
          projectCode: destProjectCode,
          materialCode,
          currentStock: 0,
          reservedStock: 0,
          incomingStock: 0,
          minStock: 50,
          safetyStock: 25,
          avgDailyConsumption: 20,
          supplierLeadTimeDays: inv.supplierLeadTimeDays,
          unitCostRm: inv.unitCostRm,
          lastUpdated: formatNow(),
        };
        store.inventory.push(destInv);
      }

      const prevSource = inv.currentStock;
      const prevDest = destInv.currentStock;
      inv.currentStock = Number((inv.currentStock - numQty).toFixed(2));
      inv.lastUpdated = formatNow();
      destInv.currentStock = Number((destInv.currentStock + numQty).toFixed(2));
      destInv.lastUpdated = formatNow();

      const outCode = `TXN-2026-${String(store.transactions.length + 895).padStart(4, "0")}`;
      const inCode = `TXN-2026-${String(store.transactions.length + 896).padStart(4, "0")}`;

      store.transactions.unshift(
        {
          id: `txn-in-${Date.now()}`,
          transactionCode: inCode,
          projectCode: destProjectCode,
          materialCode,
          transactionType: "TRANSFER_IN",
          quantity: numQty,
          workActivity: `Inter-Project Transfer IN from ${projectCode}`,
          recordedBy: userName,
          recordedByRole: userRole,
          verificationStatus: "VERIFIED",
          remarks,
          transactionDate: formatNow(),
        },
        {
          id: `txn-out-${Date.now()}`,
          transactionCode: outCode,
          projectCode,
          materialCode,
          transactionType: "TRANSFER_OUT",
          quantity: numQty,
          workActivity: `Inter-Project Transfer OUT to ${destProjectCode}`,
          recordedBy: userName,
          recordedByRole: userRole,
          verificationStatus: "VERIFIED",
          remarks,
          transactionDate: formatNow(),
        }
      );

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M02 - Smart Live Inventory",
        action: "INTER_PROJECT_MATERIAL_TRANSFER",
        recordId: `${outCode}->${inCode}`,
        previousValue: `${projectCode}: ${prevSource} | ${destProjectCode}: ${prevDest}`,
        newValue: `${projectCode}: ${inv.currentStock} (-${numQty}) | ${destProjectCode}: ${destInv.currentStock} (+${numQty})`,
      });

      return NextResponse.json({
        status: "SUCCESS",
        outTransactionCode: outCode,
        inTransactionCode: inCode,
      });
    }

    return NextResponse.json(
      { error: "Unsupported inventory actionType." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Inventory transaction failed", details: String(err) },
      { status: 500 }
    );
  }
}
