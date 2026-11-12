import { PrismaClient } from "@prisma/client";
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
} from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BuildSmart AI – Gamuda Site Intelligence Database...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.projectPhoto.deleteMany();
  await prisma.projectProgress.deleteMany();
  await prisma.projectMilestone.deleteMany();
  await prisma.equipmentIncident.deleteMany();
  await prisma.equipmentMaintenance.deleteMany();
  await prisma.equipmentMovement.deleteMany();
  await prisma.equipmentAllocation.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.defectRecord.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.materialTransaction.deleteMany();
  await prisma.projectInventory.deleteMany();
  await prisma.vendorPerformance.deleteMany();
  await prisma.vendorProduct.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.material.deleteMany();
  await prisma.projectUser.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 1. Projects
  const projectMap = new Map<string, string>();
  for (const p of INITIAL_PROJECTS) {
    const created = await prisma.project.create({
      data: {
        id: p.id,
        projectCode: p.projectCode,
        name: p.name,
        location: p.location,
        projectManagerName: p.projectManagerName,
        startDate: p.startDate,
        plannedEndDate: p.plannedEndDate,
        actualEndDate: p.actualEndDate,
        budgetRm: p.budgetRm,
        spentRm: p.spentRm,
        equipmentRentalRm: p.equipmentRentalRm,
        status: p.status,
        plannedCompletion: p.plannedCompletion,
        actualCompletion: p.actualCompletion,
      },
    });
    projectMap.set(p.projectCode, created.id);
  }

  // 2. Users & ProjectUser RBAC Assignments
  for (const u of INITIAL_USERS) {
    const createdUser = await prisma.user.create({
      data: {
        id: u.id,
        userCode: u.userCode,
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.title,
      },
    });
    for (const pCode of u.assignedProjectCodes) {
      const pId = projectMap.get(pCode);
      if (pId) {
        await prisma.projectUser.create({
          data: {
            projectId: pId,
            userId: createdUser.id,
          },
        });
      }
    }
  }

  // 3. Materials
  const materialMap = new Map<string, string>();
  for (const m of INITIAL_MATERIALS) {
    const created = await prisma.material.create({
      data: {
        id: m.id,
        materialCode: m.materialCode,
        name: m.name,
        category: m.category,
        brand: m.brand,
        specifications: m.specifications,
        unit: m.unit,
        description: m.description,
        imageUrl: m.imageUrl,
        alternativeCodes: m.alternativeCodes.join(","),
      },
    });
    materialMap.set(m.materialCode, created.id);
  }

  // 4. Vendors, VendorPerformance & VendorProducts
  const vendorMap = new Map<string, string>();
  for (const v of INITIAL_VENDORS) {
    const createdVendor = await prisma.vendor.create({
      data: {
        id: v.id,
        vendorCode: v.vendorCode,
        name: v.name,
        tradeSpecialty: v.tradeSpecialty,
        address: v.address,
        contactPerson: v.contactPerson,
        contactPhone: v.contactPhone,
        contactEmail: v.contactEmail,
        distanceKm: v.distanceKm,
        cidbGrade: v.cidbGrade,
        dataSource: v.dataSource,
      },
    });
    vendorMap.set(v.vendorCode, createdVendor.id);

    await prisma.vendorPerformance.create({
      data: {
        vendorId: createdVendor.id,
        ...v.performance,
      },
    });

    for (const prod of v.products) {
      const matId = materialMap.get(prod.materialCode);
      if (matId) {
        await prisma.vendorProduct.create({
          data: {
            vendorId: createdVendor.id,
            materialId: matId,
            unitPriceRm: prod.unitPriceRm,
            availableExternalQty: prod.availableExternalQty,
            minOrderQty: prod.minOrderQty,
            leadTimeDays: prod.leadTimeDays,
            isExactSpecMatch: prod.isExactSpecMatch,
            dataSource: "SIMULATED",
            lastUpdated: prod.lastUpdated,
          },
        });
      }
    }
  }

  // 5. Inventory & Transactions
  for (const inv of INITIAL_INVENTORY) {
    const pId = projectMap.get(inv.projectCode);
    const mId = materialMap.get(inv.materialCode);
    if (pId && mId) {
      await prisma.projectInventory.create({
        data: {
          id: inv.id,
          projectId: pId,
          materialId: mId,
          currentStock: inv.currentStock,
          reservedStock: inv.reservedStock,
          incomingStock: inv.incomingStock,
          minStock: inv.minStock,
          safetyStock: inv.safetyStock,
          avgDailyConsumption: inv.avgDailyConsumption,
          supplierLeadTimeDays: inv.supplierLeadTimeDays,
          unitCostRm: inv.unitCostRm,
          lastUpdated: inv.lastUpdated,
        },
      });
    }
  }

  for (const txn of INITIAL_TRANSACTIONS) {
    const pId = projectMap.get(txn.projectCode);
    const mId = materialMap.get(txn.materialCode);
    if (pId && mId) {
      await prisma.materialTransaction.create({
        data: {
          id: txn.id,
          transactionCode: txn.transactionCode,
          projectId: pId,
          materialId: mId,
          transactionType: txn.transactionType,
          quantity: txn.quantity,
          workActivity: txn.workActivity,
          deliveryRef: txn.deliveryRef,
          vendorName: txn.vendorName,
          recordedBy: txn.recordedBy,
          recordedByRole: txn.recordedByRole,
          verificationStatus: txn.verificationStatus,
          remarks: txn.remarks,
          transactionDate: txn.transactionDate,
        },
      });
    }
  }

  // 6. Inspections & Defects
  for (const insp of INITIAL_INSPECTIONS) {
    const pId = projectMap.get(insp.projectCode);
    const mId = materialMap.get(insp.materialCode);
    const vId = vendorMap.get(insp.vendorCode);
    if (pId && mId && vId) {
      await prisma.qualityInspection.create({
        data: {
          id: insp.id,
          inspectionCode: insp.inspectionCode,
          projectId: pId,
          materialId: mId,
          vendorId: vId,
          deliveryRef: insp.deliveryRef,
          inspectionDate: insp.inspectionDate,
          result: insp.result,
          acceptedQty: insp.acceptedQty,
          rejectedQty: insp.rejectedQty,
          inspectedBy: insp.inspectedBy,
          comments: insp.comments,
          photoUrl: insp.photoUrl,
        },
      });
    }
  }

  for (const def of INITIAL_DEFECTS) {
    const pId = projectMap.get(def.projectCode);
    const mId = materialMap.get(def.materialCode);
    const vId = vendorMap.get(def.vendorCode);
    if (pId && vId) {
      const createdDef = await prisma.defectRecord.create({
        data: {
          id: def.id,
          defectCode: def.defectCode,
          projectId: pId,
          materialId: mId,
          vendorId: vId,
          deliveryRef: def.deliveryRef,
          category: def.category,
          severity: def.severity,
          rejectedQty: def.rejectedQty,
          description: def.description,
          reportedBy: def.reportedBy,
          reportedByRole: def.reportedByRole,
          reportedDate: def.reportedDate,
          photoUrl: def.photoUrl,
          status: def.status,
        },
      });
      for (const ca of def.correctiveActions) {
        await prisma.correctiveAction.create({
          data: {
            id: ca.id,
            defectId: createdDef.id,
            actionDescription: ca.actionDescription,
            responsibleParty: ca.responsibleParty,
            targetDate: ca.targetDate,
            completedDate: ca.completedDate,
            status: ca.status,
            resolutionNotes: ca.resolutionNotes,
          },
        });
      }
    }
  }

  // 7. Equipment
  for (const eq of INITIAL_EQUIPMENT) {
    const pId = projectMap.get(eq.currentProjectCode);
    if (pId) {
      const createdEq = await prisma.equipment.create({
        data: {
          id: eq.id,
          equipmentCode: eq.equipmentCode,
          name: eq.name,
          category: eq.category,
          brand: eq.brand,
          model: eq.model,
          serialNumber: eq.serialNumber,
          currentProjectId: pId,
          currentLocation: eq.currentLocation,
          condition: eq.condition,
          status: eq.status,
          assignedTo: eq.assignedTo,
          expectedReturn: eq.expectedReturn,
          qrCodePayload: eq.qrCodePayload,
          dailyRentalCostRm: eq.dailyRentalCostRm,
        },
      });

      for (const mnt of eq.maintenanceHistory) {
        await prisma.equipmentMaintenance.create({
          data: {
            id: mnt.id,
            equipmentId: createdEq.id,
            maintenanceType: mnt.maintenanceType,
            scheduledDate: mnt.scheduledDate,
            inspectionDate: mnt.inspectionDate,
            completedDate: mnt.completedDate,
            costRm: mnt.costRm,
            description: mnt.description,
            status: mnt.status,
          },
        });
      }

      for (const mov of eq.movementHistory) {
        await prisma.equipmentMovement.create({
          data: {
            id: mov.id,
            equipmentId: createdEq.id,
            sourceProjectCode: mov.sourceProjectCode,
            destProjectCode: mov.destProjectCode,
            transferDate: mov.transferDate,
            approvedBy: mov.approvedBy,
            movementStatus: mov.movementStatus,
            remarks: mov.remarks,
          },
        });
      }

      for (const inc of eq.incidents) {
        await prisma.equipmentIncident.create({
          data: {
            id: inc.id,
            equipmentId: createdEq.id,
            projectCode: inc.projectCode,
            incidentType: inc.incidentType,
            description: inc.description,
            reportedBy: inc.reportedBy,
            reportedDate: inc.reportedDate,
            status: inc.status,
          },
        });
      }
    }
  }

  // 8. Milestones, Progress Updates & Photos
  for (const ms of INITIAL_MILESTONES) {
    const pId = projectMap.get(ms.projectCode);
    const vId = vendorMap.get(ms.subcontractorCode);
    if (pId) {
      await prisma.projectMilestone.create({
        data: {
          id: ms.id,
          milestoneCode: ms.milestoneCode,
          projectId: pId,
          name: ms.name,
          subcontractorId: vId,
          responsibleTeam: ms.responsibleTeam,
          plannedStartDate: ms.plannedStartDate,
          plannedEndDate: ms.plannedEndDate,
          actualStartDate: ms.actualStartDate,
          actualEndDate: ms.actualEndDate,
          plannedProgress: ms.plannedProgress,
          actualProgress: ms.actualProgress,
          budgetAllocatedRm: ms.budgetAllocatedRm,
          actualSpentRm: ms.actualSpentRm,
          status: ms.status,
        },
      });
    }
  }

  for (const prg of INITIAL_PROGRESS_UPDATES) {
    const pId = projectMap.get(prg.projectCode);
    if (pId) {
      await prisma.projectProgress.create({
        data: {
          id: prg.id,
          projectId: pId,
          milestoneCode: prg.milestoneCode,
          milestoneName: prg.milestoneName,
          progressDate: prg.progressDate,
          completionPct: prg.completionPct,
          workCompleted: prg.workCompleted,
          workOutstanding: prg.workOutstanding,
          remarks: prg.remarks,
          updatedBy: prg.updatedBy,
          photoUrl: prg.photoUrl,
        },
      });
    }
  }

  for (const pht of INITIAL_PHOTOS) {
    const pId = projectMap.get(pht.projectCode);
    if (pId) {
      await prisma.projectPhoto.create({
        data: {
          id: pht.id,
          projectId: pId,
          milestoneCode: pht.milestoneCode,
          milestoneName: pht.milestoneName,
          photoUrl: pht.photoUrl,
          description: pht.description,
          uploadedBy: pht.uploadedBy,
          uploadDate: pht.uploadDate,
        },
      });
    }
  }

  // 9. Risks, Notifications & Audit Logs
  for (const rsk of INITIAL_RISKS) {
    const pId = projectMap.get(rsk.projectCode);
    if (pId) {
      await prisma.risk.create({
        data: {
          id: rsk.id,
          riskCode: rsk.riskCode,
          projectId: pId,
          category: rsk.category,
          title: rsk.title,
          description: rsk.description,
          sourceData: rsk.sourceData,
          likelihood: rsk.likelihood,
          impact: rsk.impact,
          riskScore: rsk.riskScore,
          riskLevel: rsk.riskLevel,
          recommendedAction: rsk.recommendedAction,
          riskOwner: rsk.riskOwner,
          status: rsk.status,
          identifiedDate: rsk.identifiedDate,
        },
      });
    }
  }

  for (const not of INITIAL_NOTIFICATIONS) {
    const pId = projectMap.get(not.projectCode);
    if (pId) {
      await prisma.notification.create({
        data: {
          id: not.id,
          alertCode: not.alertCode,
          projectId: pId,
          title: not.title,
          description: not.description,
          relatedRef: not.relatedRef,
          priority: not.priority,
          targetRoles: not.targetRoles.join(","),
          targetModule: not.targetModule,
          isRead: not.isRead,
          createdAt: not.createdAt,
        },
      });
    }
  }

  for (const aud of INITIAL_AUDIT_LOGS) {
    const pId = projectMap.get(aud.projectCode);
    if (pId) {
      await prisma.auditLog.create({
        data: {
          id: aud.id,
          auditCode: aud.auditCode,
          userId: aud.userId,
          userName: aud.userName,
          userRole: aud.userRole,
          projectId: pId,
          module: aud.module,
          action: aud.action,
          recordId: aud.recordId,
          previousValue: aud.previousValue,
          newValue: aud.newValue,
          timestamp: aud.timestamp,
        },
      });
    }
  }

  console.log("BuildSmart AI seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
