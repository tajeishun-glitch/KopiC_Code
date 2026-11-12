// BuildSmart AI - Comprehensive Construction Site Seed Dataset (Gamuda Berhad Demo Data)
// Strictly adheres to Section 11 (Data Entities) and Section 14 (Business Rules BR-001 to BR-020).
// Note: All external vendor pricing, stock, and performance figures are marked SIMULATED per BR-018.

export type RoleType =
  | "PROJECT_MANAGER"
  | "SITE_SUPERVISOR"
  | "SITE_ENGINEER"
  | "SITE_WORKER";

export interface SeedUser {
  id: string;
  userCode: string;
  name: string;
  email: string;
  role: RoleType;
  title: string;
  assignedProjectCodes: string[];
}

export interface SeedProject {
  id: string;
  projectCode: string;
  name: string;
  region: "Malaysia" | "Australia" | "Singapore" | "United Kingdom" | "Taiwan";
  location: string;
  projectManagerName: string;
  startDate: string;
  plannedEndDate: string;
  actualEndDate: string | null;
  budgetRm: number;
  spentRm: number;
  equipmentRentalRm: number;
  status: "ON_TRACK" | "AT_RISK" | "DELAYED" | "COMPLETED";
  plannedCompletion: number;
  actualCompletion: number;
}

export interface SeedMaterial {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  brand: string;
  specifications: string;
  unit: string;
  description: string;
  imageUrl: string;
  alternativeCodes: string[];
  aiCharacteristics: string[];
}

export interface SeedVendor {
  id: string;
  vendorCode: string;
  name: string;
  tradeSpecialty: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  distanceKm: number;
  cidbGrade: string;
  dataSource: "SIMULATED";
  performance: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    totalInspectedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    openDefectsCount: number;
    resolvedDefectsCount: number;
    onTimeDeliveryRate: number;
    qualityAcceptanceRate: number;
    issueResolutionRate: number;
    overallScore: number;
    evaluationStatus: "PREFERRED" | "WATCHLIST" | "DO_NOT_REHIRE";
    aiRiskSummary: string;
    lastEvaluatedAt: string;
  };
  products: {
    materialCode: string;
    unitPriceRm: number;
    availableExternalQty: number;
    minOrderQty: number;
    leadTimeDays: number;
    isExactSpecMatch: boolean;
    lastUpdated: string;
  }[];
}

export interface SeedInventoryItem {
  id: string;
  projectCode: string;
  materialCode: string;
  currentStock: number;
  reservedStock: number;
  incomingStock: number;
  minStock: number;
  safetyStock: number;
  avgDailyConsumption: number;
  supplierLeadTimeDays: number;
  unitCostRm: number;
  lastUpdated: string;
}

export interface SeedTransaction {
  id: string;
  transactionCode: string;
  projectCode: string;
  materialCode: string;
  transactionType:
    | "RECEIPT"
    | "CONSUMPTION"
    | "RESERVATION"
    | "ADJUSTMENT"
    | "TRANSFER_IN"
    | "TRANSFER_OUT";
  quantity: number;
  workActivity?: string;
  deliveryRef?: string;
  vendorName?: string;
  recordedBy: string;
  recordedByRole: RoleType;
  verificationStatus: "VERIFIED" | "PENDING_VERIFICATION" | "REJECTED";
  remarks?: string;
  transactionDate: string;
}

export interface SeedQualityInspection {
  id: string;
  inspectionCode: string;
  projectCode: string;
  materialCode: string;
  vendorCode: string;
  deliveryRef: string;
  inspectionDate: string;
  result: "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED" | "PENDING_INSPECTION";
  acceptedQty: number;
  rejectedQty: number;
  inspectedBy: string;
  comments: string;
  photoUrl?: string;
}

export interface SeedDefectRecord {
  id: string;
  defectCode: string;
  projectCode: string;
  materialCode: string;
  vendorCode: string;
  deliveryRef: string;
  category:
    | "Damaged materials"
    | "Incorrect specifications"
    | "Wrong product delivered"
    | "Incomplete delivery"
    | "Poor product quality"
    | "Packaging damage"
    | "Subcontractor workmanship";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  rejectedQty: number;
  description: string;
  reportedBy: string;
  reportedByRole: RoleType;
  reportedDate: string;
  photoUrl?: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  correctiveActions: {
    id: string;
    actionDescription: string;
    responsibleParty: string;
    targetDate: string;
    completedDate?: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    resolutionNotes?: string;
  }[];
}

export interface SeedEquipment {
  id: string;
  equipmentCode: string;
  name: string;
  category:
    | "Heavy machinery"
    | "Power tools"
    | "Electrical equipment"
    | "Lifting equipment"
    | "Concrete equipment"
    | "Safety equipment"
    | "Other construction tools";
  brand: string;
  model: string;
  serialNumber: string;
  currentProjectCode: string;
  currentLocation: string;
  condition: "GOOD" | "FAIR" | "NEEDS_INSPECTION" | "DAMAGED";
  status:
    | "AVAILABLE"
    | "IN_USE"
    | "RESERVED"
    | "MAINTENANCE"
    | "DAMAGED"
    | "MISSING";
  assignedTo?: string;
  allocationDate?: string;
  expectedReturn?: string;
  qrCodePayload: string;
  dailyRentalCostRm: number;
  maintenanceHistory: {
    id: string;
    maintenanceType: "PREVENTIVE" | "CORRECTIVE" | "SAFETY_CALIBRATION";
    scheduledDate: string;
    inspectionDate?: string;
    completedDate?: string;
    costRm: number;
    description: string;
    status: "SCHEDULED" | "OVERDUE" | "IN_PROGRESS" | "COMPLETED";
  }[];
  movementHistory: {
    id: string;
    sourceProjectCode: string;
    destProjectCode: string;
    transferDate: string;
    approvedBy: string;
    movementStatus: "COMPLETED" | "IN_TRANSIT";
    remarks?: string;
  }[];
  incidents: {
    id: string;
    projectCode: string;
    incidentType: "DAMAGED" | "MISSING" | "BREAKDOWN";
    description: string;
    reportedBy: string;
    reportedDate: string;
    status: "OPEN" | "UNDER_REPAIR" | "RESOLVED";
  }[];
}

export interface SeedMilestone {
  id: string;
  milestoneCode: string;
  projectCode: string;
  name: string;
  subcontractorCode: string;
  subcontractorName: string;
  responsibleTeam: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedProgress: number;
  actualProgress: number;
  budgetAllocatedRm: number;
  actualSpentRm: number;
  status: "COMPLETED" | "ON_TRACK" | "DELAYED" | "NOT_STARTED";
}

export interface SeedProgressUpdate {
  id: string;
  projectCode: string;
  milestoneCode: string;
  milestoneName: string;
  progressDate: string;
  completionPct: number;
  workCompleted: string;
  workOutstanding: string;
  remarks: string;
  updatedBy: string;
  photoUrl?: string;
}

