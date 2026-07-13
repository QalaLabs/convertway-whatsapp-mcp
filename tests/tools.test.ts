import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { tools } from "../src/tools/index.js";
import { convertway } from "../src/convertway/client.js";
import { store } from "../src/storage/conversations.js";
import fs from "fs";

vi.mock("../src/convertway/client.js", () => {
  return {
    convertway: {
      sendMessage: vi.fn(),
      checkDeliveryStatus: vi.fn(),
    },
  };
});

describe("MCP Tool Handlers", () => {
  const getTool = (name: string) => {
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return tool;
  };

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("send_whatsapp", () => {
    it("should send a text message successfully", async () => {
      const tool = getTool("send_whatsapp");
      vi.mocked(convertway.sendMessage).mockResolvedValue({
        success: true,
        messageId: "msg_123",
        channel: "whatsapp",
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: {},
      });

      const result = await tool.handler({
        to: "+919876543210",
        message: "Hello world",
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("sent successfully");
      expect(convertway.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "whatsapp",
          to: "+919876543210",
          content: "Hello world",
        })
      );
      expect(store.getAll().length).toBe(1);
    });

    it("should send using a template ID successfully", async () => {
      const tool = getTool("send_whatsapp");
      vi.mocked(convertway.sendMessage).mockResolvedValue({
        success: true,
        messageId: "msg_template",
        channel: "whatsapp",
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: {},
      });

      const result = await tool.handler({
        to: "+919876543210",
        templateId: "order_confirmation",
        templateParams: {
          customer_name: "Alice",
          order_id: "OD987",
        },
      });

      expect(result.isError).toBeFalsy();
      expect(convertway.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "whatsapp",
          templateName: "order_confirmation",
          templateParams: {
            customer_name: "Alice",
            order_id: "OD987",
          },
        })
      );
    });

    it("should return error if template is not found", async () => {
      const tool = getTool("send_whatsapp");
      const result = await tool.handler({
        to: "+919876543210",
        templateId: "non_existent_template",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not found");
      expect(convertway.sendMessage).not.toHaveBeenCalled();
    });

    it("should handle Convertway API sending errors gracefully", async () => {
      const tool = getTool("send_whatsapp");
      vi.mocked(convertway.sendMessage).mockResolvedValue({
        success: false,
        messageId: "failed_123",
        channel: "whatsapp",
        status: "failed",
        timestamp: new Date().toISOString(),
        providerResponse: { error: "Invalid API credentials" },
      });

      const result = await tool.handler({
        to: "+919876543210",
        message: "Hello failed world",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Failed to send WhatsApp message");
    });
  });

  describe("send_sms", () => {
    it("should send SMS successfully", async () => {
      const tool = getTool("send_sms");
      vi.mocked(convertway.sendMessage).mockResolvedValue({
        success: true,
        messageId: "sms_123",
        channel: "sms",
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: {},
      });

      const result = await tool.handler({
        to: "+919876543210",
        message: "Short text message",
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("SMS sent successfully");
      expect(convertway.sendMessage).toHaveBeenCalledWith({
        channel: "sms",
        to: "+919876543210",
        content: "Short text message",
        senderId: undefined,
      });
    });
  });

  describe("send_email", () => {
    it("should send email successfully", async () => {
      const tool = getTool("send_email");
      vi.mocked(convertway.sendMessage).mockResolvedValue({
        success: true,
        messageId: "email_123",
        channel: "email",
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: {},
      });

      const result = await tool.handler({
        to: "bob@example.com",
        subject: "Test Subject",
        body: "Hello Bob",
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("Email sent successfully");
      expect(convertway.sendMessage).toHaveBeenCalledWith({
        channel: "email",
        to: "bob@example.com",
        content: "Hello Bob",
        subject: "Test Subject",
        cc: undefined,
        bcc: undefined,
      });
    });
  });

  describe("get_delivery_status", () => {
    it("should fetch and update status successfully", async () => {
      const tool = getTool("get_delivery_status");
      
      // Setup a local entry
      store.add({
        id: "conv_111",
        customerId: "+919876543210",
        channel: "whatsapp",
        direction: "outbound",
        content: "Test status update",
        status: "sent",
        messageId: "msg_update",
        timestamp: new Date().toISOString(),
      });

      vi.mocked(convertway.checkDeliveryStatus).mockResolvedValue({
        messageId: "msg_update",
        channel: "whatsapp",
        status: "delivered",
        timestamp: new Date().toISOString(),
      });

      const result = await tool.handler({
        messageId: "msg_update",
        channel: "whatsapp",
      });

      expect(result.content[0].text).toContain("Status: delivered");
      expect(store.getByMessageId("msg_update")?.status).toBe("delivered");
    });
  });

  describe("conversations storage tools", () => {
    it("should log a conversation entry", async () => {
      const tool = getTool("log_conversation");
      const result = await tool.handler({
        customerId: "+919876543210",
        channel: "whatsapp",
        direction: "inbound",
        content: "Hi there",
        status: "delivered",
      });

      expect(result.content[0].text).toContain("logged successfully");
      expect(store.getAll().length).toBe(1);
    });

    it("should retrieve conversation history", async () => {
      const logTool = getTool("log_conversation");
      const historyTool = getTool("get_conversation_history");

      await logTool.handler({
        customerId: "+919876543210",
        channel: "whatsapp",
        direction: "inbound",
        content: "First message",
        status: "delivered",
      });

      await logTool.handler({
        customerId: "+919876543210",
        channel: "whatsapp",
        direction: "outbound",
        content: "Reply message",
        status: "sent",
      });

      const result = await historyTool.handler({
        customerId: "+919876543210",
      });

      expect(result.content[0].text).toContain("Conversation History for +919876543210");
      expect(result.content[0].text).toContain("First message");
      expect(result.content[0].text).toContain("Reply message");
    });

    it("should handle retrieving empty history", async () => {
      const tool = getTool("get_conversation_history");
      const result = await tool.handler({
        customerId: "non_existent_customer",
      });

      expect(result.content[0].text).toContain("No conversation history found");
    });
  });

  describe("template tools", () => {
    it("should list template modules", async () => {
      const tool = getTool("list_template_modules");
      const result = await tool.handler({});

      expect(result.content[0].text).toContain("Available Template Modules");
      expect(result.content[0].text).toContain("shipment");
    });

    it("should list templates by module", async () => {
      const tool = getTool("list_templates_by_module");
      const result = await tool.handler({ module: "shipment" });

      expect(result.content[0].text).toContain("Templates for \"shipment\"");
    });

    it("should list all templates", async () => {
      const tool = getTool("list_all_templates");
      const result = await tool.handler({ channel: "whatsapp" });

      expect(result.content[0].text).toContain("Total templates:");
    });
  });
});
