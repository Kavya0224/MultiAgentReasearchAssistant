import { ChatGroq } from "@langchain/groq";
import { config } from "dotenv";

config();

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables.");
}

// Primary model for complex reasoning (Planner, Validator)
export const primaryLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  temperature: 0.1,
  maxTokens: 4096,
  streaming: true,
});

// Fast model for summarization tasks
export const fastLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "mixtral-8x7b-32768",
  temperature: 0.2,
  maxTokens: 2048,
  streaming: true,
});

// JSON-mode LLM for structured outputs
export const jsonLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  temperature: 0,
  maxTokens: 2048,
});