export interface SeedPhoto {
  id: string;
  projectCode: string;
  milestoneCode: string;
  milestoneName: string;
  photoUrl: string;
  description: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface SeedRisk {
  id: string;
  riskCode: string;
  projectCode: string;
  category: "MATERIAL" | "VENDOR" | "EQUIPMENT" | "PROJECT";
  title: string;
  description: string;
  sourceData: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction: string;
  riskOwner: string;
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  identifiedDate: string;
  resolutionNotes?: string;
}

export interface SeedNotification {
  id: string;
  alertCode: string;
  projectCode: string;
  title: string;
  description: string;
  relatedRef: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  targetRoles: RoleType[];
  targetModule: "M01" | "M02" | "M03" | "M04" | "M05" | "M06";
  isRead: boolean;
  createdAt: string;
}

export interface SeedAuditLog {
  id: string;
  auditCode: string;
  userId: string;
  userName: string;
  userRole: RoleType;
  projectCode: string;
  module: string;
  action: string;
  recordId: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
}

export const INITIAL_USERS: SeedUser[] = [
  {
    id: "usr-pm-01",
    userCode: "USR-001",
    name: "Ir. Razak Ahmad",
    email: "razak.ahmad@gamuda.com.my",
    role: "PROJECT_MANAGER",
    title: "Senior Project Manager (Global Infrastructure & Transit)",
    assignedProjectCodes: [
      "PRJ-ALPHA",
      "PRJ-BETA",
      "PRJ-GAMMA",
      "PRJ-SYDNEY",
      "PRJ-SG-CRL",
      "PRJ-UK-HS2",
      "PRJ-TW-TY",
    ],
  },
  {
    id: "usr-eng-01",
    userCode: "USR-002",
    name: "Engr. Mei Ling Tan",
    email: "meiling.tan@gamuda.com.my",
    role: "SITE_ENGINEER",
    title: "Lead Structural & QA/QC Site Engineer",
    assignedProjectCodes: ["PRJ-ALPHA", "PRJ-GAMMA", "PRJ-SYDNEY"],
  },
  {
    id: "usr-sup-01",
    userCode: "USR-003",
    name: "Ahmad Faiz Zulkifli",
    email: "faiz.zulkifli@gamuda.com.my",
    role: "SITE_SUPERVISOR",
    title: "Senior Site Operations Supervisor",
    assignedProjectCodes: ["PRJ-ALPHA", "PRJ-BETA", "PRJ-SG-CRL"],
  },
  {
    id: "usr-wrk-01",
    userCode: "USR-004",
    name: "Muthu Krishnan",
    email: "muthu.k@site.gamuda.com.my",
    role: "SITE_WORKER",
    title: "Structural Foreperson & Yard Crew Lead",
    assignedProjectCodes: ["PRJ-ALPHA"], // Assigned only to PRJ-ALPHA to demonstrate RBAC TC-021 on other projects
  },
];

export const INITIAL_PROJECTS: SeedProject[] = [
  {
    id: "prj-alpha",
    projectCode: "PRJ-ALPHA",
    name: "Project Alpha – MRT3 Titiwangsa Underground Station (CMC302)",
    region: "Malaysia",
    location: "Titiwangsa, Kuala Lumpur, Malaysia",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2026-01-15",
    plannedEndDate: "2027-08-30",
    actualEndDate: null,
    budgetRm: 185000000,
    spentRm: 124500000,
    equipmentRentalRm: 4850000,
    status: "AT_RISK",
    plannedCompletion: 65,
    actualCompletion: 56,
  },
  {
    id: "prj-beta",
    projectCode: "PRJ-BETA",
    name: "Project Beta – Penang Silicon Island Marine Bridge Pkg 2",
    region: "Malaysia",
    location: "Bayan Lepas, Penang, Malaysia",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2026-03-01",
    plannedEndDate: "2027-11-30",
    actualEndDate: null,
    budgetRm: 240000000,
    spentRm: 92000000,
    equipmentRentalRm: 6200000,
    status: "ON_TRACK",
    plannedCompletion: 42,
    actualCompletion: 41,
  },
  {
    id: "prj-gamma",
    projectCode: "PRJ-GAMMA",
    name: "Project Gamma – Gamuda Cove IBS Commercial Podium",
    region: "Malaysia",
    location: "Dengkil, Selangor, Malaysia",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2026-02-10",
    plannedEndDate: "2027-04-15",
    actualEndDate: null,
    budgetRm: 95000000,
    spentRm: 68400000,
    equipmentRentalRm: 2100000,
    status: "DELAYED",
    plannedCompletion: 75,
    actualCompletion: 62,
  },
  {
    id: "prj-sydney",
    projectCode: "PRJ-SYDNEY",
    name: "Project Sydney – Sydney Metro West Western Tunnelling (WTP)",
    region: "Australia",
    location: "Sydney Olympic Park & Westmead, NSW, Australia",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2025-06-01",
    plannedEndDate: "2028-12-15",
    actualEndDate: null,
    budgetRm: 3800000000,
    spentRm: 1450000000,
    equipmentRentalRm: 42000000,
    status: "ON_TRACK",
    plannedCompletion: 48,
    actualCompletion: 46,
  },
  {
    id: "prj-sg-crl",
    projectCode: "PRJ-SG-CRL",
    name: "Project Singapore – Cross Island Line Defu Station & Tunnels (CR112)",
    region: "Singapore",
    location: "Defu Industrial Park, Singapore",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2025-09-01",
    plannedEndDate: "2029-06-30",
    actualEndDate: null,
    budgetRm: 1650000000,
    spentRm: 510000000,
    equipmentRentalRm: 18500000,
    status: "ON_TRACK",
    plannedCompletion: 35,
    actualCompletion: 34,
  },
  {
    id: "prj-uk-hs2",
    projectCode: "PRJ-UK-HS2",
    name: "Project UK – London Underground & Rail Civil Works",
    region: "United Kingdom",
    location: "Greater London / West Ruislip, UK",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2024-11-01",
    plannedEndDate: "2028-09-30",
    actualEndDate: null,
    budgetRm: 2900000000,
    spentRm: 1200000000,
    equipmentRentalRm: 35000000,
    status: "AT_RISK",
    plannedCompletion: 52,
    actualCompletion: 45,
  },
  {
    id: "prj-tw-ty",
    projectCode: "PRJ-TW-TY",
    name: "Project Taiwan – Taoyuan City Underground Railway Package CJ18",
    region: "Taiwan",
    location: "Taoyuan City / Pingzhen, Taiwan",
    projectManagerName: "Ir. Razak Ahmad",
    startDate: "2025-01-10",
    plannedEndDate: "2028-05-20",
    actualEndDate: null,
    budgetRm: 2100000000,
    spentRm: 740000000,
    equipmentRentalRm: 22000000,
    status: "ON_TRACK",
    plannedCompletion: 38,
    actualCompletion: 37,
  },
];

export const INITIAL_MATERIALS: SeedMaterial[] = [
  {
    id: "mat-cem-001",
    materialCode: "CEM-001",
    name: "Portland Cement (Ordinary Portland CEM I 52.5N)",
    category: "Cement & Binders",
    brand: "YTL Castle / Hume",
    specifications: "MS EN 197-1:2014 CEM I 52.5N, 50kg multi-ply kraft bag, compressive strength >= 52.5 MPa at 28 days",
    unit: "bag",
    description: "High-early-strength Ordinary Portland Cement for underground station structural slabs, columns, and grouting.",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: ["CEM-006"],
    aiCharacteristics: [
      "50kg woven/kraft paper bag packaging",
      "Fine grey hydraulic powder texture",
      "MS EN 197-1 CEM I marking on bag face",
    ],
  },
  {
    id: "mat-stl-002",
    materialCode: "STL-002",
    name: "High-Tensile Deformed Steel Rebar T16 (Grade B500B)",
    category: "Reinforcement Steel",
    brand: "Ann Joo / Southern Steel",
    specifications: "MS 146 / BS 4449:2005 Grade B500B, 16mm diameter ribbed bar, 12m standard length, yield strength 500 MPa",
    unit: "MT",
    description: "Primary structural reinforcement steel bars for diaphragm walls, transfer beams, and station concourse slabs.",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: ["STL-007"],
    aiCharacteristics: [
      "Ribbed transverse lug pattern on steel surface",
      "16mm nominal cross-section diameter",
      "Bundled mill-tagged 12m steel bars",
    ],
  },
  {
    id: "mat-til-003",
    materialCode: "TIL-003",
    name: "Heavy-Duty Homogeneous Porcelain Floor Tiles (600x600mm)",
    category: "Architectural Finishes",
    brand: "Niro Granite",
    specifications: "ISO 13006 Group BIa, 600x600x10mm, Water absorption < 0.1%, Anti-slip R10 rating for public concourse",
    unit: "m2",
    description: "High-traffic slip-resistant vitrified porcelain tiles for station concourse and pedestrian walkways.",
    imageUrl: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: [],
    aiCharacteristics: [
      "600x600mm rectified matte grey ceramic surface",
      "10mm heavy-duty body thickness",
      "Carton palletized packaging (1.44 m2/box)",
    ],
  },
  {
    id: "mat-con-004",
    materialCode: "CON-004",
    name: "Ready-Mix Concrete Grade C40/50 (Waterproof Tremie Mix)",
    category: "Ready-Mix Concrete",
    brand: "Gamuda Readymix",
    specifications: "MS EN 206 Grade C40/50, Slump 180±25mm, W/C ratio <= 0.42 with crystalline waterproofing admixture",
    unit: "m3",
    description: "Pumpable waterproof structural concrete for basement retaining walls and deep foundation piles.",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: [],
    aiCharacteristics: [
      "Fresh wet aggregate-cement slurry from transit mixer",
      "High workability tremie slump profile",
      "Batch ticket verification required for C40/50 grade",
    ],
  },
  {
    id: "mat-blk-005",
    materialCode: "BLK-005",
    name: "Autoclaved Aerated Concrete (AAC) Lightweight Blocks",
    category: "Masonry & IBS Walls",
    brand: "Starken AAC",
    specifications: "600x200x100mm precision block, Dry density 550 kg/m3, Fire rating 4 hours, MS 2282 certified",
    unit: "pallet",
    description: "Lightweight insulated masonry blocks for station plant rooms and non-load-bearing internal partitions.",
    imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: [],
    aiCharacteristics: [
      "White/light-grey cellular porous concrete block",
      "Precision smooth faces 600x200x100mm",
      "Shrink-wrapped wooden pallet packaging",
    ],
  },
  {
    id: "mat-cem-006",
    materialCode: "CEM-006",
    name: "Eco-Blended GGBS Low-Heat Cement (CEM III/A 42.5N)",
    category: "Cement & Binders",
    brand: "YTL EcoCement",
    specifications: "MS EN 197-1 CEM III/A 42.5N with 45% Ground Granulated Blast-Furnace Slag, low hydration heat",
    unit: "bag",
    description: "Alternative lower-carbon blended cement. Requires Site Engineer specification verification before substituting CEM-001.",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    alternativeCodes: ["CEM-001"],
    aiCharacteristics: [
      "50kg green-striped kraft bag",
      "Lighter grey slag-blended powder",
      "CEM III/A low-heat marking",
    ],
  },
];

export const INITIAL_VENDORS: SeedVendor[] = [
  {
    id: "ven-001",
    vendorCode: "V001",
    name: "YTL Cement Marketing Sdn Bhd",
    tradeSpecialty: "Cement, Binders & Dry Mortar Supply",
    address: "Lot 19, Rawang Integrated Industrial Park, 48000 Rawang, Selangor",
    contactPerson: "Dato' Kelvin Lim",
    contactPhone: "+603-6091-8800",
    contactEmail: "orders@ytlcement-sim.com.my",
    distanceKm: 18.5,
    cidbGrade: "G7",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 50,
      onTimeDeliveries: 48,
      lateDeliveries: 2,
      totalInspectedQty: 12000,
      acceptedQty: 11820,
      rejectedQty: 180,
      openDefectsCount: 0,
      resolvedDefectsCount: 3,
      onTimeDeliveryRate: 96.0,
      qualityAcceptanceRate: 98.5,
      issueResolutionRate: 100.0,
      overallScore: 97.8,
      evaluationStatus: "PREFERRED",
      aiRiskSummary: "Consistently reliable delivery (96% on-time) and 98.5% quality acceptance across all Gamuda packages. Recommended primary cement partner.",
      lastEvaluatedAt: "2026-11-12 09:00",
    },
    products: [
      {
        materialCode: "CEM-001",
        unitPriceRm: 21.8,
        availableExternalQty: 4500,
        minOrderQty: 100,
        leadTimeDays: 2,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:30",
      },
      {
        materialCode: "CEM-006",
        unitPriceRm: 20.5,
        availableExternalQty: 2800,
        minOrderQty: 100,
        leadTimeDays: 2,
        isExactSpecMatch: false,
        lastUpdated: "2026-11-12 10:30",
      },
    ],
  },
  {
    id: "ven-002",
    vendorCode: "V002",
    name: "Apex Steel & Metal Trading Sdn Bhd",
    tradeSpecialty: "Reinforcement Steel & Structural Metal Supply",
    address: "Kawasan Perindustrian Bukit Raja, 41050 Klang, Selangor",
    contactPerson: "En. Hishamuddin Omar",
    contactPhone: "+603-3342-5190",
    contactEmail: "sales@apexsteel-sim.com.my",
    distanceKm: 34.0,
    cidbGrade: "G6",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 20,
      onTimeDeliveries: 11,
      lateDeliveries: 9,
      totalInspectedQty: 800,
      acceptedQty: 568,
      rejectedQty: 232,
      openDefectsCount: 4,
      resolvedDefectsCount: 1,
      onTimeDeliveryRate: 55.0,
      qualityAcceptanceRate: 71.0,
      issueResolutionRate: 20.0,
      overallScore: 54.4,
      evaluationStatus: "DO_NOT_REHIRE",
      aiRiskSummary: "HIGH RISK: 9 of 20 deliveries arrived late (avg +4.2 days delay) and 29% of T16 rebar was rejected by site workers/engineers for surface pitting corrosion and missing mill certs. Flagged against future tender awards.",
      lastEvaluatedAt: "2026-11-12 11:15",
    },
    products: [
      {
        materialCode: "STL-002",
        unitPriceRm: 2690.0,
        availableExternalQty: 180,
        minOrderQty: 20,
        leadTimeDays: 6,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 08:45",
      },
      {
        materialCode: "CEM-001",
        unitPriceRm: 22.9,
        availableExternalQty: 600,
        minOrderQty: 50,
        leadTimeDays: 4,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 08:45",
      },
    ],
  },
  {
    id: "ven-003",
    vendorCode: "V003",
    name: "MetroSteel Industries (M) Bhd",
    tradeSpecialty: "BS 4449 High-Tensile Steel Rebar & Cut-and-Bend IBS",
    address: "Jalan Utas 15/7, Seksyen 15, 40200 Shah Alam, Selangor",
    contactPerson: "Ms. Rachel Chong",
    contactPhone: "+603-5519-7722",
    contactEmail: "dispatch@metrosteel-sim.com.my",
    distanceKm: 24.2,
    cidbGrade: "G7",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 35,
      onTimeDeliveries: 33,
      lateDeliveries: 2,
      totalInspectedQty: 1450,
      acceptedQty: 1410,
      rejectedQty: 40,
      openDefectsCount: 0,
      resolvedDefectsCount: 2,
      onTimeDeliveryRate: 94.3,
      qualityAcceptanceRate: 97.2,
      issueResolutionRate: 100.0,
      overallScore: 96.6,
      evaluationStatus: "PREFERRED",
      aiRiskSummary: "Top-performing steel vendor (96.6/100). Full mill test certificates provided on every batch with 2-day rapid dispatch capability.",
      lastEvaluatedAt: "2026-11-12 09:30",
    },
    products: [
      {
        materialCode: "STL-002",
        unitPriceRm: 2780.0,
        availableExternalQty: 650,
        minOrderQty: 15,
        leadTimeDays: 2,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 11:00",
      },
    ],
  },
  {
    id: "ven-004",
    vendorCode: "V004",
    name: "Niro Ceramic Commercial Supply Sdn Bhd",
    tradeSpecialty: "Architectural Tiles, Stone & Station Finishes",
    address: "Persiaran Sabak Bernam, Seksyen 26, 40400 Shah Alam, Selangor",
    contactPerson: "Mr. Jason Teh",
    contactPhone: "+603-5191-6333",
    contactEmail: "projects@niroceramic-sim.com.my",
    distanceKm: 27.0,
    cidbGrade: "G7",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 24,
      onTimeDeliveries: 22,
      lateDeliveries: 2,
      totalInspectedQty: 5200,
      acceptedQty: 4888,
      rejectedQty: 312,
      openDefectsCount: 1,
      resolvedDefectsCount: 4,
      onTimeDeliveryRate: 91.7,
      qualityAcceptanceRate: 94.0,
      issueResolutionRate: 80.0,
      overallScore: 90.3,
      evaluationStatus: "PREFERRED",
      aiRiskSummary: "Reliable architectural finish vendor. 1 minor packaging edge-chip defect currently in replacement transit.",
      lastEvaluatedAt: "2026-11-12 10:00",
    },
    products: [
      {
        materialCode: "TIL-003",
        unitPriceRm: 48.5,
        availableExternalQty: 3200,
        minOrderQty: 100,
        leadTimeDays: 3,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:15",
      },
      {
        materialCode: "BLK-005",
        unitPriceRm: 310.0,
        availableExternalQty: 180,
        minOrderQty: 10,
        leadTimeDays: 3,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:15",
      },
    ],
  },
  {
    id: "ven-005",
    vendorCode: "V005",
    name: "Southern Quarry & Readymix Bhd",
    tradeSpecialty: "Ready-Mix Concrete, Cement & Masonry Blocks",
    address: "Batu 11, Jalan Cheras, 43200 Kajang, Selangor",
    contactPerson: "Ir. Bala Subramaniam",
    contactPhone: "+603-9075-4411",
    contactEmail: "plant@southernreadymix-sim.com.my",
    distanceKm: 14.8,
    cidbGrade: "G7",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 25,
      onTimeDeliveries: 18,
      lateDeliveries: 7,
      totalInspectedQty: 3400,
      acceptedQty: 2856,
      rejectedQty: 544,
      openDefectsCount: 2,
      resolvedDefectsCount: 3,
      onTimeDeliveryRate: 72.0,
      qualityAcceptanceRate: 84.0,
      issueResolutionRate: 60.0,
      overallScore: 74.4,
      evaluationStatus: "WATCHLIST",
      aiRiskSummary: "WATCHLIST: Peak-hour transit mixer delays and 2 rejected concrete slump tests on Project Alpha. Requires strict slump verification at gate.",
      lastEvaluatedAt: "2026-11-12 10:45",
    },
    products: [
      {
        materialCode: "CEM-001",
        unitPriceRm: 22.4,
        availableExternalQty: 1900,
        minOrderQty: 80,
        leadTimeDays: 3,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:00",
      },
      {
        materialCode: "CON-004",
        unitPriceRm: 345.0,
        availableExternalQty: 900,
        minOrderQty: 20,
        leadTimeDays: 1,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:00",
      },
      {
        materialCode: "BLK-005",
        unitPriceRm: 295.0,
        availableExternalQty: 240,
        minOrderQty: 10,
        leadTimeDays: 2,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:00",
      },
      {
        materialCode: "TIL-003",
        unitPriceRm: 51.0,
        availableExternalQty: 1100,
        minOrderQty: 80,
        leadTimeDays: 5,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 10:00",
      },
    ],
  },
  {
    id: "ven-006",
    vendorCode: "V006",
    name: "BinaTeguh Structural Subcontractors Sdn Bhd",
    tradeSpecialty: "Structural Formwork, Rebar Fixing & Concreting Subcontractor",
    address: "No. 42, Jalan Maarof, Bangsar, 59000 Kuala Lumpur",
    contactPerson: "En. Kamarul Baharin",
    contactPhone: "+603-2284-9012",
    contactEmail: "ops@binateguh-sim.com.my",
    distanceKm: 9.5,
    cidbGrade: "G7",
    dataSource: "SIMULATED",
    performance: {
      totalDeliveries: 18,
      onTimeDeliveries: 12,
      lateDeliveries: 6,
      totalInspectedQty: 100,
      acceptedQty: 78,
      rejectedQty: 22,
      openDefectsCount: 2,
      resolvedDefectsCount: 2,
      onTimeDeliveryRate: 66.7,
      qualityAcceptanceRate: 78.0,
      issueResolutionRate: 50.0,
      overallScore: 67.9,
      evaluationStatus: "WATCHLIST",
      aiRiskSummary: "Subcontractor behind schedule by 15% on Structural Work milestone (65% actual vs 80% planned) with 2 open rebar spacing workmanship defects.",
      lastEvaluatedAt: "2026-11-12 11:00",
    },
    products: [
      {
        materialCode: "STL-002",
        unitPriceRm: 2820.0,
        availableExternalQty: 120,
        minOrderQty: 10,
        leadTimeDays: 4,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 09:15",
      },
      {
        materialCode: "TIL-003",
        unitPriceRm: 46.8,
        availableExternalQty: 850,
        minOrderQty: 120,
        leadTimeDays: 6,
        isExactSpecMatch: true,
        lastUpdated: "2026-11-12 09:15",
      },
    ],
  },
];

