import React from "react";

const AGENTS = [
  { id: "planner", label: "Planner", color: "#a78bfa", icon: "◈", desc: "Decomposes query into research plan" },
  { id: "retriever", label: "Retriever", color: "#34d399", icon: "⬡", desc: "Semantic FAISS chunk retrieval" },
  { id: "summarizer", label: "Summarizer", color: "#fbbf24", icon: "◉", desc: "Synthesizes retrieved context" },
  { id: "validator", label: "Validator", color: "#f87171", icon: "⬟", desc: "Hallucination detection & re-retrieval" },
];

function StatusDot({ status }) {
  if (status === "running") return <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />;
  if (status === "completed") return <span className="w-2 h-2 rounded-full bg-success inline-block" />;
  if (status === "fallback") return <span className="w-2 h-2 rounded-full bg-warning inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-border inline-block" />;
}

export default function AgentGraph({ activeNode, agentLogs = [] }) {
  const getLog = (id) => agentLogs.find((l) => l.agent?.toLowerCase() === id);

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-text-primary text-sm">Agent Pipeline</h3>
        <span className="font-mono text-xs text-text-dim">LangGraph State Graph</span>
      </div>

      <div className="flex flex-col gap-2">
        {AGENTS.map((agent, idx) => {
          const log = getLog(agent.id);
          const isActive = activeNode === agent.id;
          const isDone = !!log;

          return (
            <div key={agent.id}>
              {/* Agent node */}
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? "border-accent/50 bg-accent/5 shadow-[0_0_12px_rgba(0,212,255,0.1)]"
                    : isDone
                    ? "border-border bg-surface/50"
                    : "border-border/50 bg-surface/20 opacity-50"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                    isActive ? "node-active" : ""
                  }`}
                  style={{
                    background: `${agent.color}18`,
                    border: `1px solid ${agent.color}40`,
                    color: agent.color,
                  }}
                >
                  {agent.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm text-text-primary">{agent.label}</span>
                    <StatusDot status={isActive ? "running" : log?.status} />
                  </div>
                  <p className="font-mono text-xs text-text-dim truncate">{agent.desc}</p>
                </div>

                {/* Meta */}
                {log && (
                  <div className="text-right flex-shrink-0">
                    {log.reRetrieval && (
                      <span className="tag border-warning/40 text-warning text-[10px]">re-fetch</span>
                    )}
                    {log.output?.chunksRetrieved !== undefined && (
                      <div className="font-mono text-xs text-text-dim">{log.output.chunksRetrieved} chunks</div>
                    )}
                    {log.output?.confidenceScore !== undefined && (
                      <div
                        className="font-mono text-xs"
                        style={{ color: log.output.confidenceScore > 0.75 ? "#10b981" : "#f59e0b" }}
                      >
                        {(log.output.confidenceScore * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Edge connector */}
              {idx < AGENTS.length - 1 && (
                <div className="flex items-center ml-4 gap-2 py-0.5">
                  <div
                    className={`w-px h-5 transition-all duration-500 ${
                      isDone ? "bg-border" : "bg-border/30"
                    }`}
                  />
                  {idx === 2 && (
                    <span className="font-mono text-[9px] text-warning opacity-70">
                      ↩ re-retrieve if hallucinated
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-3">
        {[
          { color: "#00d4ff", label: "Active" },
          { color: "#10b981", label: "Done" },
          { color: "#f59e0b", label: "Fallback" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="font-mono text-[10px] text-text-dim">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
