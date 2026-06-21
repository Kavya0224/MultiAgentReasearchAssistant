import React, { useState, useRef } from "react";
import { startResearch, subscribeToJob } from "../utils/api.js";
import { useResearchStore } from "../store/researchStore.js";

const EXAMPLE_QUERIES = [
  "Explain transformer attention mechanisms and their computational complexity",
  "Compare FAISS, Pinecone, and Chroma for production RAG systems",
  "What are the key differences between LangGraph and standard LangChain chains?",
  "Summarize recent advances in retrieval-augmented generation",
];

export default function QueryInput() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef(null);

  const { status, startJob, addStep, setResult, setError, reset } = useResearchStore();
  const isRunning = status === "running";

  const handleSubmit = async () => {
    const q = inputValue.trim();
    if (!q || q.length < 5 || isRunning) return;

    setLoading(true);
    try {
      const { jobId } = await startResearch(q);
      startJob(jobId, q);

      unsubRef.current = subscribeToJob(jobId, {
        onStep: (step) => addStep(step),
        onResult: (result) => {
          setResult(result);
          setLoading(false);
        },
        onError: (err) => {
          setError(err.message || "Research failed");
          setLoading(false);
        },
        onDone: () => setLoading(false),
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const handleReset = () => {
    unsubRef.current?.();
    reset();
    setLoading(false);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-accent text-xs">QUERY</span>
        <div className="flex-1 h-px bg-border" />
        <span className="font-mono text-text-dim text-xs">⌘↵ to run</span>
      </div>

      {/* Input */}
      <div className="relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder="Enter your research query..."
          rows={3}
          className={`w-full bg-bg border rounded-lg px-4 py-3 font-body text-text-primary
            placeholder-text-dim resize-none outline-none transition-all duration-200
            ${isRunning ? "border-border opacity-60" : "border-border focus:border-accent/60 focus:shadow-[0_0_12px_rgba(0,212,255,0.08)]"}`}
        />
        {isRunning && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleSubmit}
              disabled={inputValue.trim().length < 5}
              className="btn-primary text-sm"
            >
              Run Research
            </button>
          ) : (
            <button onClick={handleReset} className="btn-ghost text-sm border-danger/40 text-danger hover:border-danger">
              Cancel
            </button>
          )}
          {status === "completed" && (
            <button onClick={handleReset} className="btn-ghost text-sm">
              New Query
            </button>
          )}
        </div>
        <span className="font-mono text-xs text-text-dim">
          {inputValue.length}/2000
        </span>
      </div>

      {/* Examples */}
      {status === "idle" && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="font-mono text-xs text-text-dim mb-2">TRY AN EXAMPLE</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => setInputValue(q)}
                className="text-left text-xs text-text-secondary hover:text-accent font-body px-2 py-1.5 rounded hover:bg-accent/5 transition-colors"
              >
                <span className="text-text-dim mr-2 font-mono">→</span>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