// FR-M02-001, FR-M02-005, FR-M02-006:
// Available Stock = Current Stock - Reserved Stock
// Reorder Point = (Average Daily Consumption * Supplier Lead Time) + Safety Stock
// Stock Coverage Days = Available Stock / Average Daily Consumption
export const INITIAL_INVENTORY: SeedInventoryItem[] = [
  // Project Alpha (MRT3 Titiwangsa)
  {
    id: "inv-alpha-cem",
    projectCode: "PRJ-ALPHA",
    materialCode: "CEM-001",
    currentStock: 210,
    reservedStock: 40, // Available = 170 bags | Reorder Point = (50 * 3) + 50 = 200 bags -> BELOW REORDER POINT! (Coverage: 3.4 days)
    incomingStock: 300,
    minStock: 150,
    safetyStock: 50,
    avgDailyConsumption: 50,
    supplierLeadTimeDays: 3,
    unitCostRm: 21.8,
    lastUpdated: "2026-11-12 10:45",
  },
  {
    id: "inv-alpha-stl",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    currentStock: 340,
    reservedStock: 40, // Available = 300 MT | Daily consumption = 100 MT -> Coverage = 3.0 days! Lead time = 5 days -> Reorder Point = (100*5)+80 = 580 MT (Matches FR-M06-005 exact example!)
    incomingStock: 250,
    minStock: 250,
    safetyStock: 80,
    avgDailyConsumption: 100,
    supplierLeadTimeDays: 5,
    unitCostRm: 2750.0,
    lastUpdated: "2026-11-12 11:10",
  },
  {
    id: "inv-alpha-til",
    projectCode: "PRJ-ALPHA",
    materialCode: "TIL-003",
    currentStock: 560,
    reservedStock: 60, // Available = 500 m2 | Daily = 45 m2 -> Coverage = 11.1 days (Slightly short of 14-day two-week requirement!)
    incomingStock: 200,
    minStock: 200,
    safetyStock: 90,
    avgDailyConsumption: 45,
    supplierLeadTimeDays: 3,
    unitCostRm: 48.5,
    lastUpdated: "2026-11-12 09:20",
  },
  {
    id: "inv-alpha-con",
    projectCode: "PRJ-ALPHA",
    materialCode: "CON-004",
    currentStock: 180,
    reservedStock: 30, // Available = 150 m3 | Daily = 30 m3 -> Coverage = 5.0 days | ROP = (30*1)+30 = 60 m3 (Healthy)
    incomingStock: 120,
    minStock: 60,
    safetyStock: 30,
    avgDailyConsumption: 30,
    supplierLeadTimeDays: 1,
    unitCostRm: 345.0,
    lastUpdated: "2026-11-12 10:00",
  },
  {
    id: "inv-alpha-blk",
    projectCode: "PRJ-ALPHA",
    materialCode: "BLK-005",
    currentStock: 85,
    reservedStock: 10, // Available = 75 pallets | Daily = 5 pallets -> Coverage = 15.0 days (Healthy)
    incomingStock: 0,
    minStock: 25,
    safetyStock: 15,
    avgDailyConsumption: 5,
    supplierLeadTimeDays: 2,
    unitCostRm: 295.0,
    lastUpdated: "2026-11-12 08:30",
  },

  // Project Beta (Penang Silicon Island Bridge - Has EXCESS Steel & Cement that can be transferred!)
  {
    id: "inv-beta-cem",
    projectCode: "PRJ-BETA",
    materialCode: "CEM-001",
    currentStock: 1200,
    reservedStock: 100, // Available = 1100 bags | Daily = 40 -> Coverage = 27.5 days (Excess stock eligible for transfer!)
    incomingStock: 0,
    minStock: 200,
    safetyStock: 80,
    avgDailyConsumption: 40,
    supplierLeadTimeDays: 2,
    unitCostRm: 21.8,
    lastUpdated: "2026-11-12 09:00",
  },
  {
    id: "inv-beta-stl",
    projectCode: "PRJ-BETA",
    materialCode: "STL-002",
    currentStock: 920,
    reservedStock: 70, // Available = 850 MT | Daily = 35 MT -> Coverage = 24.3 days (Excess stock!)
    incomingStock: 150,
    minStock: 200,
    safetyStock: 60,
    avgDailyConsumption: 35,
    supplierLeadTimeDays: 3,
    unitCostRm: 2780.0,
    lastUpdated: "2026-11-12 09:30",
  },

  // Project Gamma (Gamuda Cove IBS Podium)
  {
    id: "inv-gamma-cem",
    projectCode: "PRJ-GAMMA",
    materialCode: "CEM-001",
    currentStock: 140,
    reservedStock: 20, // Available = 120 bags | Daily = 40 -> Coverage = 3.0 days | ROP = (40*3)+40 = 160 -> Low Stock!
    incomingStock: 100,
    minStock: 120,
    safetyStock: 40,
    avgDailyConsumption: 40,
    supplierLeadTimeDays: 3,
    unitCostRm: 22.4,
    lastUpdated: "2026-11-12 10:15",
  },
  {
    id: "inv-gamma-til",
    projectCode: "PRJ-GAMMA",
    materialCode: "TIL-003",
    currentStock: 840,
    reservedStock: 40, // Available = 800 m2 | Daily = 30 -> Coverage = 26.7 days
    incomingStock: 0,
    minStock: 150,
    safetyStock: 60,
    avgDailyConsumption: 30,
    supplierLeadTimeDays: 3,
    unitCostRm: 48.5,
    lastUpdated: "2026-11-12 10:15",
  },

  // Project Sydney (Sydney Metro West Tunnelling - Australia)
  {
    id: "inv-syd-stl",
    projectCode: "PRJ-SYDNEY",
    materialCode: "STL-002",
    currentStock: 1450,
    reservedStock: 120,
    incomingStock: 600,
    minStock: 400,
    safetyStock: 150,
    avgDailyConsumption: 85,
    supplierLeadTimeDays: 5,
    unitCostRm: 2850.0,
    lastUpdated: "2026-11-12 11:00",
  },
  {
    id: "inv-syd-con",
    projectCode: "PRJ-SYDNEY",
    materialCode: "CON-004",
    currentStock: 520,
    reservedStock: 60,
    incomingStock: 300,
    minStock: 120,
    safetyStock: 50,
    avgDailyConsumption: 60,
    supplierLeadTimeDays: 1,
    unitCostRm: 360.0,
    lastUpdated: "2026-11-12 11:00",
  },

  // Project Singapore CRL (Defu Station - Singapore)
  {
    id: "inv-sg-cem",
    projectCode: "PRJ-SG-CRL",
    materialCode: "CEM-001",
    currentStock: 890,
    reservedStock: 80,
    incomingStock: 400,
    minStock: 250,
    safetyStock: 100,
    avgDailyConsumption: 55,
    supplierLeadTimeDays: 2,
    unitCostRm: 23.5,
    lastUpdated: "2026-11-12 10:30",
  },
  {
    id: "inv-sg-stl",
    projectCode: "PRJ-SG-CRL",
    materialCode: "STL-002",
    currentStock: 680,
    reservedStock: 50,
    incomingStock: 200,
    minStock: 200,
    safetyStock: 80,
    avgDailyConsumption: 40,
    supplierLeadTimeDays: 4,
    unitCostRm: 2800.0,
    lastUpdated: "2026-11-12 10:30",
  },

  // Project UK (London Rail - United Kingdom)
  {
    id: "inv-uk-stl",
    projectCode: "PRJ-UK-HS2",
    materialCode: "STL-002",
    currentStock: 420,
    reservedStock: 50,
    incomingStock: 150,
    minStock: 300,
    safetyStock: 120,
    avgDailyConsumption: 65,
    supplierLeadTimeDays: 6,
    unitCostRm: 3100.0,
    lastUpdated: "2026-11-12 09:45",
  },

  // Project Taiwan (Taoyuan Underground Railway - Taiwan)
  {
    id: "inv-tw-con",
    projectCode: "PRJ-TW-TY",
    materialCode: "CON-004",
    currentStock: 380,
    reservedStock: 40,
    incomingStock: 200,
    minStock: 100,
    safetyStock: 45,
    avgDailyConsumption: 35,
    supplierLeadTimeDays: 2,
    unitCostRm: 330.0,
    lastUpdated: "2026-11-12 10:00",
  },
];

