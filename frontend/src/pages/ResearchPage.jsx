import React from "react";
import QueryInput from "../components/QueryInput.jsx";
import AgentGraph from "../components/AgentGraph.jsx";
import ResearchResult from "../components/ResearchResult.jsx";
import { useResearchStore } from "../store/researchStore.js";

function StatusBanner({ status, error }) {
  if (status === "running") {
    return (
      <div className="glass-panel p-4 border-accent/20 flex items-center gap-3 animate-pulse-slow">
        <div className="w-3 h-3 rounded-full bg-accent animate-spin-slow border-2 border-accent border-t-transparent" />
        <div>
          <p className="font-display font-semibold text-sm text-text-primary">Agents processing your query...</p>
          <p className="font-mono text-xs text-text-dim">Multi-agent pipeline active · Real-time FAISS retrieval</p>
        </div>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="glass-panel p-4 border-danger/20 bg-danger/5">
        <p className="font-display font-semibold text-sm text-danger mb-1">Research Failed</p>
        <p className="font-mono text-xs text-text-dim">{error}</p>
      </div>
    );
  }
  return null;
}

export default function ResearchPage() {
  const { activeNode, agentLogs, result, status, error } = useResearchStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      {/* Left column */}
      <div className="flex flex-col gap-4">
        <QueryInput />
        <StatusBanner status={status} error={error} />
        {result && <ResearchResult result={result} />}

        {/* Idle state */}
        {status === "idle" && !result && (
          <div className="glass-panel p-8 text-center">
            <div className="text-4xl mb-3 opacity-30">⬡</div>
            <p className="font-display font-semibold text-text-secondary mb-1">
              Ready to research
            </p>
            <p className="font-mono text-xs text-text-dim max-w-sm mx-auto">
              Enter a query above. The Planner, Retriever, Summarizer, and Validator agents will coordinate via LangGraph to produce a validated answer.
            </p>
          </div>
        )}
      </div>

      {/* Right column — Agent Pipeline */}
      <div className="flex flex-col gap-4">
        <AgentGraph activeNode={activeNode} agentLogs={agentLogs} />

        {/* Tech stack info */}
        <div className="glass-panel p-4">
          <p className="font-mono text-xs text-text-dim mb-3">TECH STACK</p>
          <div className="space-y-1.5">
            {[
              ["Orchestration", "LangGraph JS"],
              ["LLM", "Groq · llama-3.3-70b"],
              ["Vector DB", "FAISS (HF Embeddings)"],
              ["Framework", "LangChain JS"],
              ["Backend", "Node.js · Express"],
              ["Frontend", "React · Zustand"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-text-dim">{label}</span>
                <span className="font-mono text-[10px] text-accent">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
