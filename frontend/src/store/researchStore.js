import { create } from "zustand";

export const useResearchStore = create((set, get) => ({
  // ── Research State ──────────────────────────────────────────────────────────
  query: "",
  jobId: null,
  status: "idle", // idle | running | completed | failed
  activeNode: null,
  agentLogs: [],
  steps: [],
  result: null,
  error: null,

  // ── History ─────────────────────────────────────────────────────────────────
  history: [],

  // ── UI ──────────────────────────────────────────────────────────────────────
  activeTab: "research", // research | documents | history

  // ── Actions ─────────────────────────────────────────────────────────────────
  setQuery: (query) => set({ query }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  startJob: (jobId, query) =>
    set({
      jobId,
      query,
      status: "running",
      activeNode: "planner",
      agentLogs: [],
      steps: [],
      result: null,
      error: null,
    }),

  addStep: (step) =>
    set((s) => ({
      steps: [...s.steps, step],
      activeNode: step.node,
      agentLogs: step.state?.agentLogs || s.agentLogs,
    })),

  setResult: (result) =>
    set((s) => {
      const entry = {
        id: s.jobId,
        query: s.query,
        result,
        timestamp: new Date().toISOString(),
      };
      return {
        result,
        status: "completed",
        activeNode: null,
        history: [entry, ...s.history].slice(0, 50),
      };
    }),

  setError: (error) => set({ error, status: "failed", activeNode: null }),

  reset: () =>
    set({
      jobId: null,
      status: "idle",
      activeNode: null,
      agentLogs: [],
      steps: [],
      result: null,
      error: null,
    }),

  loadHistoryEntry: (entry) =>
    set({
      query: entry.query,
      result: entry.result,
      status: "completed",
      activeNode: null,
      agentLogs: entry.result?.agentLogs || [],
      jobId: entry.id,
    }),
}));