export const INITIAL_TRANSACTIONS: SeedTransaction[] = [
  {
    id: "txn-001",
    transactionCode: "TXN-2026-0891",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    transactionType: "CONSUMPTION",
    quantity: 95,
    workActivity: "Concourse Level B2 Diaphragm Wall Cage Fixing",
    recordedBy: "Muthu Krishnan",
    recordedByRole: "SITE_WORKER",
    verificationStatus: "VERIFIED",
    remarks: "Verified by Site Supervisor Ahmad Faiz against B2 bar bending schedule.",
    transactionDate: "2026-11-12 08:15",
  },
  {
    id: "txn-002",
    transactionCode: "TXN-2026-0892",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    transactionType: "RECEIPT",
    quantity: 56,
    deliveryRef: "DO-APEX-7741",
    vendorName: "Apex Steel & Metal Trading Sdn Bhd",
    recordedBy: "Ahmad Faiz Zulkifli",
    recordedByRole: "SITE_SUPERVISOR",
    verificationStatus: "VERIFIED",
    remarks: "Partial acceptance: 80 MT delivered, 56 MT confirmed into inventory, 24 MT rejected for heavy pitting rust (BR-007 & BR-009).",
    transactionDate: "2026-11-11 16:40",
  },
  {
    id: "txn-003",
    transactionCode: "TXN-2026-0893",
    projectCode: "PRJ-ALPHA",
    materialCode: "CEM-001",
    transactionType: "CONSUMPTION",
    quantity: 55,
    workActivity: "Station Box Base Slab Screeding & Grouting",
    recordedBy: "Muthu Krishnan",
    recordedByRole: "SITE_WORKER",
    verificationStatus: "VERIFIED",
    remarks: "Daily cement draw for Zone A & Zone B grouting.",
    transactionDate: "2026-11-11 17:30",
  },
  {
    id: "txn-004",
    transactionCode: "TXN-2026-0894",
    projectCode: "PRJ-ALPHA",
    materialCode: "CEM-001",
    transactionType: "RECEIPT",
    quantity: 200,
    deliveryRef: "DO-YTL-9920",
    vendorName: "YTL Cement Marketing Sdn Bhd",
    recordedBy: "Ahmad Faiz Zulkifli",
    recordedByRole: "SITE_SUPERVISOR",
    verificationStatus: "VERIFIED",
    remarks: "100% passed quality inspection. Dry bags stacked in Weatherproof Silo Bay 2.",
    transactionDate: "2026-11-10 11:05",
  },
];

export const INITIAL_INSPECTIONS: SeedQualityInspection[] = [
  {
    id: "insp-001",
    inspectionCode: "QCI-2026-041",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    vendorCode: "V002",
    deliveryRef: "DO-APEX-7741",
    inspectionDate: "2026-11-11",
    result: "PARTIALLY_ACCEPTED",
    acceptedQty: 56,
    rejectedQty: 24,
    inspectedBy: "Engr. Mei Ling Tan",
    comments: "24 MT out of 80 MT bundle rejected at Gate B due to severe flaking rust and missing heat-number mill certificate. Quarantined for vendor pick-up.",
    photoUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "insp-002",
    inspectionCode: "QCI-2026-042",
    projectCode: "PRJ-ALPHA",
    materialCode: "CEM-001",
    vendorCode: "V001",
    deliveryRef: "DO-YTL-9920",
    inspectionDate: "2026-11-10",
    result: "ACCEPTED",
    acceptedQty: 200,
    rejectedQty: 0,
    inspectedBy: "Engr. Mei Ling Tan",
    comments: "All 200 bags intact, moisture check 0%, batch certificate MS EN 197-1 verified.",
  },
  {
    id: "insp-003",
    inspectionCode: "QCI-2026-043",
    projectCode: "PRJ-ALPHA",
    materialCode: "CON-004",
    vendorCode: "V005",
    deliveryRef: "DO-SQR-3318",
    inspectionDate: "2026-11-09",
    result: "REJECTED",
    acceptedQty: 0,
    rejectedQty: 18,
    inspectedBy: "Engr. Mei Ling Tan",
    comments: "2 transit mixer trucks (18 m3) arrived 95 minutes after batching; slump test failed at 90mm (spec 180±25mm). Rejected whole load.",
  },
];

