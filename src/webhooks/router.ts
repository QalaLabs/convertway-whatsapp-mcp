import express from "express";
import { config } from "../config.js";
import { processInboundWebhook } from "./handler.js";

export function createWebhookRouter(): express.Router {
  const router = express.Router();

  router.post(config.server.webhookPath, (req, res) => {
    try {
      const payload = req.body;
      
      const entry = payload.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      
      if (value?.messages?.[0]) {
        console.error(`[Webhook] Received message event: ${value.messages[0].id}`);
      } else if (value?.statuses?.[0]) {
        console.error(`[Webhook] Received status update event: ${value.statuses[0].id} (${value.statuses[0].status})`);
      } else {
        console.error(`[Webhook] Received other webhook payload field: ${change?.field || "unknown"}`);
      }

      processInboundWebhook(payload);

      res.status(200).json({ status: "ok" });
    } catch (err) {
      console.error("[Webhook] Error processing:", err);
      res.status(500).json({ status: "error", message: (err as Error).message });
    }
  });

  router.get(config.server.webhookPath, (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
      console.error("[Webhook] Verified webhook subscription with Meta");
      res.status(200).send(challenge);
    } else {
      console.warn(`[Webhook] Verification failed. Expected verify token: ${config.whatsapp.verifyToken}, received: ${token}`);
      res.status(403).json({ error: "Verification failed" });
    }
  });

  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", service: "whatsapp-mcp", timestamp: new Date().toISOString() });
  });

  return router;
}
