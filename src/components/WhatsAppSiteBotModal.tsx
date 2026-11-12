"use client";

import React, { useState } from "react";

interface WhatsAppSiteBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user" | "system";
  text: string;
  time: string;
  badge?: string;
}

export const WhatsAppSiteBotModal: React.FC<WhatsAppSiteBotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"QR_LOGIN" | "SITE_BOT">("SITE_BOT");
  const [isQrScanned, setIsQrScanned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "system",
      text: "🔒 Messages and calls are end-to-end encrypted. Gamuda Site Bot connected.",
      time: "10:00 AM",
    },
    {
      id: "msg-2",
      sender: "bot",
      text: "👋 Hello Site Supervisor! I am the Gamuda BuildSmart AI WhatsApp Bot. You can check live site stock, request crane support, report safety hazards, or dispatch drone sweeps directly through WhatsApp.",
      time: "10:01 AM",
      badge: "Gamuda Bot • Verified",
    },
    {
      id: "msg-3",
      sender: "bot",
      text: "📢 [LIVE DISPATCH] 2x Ready-Mix Concrete Mixers (Southern Batching Plant) have cleared Main Security Entrance Weighbridge. Headed to Zone B Concourse Slab.",
      time: "10:14 AM",
      badge: "Logistics Auto-Alert",
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: userText,
      time: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    // Automated Site Bot response logic
    setTimeout(() => {
      let botReply = "";
      const lower = userText.toLowerCase();

      if (lower.includes("stock") || lower.includes("rebar") || lower.includes("cement") || lower.includes("inventory")) {
        botReply = "📊 [LIVE INVENTORY] High-Tensile Rebar (Y25): 142 MT (Healthy, 8.2 days buffer). Ready-Mix Concrete C40: 640 m³ on order. Plywood formwork stock at 92% capacity at Laydown Zone D.";
      } else if (lower.includes("drone") || lower.includes("fly") || lower.includes("inspection")) {
        botReply = "🛸 [DRONE DISPATCHED] DJI Matrice 300 RTK drone assigned to sweep Zone A Substructure. Live telemetry stream available via top-right Drone Vision icon.";
      } else if (lower.includes("safety") || lower.includes("hazard") || lower.includes("emergency")) {
        botReply = "🚨 [SAFETY OFFICER NOTIFIED] Site HSE Officer En. Faizal alerted (+6012-345-6789). Assembly Point #1 designated active.";
      } else if (lower.includes("vendor") || lower.includes("purchase") || lower.includes("order")) {
        botReply = "📋 [PURCHASE REQ] PO-2026-088 for Southern Steel Works is currently Under Review. Estimated delivery lead time: 24 hours.";
      } else {
        botReply = `🤖 [BUILDSMART BOT] Received: "${userText}". Synced with site central dashboard and logged in supervisor channel. Type "stock", "drone", or "safety" for quick commands.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          badge: "Gamuda Bot • Verified",
        },
      ]);
    }, 600);
  };

  const quickPrompts = [
    "Check Rebar Stock",
    "Request Drone Inspection",
    "Concrete Delivery ETA",
    "Report Safety Defect",
  ];

  return (
    <div
      className={`fixed z-50 transition-all duration-200 ${
        isMinimized
          ? "bottom-4 right-4 sm:right-6 w-72 h-14 bg-emerald-700 text-white rounded-2xl shadow-2xl border border-emerald-400 flex items-center justify-between px-4 cursor-pointer"
          : "bottom-4 right-2 sm:right-6 w-[94vw] sm:w-[440px] md:w-[460px] h-[72vh] min-h-[520px] max-h-[640px] bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border-2 border-emerald-500/80 flex flex-col overflow-hidden ring-4 ring-emerald-500/20"
      }`}
    >
      {/* Minimized Bar */}
      {isMinimized ? (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="font-bold text-sm tracking-wide">WhatsApp Site Bot</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-emerald-800 rounded text-emerald-100"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-900 border border-emerald-300 flex items-center justify-center text-lg font-bold shadow-inner">
                💬
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-tight">Gamuda Site WhatsApp Bot</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-800 text-emerald-200 border border-emerald-400">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                  Connected to Site Command • Instant Sync
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* External WhatsApp Web Link */}
              <a
                href="https://web.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Open WhatsApp Web in external tab"
                className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-xs text-emerald-100 flex items-center gap-1 transition-colors border border-emerald-600"
              >
                <span>🌐</span>
                <span className="hidden sm:inline text-[10px] font-mono">Web</span>
              </a>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize WhatsApp window"
                className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-100 text-xs"
              >
                🗕
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-emerald-800 text-emerald-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Subheader / Tabs */}
          <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("SITE_BOT")}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "SITE_BOT"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🤖</span>
                <span>Site Bot Chat</span>
              </button>

              <button
                onClick={() => setActiveTab("QR_LOGIN")}
                className={`px-2.5 py-1 rounded-md font-mono font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "QR_LOGIN"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span>📱</span>
                <span>WhatsApp Web QR</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              Site Bot v2.4
            </span>
          </div>

          {/* Content Area */}
          {activeTab === "QR_LOGIN" ? (
            /* WhatsApp Web QR Login Screen */
            <div className="flex-1 bg-slate-900 p-4 flex flex-col items-center justify-center text-center overflow-y-auto">
              <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-emerald-500/60 mb-3 relative group">
                {/* Simulated QR Code Canvas/SVG */}
                <svg
                  className="w-48 h-48 sm:w-52 sm:h-52 text-slate-900"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <rect width="100" height="100" fill="#ffffff" />
                  {/* Position detection patterns */}
                  <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
                  <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="13" width="12" height="12" fill="#0f172a" />

                  <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
                  <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="75" y="13" width="12" height="12" fill="#0f172a" />

                  <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
                  <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="75" width="12" height="12" fill="#0f172a" />

                  {/* QR Data Pattern bits */}
                  <rect x="38" y="10" width="8" height="6" fill="#0f172a" />
                  <rect x="50" y="8" width="6" height="8" fill="#0f172a" />
                  <rect x="42" y="22" width="18" height="6" fill="#0f172a" />
                  <rect x="10" y="38" width="12" height="6" fill="#0f172a" />
                  <rect x="26" y="42" width="6" height="12" fill="#0f172a" />
                  <rect x="38" y="38" width="24" height="24" fill="#0f172a" />
                  <rect x="42" y="42" width="16" height="16" fill="#ffffff" />
                  <rect x="46" y="46" width="8" height="8" fill="#10b981" />
                  <rect x="68" y="38" width="14" height="6" fill="#0f172a" />
                  <rect x="86" y="42" width="6" height="16" fill="#0f172a" />
                  <rect x="38" y="68" width="8" height="18" fill="#0f172a" />
                  <rect x="52" y="72" width="16" height="6" fill="#0f172a" />
                  <rect x="72" y="68" width="12" height="12" fill="#0f172a" />
                  <rect x="88" y="82" width="6" height="8" fill="#0f172a" />
                </svg>

                {/* Animated Scanner Laser */}
                <div className="absolute inset-x-3 top-3 h-1 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse"></div>
              </div>

              <h4 className="text-white font-bold text-sm mb-1 flex items-center justify-center gap-1.5">
                <span>Scan QR code with your WhatsApp app</span>
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mb-3">
                Open WhatsApp on your phone &gt; Settings / Menu &gt; Linked Devices &gt; Point camera at this screen.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <button
                  onClick={() => {
                    setIsQrScanned(true);
                    setActiveTab("SITE_BOT");
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-colors shadow-lg"
                >
                  ✓ Simulate Scan & Connect
                </button>
                <a
                  href="https://web.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  Open WhatsApp Web ↗
                </a>
              </div>
            </div>
          ) : (
            /* Site Bot Live Chat Screen */
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {/* Chat Message List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === "user"
                        ? "items-end"
                        : m.sender === "system"
                        ? "items-center"
                        : "items-start"
                    }`}
                  >
                    {m.sender === "system" ? (
                      <div className="bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full text-[10px] text-center my-1 max-w-[85%] border border-slate-700/50">
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] p-2.5 rounded-2xl shadow-md ${
                          m.sender === "user"
                            ? "bg-emerald-700 text-white rounded-br-xs"
                            : "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700"
                        }`}
                      >
                        {m.badge && (
                          <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1 flex items-center gap-1">
                            <span>✓✓</span>
                            <span>{m.badge}</span>
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <div
                          className={`text-[9px] mt-1 text-right font-mono ${
                            m.sender === "user" ? "text-emerald-200" : "text-slate-400"
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">⚡ Quick:</span>
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInputMessage(q);
                    }}
                    className="flex-shrink-0 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-emerald-900/60 border border-slate-700 hover:border-emerald-500/50 text-[10px] text-slate-300 hover:text-emerald-300 font-mono transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Site Bot (e.g. check stock, dispatch drone)..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-md"
                >
                  <span>Send</span>
                  <span>➤</span>
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