export const INITIAL_DEFECTS: SeedDefectRecord[] = [
  {
    id: "def-001",
    defectCode: "DEF-2026-101",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    vendorCode: "V002",
    deliveryRef: "DO-APEX-7741",
    category: "Poor product quality",
    severity: "CRITICAL",
    rejectedQty: 24,
    description: "Worker Muthu Krishnan flagged heavy surface pitting corrosion and 14.8mm undersized rib diameter on 3 bundles (24 MT) of T16 rebar delivered by Apex Steel.",
    reportedBy: "Muthu Krishnan",
    reportedByRole: "SITE_WORKER",
    reportedDate: "2026-11-11",
    photoUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
    status: "OPEN",
    correctiveActions: [
      {
        id: "ca-001",
        actionDescription: "Quarantine 24 MT bundle in Reject Bay, issue Non-Conformance Report (NCR) to Apex Steel, and source replacement tonnage from MetroSteel (V003).",
        responsibleParty: "Engr. Mei Ling Tan",
        targetDate: "2026-11-14",
        status: "IN_PROGRESS",
        resolutionNotes: "Apex Steel notified; vendor performance score downgraded to 54.4 (DO_NOT_REHIRE tier).",
      },
    ],
  },
  {
    id: "def-002",
    defectCode: "DEF-2026-102",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    vendorCode: "V002",
    deliveryRef: "DO-APEX-7690",
    category: "Incomplete delivery",
    severity: "HIGH",
    rejectedQty: 0,
    description: "Delivery arrived 4 days late and short by 35 MT against scheduled call-off, delaying Zone B reinforcement cage assembly.",
    reportedBy: "Ahmad Faiz Zulkifli",
    reportedByRole: "SITE_SUPERVISOR",
    reportedDate: "2026-11-06",
    status: "IN_PROGRESS",
    correctiveActions: [
      {
        id: "ca-002",
        actionDescription: "Deduct liquidated delivery penalty and shift primary rebar call-off allocation to MetroSteel Industries (V003).",
        responsibleParty: "Ir. Razak Ahmad",
        targetDate: "2026-11-13",
        status: "IN_PROGRESS",
      },
    ],
  },
  {
    id: "def-003",
    defectCode: "DEF-2026-103",
    projectCode: "PRJ-ALPHA",
    materialCode: "CON-004",
    vendorCode: "V005",
    deliveryRef: "DO-SQR-3318",
    category: "Incorrect specifications",
    severity: "HIGH",
    rejectedQty: 18,
    description: "Ready-mix C40/50 tremie concrete failed gate slump inspection (90mm vs required 180mm) due to 95-minute transit delay from Kajang plant.",
    reportedBy: "Engr. Mei Ling Tan",
    reportedByRole: "SITE_ENGINEER",
    reportedDate: "2026-11-09",
    status: "OPEN",
    correctiveActions: [
      {
        id: "ca-003",
        actionDescription: "Require Southern Quarry & Readymix to dispatch night-shift pours from nearer satellite batching plant with retarder dosage sheet.",
        responsibleParty: "Engr. Mei Ling Tan",
        targetDate: "2026-11-13",
        status: "OPEN",
      },
    ],
  },
  {
    id: "def-004",
    defectCode: "DEF-2026-104",
    projectCode: "PRJ-ALPHA",
    materialCode: "TIL-003",
    vendorCode: "V004",
    deliveryRef: "DO-NIRO-1182",
    category: "Packaging damage",
    severity: "LOW",
    rejectedQty: 28,
    description: "1 pallet (28 m2) of 600x600mm homogeneous tiles had fork-lift corner strap damage upon unloading.",
    reportedBy: "Muthu Krishnan",
    reportedByRole: "SITE_WORKER",
    reportedDate: "2026-11-04",
    status: "RESOLVED",
    correctiveActions: [
      {
        id: "ca-004",
        actionDescription: "Vendor replaced 28 m2 free-of-charge within 48 hours with reinforced corner guards.",
        responsibleParty: "Mr. Jason Teh (Niro Ceramic)",
        targetDate: "2026-11-06",
        completedDate: "2026-11-06",
        status: "RESOLVED",
        resolutionNotes: "Replacement batch inspected and accepted.",
      },
    ],
  },
  {
    id: "def-005",
    defectCode: "DEF-2026-105",
    projectCode: "PRJ-ALPHA",
    materialCode: "STL-002",
    vendorCode: "V006",
    deliveryRef: "SUB-BT-W14",
    category: "Subcontractor workmanship",
    severity: "HIGH",
    rejectedQty: 0,
    description: "Subcontractor BinaTeguh rebar link spacing on Grid C4-C7 measured at 250mm c/c instead of structural drawing spec 175mm c/c.",
    reportedBy: "Engr. Mei Ling Tan",
    reportedByRole: "SITE_ENGINEER",
    reportedDate: "2026-11-10",
    status: "OPEN",
    correctiveActions: [
      {
        id: "ca-005",
        actionDescription: "Halt Grid C4-C7 formwork closure until BinaTeguh rectifies link spacing and passes re-inspection.",
        responsibleParty: "En. Kamarul Baharin (BinaTeguh)",
        targetDate: "2026-11-13",
        status: "IN_PROGRESS",
      },
    ],
  },
];

export const INITIAL_EQUIPMENT: SeedEquipment[] = [
  {
    id: "eq-001",
    equipmentCode: "EQ-EX-001",
    name: "Crawler Hydraulic Excavator 30-Ton (Long Reach)",
    category: "Heavy machinery",
    brand: "Komatsu",
    model: "PC300LC-8M0",
    serialNumber: "KMT-PC300-88412",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Zone A – Station Box Excavation Pit",
    condition: "GOOD",
    status: "IN_USE",
    assignedTo: "Earthworks Team A (Lead: Muthu Krishnan)",
    allocationDate: "2026-11-01",
    expectedReturn: "2026-11-20",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-EX-001",
    dailyRentalCostRm: 1850,
    maintenanceHistory: [
      {
        id: "mnt-001",
        maintenanceType: "PREVENTIVE",
        scheduledDate: "2026-11-10",
        inspectionDate: "2026-10-15",
        costRm: 2400,
        description: "500-hour hydraulic oil filter replacement & boom pin greasing (OVERDUE by 2 days).",
        status: "OVERDUE",
      },
    ],
    movementHistory: [
      {
        id: "mov-001",
        sourceProjectCode: "PRJ-GAMMA",
        destProjectCode: "PRJ-ALPHA",
        transferDate: "2026-09-01",
        approvedBy: "Ir. Razak Ahmad",
        movementStatus: "COMPLETED",
        remarks: "Transferred after Gamuda Cove earthworks completion.",
      },
    ],
    incidents: [],
  },
  {
    id: "eq-002",
    equipmentCode: "EQ-CR-002",
    name: "Rough-Terrain Mobile Telescopic Crane 50-Ton",
    category: "Lifting equipment",
    brand: "Tadano",
    model: "GR-500EX",
    serialNumber: "TDN-GR500-31094",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Gate B – Rebar & Formwork Lifting Bay",
    condition: "GOOD",
    status: "IN_USE",
    assignedTo: "Structural Lifting Crew (BinaTeguh Subcon)",
    allocationDate: "2026-10-25",
    expectedReturn: "2026-11-08", // OVERDUE RETURN!
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-CR-002",
    dailyRentalCostRm: 3200,
    maintenanceHistory: [
      {
        id: "mnt-002",
        maintenanceType: "SAFETY_CALIBRATION",
        scheduledDate: "2026-12-01",
        inspectionDate: "2026-09-01",
        completedDate: "2026-09-01",
        costRm: 1800,
        description: "DOSH PMA load moment indicator (LMI) & wire rope ultrasonic certification.",
        status: "SCHEDULED",
      },
    ],
    movementHistory: [],
    incidents: [],
  },
  {
    id: "eq-003",
    equipmentCode: "EQ-CP-003",
    name: "Stationary High-Pressure Concrete Boom Pump",
    category: "Concrete equipment",
    brand: "Putzmeister",
    model: "BSA 2109 H-D",
    serialNumber: "PTZ-2109-55201",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Zone B – Concourse Slab Pour Deck",
    condition: "GOOD",
    status: "AVAILABLE",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-CP-003",
    dailyRentalCostRm: 1450,
    maintenanceHistory: [
      {
        id: "mnt-003",
        maintenanceType: "PREVENTIVE",
        scheduledDate: "2026-11-05",
        inspectionDate: "2026-11-05",
        completedDate: "2026-11-05",
        costRm: 950,
        description: "Wear plate, S-valve seal, and delivery pipeline pressure test.",
        status: "COMPLETED",
      },
    ],
    movementHistory: [],
    incidents: [],
  },
  {
    id: "eq-004",
    equipmentCode: "EQ-RB-004",
    name: "Electro-Hydraulic Rebar Cutter & Bender Station",
    category: "Power tools",
    brand: "Toyo",
    model: "TY-B42 / C42 Combo",
    serialNumber: "TYO-4200-19283",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Steel Fabrication Yard 1",
    condition: "DAMAGED",
    status: "DAMAGED",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-RB-004",
    dailyRentalCostRm: 380,
    maintenanceHistory: [
      {
        id: "mnt-004",
        maintenanceType: "CORRECTIVE",
        scheduledDate: "2026-11-12",
        costRm: 1650,
        description: "Replace cracked hydraulic solenoid valve and bending roller pin.",
        status: "IN_PROGRESS",
      },
    ],
    movementHistory: [],
    incidents: [
      {
        id: "inc-001",
        projectCode: "PRJ-ALPHA",
        incidentType: "DAMAGED",
        description: "Hydraulic pressure seal burst while bending out-of-spec brittle rebar batch from Apex Steel.",
        reportedBy: "Muthu Krishnan",
        reportedDate: "2026-11-11",
        status: "UNDER_REPAIR",
      },
    ],
  },
  {
    id: "eq-005",
    equipmentCode: "EQ-GN-005",
    name: "Silent Diesel Generator Set 250 kVA",
    category: "Electrical equipment",
    brand: "Denyo",
    model: "DCA-220SPK3",
    serialNumber: "DNY-220-77410",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Tunnel Ventilation & Dewatering Sump",
    condition: "GOOD",
    status: "IN_USE",
    assignedTo: "MEP & Dewatering Shift Crew",
    allocationDate: "2026-10-01",
    expectedReturn: "2026-12-31",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-GN-005",
    dailyRentalCostRm: 750,
    maintenanceHistory: [],
    movementHistory: [],
    incidents: [],
  },
  {
    id: "eq-006",
    equipmentCode: "EQ-GD-006",
    name: "Confined-Space Multi-Gas Detector & Tripod Winch Kit",
    category: "Safety equipment",
    brand: "MSA Safety",
    model: "Altair 5X + Workman Tripod",
    serialNumber: "MSA-A5X-90311",
    currentProjectCode: "PRJ-ALPHA",
    currentLocation: "Site Safety Store – Container 2",
    condition: "GOOD",
    status: "AVAILABLE",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-GD-006",
    dailyRentalCostRm: 180,
    maintenanceHistory: [],
    movementHistory: [],
    incidents: [],
  },
  {
    id: "eq-007",
    equipmentCode: "EQ-EX-007",
    name: "Crawler Hydraulic Excavator 20-Ton (Underutilized at Project Beta)",
    category: "Heavy machinery",
    brand: "Caterpillar",
    model: "CAT 320 GC",
    serialNumber: "CAT-320-66102",
    currentProjectCode: "PRJ-BETA",
    currentLocation: "Penang Bridge Yard B – Idle Bay",
    condition: "GOOD",
    status: "AVAILABLE",
    qrCodePayload: "BUILDSMART://EQUIPMENT/EQ-EX-007",
    dailyRentalCostRm: 1400,
    maintenanceHistory: [],
    movementHistory: [],
    incidents: [],
  },
];

