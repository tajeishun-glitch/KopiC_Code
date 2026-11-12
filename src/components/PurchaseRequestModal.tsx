"use client";

import React, { useState } from "react";
import { SeedVendor, SeedMaterial } from "@/lib/seed-data";

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: SeedVendor | null;
  projectCode: string;
  materials: SeedMaterial[];
  onSubmitRequest: (payload: {
    vendorCode: string;
    vendorName: string;
    materialCode: string;
    quantity: number;
    targetDate: string;
    urgency: "NORMAL" | "URGENT" | "EMERGENCY";
    notes: string;
  }) => void;
}

export function PurchaseRequestModal({
  isOpen,
  onClose,
  vendor,
  projectCode,
  materials,
  onSubmitRequest,
}: PurchaseRequestModalProps) {
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(
    vendor?.products[0]?.materialCode || materials[0]?.materialCode || "STL-002"
  );
  const [quantity, setQuantity] = useState<number>(50);
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [urgency, setUrgency] = useState<"NORMAL" | "URGENT" | "EMERGENCY">(
    "NORMAL"
  );
  const [notes, setNotes] = useState<string>(
    "Urgent site delivery to Main Storage Yard Gate 2 for scheduled concreting works."
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen || !vendor) return null;

  const mat =
    materials.find((m) => m.materialCode === selectedMaterialCode) ||
    materials[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onSubmitRequest({
        vendorCode: vendor.vendorCode,
        vendorName: vendor.name,
        materialCode: selectedMaterialCode,
        quantity,
        targetDate,
        urgency,
        notes,
      });
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-lg">
              📝
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">
                  Send Purchase Request
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {vendor.performance.evaluationStatus} VENDOR
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                To: <strong className="text-white">{vendor.name}</strong> ({vendor.vendorCode}) • Project:{" "}
                <span className="text-amber-400 font-mono font-bold">
                  {projectCode}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {submittedSuccess ? (
            <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="text-4xl">✅</div>
              <h4 className="text-lg font-bold text-white">
                Purchase Request Transmitted!
              </h4>
              <p className="text-xs text-slate-300">
                Official RFQ/Purchase order request has been logged and sent to{" "}
                <strong className="text-emerald-300">{vendor.name}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 font-mono">
                    SELECT MATERIAL
                  </label>
                  <select
                    value={selectedMaterialCode}
                    onChange={(e) => setSelectedMaterialCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    {materials.map((m) => (
                      <option key={m.materialCode} value={m.materialCode}>
                        [{m.materialCode}] {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 font-mono">
                    REQUIRED QUANTITY ({mat?.unit || "Units"})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 font-mono">
                    TARGET DELIVERY DATE
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 font-mono">
                    URGENCY LEVEL
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(
                        e.target.value as "NORMAL" | "URGENT" | "EMERGENCY"
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="NORMAL">Standard Schedule</option>
                    <option value="URGENT">Urgent Site Reorder</option>
                    <option value="EMERGENCY">Emergency Critical Path</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 font-mono">
                  SITE INSTRUCTIONS & DELIVERY NOTES
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Standard Lead Time:{" "}
                  <strong className="text-white">
                    {vendor.products[0]?.leadTimeDays ?? 3} days
                  </strong>
                </span>
                <span>
                  Delivery to:{" "}
                  <strong className="text-amber-400">{projectCode} Main Yard</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? "Transmitting Request..." : "Submit Purchase Request →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
