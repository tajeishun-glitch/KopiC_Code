# 🏗️ BuildSmart AI — Gamuda Construction Site Intelligence & Risk Copilot

**BuildSmart AI** is a centralized construction site intelligence platform designed for **Project Managers**, **Site Engineers**, **Site Supervisors**, and **Site Workers** (with heavy back-office procurement officer workflows streamlined out so site teams can focus on live risk, stock, quality, equipment, and progress).

---

## 🚀 Two Ways to Run (Hackathon-Proof)

### Option A: Instant 1-Click Stage Demo (Zero Setup Required)
Double-click **[`launch-buildsmart-ai.bat`](./launch-buildsmart-ai.bat)** or open **[`public/standalone-app.html`](./public/standalone-app.html)** directly in Chrome or Edge.
- Runs 100% locally in the browser with zero dependency installation required.

### Option B: Full-Stack Next.js 14 + Prisma (SQLite) + Gemini API Server
```bash
npm install
npm run db:setup
npm run dev
```
Then open `http://localhost:3000`.

---

## 🧩 Implemented Functional Modules (M01 – M06)

| Module | Key Capabilities Built | Spec Rules Covered |
| :--- | :--- | :--- |
| **M01: AI Material Recognition & Stock/Vendor Lookup** | Upload/select material photo → AI identifies material & specs → **Automatically checks live project stock coverage + linked vendor stock, pricing & defect evaluation scorecards**. | `FR-M01-001` to `007`, `BR-002`, `BR-003`, `BR-018` |
| **M02: Smart Live Stock Inventory** | Tracks `Current`, `Reserved`, `Available = Current − Reserved`, and `Incoming` (strictly separate), calculates `Reorder Point` & `Stock Coverage Days`, records Consumption, Goods Receipt, and Inter-Project Transfers. | `FR-M02-001` to `009`, `BR-004` to `BR-010` |
| **M03: Quality, Worker Defect Log & Vendor Evaluation** | Lets Site Workers & Engineers reflect delivery/subcontractor defects on site, tracks corrective actions, and auto-calculates weighted Vendor Scorecards (`40% Delivery + 40% Quality + 20% Resolution`) for future hiring evaluation. | `FR-M03-001` to `006`, `TC-008`, `TC-009` |
| **M04: On-Site Tools & Equipment (QR)** | Unique QR code lookup & scanner, equipment allocation with **conflict prevention (`BR-012` / `TC-022`)**, return verification, inter-project movement history, and maintenance/damage reporting. | `FR-M04-001` to `010`, `BR-011` to `BR-014` |
| **M05: Visual Project & Subcontractor Progress** | Tracks Planned vs. Actual completion across milestones and subcontractors, daily progress updates, milestone photo gallery, and flags higher budget burn vs. completion for investigation (`FR-M05-008`). | `FR-M05-001` to `008`, `BR-015` |
| **M06: AI Risk Copilot & Scenario Simulator** | Grounded natural-language AI assistant, automatic cross-module risk register (`Likelihood × Impact` 1–25 score), non-mutating **What-If Scenario Simulator (`BR-020`)**, and Explainable AI citations. | `FR-M06-001` to `009`, `BR-016` to `BR-020` |
