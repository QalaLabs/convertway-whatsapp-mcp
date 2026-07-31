import { z } from "zod";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "./index.js";

export const logConversationSchema = {
  customerId: z.string().describe("Customer identifier (phone number or user ID)"),
  channel: z.enum(["whatsapp"]).describe("Communication channel used (always whatsapp)"),
  direction: z.enum(["outbound", "inbound"]).describe("Direction of the message"),
  content: z.string().describe("Message content"),
  status: z.enum(["queued", "sent", "delivered", "read", "failed"]).describe("Message delivery status"),
  messageId: z.string().optional().describe("Provider message ID for cross-referencing"),
  metadata: z.record(z.string(), z.unknown()).optional().describe("Additional metadata (tags, campaign name, etc.)"),
};

export const logConversation: ToolDefinition = {
  name: "log_conversation",
  description: "Log a conversation entry to the conversation history store",
  schema: logConversationSchema,
  handler: async (args) => {
    const entry = {
      id: `conv_${Date.now()}`,
      customerId: args.customerId as string,
      channel: "whatsapp" as const,
      direction: args.direction as "outbound" | "inbound",
      content: args.content as string,
      status: args.status as "queued" | "sent" | "delivered" | "read" | "failed",
      messageId: args.messageId as string | undefined,
      timestamp: new Date().toISOString(),
      metadata: args.metadata as Record<string, unknown> | undefined,
    };

    store.add(entry);

    return {
      content: [{
        type: "text",
        text: `Conversation logged successfully.\nID: ${entry.id}\nCustomer: ${entry.customerId}\nChannel: whatsapp\nDirection: ${entry.direction}`,
      }],
    };
  },
};

export const getConversationHistorySchema = {
  customerId: z.string().describe("Customer identifier to retrieve history for"),
  limit: z.number().optional().describe("Maximum number of entries to return (default: 20)"),
};

export const getConversationHistory: ToolDefinition = {
  name: "get_conversation_history",
  description: "Retrieve conversation history for a customer",
  schema: getConversationHistorySchema,
  handler: async (args) => {
    const customerId = args.customerId as string;
    const limit = (args.limit as number) || 20;

    const history = store.getByCustomer(customerId).slice(-limit);

    if (history.length === 0) {
      return {
        content: [{ type: "text", text: `No conversation history found for customer: ${customerId}` }],
      };
    }

    const lines = history.map(
      (entry) =>
        `[${entry.timestamp}] ${entry.direction.toUpperCase()} | ${entry.status}\n  ${entry.content.substring(0, 200)}${entry.content.length > 200 ? "..." : ""}`
    );

    return {
      content: [{
        type: "text",
        text: `Conversation History for ${customerId} (last ${history.length} messages):\n\n${lines.join("\n\n")}`,
      }],
    };
  },
};
