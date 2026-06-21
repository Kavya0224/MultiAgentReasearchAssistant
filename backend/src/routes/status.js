import { Router } from "express";

export const statusRouter = Router();

statusRouter.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Multi-Agent Research Assistant",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

statusRouter.get("/health", (req, res) => {
  res.json({ healthy: true });
});
