import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createWebhookRouter } from "../src/webhooks/router.js";
import { store } from "../src/storage/conversations.js";
import { receiveInbound } from "../src/webhooks/handler.js";
import fs from "fs";

describe("Webhook Router & Handler", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/", createWebhookRouter());

    // Reset store
    (store as any).conversations = [];
    if (fs.existsSync("./data/test_conversations.json")) {
      fs.unlinkSync("./data/test_conversations.json");
    }
  });

  afterEach(() => {
    if (fs.existsSync("./data/test_conversations.json")) {
      fs.unlinkSync("./data/test_conversations.json");
    }
  });

  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
    });
  });

  describe("GET /webhooks/convertway (Subscription Verification)", () => {
    it("should verify subscription successfully with correct token", async () => {
      const res = await request(app)
        .get("/webhooks/convertway")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "convertway_verify_token",
          "hub.challenge": "challenge_12345",
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe("challenge_12345");
    });

    it("should return 403 on invalid verification token", async () => {
      const res = await request(app)
        .get("/webhooks/convertway")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token",
          "hub.challenge": "challenge_12345",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /webhooks/convertway", () => {
    it("should process inbound whatsapp message and save to store", async () => {
      const payload = {
        event: "message_received",
        data: {
          id: "msg_in_999",
          channel: "whatsapp",
          from: "+919876543210",
          to: "+919000000000",
          content: "Hello from webhook test!",
          timestamp: new Date().toISOString(),
        },
      };

      const res = await request(app)
        .post("/webhooks/convertway")
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");

      // Verify that it is in the database store
      const localHistory = store.getByCustomer("+919876543210");
      expect(localHistory.length).toBe(1);
      expect(localHistory[0].content).toBe("Hello from webhook test!");
      expect(localHistory[0].direction).toBe("inbound");

      // Verify retrieving it via handler/tool
      const toolResult = await receiveInbound.handler({ limit: 1 });
      expect(toolResult.content[0].text).toContain("Hello from webhook test!");
    });

    it("should respond with 200 for unhandled events", async () => {
      const payload = {
        event: "some_unhandled_event",
        data: {
          foo: "bar",
        },
      };

      const res = await request(app)
        .post("/webhooks/convertway")
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
