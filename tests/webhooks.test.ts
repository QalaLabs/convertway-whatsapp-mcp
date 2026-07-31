import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createWebhookRouter } from "../src/webhooks/router.js";
import { store } from "../src/storage/conversations.js";
import { receiveInbound } from "../src/webhooks/handler.js";
import { config } from "../src/config.js";
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

  describe("GET /webhooks/whatsapp (Subscription Verification)", () => {
    it("should verify subscription successfully with correct token", async () => {
      const res = await request(app)
        .get(config.server.webhookPath)
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": config.whatsapp.verifyToken,
          "hub.challenge": "challenge_12345",
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe("challenge_12345");
    });

    it("should return 403 on invalid verification token", async () => {
      const res = await request(app)
        .get(config.server.webhookPath)
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token",
          "hub.challenge": "challenge_12345",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /webhooks/whatsapp", () => {
    it("should process inbound whatsapp message and save to store", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "12345",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "15550101234",
                    phone_number_id: "1234567890"
                  },
                  contacts: [
                    {
                      profile: { name: "Alice" },
                      wa_id: "919876543210"
                    }
                  ],
                  messages: [
                    {
                      from: "919876543210",
                      id: "msg_in_999",
                      timestamp: "1672531199",
                      text: {
                        body: "Hello from webhook test!"
                      },
                      type: "text"
                    }
                  ]
                },
                field: "messages"
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post(config.server.webhookPath)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");

      // Verify that it is in the database store
      const localHistory = store.getByCustomer("919876543210");
      expect(localHistory.length).toBe(1);
      expect(localHistory[0].content).toBe("Hello from webhook test!");
      expect(localHistory[0].direction).toBe("inbound");

      // Verify retrieving it via handler/tool
      const toolResult = await receiveInbound.handler({ limit: 1 });
      expect(toolResult.content[0].text).toContain("Hello from webhook test!");
    });

    it("should respond with 200 for unhandled webhook events", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "12345",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  field: "something_else"
                },
                field: "something_else"
              }
            ]
          }
        ]
      };

      const res = await request(app)
        .post(config.server.webhookPath)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });

    it("should handle non-array or malformed entry payloads safely", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: "invalid_entry_format"
      };

      const res = await request(app)
        .post(config.server.webhookPath)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
