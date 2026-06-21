import { Router } from "express";
import multer from "multer";
import path from "path";
import { addDocumentsToStore } from "../rag/vectorStore.js";
import { logger } from "../utils/logger.js";

export const documentsRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".txt", ".md", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(", ")}`));
    }
  },
});

/**
 * POST /api/documents/upload
 * Upload and ingest a document into FAISS
 */
documentsRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { originalname, buffer, mimetype } = req.file;
  const ext = path.extname(originalname).toLowerCase();
  let text = "";

  try {
    if (ext === ".txt" || ext === ".md") {
      text = buffer.toString("utf-8");
    } else if (ext === ".pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    }

    if (!text || text.trim().length < 10) {
      return res.status(422).json({ error: "Extracted text is too short or empty." });
    }

    const metadata = {
      source: originalname,
      mimetype,
      uploadedAt: new Date().toISOString(),
    };

    const chunks = await addDocumentsToStore(text, metadata);

    logger.info(`[Documents] Ingested "${originalname}" → ${chunks} chunks`);
    res.json({ message: "Document ingested successfully.", filename: originalname, chunks });
  } catch (err) {
    logger.error("[Documents] Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents/text
 * Ingest raw text directly
 */
documentsRouter.post("/text", async (req, res) => {
  const { text, source = "manual-input" } = req.body;

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return res.status(400).json({ error: "Text must be at least 20 characters." });
  }

  try {
    const chunks = await addDocumentsToStore(text.trim(), {
      source,
      uploadedAt: new Date().toISOString(),
    });

    res.json({ message: "Text ingested successfully.", source, chunks });
  } catch (err) {
    logger.error("[Documents] Text ingest error:", err);
    res.status(500).json({ error: err.message });
  }
});
