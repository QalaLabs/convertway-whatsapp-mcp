import { z } from "zod";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "./index.js";

export const getDeliveryStatusSchema = {
  messageId: z.string().describe("Message ID returned from a send operation"),
};

export const getDeliveryStatus: ToolDefinition = {
  name: "get_delivery_status",
  description: "Check the known delivery status of a previously sent message from the local conversation database",
  schema: getDeliveryStatusSchema,
  handler: async (args) => {
    const messageId = args.messageId as string;

    const localEntry = store.getByMessageId(messageId);

    if (!localEntry) {
      return {
        content: [{
          type: "text",
          text: `Message ID ${messageId} not found in the local conversation store. Status updates are pushed asynchronously via webhooks.`,
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: "text",
        text: `Delivery Status for ${messageId}:
Channel: whatsapp
Status: ${localEntry.status}
Timestamp: ${localEntry.timestamp}
To: ${localEntry.customerId}`,
      }],
    };
  },
};
