import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "dotenv";
import rateLimit from "express-rate-limit";

import { logger } from "./utils/logger.js";
import { researchRouter } from "./routes/research.js";
import { documentsRouter } from "./routes/documents.js";
import { statusRouter } from "./routes/status.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initializeFAISS } from "./rag/vectorStore.js";

config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security & Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("combined", { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/research", researchRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/status", statusRouter);

// ── Error Handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────────
async function startServer() {
  try {
    logger.info("Initializing FAISS vector store...");
    await initializeFAISS();
    logger.info("FAISS vector store ready.");

    app.listen(PORT, () => {
      logger.info(`🚀 Research Assistant API running on http://localhost:${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
