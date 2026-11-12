import * as fs from "fs";
import * as path from "path";
import { getCloneOfInitialState } from "../src/lib/store";

async function main() {
  console.log("Initializing BuildSmart AI Local Database (prisma/dev-db.json)...");
  const state = getCloneOfInitialState();
  const dbPath = path.join(process.cwd(), "prisma", "dev-db.json");
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), "utf-8");

  console.log(`✓ Seeded ${state.projects.length} Gamuda Projects (${state.projects.map((p) => p.projectCode).join(", ")})`);
  console.log(`✓ Seeded ${state.users.length} Role Accounts (Project Manager, Site Engineer, Site Supervisor, Site Worker)`);
  console.log(`✓ Seeded ${state.materials.length} Construction Materials & ${state.vendors.length} Vendors/Subcontractors`);
  console.log(`✓ Seeded ${state.inventory.length} Live Inventory Records & ${state.transactions.length} Transactions`);
  console.log(`✓ Seeded ${state.defects.length} Site Defect Logs & ${state.inspections.length} Quality Inspections`);
  console.log(`✓ Seeded ${state.equipments.length} QR Equipment Items & ${state.milestones.length} Milestones`);
  console.log(`✓ Seeded ${state.risks.length} AI Risk Records & ${state.notifications.length} Configured Alerts`);
  console.log("BuildSmart AI Database Setup Complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
