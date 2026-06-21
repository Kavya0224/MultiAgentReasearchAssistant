import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { fastLLM } from "../config/llm.js";
import { logger } from "../utils/logger.js";

const summarizerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a Research Summarizer Agent. You synthesize retrieved document chunks into a coherent, accurate, and well-structured research response.

STRICT RULES:
1. Only use information explicitly present in the provided context chunks
2. Clearly structure your response with sections when appropriate
3. Cite sources by referencing chunk metadata when available
4. If the context is insufficient, explicitly state what is missing
5. Never fabricate information or make assumptions beyond the provided context
6. Use markdown formatting for readability

Your response should directly address the main objective and all sub-queries.`,
  ],
  [
    "human",
    `Main Research Objective: {mainObjective}

Sub-queries to address:
{subQueries}

Retrieved Context Chunks:
{context}

Expected Format: {expectedFormat}

Generate a comprehensive research summary:`,
  ],
]);

export async function summarizerAgent(state) {
  const { plan, retrievedChunks } = state;
  logger.info(`[Summarizer] Synthesizing ${retrievedChunks.length} chunks`);

  // Build context string with source attribution
  const contextStr = retrievedChunks
    .map((chunk, i) => {
      const source = chunk.metadata?.source || "Unknown";
      return `[Chunk ${i + 1} | Source: ${source} | Relevance: ${chunk.score}]\n${chunk.content}`;
    })
    .join("\n\n---\n\n");

  const chain = summarizerPrompt.pipe(fastLLM).pipe(new StringOutputParser());

  let summary = "";
  try {
    summary = await chain.invoke({
      mainObjective: plan.mainObjective,
      subQueries: plan.subQueries.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      context: contextStr || "No relevant context was retrieved.",
      expectedFormat: plan.expectedOutputFormat || "comprehensive summary",
    });

    logger.info(`[Summarizer] Summary generated — ${summary.length} chars`);
  } catch (err) {
    logger.error("[Summarizer] Error:", err.message);
    summary = `Unable to generate summary due to an error: ${err.message}`;
  }

  return {
    ...state,
    summary,
    agentLogs: [
      ...(state.agentLogs || []),
      {
        agent: "Summarizer",
        status: "completed",
        output: { summaryLength: summary.length },
        timestamp: new Date().toISOString(),
      },
    ],
    currentStep: "validator",
  };
}
