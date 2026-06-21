import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { logger } from "../utils/logger.js";
import { config } from "dotenv";

config();

const INDEX_PATH = process.env.FAISS_INDEX_PATH || "./data/faiss_index";

let vectorStore = null;
let embeddings = null;

function getEmbeddings() {
  if (!embeddings) {
    embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });
  }
  return embeddings;
}

export async function initializeFAISS() {
  const emb = getEmbeddings();

  if (existsSync(path.join(INDEX_PATH, "faiss.index"))) {
    logger.info(`Loading existing FAISS index from ${INDEX_PATH}`);
    vectorStore = await FaissStore.load(INDEX_PATH, emb);
    logger.info("FAISS index loaded successfully.");
  } else {
    logger.info("No existing FAISS index found. Creating fresh store.");
    mkdirSync(INDEX_PATH, { recursive: true });
    // Seed with a placeholder doc so the store is non-empty
    vectorStore = await FaissStore.fromDocuments(
      [new Document({ pageContent: "Research Assistant initialized.", metadata: { source: "system" } })],
      emb
    );
    await vectorStore.save(INDEX_PATH);
    logger.info("Fresh FAISS index created and saved.");
  }
}

export async function addDocumentsToStore(rawText, metadata = {}) {
  if (!vectorStore) throw new Error("FAISS store not initialized.");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200,
  });

  const docs = await splitter.createDocuments([rawText], [metadata]);
  await vectorStore.addDocuments(docs);
  await vectorStore.save(INDEX_PATH);

  logger.info(`Added ${docs.length} chunks to FAISS index.`);
  return docs.length;
}

export async function similaritySearch(query, k = 5) {
  if (!vectorStore) throw new Error("FAISS store not initialized.");

  const topK = k || parseInt(process.env.TOP_K_RESULTS) || 5;
  const results = await vectorStore.similaritySearchWithScore(query, topK);

  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    score: parseFloat(score.toFixed(4)),
  }));
}

export function getVectorStore() {
  return vectorStore;
}
