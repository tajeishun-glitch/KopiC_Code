"use client";

import React, { useState, useRef, useEffect } from "react";
import { SeedNotification, SeedUser } from "@/lib/seed-data";

interface TopRightNotificationCenterProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentUser: SeedUser;
  notifications: SeedNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onApprovePurchaseRequest: (notificationId: string) => void;
  onRejectPurchaseRequest: (notificationId: string, reason: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export function TopRightNotificationCenter({
  isOpen,
  onToggle,
  onClose,
  currentUser,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onApprovePurchaseRequest,
  onRejectPurchaseRequest,
  onNavigateTab,
}: TopRightNotificationCenterProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isManager =
    currentUser.role === "PROJECT_MANAGER" ||
    currentUser.role === "SITE_MANAGER";

  // Rejection state: tracking which notification is being rejected and the reason text
  const [rejectingNotifId, setRejectingNotifId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "MY_REQUESTS" | "ALERTS">("ALL");

  // Dismiss on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Notifications relevant to current user
  const userRelevantNotifs = notifications.filter((n) => {
    if (n.targetUserId && n.targetUserId === currentUser.id) return true;
    if (n.purchaseRequest?.requesterId === currentUser.id) return true;
    if (n.targetRoles && n.targetRoles.includes(currentUser.role)) return true;
    return false;
  });

  // Unread count
  const unreadCount = userRelevantNotifs.filter((n) => !n.isRead).length;

  // Pending PRs count for manager
  const pendingApprovals = userRelevantNotifs.filter(
    (n) => n.purchaseRequest && n.purchaseRequest.status === "PENDING"
  );
  const pendingCount = pendingApprovals.length;

  // Staff's own purchase requests
  const myRequests = userRelevantNotifs.filter(
    (n) => n.purchaseRequest && (n.purchaseRequest.requesterId === currentUser.id || !isManager)
  );

  // Filtered notifications to display
  const displayedNotifs = userRelevantNotifs.filter((n) => {
    if (activeFilter === "PENDING") {
      return n.purchaseRequest && n.purchaseRequest.status === "PENDING";
    }
    if (activeFilter === "MY_REQUESTS") {
      return !!n.purchaseRequest;
    }
    if (activeFilter === "ALERTS") {
      return !n.purchaseRequest;
    }
    return true;
  });

  const handleConfirmReject = (notifId: string) => {
    const finalReason = rejectReason.trim() || "Disapproved by Project Manager upon procurement budget review";
    onRejectPurchaseRequest(notifId, finalReason);
    setRejectingNotifId(null);
    setRejectReason("");
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Top Right Bell Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`relative px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md group ${
          isOpen
            ? "bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/30"
            : isManager && pendingCount > 0
            ? "bg-amber-500/15 text-amber-300 border-amber-500/60 animate-pulse"
            : unreadCount > 0
            ? "bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700"
            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
        }`}
        title={`Notifications & Approvals (${unreadCount} unread)`}
      >
        <span className="text-sm group-hover:scale-110 transition-transform">🔔</span>
        <span className="hidden sm:inline">Notifications</span>

        {/* Pending approvals badge for manager */}
        {isManager && pendingCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500 text-slate-950 shadow-sm">
            {pendingCount} PR
          </span>
        )}

        {/* Unread badge count */}
        {unreadCount > 0 && (!isManager || pendingCount === 0) && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-600 text-white animate-pulse shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[460px] max-w-[94vw] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🔔</span>
                <h3 className="font-extrabold text-white text-sm">
                  Notifications &amp; Approvals
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <span>Logged in as:</span>
                <strong className="text-amber-400 font-mono">{currentUser.name}</strong>
                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUser.role.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition-all border border-slate-700"
                  title="Mark all notifications as read"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs"
                title="Close panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="bg-slate-950/70 px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === "ALL"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({userRelevantNotifs.length})
            </button>

            {isManager && (
              <button
                onClick={() => setActiveFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  activeFilter === "PENDING"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : pendingCount > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>⏳ Approvals</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-600 text-white font-mono">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {!isManager && (
              <button
                onClick={() => setActiveFilter("MY_REQUESTS")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeFilter === "MY_REQUESTS"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                My Requests ({myRequests.length})
              </button>
            )}

            <button
              onClick={() => setActiveFilter("ALERTS")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === "ALERTS"
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Site Alerts
            </button>
          </div>

          {/* Manager Role Notice Banner */}
          {isManager && (
            <div className="bg-amber-500/10 px-4 py-2 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Manager Approval Authorized</span>
              </span>
              <span className="text-[10px] text-slate-400">
                You can review &amp; approve worker purchase requests
              </span>
            </div>
          )}

          {/* Staff Role Notice Banner */}
          {!isManager && (
            <div className="bg-sky-500/10 px-4 py-2 border-b border-sky-500/20 flex items-center justify-between text-[11px] text-sky-300 font-mono">
              <span className="flex items-center gap-1.5">
                <span>👷</span>
                <span>Staff Request Tracker</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Shows real-time manager approval status of your requests
              </span>
            </div>
          )}

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
            {displayedNotifs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">📭</span>
                <p className="text-xs font-semibold">No notifications in this filter.</p>
                <p className="text-[11px] text-slate-500">
                  New alerts and purchase request updates will appear here in real time.
                </p>
              </div>
            ) : (
              displayedNotifs.map((n) => {
                const isPR = !!n.purchaseRequest;
                const pr = n.purchaseRequest;
                const isPending = pr?.status === "PENDING";
                const isApproved = pr?.status === "APPROVED";
                const isRejected = pr?.status === "REJECTED";

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) onMarkAsRead(n.id);
                    }}
                    className={`pt-2.5 first:pt-0 p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      !n.isRead
                        ? "bg-slate-950/80 border-amber-500/40 shadow-sm"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                    }`}
                  >
                    {/* Top Row: Priority Badge & Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            APPROVAL REQUIRED
                          </span>
                        ) : isApproved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ✓ APPROVED
                          </span>
                        ) : isRejected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            ✕ REJECTED
                          </span>
                        ) : (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              n.priority === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                : n.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                            }`}
                          >
                            {n.priority}
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-slate-400">
                          {n.alertCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">
                          {n.createdAt}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Unread" />
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-bold text-white text-xs leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                        {n.description}
                      </p>
                    </div>

                    {/* Purchase Request Details Block */}
                    {isPR && pr && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-mono font-bold text-amber-300">
                            🏢 {pr.vendorName} ({pr.vendorCode})
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {pr.urgency} URGENCY
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                          <div>
                            Material: <strong className="text-slate-200">{pr.materialCode}</strong>
                          </div>
                          <div>
                            Qty: <strong className="text-slate-200">{pr.quantity} Units</strong>
                          </div>
                          <div>
                            Target Date: <strong className="text-slate-200">{pr.targetDate || "Next 7 Days"}</strong>
                          </div>
                          <div>
                            Requester: <strong className="text-slate-200">{pr.requesterName}</strong>
                          </div>
                        </div>

                        {pr.notes && (
                          <div className="text-[10px] text-slate-400 italic bg-slate-950 p-1.5 rounded border border-slate-800/80">
                            &quot;{pr.notes}&quot;
                          </div>
                        )}

                        {/* Status Banners for Completed Requests */}
                        {isApproved && (
                          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono flex items-center justify-between">
                            <span>✓ Approved by: <strong>{pr.decisionBy}</strong> ({pr.decisionDate})</span>
                            <span className="font-bold">ERP Synced</span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-mono space-y-0.5">
                            <div className="font-bold">✕ Disapproved by {pr.decisionBy} ({pr.decisionDate})</div>
                            {pr.rejectionReason && (
                              <div className="text-slate-300">Reason: {pr.rejectionReason}</div>
                            )}
                          </div>
                        )}

                        {/* Manager Approval Action Buttons */}
                        {isPending && isManager && (
                          <div className="pt-2 border-t border-slate-800 space-y-2">
                            {rejectingNotifId === n.id ? (
                              <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-rose-500/40 animate-fadeIn">
                                <label className="block text-[10px] font-mono font-bold text-rose-300">
                                  State Rejection Reason (Sent to {pr.requesterName}):
                                </label>
                                <textarea
                                  rows={2}
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="e.g. Budget limit reached; surplus rebar available at Yard 2..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingNotifId(null);
                                      setRejectReason("");
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmReject(n.id)}
                                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black shadow transition-all"
                                  >
                                    Confirm Rejection
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onApprovePurchaseRequest(n.id)}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>✅ Approve Request</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingNotifId(n.id);
                                    setRejectReason("");
                                  }}
                                  className="py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  <span>❌ Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Staff View: Locked state explaining only manager can approve */}
                        {isPending && !isManager && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono flex items-center justify-between">
                            <span>⏳ Awaiting Project Manager Approval</span>
                            <span className="text-slate-400 text-[9px]">Submitted by you</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick navigation link if related to M03 or inventory */}
                    {n.targetModule === "M03" && onNavigateTab && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateTab("M03_SUPPLIERS");
                            onClose();
                          }}
                          className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline"
                        >
                          View in Supplier Management →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Section 15 • Real-Time Notification Service</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("NOTIFICATIONS_AUDIT");
                  onClose();
                }}
                className="text-amber-400 hover:text-amber-300 font-bold"
              >
                Full Audit Trail →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
