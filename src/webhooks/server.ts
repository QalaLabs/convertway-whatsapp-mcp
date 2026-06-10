import express from "express";
import { config } from "../config.js";
import { createWebhookRouter } from "./router.js";

export function startWebhookServer(): void {
  const app = express();
  app.use(express.json());
  app.use("/", createWebhookRouter());

  app.listen(config.server.port, () => {
    console.error(`[Convertway MCP] Webhook server listening on port ${config.server.port}`);
    console.error(`[Convertway MCP] Inbound webhook endpoint: POST http://localhost:${config.server.port}${config.server.webhookPath}`);
    console.error(`[Convertway MCP] Health check: GET http://localhost:${config.server.port}/health`);
  });
}
