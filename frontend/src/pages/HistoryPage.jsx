import React from "react";
import { useResearchStore } from "../store/researchStore.js";

export default function HistoryPage() {
  const { history, loadHistoryEntry, setActiveTab } = useResearchStore();

  const handleLoad = (entry) => {
    loadHistoryEntry(entry);
    setActiveTab("research");
  };

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4 opacity-20">◎</div>
        <p className="font-display font-semibold text-text-secondary mb-1">No research history yet</p>
        <p className="font-mono text-xs text-text-dim">Completed queries will appear here</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-text-primary">Research History</h2>
        <span className="font-mono text-xs text-text-dim">{history.length} entries</span>
      </div>

      <div className="space-y-3">
        {history.map((entry, i) => (
          <div key={entry.id} className="glass-panel p-4 hover:border-accent/20 transition-colors group">
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-text-dim mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-text-primary text-sm mb-1 line-clamp-2">{entry.query}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-text-dim">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  {entry.result?.validation && (
                    <span
                      className={
                        entry.result.validation.isValid ? "text-success" : "text-warning"
                      }
                    >
                      {entry.result.validation.isValid ? "✓ validated" : "⚠ issues found"}
                    </span>
                  )}
                  {entry.result?.retrievedChunks && (
                    <span>{entry.result.retrievedChunks.length} chunks</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleLoad(entry)}
                className="btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
