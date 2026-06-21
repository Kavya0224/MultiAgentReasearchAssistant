/**
 * Standalone ingestion script: node src/rag/ingest.js <file_path>
 * Supported: .txt, .md, .pdf (requires pdf-parse)
 */
import { readFileSync } from "fs";
import path from "path";
import { config } from "dotenv";
import { initializeFAISS, addDocumentsToStore } from "./vectorStore.js";
import { logger } from "../utils/logger.js";

config();

async function ingest(filePath) {
  await initializeFAISS();

  const ext = path.extname(filePath).toLowerCase();
  let text = "";
  const metadata = { source: path.basename(filePath), ingestedAt: new Date().toISOString() };

  if (ext === ".txt" || ext === ".md") {
    text = readFileSync(filePath, "utf-8");
  } else if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = readFileSync(filePath);
    const data = await pdfParse(buffer);
    text = data.text;
    metadata.pages = data.numpages;
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const chunks = await addDocumentsToStore(text, metadata);
  logger.info(`✅ Ingested "${path.basename(filePath)}" → ${chunks} chunks added to FAISS.`);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node src/rag/ingest.js <path-to-file>");
  process.exit(1);
}

ingest(filePath).catch((err) => {
  logger.error("Ingestion failed:", err);
  process.exit(1);
});
