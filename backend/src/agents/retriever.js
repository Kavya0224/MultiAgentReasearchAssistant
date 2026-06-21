import { similaritySearch } from "../rag/vectorStore.js";
import { logger } from "../utils/logger.js";

export async function retrieverAgent(state) {
  const { plan, retrievalAttempt = 1 } = state;
  logger.info(`[Retriever] Attempt #${retrievalAttempt} — ${plan.subQueries.length} sub-queries`);

  const allResults = [];
  const seenContent = new Set();

  // Search for each sub-query
  for (const subQuery of plan.subQueries) {
    try {
      const results = await similaritySearch(subQuery, 3);
      for (const r of results) {
        if (!seenContent.has(r.content)) {
          seenContent.add(r.content);
          allResults.push({ ...r, subQuery });
        }
      }
    } catch (err) {
      logger.warn(`[Retriever] Sub-query failed: "${subQuery}" — ${err.message}`);
    }
  }

  // Also search using raw keywords
  for (const keyword of (plan.searchKeywords || []).slice(0, 3)) {
    try {
      const results = await similaritySearch(keyword, 2);
      for (const r of results) {
        if (!seenContent.has(r.content)) {
          seenContent.add(r.content);
          allResults.push({ ...r, subQuery: keyword });
        }
      }
    } catch (err) {
      logger.warn(`[Retriever] Keyword search failed: "${keyword}"`);
    }
  }

  // Sort by relevance score (lower = more similar for FAISS L2)
  const sorted = allResults.sort((a, b) => a.score - b.score);

  logger.info(`[Retriever] Retrieved ${sorted.length} unique chunks`);

  return {
    ...state,
    retrievedChunks: sorted,
    retrievalAttempt,
    agentLogs: [
      ...(state.agentLogs || []),
      {
        agent: "Retriever",
        status: "completed",
        output: { chunksRetrieved: sorted.length, attempt: retrievalAttempt },
        timestamp: new Date().toISOString(),
      },
    ],
    currentStep: "summarizer",
  };
}
