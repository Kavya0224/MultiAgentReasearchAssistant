import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TAB_IDS = ["summary", "plan", "chunks", "validation", "logs"];
const TAB_LABELS = {
  summary: "Summary",
  plan: "Research Plan",
  chunks: "Retrieved Chunks",
  validation: "Validation",
  logs: "Agent Logs",
};

function Badge({ children, color = "accent" }) {
  const colors = {
    accent: "border-accent/30 text-accent bg-accent/5",
    success: "border-success/30 text-success bg-success/5",
    warning: "border-warning/30 text-warning bg-warning/5",
    danger: "border-danger/30 text-danger bg-danger/5",
    purple: "border-purple-400/30 text-purple-400 bg-purple-400/5",
  };
  return (
    <span className={`tag ${colors[color] || colors.accent} font-mono text-[10px]`}>{children}</span>
  );
}

function SummaryTab({ result }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary || "No summary generated."}</ReactMarkdown>
    </div>
  );
}

function PlanTab({ plan }) {
  if (!plan) return <p className="text-text-dim font-mono text-sm">No plan available.</p>;
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs text-text-dim mb-1">MAIN OBJECTIVE</p>
        <p className="text-text-primary font-body">{plan.mainObjective}</p>
      </div>
      <div>
        <p className="font-mono text-xs text-text-dim mb-2">SUB-QUERIES ({plan.subQueries?.length})</p>
        <ol className="space-y-2">
          {plan.subQueries?.map((q, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-mono text-accent text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-text-secondary text-sm">{q}</span>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="font-mono text-xs text-text-dim mb-2">SEARCH KEYWORDS</p>
        <div className="flex flex-wrap gap-2">
          {plan.searchKeywords?.map((kw, i) => (
            <Badge key={i} color="purple">{kw}</Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <div>
          <p className="font-mono text-xs text-text-dim mb-1">FORMAT</p>
          <Badge color="accent">{plan.expectedOutputFormat}</Badge>
        </div>
        <div>
          <p className="font-mono text-xs text-text-dim mb-1">COMPLEXITY</p>
          <Badge color={plan.complexity === "high" ? "danger" : plan.complexity === "medium" ? "warning" : "success"}>
            {plan.complexity}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ChunksTab({ chunks }) {
  const [expanded, setExpanded] = useState(null);
  if (!chunks?.length) return <p className="text-text-dim font-mono text-sm">No chunks retrieved.</p>;
  return (
    <div className="space-y-3">
      {chunks.map((chunk, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-mono text-xs text-text-dim truncate">{chunk.metadata?.source || "Unknown"}</span>
              <Badge color={chunk.score < 1 ? "success" : chunk.score < 2 ? "accent" : "warning"}>
                score: {chunk.score?.toFixed(3)}
              </Badge>
            </div>
            <span className="text-text-dim text-xs flex-shrink-0 ml-2">{expanded === i ? "▲" : "▼"}</span>
          </button>
          {expanded === i && (
            <div className="border-t border-border p-3 bg-bg/50">
              <p className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                {chunk.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ValidationTab({ validation }) {
  if (!validation) return <p className="text-text-dim font-mono text-sm">No validation data.</p>;
  const scoreColor = validation.confidenceScore > 0.8 ? "success" : validation.confidenceScore > 0.6 ? "warning" : "danger";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
        <div className="text-center">
          <div className={`text-3xl font-display font-bold text-${scoreColor}`}>
            {(validation.confidenceScore * 100).toFixed(0)}%
          </div>
          <div className="font-mono text-xs text-text-dim">Confidence</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge color={validation.isValid ? "success" : "danger"}>
              {validation.isValid ? "✓ VALID" : "✗ INVALID"}
            </Badge>
            <Badge color="accent">{validation.recommendation}</Badge>
          </div>
          <p className="text-text-secondary text-sm">{validation.validatorNotes}</p>
        </div>
      </div>
      {validation.issues?.length > 0 && (
        <div>
          <p className="font-mono text-xs text-text-dim mb-2">ISSUES FOUND ({validation.issues.length})</p>
          <div className="space-y-2">
            {validation.issues.map((issue, i) => (
              <div key={i} className="border border-warning/20 rounded-lg p-3 bg-warning/5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="warning">{issue.type}</Badge>
                </div>
                <p className="text-text-secondary text-sm mb-1">{issue.description}</p>
                <p className="font-mono text-xs text-text-dim">Fix: {issue.suggestedFix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {validation.hallucinatedClaims?.length > 0 && (
        <div>
          <p className="font-mono text-xs text-danger mb-2">HALLUCINATED CLAIMS</p>
          <div className="space-y-1">
            {validation.hallucinatedClaims.map((claim, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="text-danger">✗</span>
                <span className="text-text-secondary">{claim}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LogsTab({ logs }) {
  if (!logs?.length) return <p className="text-text-dim font-mono text-sm">No logs available.</p>;
  const agentColors = { Planner: "#a78bfa", Retriever: "#34d399", Summarizer: "#fbbf24", Validator: "#f87171" };
  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 border border-border rounded-lg p-3">
          <div
            className="w-1 rounded-full flex-shrink-0"
            style={{ background: agentColors[log.agent] || "#4b6070" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-semibold text-sm text-text-primary">{log.agent}</span>
              <Badge color={log.status === "completed" ? "success" : log.status === "fallback" ? "warning" : "danger"}>
                {log.status}
              </Badge>
              {log.reRetrieval && <Badge color="warning">re-retrieved</Badge>}
              <span className="font-mono text-[10px] text-text-dim ml-auto">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {log.output && (
              <pre className="font-mono text-xs text-text-dim bg-bg rounded p-2 overflow-x-auto">
                {JSON.stringify(log.output, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResearchResult({ result }) {
  const [activeTab, setActiveTab] = useState("summary");

  if (!result) return null;

  const tabContent = {
    summary: <SummaryTab result={result} />,
    plan: <PlanTab plan={result.plan} />,
    chunks: <ChunksTab chunks={result.retrievedChunks} />,
    validation: <ValidationTab validation={result.validation} />,
    logs: <LogsTab logs={result.agentLogs} />,
  };

  return (
    <div className="glass-panel overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="font-mono text-xs text-success">RESEARCH COMPLETE</span>
          {result.retrievalAttempts > 1 && (
            <Badge color="warning">{result.retrievalAttempts} retrieval attempts</Badge>
          )}
        </div>
        <p className="font-body text-text-secondary text-sm truncate">{result.query}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TAB_IDS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-mono text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab
                ? "text-accent border-b-2 border-accent"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === "chunks" && result.retrievedChunks?.length
              ? ` (${result.retrievedChunks.length})`
              : ""}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">{tabContent[activeTab]}</div>
    </div>
  );
}
