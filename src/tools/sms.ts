import { z } from "zod";
import { convertway } from "../convertway/client.js";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "./index.js";

export const sendSmsSchema = {
  to: z.string().describe("Recipient phone number with country code"),
  message: z.string().describe("SMS text content (max 160 characters per segment)"),
  senderId: z.string().optional().describe("SMS sender ID / DLT header"),
};

export const sendSms: ToolDefinition = {
  name: "send_sms",
  description: "Send an SMS message via Convertway",
  schema: sendSmsSchema,
  handler: async (args) => {
    const to = args.to as string;
    const message = args.message as string;
    const senderId = args.senderId as string | undefined;

    const result = await convertway.sendMessage({
      channel: "sms",
      to,
      content: message,
      senderId,
    });

    store.add({
      id: `conv_${Date.now()}`,
      customerId: to,
      channel: "sms",
      direction: "outbound",
      content: message,
      status: result.status,
      messageId: result.messageId,
      timestamp: result.timestamp,
      metadata: { senderId },
    });

    if (!result.success) {
      return {
        content: [{ type: "text", text: `Failed to send SMS: ${JSON.stringify(result.providerResponse)}` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: "text",
        text: `SMS sent successfully.\nMessage ID: ${result.messageId}\nTo: ${to}\nSegments: ${Math.ceil(message.length / 160)}`,
      }],
    };
  },
};