// FR-M05-002 & FR-M05-003: Exact table example included + Subcontractor mapping
export const INITIAL_MILESTONES: SeedMilestone[] = [
  // Project Alpha Milestones (Matches FR-M05-003 table example: Foundation 100/100, Structural Work 80/65, Electrical Work 50/35, Finishing Work 20/10)
  {
    id: "ms-alpha-01",
    milestoneCode: "MS-ALPHA-01",
    projectCode: "PRJ-ALPHA",
    name: "Foundation & Diaphragm Wall Works",
    subcontractorCode: "V001",
    subcontractorName: "YTL Cement / Gamuda Geotechnics",
    responsibleTeam: "Geotechnical & Piling Team A",
    plannedStartDate: "2026-01-15",
    plannedEndDate: "2026-06-30",
    actualStartDate: "2026-01-15",
    actualEndDate: "2026-06-28",
    plannedProgress: 100,
    actualProgress: 100,
    budgetAllocatedRm: 52000000,
    actualSpentRm: 51200000,
    status: "COMPLETED",
  },
  {
    id: "ms-alpha-02",
    milestoneCode: "MS-ALPHA-02",
    projectCode: "PRJ-ALPHA",
    name: "Structural Work (Station Box & Concourse Slabs)",
    subcontractorCode: "V006",
    subcontractorName: "BinaTeguh Structural Subcontractors Sdn Bhd",
    responsibleTeam: "Structural RC Team B (Lead: Engr. Mei Ling Tan)",
    plannedStartDate: "2026-06-01",
    plannedEndDate: "2027-01-15",
    actualStartDate: "2026-06-05",
    plannedProgress: 80,
    actualProgress: 65, // Behind by 15%!
    budgetAllocatedRm: 68000000,
    actualSpentRm: 54800000, // 80.6% budget spent for only 65% actual progress -> Flagged for investigation per FR-M05-008!
    status: "DELAYED",
  },
  {
    id: "ms-alpha-03",
    milestoneCode: "MS-ALPHA-03",
    projectCode: "PRJ-ALPHA",
    name: "Electrical Work & Tunnel MEP Services",
    subcontractorCode: "V003",
    subcontractorName: "MetroSteel / Gamuda M&E Package",
    responsibleTeam: "MEP Systems Team C",
    plannedStartDate: "2026-08-15",
    plannedEndDate: "2027-04-30",
    actualStartDate: "2026-08-25",
    plannedProgress: 50,
    actualProgress: 35, // Behind by 15% due to predecessor Structural Work delay!
    budgetAllocatedRm: 38000000,
    actualSpentRm: 13500000,
    status: "DELAYED",
  },
  {
    id: "ms-alpha-04",
    milestoneCode: "MS-ALPHA-04",
    projectCode: "PRJ-ALPHA",
    name: "Finishing Work (Concourse Tiling & Architectural)",
    subcontractorCode: "V004",
    subcontractorName: "Niro Ceramic Commercial Supply Sdn Bhd",
    responsibleTeam: "Architectural Finishes Team D",
    plannedStartDate: "2026-10-15",
    plannedEndDate: "2027-08-15",
    actualStartDate: "2026-10-28",
    plannedProgress: 20,
    actualProgress: 10, // Behind by 10%
    budgetAllocatedRm: 27000000,
    actualSpentRm: 5000000,
    status: "DELAYED",
  },

  // Project Beta Milestones
  {
    id: "ms-beta-01",
    milestoneCode: "MS-BETA-01",
    projectCode: "PRJ-BETA",
    name: "Marine Bored Piling & Caisson Foundations",
    subcontractorCode: "V003",
    subcontractorName: "MetroSteel Industries (M) Bhd",
    responsibleTeam: "Marine Foundation Team",
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-10-30",
    actualStartDate: "2026-03-01",
    plannedProgress: 85,
    actualProgress: 84,
    budgetAllocatedRm: 95000000,
    actualSpentRm: 78000000,
    status: "ON_TRACK",
  },
  {
    id: "ms-beta-02",
    milestoneCode: "MS-BETA-02",
    projectCode: "PRJ-BETA",
    name: "Precast Segmental Box Girder Launching",
    subcontractorCode: "V001",
    subcontractorName: "YTL Cement Marketing Sdn Bhd",
    responsibleTeam: "Bridge Superstructure Team",
    plannedStartDate: "2026-09-15",
    plannedEndDate: "2027-07-30",
    actualStartDate: "2026-09-18",
    plannedProgress: 20,
    actualProgress: 19,
    budgetAllocatedRm: 145000000,
    actualSpentRm: 14000000,
    status: "ON_TRACK",
  },

  // Project Gamma Milestones
  {
    id: "ms-gamma-01",
    milestoneCode: "MS-GAMMA-01",
    projectCode: "PRJ-GAMMA",
    name: "IBS Precast Wall & Slab Erection (Levels 1-8)",
    subcontractorCode: "V006",
    subcontractorName: "BinaTeguh Structural Subcontractors Sdn Bhd",
    responsibleTeam: "IBS Installation Team",
    plannedStartDate: "2026-02-10",
    plannedEndDate: "2026-12-30",
    actualStartDate: "2026-02-15",
    plannedProgress: 75,
    actualProgress: 62,
    budgetAllocatedRm: 95000000,
    actualSpentRm: 68400000,
    status: "DELAYED",
  },

  // Project Sydney (Australia)
  {
    id: "ms-syd-01",
    milestoneCode: "MS-SYD-01",
    projectCode: "PRJ-SYDNEY",
    name: "Twin Tunnel TBM Driving (Westmead to Sydney Olympic Park)",
    subcontractorCode: "V003",
    subcontractorName: "MetroSteel / Tunnelling Joint Venture",
    responsibleTeam: "TBM Operations Team A",
    plannedStartDate: "2025-08-01",
    plannedEndDate: "2027-10-30",
    actualStartDate: "2025-08-10",
    plannedProgress: 48,
    actualProgress: 46,
    budgetAllocatedRm: 1800000000,
    actualSpentRm: 720000000,
    status: "ON_TRACK",
  },

  // Project Singapore CRL (Singapore)
  {
    id: "ms-sg-01",
    milestoneCode: "MS-SG-01",
    projectCode: "PRJ-SG-CRL",
    name: "Defu Station Box Diaphragm Wall & Deep Excavation",
    subcontractorCode: "V001",
    subcontractorName: "YTL / Singapore Civils Consortium",
    responsibleTeam: "Deep Basement Team",
    plannedStartDate: "2025-10-01",
    plannedEndDate: "2027-06-30",
    actualStartDate: "2025-10-01",
    plannedProgress: 35,
    actualProgress: 34,
    budgetAllocatedRm: 850000000,
    actualSpentRm: 280000000,
    status: "ON_TRACK",
  },

  // Project UK (United Kingdom)
  {
    id: "ms-uk-01",
    milestoneCode: "MS-UK-01",
    projectCode: "PRJ-UK-HS2",
    name: "North Portal Crossover Box & Shaft Sinking",
    subcontractorCode: "V003",
    subcontractorName: "Gamuda UK Civils Joint Venture",
    responsibleTeam: "Shaft Sinking Team 1",
    plannedStartDate: "2025-03-01",
    plannedEndDate: "2027-04-30",
    actualStartDate: "2025-03-15",
    plannedProgress: 52,
    actualProgress: 45,
    budgetAllocatedRm: 1400000000,
    actualSpentRm: 620000000,
    status: "DELAYED",
  },

  // Project Taiwan (Taiwan)
  {
    id: "ms-tw-01",
    milestoneCode: "MS-TW-01",
    projectCode: "PRJ-TW-TY",
    name: "Pingzhen Cut-and-Cover Tunnel Box Construction",
    subcontractorCode: "V005",
    subcontractorName: "Taiwan Engineering & Concrete Group",
    responsibleTeam: "Railway Civils Team",
    plannedStartDate: "2025-02-01",
    plannedEndDate: "2027-11-30",
    actualStartDate: "2025-02-05",
    plannedProgress: 38,
    actualProgress: 37,
    budgetAllocatedRm: 950000000,
    actualSpentRm: 360000000,
    status: "ON_TRACK",
  },
];

