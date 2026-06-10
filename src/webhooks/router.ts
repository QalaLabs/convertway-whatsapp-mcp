import express from "express";
import { config } from "../config.js";
import { processInboundWebhook } from "./handler.js";

export function createWebhookRouter(): express.Router {
  const router = express.Router();

  router.post(config.server.webhookPath, (req, res) => {
    try {
      const payload = req.body;
      console.log(`[Webhook] Received event: ${payload.event || "unknown"}`);

      switch (payload.event) {
        case "message_received":
          processInboundWebhook(payload.data as Record<string, unknown>);
          break;
        case "delivery_status":
          console.log(`[Webhook] Delivery status: ${JSON.stringify(payload.data)}`);
          break;
        default:
          console.log(`[Webhook] Unhandled event: ${JSON.stringify(payload).substring(0, 200)}`);
      }

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

    if (mode === "subscribe" && token === "convertway_verify_token") {
      console.log("[Webhook] Verified webhook subscription");
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: "Verification failed" });
    }
  });

  router.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", service: "convertway-mcp", timestamp: new Date().toISOString() });
  });

  return router;
}
