import { z } from "zod";
import { convertway } from "../convertway/client.js";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "./index.js";

export const getDeliveryStatusSchema = {
  messageId: z.string().describe("Message ID returned from a send operation"),
  channel: z.enum(["whatsapp", "sms", "email"]).optional().describe("Channel the message was sent on"),
};

export const getDeliveryStatus: ToolDefinition = {
  name: "get_delivery_status",
  description: "Check the delivery status of a previously sent message",
  schema: getDeliveryStatusSchema,
  handler: async (args) => {
    const messageId = args.messageId as string;
    const channel = (args.channel as "whatsapp" | "sms" | "email") || "whatsapp";

    const localEntry = store.getByMessageId(messageId);
    const status = await convertway.checkDeliveryStatus(messageId, channel);

    if (localEntry) {
      store.updateStatus(messageId, status.status);
    }

    const localInfo = localEntry
      ? `\nOriginal Channel: ${localEntry.channel}\nTo: ${localEntry.customerId}\nSent: ${localEntry.timestamp}`
      : "";

    return {
      content: [{
        type: "text",
        text: `Delivery Status for ${messageId}:
Channel: ${channel}
Status: ${status.status}
Timestamp: ${status.timestamp}
${status.error ? `Error: ${status.error}` : ""}${localInfo}`,
      }],
    };
  },
};