export const INITIAL_PROGRESS_UPDATES: SeedProgressUpdate[] = [
  {
    id: "prg-001",
    projectCode: "PRJ-ALPHA",
    milestoneCode: "MS-ALPHA-02",
    milestoneName: "Structural Work (Station Box & Concourse Slabs)",
    progressDate: "2026-11-12",
    completionPct: 65,
    workCompleted: "Completed Concourse Level B2 Grid A1-C4 slab pour (420 m3 C40 concrete) and stripping of Zone A wall shutters.",
    workOutstanding: "Grid C4-C7 rebar link spacing rectification by BinaTeguh and Zone B transfer beam reinforcement (awaiting replacement T16 rebar).",
    remarks: "24 MT corroded rebar rejection from Apex Steel and Rebar Bender EQ-RB-004 breakdown slowed cage fabrication by 2 shifts.",
    updatedBy: "Engr. Mei Ling Tan",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "prg-002",
    projectCode: "PRJ-ALPHA",
    milestoneCode: "MS-ALPHA-04",
    milestoneName: "Finishing Work (Concourse Tiling & Architectural)",
    progressDate: "2026-11-11",
    completionPct: 10,
    workCompleted: "Completed waterproof floor screed and 180 m2 homogeneous tile laying at North Entrance Ticketing Hall.",
    workOutstanding: "Concourse central walkway tiling (500 m2 available stock covers 11.1 days; additional 130 m2 needed to cover full 14-day lookahead).",
    remarks: "Handover of South Concourse zone delayed by MEP conduit pressure testing.",
    updatedBy: "Ahmad Faiz Zulkifli",
    photoUrl: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=600&q=80",
  },
];

export const INITIAL_PHOTOS: SeedPhoto[] = [
  {
    id: "pht-001",
    projectCode: "PRJ-ALPHA",
    milestoneCode: "MS-ALPHA-01",
    milestoneName: "Foundation & Diaphragm Wall Works",
    photoUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
    description: "Completed 1.2m thick diaphragm wall guide-beam and base excavation pit sign-off.",
    uploadedBy: "Engr. Mei Ling Tan",
    uploadDate: "2026-06-28",
  },
  {
    id: "pht-002",
    projectCode: "PRJ-ALPHA",
    milestoneCode: "MS-ALPHA-02",
    milestoneName: "Structural Work (Station Box & Concourse Slabs)",
    photoUrl: "https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=600&q=80",
    description: "Concourse B2 structural slab reinforcement cage inspection and concrete boom pump placement.",
    uploadedBy: "Engr. Mei Ling Tan",
    uploadDate: "2026-11-12",
  },
  {
    id: "pht-003",
    projectCode: "PRJ-ALPHA",
    milestoneCode: "MS-ALPHA-04",
    milestoneName: "Finishing Work (Concourse Tiling & Architectural)",
    photoUrl: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?auto=format&fit=crop&w=600&q=80",
    description: "North Concourse 600x600mm anti-slip homogeneous porcelain floor tile installation.",
    uploadedBy: "Muthu Krishnan",
    uploadDate: "2026-11-11",
  },
];

