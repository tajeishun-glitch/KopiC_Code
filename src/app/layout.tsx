import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildSmart AI | Gamuda Construction Site Intelligence & Risk Copilot",
  description:
    "Centralized AI-Powered Construction Material Recognition, Live Stock Inventory, Worker Defect Reflection & Vendor Evaluation, QR Equipment Tracking, Visual Subcontractor Progress, and Predictive Risk Copilot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
