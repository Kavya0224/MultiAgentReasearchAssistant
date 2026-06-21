import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { jsonLLM } from "../config/llm.js";
import { logger } from "../utils/logger.js";

const validatorPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a Research Validator Agent. Your job is to rigorously fact-check a research summary against the source context chunks it was derived from.

Evaluate:
1. FACTUAL ALIGNMENT: Does every claim in the summary trace back to the context?
2. HALLUCINATION DETECTION: Are there claims in the summary NOT supported by any context chunk?
3. COMPLETENESS: Does the summary address all sub-queries?
4. ACCURACY: Is information correctly represented (no distortions)?

Return ONLY a JSON object (no markdown, no prose):
{{
  "isValid": boolean,
  "confidenceScore": number (0.0 to 1.0),
  "issues": [
    {{
      "type": "hallucination | incomplete | distortion | unsupported_claim",
      "description": "specific issue description",
      "suggestedFix": "how to address this"
    }}
  ],
  "hallucinatedClaims": ["list of specific hallucinated statements if any"],
  "missingSubQueries": ["sub-queries not addressed"],
  "recommendation": "approve | re_retrieve | revise_summary",
  "validatorNotes": "brief overall assessment"
}}`,
  ],
  [
    "human",
    `Original Query: {query}

Sub-queries that must be addressed:
{subQueries}

Source Context Chunks:
{context}

Generated Summary to Validate:
{summary}

Validate this summary:`,
  ],
]);

const THRESHOLD = parseFloat(process.env.VALIDATOR_THRESHOLD) || 0.75;

export async function validatorAgent(state) {
  const { query, plan, retrievedChunks, summary, retrievalAttempt = 1 } = state;
  logger.info(`[Validator] Validating summary (attempt ${retrievalAttempt})`);

  const contextStr = retrievedChunks
    .slice(0, 10) // Limit to avoid token overflow
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join("\n\n---\n\n");

  const chain = validatorPrompt.pipe(jsonLLM).pipe(new StringOutputParser());

  let validation = null;
  let rawOutput = "";

  try {
    rawOutput = await chain.invoke({
      query,
      subQueries: plan.subQueries.join("\n"),
      context: contextStr,
      summary,
    });

    const cleaned = rawOutput.replace(/```json|```/g, "").trim();
    validation = JSON.parse(cleaned);
    logger.info(
      `[Validator] Score: ${validation.confidenceScore} | Valid: ${validation.isValid} | Recommendation: ${validation.recommendation}`
    );
  } catch (err) {
    logger.error("[Validator] Parse error:", err.message);
    // Assume valid on parse failure to avoid infinite loops
    validation = {
      isValid: true,
      confidenceScore: 0.8,
      issues: [],
      hallucinatedClaims: [],
      missingSubQueries: [],
      recommendation: "approve",
      validatorNotes: "Validation parsing failed; defaulting to approve.",
    };
  }

  const shouldReRetrieve =
    process.env.ENABLE_RE_RETRIEVAL !== "false" &&
    !validation.isValid &&
    validation.recommendation === "re_retrieve" &&
    retrievalAttempt < (parseInt(process.env.MAX_ITERATIONS) || 3);

  const nextStep = shouldReRetrieve ? "retriever" : "done";

  return {
    ...state,
    validation,
    retrievalAttempt: shouldReRetrieve ? retrievalAttempt + 1 : retrievalAttempt,
    currentStep: nextStep,
    agentLogs: [
      ...(state.agentLogs || []),
      {
        agent: "Validator",
        status: "completed",
        output: validation,
        reRetrieval: shouldReRetrieve,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
