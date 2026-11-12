# BuildSmart AI — Role-Based Access Control (RBAC) Specification

Please update the Role-Based Access Control (RBAC) in BuildSmart AI (`seed-data.ts`, `business-engine.ts`, `page.tsx`, and module components) to replace the existing 4 roles with the following **5 roles** and enforce their exact module and action permissions (including the **Drone Site Progress View** feature).

---

## 1. Roles Overview

| # | Role Enum (`RoleType`) | Display Name | Access Level | Domain Scope |
| :- | :--- | :--- | :--- | :--- |
| 1 | `PROJECT_MANAGER` | **Project Manager** | Full Access | All Modules: Command, Material/Procurement, Construction/Site & Drone Site Progress View |
| 2 | `SITE_MANAGER` | **Site Manager** | Limited Access | Construction, Site Execution & Drone Site Progress View Only (Manager / Approver level) |
| 3 | `SITE_ENGINEER` | **Site Engineer** | Limited Access | Construction, Site Execution & Drone Site Progress View Only (Operational / Field level) |
| 4 | `PROCUREMENT_MANAGER` | **Procurement Manager** | Limited Access | Material, Vendor & Inventory Only (Manager / Approver level) |
| 5 | `PROCUREMENT_STAFF` | **Procurement Staff** | Limited Access | Material, Vendor & Inventory Only (Operational level) |

---

## 2. Navigation & Module Access by Role

### A. Project Manager (`FULL ACCESS`)
- **Command Dashboard**: Full KPIs, S-Curve, Spend Donut, Top 5 AI Risks
- **Alerts & Audit Trail**: All project alerts + full immutable audit log
- **M02: AI Material Scanner**
- **M03: Vendor Finder**
- **M04: Live Stock Inventory**
- **M05: Defect Log & Vendor Score**
- **M05: Project & Subcon Progress** *(Includes Drone Site Progress View)*
- **M06: AI Risk & Copilot**

### B. Site Manager & Site Engineer (`CONSTRUCTION ACCESS ONLY`)
- **Command Dashboard**: Construction view (Physical Progress, Drone Feeds, Defects, Site Risks)
- **Alerts & Audit Trail**: Filtered to Construction, Progress, Drone, Defect & Site Risk alerts
- **M02: AI Material Scanner**: Allowed for on-site material verification & logging site usage
- **M04: Live Stock Inventory**: Site usage / consumption view only (no commercial procurement actions)
- **M05: Defect Log & Vendor Score**: Site quality inspections & NCR defect reporting
- **M05: Project & Subcon Progress**: Milestone progress, site photo uploads & **Drone Site Progress View**
- **M06: AI Risk & Copilot**: Construction/schedule/equipment risk monitoring & simulation
- **Hidden / Restricted from Site Roles**:
  - `M03: Vendor Finder` (commercial pricing/sourcing)
  - Goods Receipt confirmation & Inter-project Material Surplus Transfer in `M04`

### C. Procurement Manager & Procurement Staff (`MATERIAL ACCESS ONLY`)
- **Command Dashboard**: Material/Procurement view (Live Stock Status, Spend Donut, Vendor NCRs, Supply Chain Risks)
- **Alerts & Audit Trail**: Filtered to Inventory, Reorder, Delivery, Vendor & Price alerts
- **M02: AI Material Scanner**: Material catalog & specification matching
- **M03: Vendor Finder**: Vendor comparison, pricing, lead time & CIDB grade
- **M04: Live Stock Inventory**: Stock levels, Reorder Points, Goods Receipt & Inter-Project Transfers
- **M05: Defect Log & Vendor Score**: Supplier quality acceptance rate, delivery reliability & vendor evaluation status
- **M06: AI Risk & Copilot**: Delivery delay, consumption surge & price increase simulations
- **Hidden / Restricted from Procurement Roles**:
  - `M05: Project & Subcon Progress` and **Drone Site Progress View**
  - Site Consumption logging in `M04`

---

## 3. Detailed Action Permissions Matrix

### 1) `PROJECT_MANAGER` (Full Access)
- `dashboardAccess`: `"FULL"`
- All Projects / All Regions access
- `canViewDroneSiteProgress`: `true` (Full access to Drone aerial feeds, telemetry, orthomosaics & AI progress comparison)
- `canControlDroneFlightOrCaptures`: `true` (Can trigger/upload new drone captures and verify aerial progress)
- Can scan materials, compare vendors, and view vendor performance
- Can record & verify material consumption, confirm goods receipts, and approve inter-project material transfers
- Can report NCR defects, perform quality inspections, and resolve/close defect statuses
- Can update construction milestone progress and upload site/drone photos
- Can manage equipment allocations, approve equipment transfers, and schedule maintenance
- Can assign risk owners, update/close AI risks, and run What-If simulations

