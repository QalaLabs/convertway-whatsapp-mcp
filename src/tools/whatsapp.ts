import { z } from "zod";
import { whatsapp } from "../whatsapp/client.js";
import { store } from "../storage/conversations.js";
import { templates, render, getTemplate } from "../templates/index.js";
import type { ToolDefinition } from "./index.js";

export const sendWhatsAppSchema = {
  to: z.string().describe("Recipient phone number with country code (e.g. +919876543210)"),
  message: z.string().optional().describe("Text message content"),
  templateId: z.string().optional().describe("Template ID from the template library"),
  templateParams: z.record(z.string(), z.string()).optional().describe("Template variable values as key-value pairs"),
  mediaUrl: z.string().url().optional().describe("URL of media to send (image/video/document)"),
  mediaType: z.enum(["image", "document", "video"]).optional().describe("Type of media being sent"),
};

export const sendWhatsApp: ToolDefinition = {
  name: "send_whatsapp",
  description: "Send a WhatsApp message directly via Meta's WhatsApp Cloud API — supports text, templates, and media messages",
  schema: sendWhatsAppSchema,
  handler: async (args) => {
    const to = args.to as string;
    const message = args.message as string | undefined;
    const templateId = args.templateId as string | undefined;
    const templateParams = args.templateParams as Record<string, string> | undefined;
    const mediaUrl = args.mediaUrl as string | undefined;
    const mediaType = args.mediaType as "image" | "document" | "video" | undefined;

    let content = message || "";
    let templateName: string | undefined;

    if (templateId) {
      const tmpl = getTemplate(templateId as string);
      if (!tmpl) {
        return {
          content: [{ type: "text", text: `Template "${templateId}" not found. Available: ${templates.map(t => t.id).join(", ")}` }],
          isError: true,
        };
      }
      const rendered = render(tmpl, (templateParams || {}) as Record<string, string>);
      content = rendered.content;
      templateName = tmpl.whatsappTemplateName;
    }

    const result = await whatsapp.sendMessage({
      to,
      content,
      templateName,
      templateParams: templateParams as Record<string, string> | undefined,
      mediaUrl,
      mediaType,
    });

    store.add({
      id: `conv_${Date.now()}`,
      customerId: to,
      channel: "whatsapp",
      direction: "outbound",
      content,
      status: result.status,
      messageId: result.messageId,
      timestamp: result.timestamp,
      metadata: { templateId, mediaUrl, mediaType },
    });

    if (!result.success) {
      return {
        content: [{ type: "text", text: `Failed to send WhatsApp message: ${JSON.stringify(result.providerResponse)}` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: "text",
        text: `WhatsApp message sent successfully.\nMessage ID: ${result.messageId}\nTo: ${to}\nStatus: ${result.status}`,
      }],
    };
  },
};

export const getWhatsAppTemplates: ToolDefinition = {
  name: "get_whatsapp_templates",
  description: "List available WhatsApp message templates grouped by module",
  schema: {
    module: z.string().optional().describe("Filter templates by module name"),
  },
  handler: async (args) => {
    const module = args.module as string | undefined;
    const filtered = module
      ? templates.filter((t) => t.module === module && t.channel === "whatsapp")
      : templates.filter((t) => t.channel === "whatsapp");

    const grouped: Record<string, typeof filtered> = {};
    for (const t of filtered) {
      if (!grouped[t.module]) grouped[t.module] = [];
      grouped[t.module].push(t);
    }

    const lines = Object.entries(grouped).flatMap(([mod, tmpls]) => [
      `\n## ${mod}`,
      ...tmpls.map((t) => `  • ${t.id}: ${t.description}`),
    ]);

    return {
      content: [{ type: "text", text: `Available WhatsApp Templates:\n${lines.join("\n")}` }],
    };
  },
};