// FR-M06-002, FR-M06-003, FR-M06-004:
// Risk Score = Likelihood (1-5) * Impact (1-5)
// 1-4: LOW | 5-9: MEDIUM | 10-16: HIGH | 17-25: CRITICAL
export const INITIAL_RISKS: SeedRisk[] = [
  {
    id: "rsk-001",
    riskCode: "RSK-ALPHA-001",
    projectCode: "PRJ-ALPHA",
    category: "MATERIAL",
    title: "Critical Steel Rebar T16 Shortage in 3.0 Days (2-Day Coverage Gap)",
    description: "Project Alpha has 300 MT available T16 Steel Rebar against 100 MT/day consumption (3.0 days stock coverage). Expected delivery from current schedule is 5 days, creating a 2-day critical path stockout on Structural Work.",
    sourceData: "M02 Inventory [inv-alpha-stl: Available 300 MT, Burn 100 MT/d] + M03 Inspection [QCI-2026-041: 24 MT Rejected from Apex Steel] (Updated 2026-11-12 11:10)",
    likelihood: 5,
    impact: 5,
    riskScore: 25,
    riskLevel: "CRITICAL",
    recommendedAction: "1) Transfer 200 MT excess T16 Rebar from Project Beta (850 MT available, 24.3d cover). 2) Issue emergency split order to Preferred Vendor MetroSteel (V003, 96.6 score, 2-day lead time, 650 MT external stock).",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-002",
    riskCode: "RSK-ALPHA-002",
    projectCode: "PRJ-ALPHA",
    category: "VENDOR",
    title: "Chronic Delivery Delays & 29% Defect Rate from Apex Steel (V002)",
    description: "Vendor Apex Steel & Metal Trading has 9 late deliveries out of 20 (55% on-time rate), 232 MT total rejected steel, and 4 open defects including DEF-2026-101 (pitting corrosion). Performance score dropped to 54.4/100.",
    sourceData: "M03 Vendor Performance [V002: Score 54.4%, OTIF 55%, Quality 71%, Open Defects: 4] (Updated 2026-11-12 11:15)",
    likelihood: 5,
    impact: 4,
    riskScore: 20,
    riskLevel: "CRITICAL",
    recommendedAction: "Place Apex Steel (V002) on cross-project Tender Hold (DO_NOT_REHIRE) and reallocate remaining steel call-offs to MetroSteel Industries (V003).",
    riskOwner: "Engr. Mei Ling Tan",
    status: "IN_PROGRESS",
    identifiedDate: "2026-11-11",
  },
  {
    id: "rsk-003",
    riskCode: "RSK-ALPHA-003",
    projectCode: "PRJ-ALPHA",
    category: "MATERIAL",
    title: "Portland Cement (CEM-001) Below Reorder Point (170 vs 200 Bags ROP)",
    description: "Available Portland Cement at Project Alpha is 170 bags (Current 210 - Reserved 40), which is below the calculated Reorder Point of 200 bags ((50 bags/day × 3 days lead time) + 50 safety stock). Coverage is 3.4 days.",
    sourceData: "M02 Inventory [inv-alpha-cem: Available 170 bags, ROP 200 bags, Coverage 3.4d] (Updated 2026-11-12 10:45)",
    likelihood: 4,
    impact: 3,
    riskScore: 12,
    riskLevel: "HIGH",
    recommendedAction: "Expedite incoming 300-bag order from YTL Cement (V001, 2-day lead time, RM 21.80/bag) or transfer 250 bags from Project Beta's 1,100-bag surplus.",
    riskOwner: "Ahmad Faiz Zulkifli",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-004",
    riskCode: "RSK-ALPHA-004",
    projectCode: "PRJ-ALPHA",
    category: "EQUIPMENT",
    title: "Rebar Bender Breakdown (EQ-RB-004) & Overdue Excavator Maintenance (EQ-EX-001)",
    description: "Steel Yard Rebar Cutter/Bender EQ-RB-004 is DAMAGED (hydraulic seal burst), reducing on-site cage fabrication capacity by 40%. Additionally, 30T Excavator EQ-EX-001 is 2 days overdue for 500-hr hydraulic maintenance and Crane EQ-CR-002 is overdue for return.",
    sourceData: "M04 Equipment [EQ-RB-004: DAMAGED, Inc INC-001] + [EQ-EX-001: Maintenance MNT-001 OVERDUE] + [EQ-CR-002: Return Overdue since 2026-11-08]",
    likelihood: 4,
    impact: 4,
    riskScore: 16,
    riskLevel: "HIGH",
    recommendedAction: "Complete priority hydraulic valve repair on EQ-RB-004 today, order pre-cut/bent rebar from MetroSteel for 48 hours, and schedule night-shift service for EQ-EX-001.",
    riskOwner: "Ahmad Faiz Zulkifli",
    status: "ACKNOWLEDGED",
    identifiedDate: "2026-11-11",
  },
  {
    id: "rsk-005",
    riskCode: "RSK-ALPHA-005",
    projectCode: "PRJ-ALPHA",
    category: "PROJECT",
    title: "Structural Work Schedule Slippage (-15%) & Higher Budget Burn vs Completion",
    description: "Milestone MS-ALPHA-02 (Structural Work by BinaTeguh Subcon) is at 65% actual vs 80% planned completion (-15% variance), while budget utilization on the milestone is at 80.6% (RM 54.8M / RM 68.0M). Overall project spend is 67.3% vs 56% actual completion.",
    sourceData: "M05 Progress [MS-ALPHA-02: Planned 80%, Actual 65%, Spend 80.6%] + M03 Defect [DEF-2026-105: Rebar spacing rework]",
    likelihood: 4,
    impact: 4,
    riskScore: 16,
    riskLevel: "HIGH",
    recommendedAction: "Flagged for commercial & technical investigation (FR-M05-008): audit BinaTeguh rework quantities on Grid C4-C7, verify unbilled variation works vs material overrun, and add weekend concreting shift.",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-006",
    riskCode: "RSK-GAMMA-001",
    projectCode: "PRJ-GAMMA",
    category: "PROJECT",
    title: "Gamuda Cove IBS Podium Behind Schedule (-13% Variance) & Low Cement Stock",
    description: "Project Gamma IBS installation is at 62% actual vs 75% planned completion, and CEM-001 available stock (120 bags) has fallen below its 160-bag reorder point.",
    sourceData: "M05 Project [PRJ-GAMMA: 62% vs 75%] + M02 Inventory [inv-gamma-cem: 120 bags < 160 ROP]",
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: "HIGH",
    recommendedAction: "Replenish 200 bags of CEM-001 from YTL Cement (V001) and reallocate idle 20T Excavator EQ-EX-007 from Project Beta.",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-007",
    riskCode: "RSK-SYD-001",
    projectCode: "PRJ-SYDNEY",
    category: "EQUIPMENT",
    title: "Port Kembla TBM Cutterhead Tooling Logistics Delay (NSW)",
    description: "Maritime freight customs clearance on specialized tungsten carbide disc cutters delayed by 4 days due to Port Kembla terminal congestion.",
    sourceData: "Sydney Port Manifest & Supply Chain Logistics Tracker (Updated 2026-11-12 08:30)",
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: "HIGH",
    recommendedAction: "Activate local Australian precision tooling supplier backup inventory and adjust TBM maintenance shift window.",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-008",
    riskCode: "RSK-SG-001",
    projectCode: "PRJ-SG-CRL",
    category: "PROJECT",
    title: "Deep Basement Groundwater Inflow Monitoring at Defu Station",
    description: "Piezometer sensor readings indicate elevated hydrostatic pressure near diaphragm wall panel D-14 following seasonal heavy rainfall.",
    sourceData: "LTA Automated Geotechnical Instrumentation Monitoring System (Updated 2026-11-12 09:15)",
    likelihood: 3,
    impact: 4,
    riskScore: 12,
    riskLevel: "HIGH",
    recommendedAction: "Initiate secondary dewatering recharge well cycle and conduct GPR void scanning behind panel D-14.",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
  {
    id: "rsk-009",
    riskCode: "RSK-UK-001",
    projectCode: "PRJ-UK-HS2",
    category: "MATERIAL",
    title: "Winter Supply Chain Freeze on High-Strength Low-Carbon Grout",
    description: "UK logistics transit freeze affecting daily delivery of BS EN 197 CEM III/A blast-furnace slag blended cement to West Ruislip shaft.",
    sourceData: "National Highways & Rail Freight Advisory Network (Updated 2026-11-12 07:00)",
    likelihood: 4,
    impact: 4,
    riskScore: 16,
    riskLevel: "HIGH",
    recommendedAction: "Maintain minimum 10-day buffer silo capacity on-site and pre-order heated transport tankers.",
    riskOwner: "Ir. Razak Ahmad",
    status: "OPEN",
    identifiedDate: "2026-11-12",
  },
];

// Section 15: Notification & Alert Requirements (AL-001 to AL-010)
export const INITIAL_NOTIFICATIONS: SeedNotification[] = [
  {
    id: "not-001",
    alertCode: "AL-001",
    projectCode: "PRJ-ALPHA",
    title: "Material Below Reorder Point: Portland Cement (CEM-001)",
    description: "Available stock (170 bags) fell below Reorder Point (200 bags). Estimated stock coverage: 3.4 days.",
    relatedRef: "CEM-001",
    priority: "HIGH",
    targetRoles: ["SITE_SUPERVISOR", "SITE_ENGINEER", "PROJECT_MANAGER"],
    targetModule: "M02",
    isRead: false,
    createdAt: "2026-11-12 10:45",
  },
  {
    id: "not-002",
    alertCode: "AL-002",
    projectCode: "PRJ-ALPHA",
    title: "Potential Material Shortage: T16 Steel Rebar (STL-002)",
    description: "300 MT available covers only 3.0 days at 100 MT/day burn rate vs 5-day delivery lead time (2-day shortage gap).",
    relatedRef: "STL-002",
    priority: "CRITICAL",
    targetRoles: ["SITE_SUPERVISOR", "PROJECT_MANAGER"],
    targetModule: "M02",
    isRead: false,
    createdAt: "2026-11-12 11:10",
  },
  {
    id: "not-003",
    alertCode: "AL-004",
    projectCode: "PRJ-ALPHA",
    title: "Material Quality Rejection: 24 MT Corroded Rebar (DO-APEX-7741)",
    description: "Worker Muthu Krishnan & Engr. Mei Ling Tan rejected 24 MT T16 rebar from Apex Steel due to surface pitting corrosion.",
    relatedRef: "DEF-2026-101",
    priority: "CRITICAL",
    targetRoles: ["SITE_ENGINEER", "SITE_SUPERVISOR", "PROJECT_MANAGER"],
    targetModule: "M03",
    isRead: false,
    createdAt: "2026-11-11 16:45",
  },
  {
    id: "not-004",
    alertCode: "AL-005",
    projectCode: "PRJ-ALPHA",
    title: "Repeated Vendor Quality & Delay Issue: Apex Steel (V002)",
    description: "Vendor score dropped to 54.4/100 (DO_NOT_REHIRE tier) after 4th quality/delivery non-conformance.",
    relatedRef: "V002",
    priority: "HIGH",
    targetRoles: ["SITE_ENGINEER", "PROJECT_MANAGER"],
    targetModule: "M03",
    isRead: false,
    createdAt: "2026-11-11 17:00",
  },
  {
    id: "not-005",
    alertCode: "AL-006",
    projectCode: "PRJ-ALPHA",
    title: "Equipment Overdue for Return: 50T Mobile Crane (EQ-CR-002)",
    description: "Allocated to Structural Lifting Crew (BinaTeguh); expected return was 2026-11-08 (4 days overdue).",
    relatedRef: "EQ-CR-002",
    priority: "MEDIUM",
    targetRoles: ["SITE_SUPERVISOR", "PROJECT_MANAGER"],
    targetModule: "M04",
    isRead: false,
    createdAt: "2026-11-12 08:00",
  },
  {
    id: "not-006",
    alertCode: "AL-007",
    projectCode: "PRJ-ALPHA",
    title: "Equipment Maintenance Overdue: 30T Excavator (EQ-EX-001)",
    description: "500-hour hydraulic filter preventive maintenance was scheduled for 2026-11-10.",
    relatedRef: "EQ-EX-001",
    priority: "HIGH",
    targetRoles: ["SITE_SUPERVISOR", "PROJECT_MANAGER"],
    targetModule: "M04",
    isRead: false,
    createdAt: "2026-11-12 08:30",
  },
  {
    id: "not-007",
    alertCode: "AL-008",
    projectCode: "PRJ-ALPHA",
    title: "Equipment Reported Damaged: Rebar Cutter/Bender (EQ-RB-004)",
    description: "Hydraulic pressure seal burst reported by Muthu Krishnan at Steel Fabrication Yard 1.",
    relatedRef: "EQ-RB-004",
    priority: "HIGH",
    targetRoles: ["SITE_SUPERVISOR", "PROJECT_MANAGER", "SITE_WORKER"],
    targetModule: "M04",
    isRead: false,
    createdAt: "2026-11-11 15:20",
  },
  {
    id: "not-008",
    alertCode: "AL-009",
    projectCode: "PRJ-ALPHA",
    title: "Milestone Behind Schedule: Structural Work (-15% Variance)",
    description: "MS-ALPHA-02 is at 65% actual vs 80% planned completion. Higher budget burn (80.6%) flagged for investigation.",
    relatedRef: "MS-ALPHA-02",
    priority: "HIGH",
    targetRoles: ["SITE_ENGINEER", "SITE_SUPERVISOR", "PROJECT_MANAGER"],
    targetModule: "M05",
    isRead: false,
    createdAt: "2026-11-12 09:15",
  },
  {
    id: "not-009",
    alertCode: "AL-010",
    projectCode: "PRJ-ALPHA",
    title: "Critical AI Risk Identified: RSK-ALPHA-001 (Score 25/25)",
    description: "AI Risk Copilot predicts a 2-day structural steel halt in 72 hours unless inter-project transfer or backup vendor split is executed.",
    relatedRef: "RSK-ALPHA-001",
    priority: "CRITICAL",
    targetRoles: ["PROJECT_MANAGER", "SITE_SUPERVISOR", "SITE_ENGINEER", "SITE_WORKER"],
    targetModule: "M06",
    isRead: false,
    createdAt: "2026-11-12 11:15",
  },
];

export const INITIAL_AUDIT_LOGS: SeedAuditLog[] = [
  {
    id: "aud-001",
    auditCode: "AUD-2026-001",
    userId: "usr-wrk-01",
    userName: "Muthu Krishnan",
    userRole: "SITE_WORKER",
    projectCode: "PRJ-ALPHA",
    module: "M03 - Quality & Vendor Intelligence",
    action: "REPORT_VENDOR_DEFECT",
    recordId: "DEF-2026-101",
    previousValue: "No defect logged on DO-APEX-7741",
    newValue: "Logged CRITICAL defect: 24 MT corroded T16 Rebar against Apex Steel (V002)",
    timestamp: "2026-11-11 16:35",
  },
  {
    id: "aud-002",
    auditCode: "AUD-2026-002",
    userId: "usr-sup-01",
    userName: "Ahmad Faiz Zulkifli",
    userRole: "SITE_SUPERVISOR",
    projectCode: "PRJ-ALPHA",
    module: "M02 - Smart Live Inventory",
    action: "CONFIRM_GOODS_RECEIPT",
    recordId: "TXN-2026-0892",
    previousValue: "STL-002 Current Stock: 379 MT",
    newValue: "STL-002 Current Stock: 435 MT (+56 MT confirmed; 24 MT rejected excluded per BR-009)",
    timestamp: "2026-11-11 16:40",
  },
  {
    id: "aud-003",
    auditCode: "AUD-2026-003",
    userId: "usr-eng-01",
    userName: "Engr. Mei Ling Tan",
    userRole: "SITE_ENGINEER",
    projectCode: "PRJ-ALPHA",
    module: "M05 - Visual Progress Monitoring",
    action: "UPDATE_MILESTONE_PROGRESS",
    recordId: "MS-ALPHA-02",
    previousValue: "Actual Progress: 62%",
    newValue: "Actual Progress: 65% (Concourse Level B2 Grid A1-C4 slab pour completed)",
    timestamp: "2026-11-12 09:10",
  },
];
