import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { primaryLLM } from "../config/llm.js";
import { logger } from "../utils/logger.js";

const plannerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a Research Planner Agent. Your job is to decompose a user's research query into a structured, step-by-step research plan.

Output a JSON object with this exact structure:
{{
  "mainObjective": "string — the core research goal",
  "subQueries": ["array of 2-5 specific sub-questions to retrieve information for"],
  "searchKeywords": ["array of 3-8 targeted keywords for vector search"],
  "expectedOutputFormat": "string — e.g., 'comparative analysis', 'summary', 'step-by-step explanation'",
  "complexity": "low | medium | high"
}}

RULES:
- Sub-queries must be specific and retrievable from a knowledge base
- Keywords should be diverse and cover different aspects of the topic
- Do NOT include any text outside the JSON object`,
  ],
  ["human", "Research Query: {query}\n\nGenerate the research plan:"],
]);

export async function plannerAgent(state) {
  logger.info(`[Planner] Processing query: "${state.query}"`);

  const chain = plannerPrompt.pipe(primaryLLM).pipe(new StringOutputParser());

  let rawOutput = "";
  try {
    rawOutput = await chain.invoke({ query: state.query });
    
    // Strip markdown fences if present
    const cleaned = rawOutput.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleaned);

    logger.info(`[Planner] Plan created — ${plan.subQueries.length} sub-queries, complexity: ${plan.complexity}`);

    return {
      ...state,
      plan,
      agentLogs: [
        ...(state.agentLogs || []),
        {
          agent: "Planner",
          status: "completed",
          output: plan,
          timestamp: new Date().toISOString(),
        },
      ],
      currentStep: "retriever",
    };
  } catch (err) {
    logger.error("[Planner] Failed to parse plan:", err.message);
    // Fallback plan
    const fallbackPlan = {
      mainObjective: state.query,
      subQueries: [state.query],
      searchKeywords: state.query.split(" ").slice(0, 5),
      expectedOutputFormat: "summary",
      complexity: "medium",
    };

    return {
      ...state,
      plan: fallbackPlan,
      agentLogs: [
        ...(state.agentLogs || []),
        {
          agent: "Planner",
          status: "fallback",
          output: fallbackPlan,
          error: err.message,
          timestamp: new Date().toISOString(),
        },
      ],
      currentStep: "retriever",
    };
  }
}
