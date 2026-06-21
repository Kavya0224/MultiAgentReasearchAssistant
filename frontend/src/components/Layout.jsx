import React from "react";
import { useResearchStore } from "../store/researchStore.js";

const TABS = [
  { id: "research", label: "Research", icon: "⬡" },
  { id: "documents", label: "Knowledge Base", icon: "◈" },
  { id: "history", label: "History", icon: "◎" },
];

export default function Layout({ children }) {
  const { activeTab, setActiveTab, status } = useResearchStore();

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-bg font-mono font-bold text-sm">
              R
            </div>
            <span className="font-display font-semibold text-text-primary tracking-tight">
              ResearchOS
            </span>
            <span className="tag border-border text-text-dim hidden sm:inline-flex">
              v1.0 · LangGraph
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-display text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-accent/10 text-accent border border-accent/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "running" ? "bg-accent animate-pulse" : "bg-success"
              }`}
            />
            <span className="font-mono text-xs text-text-dim hidden sm:inline">
              {status === "running" ? "Processing" : "Ready"}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-4 text-center">
        <span className="font-mono text-xs text-text-dim">
          Multi-Agent Research Assistant · LangGraph JS · FAISS · Groq
        </span>
      </footer>
    </div>
  );
}
