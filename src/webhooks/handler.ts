import { z } from "zod";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "../tools/index.js";
import type { InboundMessage } from "../convertway/types.js";

const inboundMessages: InboundMessage[] = [];

export function processInboundWebhook(payload: Record<string, unknown>): void {
  const msg: InboundMessage = {
    id: payload.id as string || `in_${Date.now()}`,
    channel: (payload.channel as InboundMessage["channel"]) || "whatsapp",
    from: payload.from as string || "",
    to: payload.to as string || "",
    content: payload.content as string || "",
    mediaUrl: payload.media_url as string | undefined,
    mediaType: payload.media_type as string | undefined,
    timestamp: payload.timestamp as string || new Date().toISOString(),
    metadata: payload.metadata as Record<string, unknown> | undefined,
  };

  inboundMessages.push(msg);

  store.add({
    id: msg.id,
    customerId: msg.from,
    channel: msg.channel,
    direction: "inbound",
    content: msg.content,
    status: "delivered",
    messageId: msg.id,
    timestamp: msg.timestamp,
    metadata: { ...msg.metadata, mediaUrl: msg.mediaUrl, mediaType: msg.mediaType },
  });

  if (inboundMessages.length > 1000) {
    inboundMessages.splice(0, inboundMessages.length - 1000);
  }
}

export const receiveInboundSchema = {
  limit: z.number().optional().describe("Maximum number of messages to return (default: 10)"),
  channel: z.enum(["whatsapp", "sms", "email"]).optional().describe("Filter by channel"),
  markAsProcessed: z.boolean().optional().describe("Mark returned messages as processed (remove from queue)"),
};

export const receiveInbound: ToolDefinition = {
  name: "receive_inbound",
  description: "Retrieve inbound messages received via webhook (WhatsApp, SMS, or Email)",
  schema: receiveInboundSchema,
  handler: async (args) => {
    const limit = (args.limit as number) || 10;
    const channel = args.channel as InboundMessage["channel"] | undefined;
    const markAsProcessed = (args.markAsProcessed as boolean) || false;

    let messages = [...inboundMessages];
    if (channel) {
      messages = messages.filter((m) => m.channel === channel);
    }
    messages = messages.slice(-limit);

    if (markAsProcessed) {
      const ids = new Set(messages.map((m) => m.id));
      for (let i = inboundMessages.length - 1; i >= 0; i--) {
        if (ids.has(inboundMessages[i].id)) {
          inboundMessages.splice(i, 1);
        }
      }
    }

    if (messages.length === 0) {
      return {
        content: [{ type: "text", text: "No inbound messages waiting." }],
      };
    }

    const lines = messages.map(
      (m) =>
        `[${m.timestamp}] ${m.channel.toUpperCase()} from ${m.from}\n  ${m.content.substring(0, 300)}${m.content.length > 300 ? "..." : ""}${m.mediaUrl ? `\n  📎 Media: ${m.mediaUrl}` : ""}`
    );

    return {
      content: [{
        type: "text",
        text: `Inbound Messages (${messages.length}):\n\n${lines.join("\n\n")}`,
      }],
    };
  },
};
