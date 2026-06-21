import { StateGraph, END } from "@langchain/langgraph";
import { plannerAgent } from "../agents/planner.js";
import { retrieverAgent } from "../agents/retriever.js";
import { summarizerAgent } from "../agents/summarizer.js";
import { validatorAgent } from "../agents/validator.js";
import { logger } from "../utils/logger.js";

/**
 * Shared state shape flowing through the graph:
 * {
 *   query: string,
 *   plan: object | null,
 *   retrievedChunks: array,
 *   summary: string | null,
 *   validation: object | null,
 *   currentStep: string,
 *   retrievalAttempt: number,
 *   agentLogs: array,
 *   error: string | null,
 * }
 */

// ── Routing Functions ──────────────────────────────────────────────────────────

function routeAfterPlanner(state) {
  return state.currentStep === "retriever" ? "retriever" : END;
}

function routeAfterValidator(state) {
  if (state.currentStep === "retriever") {
    logger.info("[Graph] Validator triggered re-retrieval.");
    return "retriever";
  }
  return END;
}

// ── Build the Graph ────────────────────────────────────────────────────────────

export function buildResearchGraph() {
  const graph = new StateGraph({
    channels: {
      query: { value: (x, y) => y ?? x, default: () => "" },
      plan: { value: (x, y) => y ?? x, default: () => null },
      retrievedChunks: { value: (x, y) => y ?? x, default: () => [] },
      summary: { value: (x, y) => y ?? x, default: () => null },
      validation: { value: (x, y) => y ?? x, default: () => null },
      currentStep: { value: (x, y) => y ?? x, default: () => "planner" },
      retrievalAttempt: { value: (x, y) => y ?? x, default: () => 1 },
      agentLogs: { value: (x, y) => y ?? x, default: () => [] },
      error: { value: (x, y) => y ?? x, default: () => null },
    },
  });

  // ── Add Nodes ──
  graph.addNode("planner", plannerAgent);
  graph.addNode("retriever", retrieverAgent);
  graph.addNode("summarizer", summarizerAgent);
  graph.addNode("validator", validatorAgent);

  // ── Entry Point ──
  graph.setEntryPoint("planner");

  // ── Edges ──
  graph.addConditionalEdges("planner", routeAfterPlanner, {
    retriever: "retriever",
    [END]: END,
  });

  graph.addEdge("retriever", "summarizer");
  graph.addEdge("summarizer", "validator");

  graph.addConditionalEdges("validator", routeAfterValidator, {
    retriever: "retriever",
    [END]: END,
  });

  return graph.compile();
}

// ── Run the Graph ──────────────────────────────────────────────────────────────

export async function runResearchGraph(query, onStep = null) {
  logger.info(`[Graph] Starting research pipeline for: "${query}"`);

  const app = buildResearchGraph();

  const initialState = {
    query,
    plan: null,
    retrievedChunks: [],
    summary: null,
    validation: null,
    currentStep: "planner",
    retrievalAttempt: 1,
    agentLogs: [],
    error: null,
  };

  let finalState = initialState;

  try {
    for await (const output of await app.stream(initialState)) {
      for (const [nodeName, nodeState] of Object.entries(output)) {
        logger.info(`[Graph] Node "${nodeName}" completed`);
        finalState = { ...finalState, ...nodeState };

        if (onStep) {
          onStep({
            node: nodeName,
            state: nodeState,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    logger.error("[Graph] Pipeline error:", err);
    finalState.error = err.message;
  }

  logger.info(`[Graph] Research pipeline completed. Validation: ${finalState.validation?.isValid}`);
  return finalState;
}