### 2) `SITE_MANAGER` (Construction Access — Manager Level)
- `dashboardAccess`: `"LIMITED_CONSTRUCTION"`
- **Construction Modules**:
  - `canViewDroneSiteProgress`: `true` (Can access Drone Site Progress View, aerial zone inspections & progress overlays)
  - `canControlDroneFlightOrCaptures`: `true` (Can upload/approve drone flight captures and link to milestones)
  - `canUpdateProgress`: `true` (Can update subcontractor milestone % and upload site/drone photos)
  - `canVerifyConsumption`: `true` (Can verify/approve site material consumption)
  - `canSubmitConsumption`: `true` (Can record site material usage)
  - `canPerformQualityInspection`: `true` (Can inspect materials/workmanship on site)
  - `canReportDefect`: `true` (Can log site NCR defects)
  - `canUpdateDefectStatus`: `true` (Can update/close site defect corrective actions)
  - `canManageEquipmentAllocation`: `true`, `canApproveEquipmentTransfer`: `true`, `canManageMaintenance`: `true`
  - `canAssignRiskActions`: `true`, `canExecuteRiskActions`: `true` (For construction/schedule risks)
- **Material / Procurement Restrictions**:
  - `canCompareVendors`: `false` (No access to commercial Vendor Finder)
  - `canConfirmGoodsReceipt`: `false` (Handled by Procurement)
  - `canTransferMaterialSurplus`: `false` (Handled by Procurement)

### 3) `SITE_ENGINEER` (Construction Access — Operational Level)
- `dashboardAccess`: `"LIMITED_CONSTRUCTION"`
- **Construction Modules**:
  - `canViewDroneSiteProgress`: `true` (Can view Drone Site Progress feeds, zone aerial captures & progress comparisons)
  - `canControlDroneFlightOrCaptures`: `true` (Can upload field drone captures and log site progress observations)
  - `canUpdateProgress`: `true` (Can submit milestone progress updates & site/drone photos)
  - `canSubmitConsumption`: `true` (Can submit material consumption on site — pending verification)
  - `canVerifyConsumption`: `false` (Requires Site Manager or PM verification)
  - `canPerformQualityInspection`: `true` (Can perform site quality checks)
  - `canReportDefect`: `true` (Can report site NCR defects)
  - `canUpdateDefectStatus`: `false` (Cannot close NCRs; requires Site Manager/PM)
  - `canRequestEquipment`: `true` (Cannot approve cross-project transfers or manage maintenance)
  - `canExecuteRiskActions`: `true`, `canAssignRiskActions`: `false`
- **Material / Procurement Restrictions**:
  - `canCompareVendors`: `false`
  - `canConfirmGoodsReceipt`: `false`
  - `canTransferMaterialSurplus`: `false`

### 4) `PROCUREMENT_MANAGER` (Material Access — Manager Level)
- `dashboardAccess`: `"LIMITED_MATERIAL"`
- **Material / Procurement Modules**:
  - `canScanMaterial`: `true`
  - `canCompareVendors`: `true` (Full access to Vendor Finder, unit pricing, lead times)
  - `canViewVendorPerformance`: `true` (Full access to Vendor Scorecards: `PREFERRED` / `WATCHLIST` / `DO_NOT_REHIRE`)
  - `canManageInventory`: `true` (Can manage stock thresholds and approve inter-project material transfers)
  - `canTransferMaterialSurplus`: `true`
  - `canConfirmGoodsReceipt`: `true` (Can confirm deliveries and accepted/rejected quantities)
  - `canReportDefect`: `true`, `canUpdateDefectStatus`: `true` (For material delivery/supplier quality defects)
  - `canAssignRiskActions`: `true`, `canExecuteRiskActions`: `true` (For material shortage, delivery delay & price risks)
- **Construction & Drone Restrictions**:
  - `canViewDroneSiteProgress`: `false` (No access to Drone Site Progress View)
  - `canControlDroneFlightOrCaptures`: `false`
  - `canUpdateProgress`: `false` (No access to M05 Project & Subcon milestone progress)
  - `canSubmitConsumption`: `false`, `canVerifyConsumption`: `false` (Site consumption is logged by Site team)
  - `canManageEquipmentAllocation`: `false`, `canApproveEquipmentTransfer`: `false`

### 5) `PROCUREMENT_STAFF` (Material Access — Operational Level)
- `dashboardAccess`: `"LIMITED_MATERIAL"`
- **Material / Procurement Modules**:
  - `canScanMaterial`: `true`
  - `canCompareVendors`: `true` (Can search vendors, compare quotes & check stock availability)
  - `canViewVendorPerformance`: `true` (Can view vendor scores and defect history)
  - `canConfirmGoodsReceipt`: `true` (Can log incoming goods receipts and delivery references)
  - `canManageInventory`: `false` (Cannot approve cross-project material transfers — requires Procurement Manager or PM)
  - `canTransferMaterialSurplus`: `false`
  - `canReportDefect`: `true` (Can report damaged/incomplete material deliveries upon receipt)
  - `canUpdateDefectStatus`: `false` (Cannot close vendor NCRs — requires Procurement Manager or PM)
  - `canExecuteRiskActions`: `true`, `canAssignRiskActions`: `false`
- **Construction & Drone Restrictions**:
  - `canViewDroneSiteProgress`: `false` (No access to Drone Site Progress View)
  - `canControlDroneFlightOrCaptures`: `false`
  - `canUpdateProgress`: `false`
  - `canSubmitConsumption`: `false`, `canVerifyConsumption`: `false`
  - `canManageEquipmentAllocation`: `false`, `canApproveEquipmentTransfer`: `false`
