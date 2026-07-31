import { z } from "zod";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "../tools/index.js";
import type { InboundMessage, MessageStatus } from "../whatsapp/types.js";

const inboundMessages: InboundMessage[] = [];

export function processInboundWebhook(payload: Record<string, unknown>): void {
  const entry = Array.isArray(payload.entry) ? payload.entry[0] : undefined;
  const change = entry?.changes?.[0];
  const value = change?.value;
  
  if (value?.messages?.[0]) {
    const message = value.messages[0];
    const from = message.from || "";
    const id = message.id || `in_${Date.now()}`;
    const timestamp = message.timestamp ? new Date(parseInt(message.timestamp, 10) * 1000).toISOString() : new Date().toISOString();
    
    let content = "";
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (message.type === "text") {
      content = message.text?.body || "";
    } else if (message.type === "image") {
      content = message.image?.caption || "[Image]";
      mediaUrl = message.image?.id || "";
      mediaType = "image";
    } else if (message.type === "video") {
      content = message.video?.caption || "[Video]";
      mediaUrl = message.video?.id || "";
      mediaType = "video";
    } else if (message.type === "document") {
      content = message.document?.caption || "[Document]";
      mediaUrl = message.document?.id || "";
      mediaType = "document";
    } else {
      content = `[${message.type || "unknown message type"}]`;
    }

    const msg: InboundMessage = {
      id,
      from,
      to: value.metadata?.display_phone_number || "",
      content,
      mediaUrl,
      mediaType,
      timestamp,
      metadata: { profile: value.contacts?.[0]?.profile },
    };

    inboundMessages.push(msg);

    store.add({
      id: msg.id,
      customerId: msg.from,
      channel: "whatsapp",
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
  } else if (value?.statuses?.[0]) {
    const statusUpdate = value.statuses[0];
    const messageId = statusUpdate.id;
    const status = statusUpdate.status as MessageStatus;
    if (messageId && status) {
      store.updateStatus(messageId, status);
    }
  }
}

export const receiveInboundSchema = {
  limit: z.number().optional().describe("Maximum number of messages to return (default: 10)"),
  markAsProcessed: z.boolean().optional().describe("Mark returned messages as processed (remove from queue)"),
};

export const receiveInbound: ToolDefinition = {
  name: "receive_inbound",
  description: "Retrieve inbound messages received via webhook directly from Meta's WhatsApp Business API",
  schema: receiveInboundSchema,
  handler: async (args) => {
    const limit = (args.limit as number) || 10;
    const markAsProcessed = (args.markAsProcessed as boolean) || false;

    let messages = [...inboundMessages];
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
        content: [{ type: "text", text: "No inbound WhatsApp messages waiting." }],
      };
    }

    const lines = messages.map(
      (m) =>
        `[${m.timestamp}] WhatsApp from ${m.from}\n  ${m.content.substring(0, 300)}${m.content.length > 300 ? "..." : ""}${m.mediaUrl ? `\n  📎 Media ID/Url: ${m.mediaUrl}` : ""}`
    );

    return {
      content: [{
        type: "text",
        text: `Inbound WhatsApp Messages (${messages.length}):\n\n${lines.join("\n\n")}`,
      }],
    };
  },
};
