import { NextRequest, NextResponse } from "next/server";
import { getStore, addAuditEntry, formatNow } from "@/lib/store";
import { RoleType } from "@/lib/seed-data";

// Section 12.3: GET & POST /api/equipment/{equipmentId}
export async function GET(
  _req: NextRequest,
  { params }: { params: { equipmentId: string } }
) {
  const store = getStore();
  const code = params.equipmentId.toUpperCase();

  const equipment = store.equipments.find(
    (e) =>
      e.equipmentCode.toUpperCase() === code ||
      e.id.toUpperCase() === code ||
      e.qrCodePayload.toUpperCase().endsWith(code)
  );

  if (!equipment) {
    return NextResponse.json(
      { error: `Equipment ${params.equipmentId} not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    equipment,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { equipmentId: string } }
) {
  try {
    const store = getStore();
    const code = params.equipmentId.toUpperCase();
    const eq = store.equipments.find(
      (e) => e.equipmentCode.toUpperCase() === code || e.id.toUpperCase() === code
    );

    if (!eq) {
      return NextResponse.json(
        { error: `Equipment ${code} not found.` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      actionType, // ALLOCATE | RETURN | TRANSFER | MAINTENANCE | DAMAGE
      assignedTo,
      expectedReturn,
      returnCondition = "GOOD",
      destProjectCode,
      destLocation,
      maintenanceType = "PREVENTIVE",
      scheduledDate,
      costRm = 1200,
      description = "",
      userId = "usr-sm-01",
      userName = "Ahmad Faiz Zulkifli",
      userRole = "SITE_MANAGER" as RoleType,
    } = body;

    // 1. ALLOCATE EQUIPMENT (FR-M04-004 & BR-012 / TC-022 Conflict Check)
    if (actionType === "ALLOCATE") {
      if (eq.status !== "AVAILABLE" && eq.status !== "RESERVED") {
        return NextResponse.json(
          {
            error: `BR-012 & TC-022 Conflict Prevented: ${eq.equipmentCode} (${eq.name}) is currently ${eq.status} (${eq.assignedTo || eq.currentLocation}) and cannot have conflicting active allocations.`,
          },
          { status: 409 }
        );
      }

      const prevStatus = eq.status;
      eq.status = "IN_USE";
      eq.assignedTo = assignedTo || "Site Crew Team";
      eq.allocationDate = formatNow().slice(0, 10);
      eq.expectedReturn = expectedReturn || "2026-11-25";

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode: eq.currentProjectCode,
        module: "M04 - On-Site Tools & Equipment",
        action: "ALLOCATE_EQUIPMENT",
        recordId: eq.equipmentCode,
        previousValue: `Status: ${prevStatus}`,
        newValue: `Status: IN_USE (Assigned to ${eq.assignedTo} until ${eq.expectedReturn})`,
      });

      return NextResponse.json({ status: "SUCCESS", equipment: eq });
    }

    // 2. RETURN EQUIPMENT (FR-M04-005)
    if (actionType === "RETURN") {
      const prevStatus = eq.status;
      eq.condition = returnCondition;
      eq.status = returnCondition === "DAMAGED" ? "DAMAGED" : "AVAILABLE";
      eq.assignedTo = undefined;
      eq.expectedReturn = undefined;

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode: eq.currentProjectCode,
        module: "M04 - On-Site Tools & Equipment",
        action: "RETURN_EQUIPMENT",
        recordId: eq.equipmentCode,
        previousValue: `Status: ${prevStatus}`,
        newValue: `Status: ${eq.status} (Condition: ${eq.condition})`,
      });

      return NextResponse.json({ status: "SUCCESS", equipment: eq });
    }

    // 3. INTER-PROJECT EQUIPMENT TRANSFER (FR-M04-006 & BR-013)
    if (actionType === "TRANSFER") {
      if (eq.status === "IN_USE") {
        return NextResponse.json(
          {
            error: `BR-012 Violation: Cannot transfer ${eq.equipmentCode} while actively IN_USE by ${eq.assignedTo}. Return equipment first.`,
          },
          { status: 409 }
        );
      }

      const prevProject = eq.currentProjectCode;
      eq.currentProjectCode = destProjectCode || "PRJ-ALPHA";
      eq.currentLocation = destLocation || `${eq.currentProjectCode} Main Plant Yard`;
      eq.movementHistory.unshift({
        id: `mov-${Date.now()}`,
        sourceProjectCode: prevProject,
        destProjectCode: eq.currentProjectCode,
        transferDate: formatNow().slice(0, 10),
        approvedBy: userName,
        movementStatus: "COMPLETED",
        remarks: description || "Inter-project equipment reallocation.",
      });

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode: eq.currentProjectCode,
        module: "M04 - On-Site Tools & Equipment",
        action: "TRANSFER_EQUIPMENT",
        recordId: eq.equipmentCode,
        previousValue: `Project: ${prevProject}`,
        newValue: `Project: ${eq.currentProjectCode} (${eq.currentLocation})`,
      });

      return NextResponse.json({ status: "SUCCESS", equipment: eq });
    }

    // 4. RECORD MAINTENANCE (FR-M04-008 & BR-014)
    if (actionType === "MAINTENANCE") {
      eq.maintenanceHistory.unshift({
        id: `mnt-${Date.now()}`,
        maintenanceType,
        scheduledDate: scheduledDate || formatNow().slice(0, 10),
        costRm: Number(costRm) || 0,
        description: description || "Scheduled equipment maintenance.",
        status: "SCHEDULED",
      });

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode: eq.currentProjectCode,
        module: "M04 - On-Site Tools & Equipment",
        action: "RECORD_EQUIPMENT_MAINTENANCE",
        recordId: eq.equipmentCode,
        previousValue: `Maintenance Count: ${eq.maintenanceHistory.length - 1}`,
        newValue: `Added ${maintenanceType} Maintenance (${description})`,
      });

      return NextResponse.json({ status: "SUCCESS", equipment: eq });
    }

    // 5. REPORT DAMAGED / MISSING EQUIPMENT (FR-M04-009)
    if (actionType === "DAMAGE") {
      const prevStatus = eq.status;
      eq.status = "DAMAGED";
      eq.condition = "DAMAGED";
      eq.incidents.unshift({
        id: `inc-${Date.now()}`,
        projectCode: eq.currentProjectCode,
        incidentType: "DAMAGED",
        description: description || "Field damage reported by site crew.",
        reportedBy: userName,
        reportedDate: formatNow().slice(0, 10),
        status: "OPEN",
      });

      addAuditEntry({
        userId,
        userName,
        userRole,
        projectCode: eq.currentProjectCode,
        module: "M04 - On-Site Tools & Equipment",
        action: "REPORT_EQUIPMENT_DAMAGE",
        recordId: eq.equipmentCode,
        previousValue: `Status: ${prevStatus}`,
        newValue: `Status: DAMAGED (${description})`,
      });

      return NextResponse.json({ status: "SUCCESS", equipment: eq });
    }

    return NextResponse.json(
      { error: "Unsupported equipment action." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Equipment update failed", details: String(err) },
      { status: 500 }
    );
  }
}
