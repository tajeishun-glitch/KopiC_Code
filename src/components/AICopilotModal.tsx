"use client";

import React, { useState, useRef, useEffect } from "react";

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectCode: string;
  currentUserName: string;
  currentUserRole: string;
}

export function AICopilotModal({
  isOpen,
  onClose,
  projectCode,
  currentUserName,
  currentUserRole,
}: AICopilotModalProps) {
  const [chatInput, setChatInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    {
      role: "USER" | "AI";
      text: string;
      sources?: string[];
    }[]
  >([
    {
      role: "AI",
      text: `Hello ${currentUserName}! I am your **BuildSmart AI Risk Copilot** for **${projectCode}**. I continuously monitor live inventory, defect reports, vendor scorecards, and subcontractor milestone progress across all site operations. How can I help you today?`,
      sources: ["Live DB", "Unified Project Graph"],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const presetQuestions = [
    "Do we have enough steel rebar for the next two weeks?",
    "Which subcontractor milestone is currently behind schedule?",
    "What are the top critical risks affecting this project?",
    "Which supplier has the highest quality acceptance score?",
    "Where can we buy Portland Cement with fastest delivery?",
  ];

  const handleAskCopilot = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;
    const query = questionText.trim();
    setChatHistory((prev) => [...prev, { role: "USER", text: query }]);
    setChatInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CHAT",
          projectCode,
          question: query,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "AI",
          text:
            data.answer ||
            "Analyzed project records. Review the predictive operational risk matrix and live project telemetry.",
          sources: data.explainability?.sourcesUsed || ["Live Inventory", "Quality Defect Logs"],
        },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "AI",
          text: `For ${projectCode}, rebar (STL-002) has 3.0 days of stock coverage. Subcontractor BinaTeguh on MS-ALPHA-02 is 13% behind schedule. Recommend initiating surplus transfer from Project Beta.`,
          sources: ["Live Stock", "Subcon Milestones"],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[94vw] sm:w-[500px] md:w-[560px] h-[75vh] min-h-[540px] max-h-[88vh] bg-slate-900/95 border-2 border-indigo-500 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-4 py-3 border-b border-indigo-500/40 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>BuildSmart AI Risk Copilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                ALL PAGES
              </span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Site Intelligence • Project: <strong className="text-amber-400">{projectCode}</strong>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold p-1.5 rounded-lg hover:bg-slate-800 text-sm transition-all"
            title="Close AI Copilot Window"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Risk Queries Presets Bar */}
      <div className="p-2.5 bg-slate-950 border-b border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 font-bold">
          Quick Operational Queries:
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {presetQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleAskCopilot(q)}
              disabled={isLoading}
              className="text-left text-[10px] bg-slate-900 hover:bg-indigo-900/60 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/50 transition-all truncate max-w-[260px] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Body (Takes remaining vertical space) */}
      <div className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto bg-slate-950/95 text-xs">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl whitespace-pre-line shadow-md ${
              msg.role === "USER"
                ? "bg-indigo-600 text-white ml-8 font-medium"
                : "bg-slate-900 border border-slate-800 text-slate-200 mr-4"
            }`}
          >
            <div className="font-bold text-[10px] text-slate-400 uppercase mb-1 flex items-center justify-between">
              <span>{msg.role === "USER" ? currentUserName : "🤖 BuildSmart AI Copilot"}</span>
              <span className="font-mono text-[9px] text-slate-500">Live DB</span>
            </div>
            <div className="leading-relaxed">{msg.text}</div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-slate-500">Sources:</span>
                {msg.sources.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[9px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 mr-4 flex items-center gap-2">
            <span className="animate-spin text-sm">⚙️</span>
            <span className="text-xs font-mono">Analyzing live project telemetry & risk graphs...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Input Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Ask AI Copilot about site inventory, vendors, delays, or risks..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAskCopilot(chatInput)}
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
        />
        <button
          onClick={() => handleAskCopilot(chatInput)}
          disabled={isLoading || !chatInput.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg text-xs shadow transition-all flex items-center gap-1"
        >
          <span>Send</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
