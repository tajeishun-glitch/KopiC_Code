import { NextRequest, NextResponse } from "next/server";
import {
  getStore,
  addAuditEntry,
  formatNow,
  recalculateVendorPerformance,
} from "@/lib/store";
import { RoleType } from "@/lib/seed-data";

// Section 12.3: GET & POST /api/projects/{projectId}/risks
// Also supports logging Worker/Engineer Vendor Defects (M03) and Milestone Progress Updates (M05)
export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const store = getStore();
  const projectCode = params.projectId.toUpperCase();

  const risks = store.risks.filter((r) => r.projectCode === projectCode);
  return NextResponse.json({
    project_code: projectCode,
    total_active_risks: risks.filter(
      (r) => r.status !== "RESOLVED" && r.status !== "CLOSED"
    ).length,
    critical_count: risks.filter((r) => r.riskLevel === "CRITICAL").length,
    high_count: risks.filter((r) => r.riskLevel === "HIGH").length,
    medium_count: risks.filter((r) => r.riskLevel === "MEDIUM").length,
    low_count: risks.filter((r) => r.riskLevel === "LOW").length,
    risks,
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
      mutationType, // UPDATE_RISK | REPORT_DEFECT | UPDATE_MILESTONE
      userId = "usr-eng-01",
      userName = "Engr. Mei Ling Tan",
      userRole = "SITE_ENGINEER" as RoleType,
    } = body;

    if (mutationType === "UPDATE_RISK") {
      const { riskCode, status, riskOwner, resolutionNotes } = body;
      const risk = store.risks.find((r) => r.riskCode === riskCode);
      if (!risk) {
        return NextResponse.json(
          { error: `Risk ${riskCode} not found.` },
          { status: 404 }
        );
      }
      const prevStatus = risk.status;
      if (status) risk.status = status;
      if (riskOwner) risk.riskOwner = riskOwner;
      if (resolutionNotes) risk.resolutionNotes = resolutionNotes;

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M06 - AI Risk Copilot",
        action: "UPDATE_RISK_STATUS",
        recordId: risk.riskCode,
        previousValue: `Status: ${prevStatus}`,
        newValue: `Status: ${risk.status} (Owner: ${risk.riskOwner})`,
      });

      return NextResponse.json({ status: "SUCCESS", risk });
    }

    // M03: Worker/Engineer Reflects Vendor Defect for Future Vendor Evaluation
    if (mutationType === "REPORT_DEFECT") {
      const {
        materialCode = "STL-002",
        vendorCode = "V002",
        deliveryRef = "DO-SITE-NEW",
        category = "Damaged materials",
        severity = "HIGH",
        rejectedQty = 10,
        description = "",
        correctiveActionText = "Quarantine defective batch and notify vendor for replacement.",
      } = body;

      const defCode = `DEF-2026-${String(store.defects.length + 101).padStart(3, "0")}`;
      const newDefect = {
        id: `def-${Date.now()}`,
        defectCode: defCode,
        projectCode,
        materialCode,
        vendorCode,
        deliveryRef,
        category,
        severity,
        rejectedQty: Number(rejectedQty) || 0,
        description,
        reportedBy: userName,
        reportedByRole: userRole,
        reportedDate: formatNow().slice(0, 10),
        status: "OPEN" as const,
        correctiveActions: [
          {
            id: `ca-${Date.now()}`,
            actionDescription: correctiveActionText,
            responsibleParty: userName,
            targetDate: "2026-11-18",
            status: "OPEN" as const,
          },
        ],
      };

      store.defects.unshift(newDefect);

      // Automatically update Vendor Performance Scorecard for future evaluation!
      const vendor = store.vendors.find((v) => v.vendorCode === vendorCode);
      const prevScore = vendor?.performance.overallScore ?? 0;
      if (vendor) {
        vendor.performance.openDefectsCount += 1;
        vendor.performance.totalInspectedQty += Math.max(
          10,
          Number(rejectedQty) || 10
        );
        vendor.performance.rejectedQty += Number(rejectedQty) || 0;
        if (category === "Incomplete delivery") {
          vendor.performance.totalDeliveries += 1;
          vendor.performance.lateDeliveries += 1;
        }
        recalculateVendorPerformance(vendorCode);
      }

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M03 - Quality & Vendor Evaluation",
        action: "REFLECT_VENDOR_DEFECT",
        recordId: defCode,
        previousValue: `${vendorCode} Score: ${prevScore}%`,
        newValue: `Logged ${defCode} (${category}) -> ${vendorCode} Score updated to ${vendor?.performance.overallScore}% (${vendor?.performance.evaluationStatus})`,
      });

      return NextResponse.json({
        status: "SUCCESS",
        defect: newDefect,
        updatedVendor: vendor,
      });
    }

    // M05: Update Milestone & Subcontractor Progress
    if (mutationType === "UPDATE_MILESTONE") {
      const {
        milestoneCode,
        actualProgress,
        workCompleted = "",
        workOutstanding = "",
        remarks = "",
      } = body;

      const ms = store.milestones.find(
        (m) => m.milestoneCode === milestoneCode
      );
      if (!ms) {
        return NextResponse.json(
          { error: `Milestone ${milestoneCode} not found.` },
          { status: 404 }
        );
      }

      const prevProg = ms.actualProgress;
      ms.actualProgress = Math.min(100, Math.max(0, Number(actualProgress)));
      ms.status =
        ms.actualProgress >= 100
          ? "COMPLETED"
          : ms.actualProgress < ms.plannedProgress
            ? "DELAYED"
            : "ON_TRACK";

      store.progressUpdates.unshift({
        id: `prg-${Date.now()}`,
        projectCode,
        milestoneCode: ms.milestoneCode,
        milestoneName: ms.name,
        progressDate: formatNow().slice(0, 10),
        completionPct: ms.actualProgress,
        workCompleted,
        workOutstanding,
        remarks,
        updatedBy: userName,
      });

      // Recompute project overall actual completion average
      const projMilestones = store.milestones.filter(
        (m) => m.projectCode === projectCode
      );
      const proj = store.projects.find((p) => p.projectCode === projectCode);
      if (proj && projMilestones.length > 0) {
        proj.actualCompletion = Math.round(
          projMilestones.reduce((acc, m) => acc + m.actualProgress, 0) /
            projMilestones.length
        );
      }

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode,
        module: "M05 - Visual Progress Monitoring",
        action: "UPDATE_MILESTONE_PROGRESS",
        recordId: ms.milestoneCode,
        previousValue: `Actual Progress: ${prevProg}%`,
        newValue: `Actual Progress: ${ms.actualProgress}% (Planned: ${ms.plannedProgress}%)`,
      });

      return NextResponse.json({ status: "SUCCESS", milestone: ms });
    }

    return NextResponse.json(
      { error: "Unsupported mutationType." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Operation failed", details: String(err) },
      { status: 500 }
    );
  }
}
