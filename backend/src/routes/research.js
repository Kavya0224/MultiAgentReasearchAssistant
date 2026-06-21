import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { runResearchGraph } from "../graph/researchGraph.js";
import { logger } from "../utils/logger.js";

export const researchRouter = Router();

// In-memory job store (use Redis in production)
const jobs = new Map();

/**
 * POST /api/research
 * Start a research job
 */
researchRouter.post("/", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || query.trim().length < 5) {
    return res.status(400).json({ error: "Query must be a non-empty string with at least 5 characters." });
  }

  const jobId = uuidv4();
  const job = {
    id: jobId,
    query: query.trim(),
    status: "running",
    steps: [],
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
  };

  jobs.set(jobId, job);

  // Run the graph asynchronously
  runResearchGraph(query.trim(), (step) => {
    job.steps.push(step);
  })
    .then((finalState) => {
      job.status = "completed";
      job.result = {
        query: finalState.query,
        plan: finalState.plan,
        retrievedChunks: finalState.retrievedChunks,
        summary: finalState.summary,
        validation: finalState.validation,
        agentLogs: finalState.agentLogs,
        retrievalAttempts: finalState.retrievalAttempt,
      };
      logger.info(`[Route] Job ${jobId} completed`);
    })
    .catch((err) => {
      job.status = "failed";
      job.error = err.message;
      logger.error(`[Route] Job ${jobId} failed:`, err);
    });

  res.status(202).json({ jobId, status: "running", message: "Research job started." });
});

/**
 * GET /api/research/:jobId/stream
 * Server-Sent Events stream for live updates
 */
researchRouter.get("/:jobId/stream", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let lastStepIndex = 0;

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    // Send any new steps
    while (lastStepIndex < job.steps.length) {
      send("step", job.steps[lastStepIndex]);
      lastStepIndex++;
    }

    if (job.status === "completed") {
      send("result", job.result);
      send("done", { jobId });
      clearInterval(interval);
      res.end();
    } else if (job.status === "failed") {
      send("error", { message: job.error });
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on("close", () => {
    clearInterval(interval);
    logger.info(`[SSE] Client disconnected from job ${jobId}`);
  });
});

/**
 * GET /api/research/:jobId
 * Poll job status
 */
researchRouter.get("/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }

  res.json({
    id: job.id,
    query: job.query,
    status: job.status,
    stepsCompleted: job.steps.length,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
  });
});

/**
 * GET /api/research
 * List recent jobs
 */
researchRouter.get("/", (req, res) => {
  const recent = [...jobs.values()]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20)
    .map(({ id, query, status, createdAt }) => ({ id, query, status, createdAt }));

  res.json({ jobs: recent });
});
