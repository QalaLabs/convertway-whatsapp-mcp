import { z } from "zod";

export interface ToolResult {
  content: Array<{ type: "text"; text: string; isError?: boolean }>;
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodType>;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

import { sendWhatsApp, getWhatsAppTemplates } from "./whatsapp.js";
import { getDeliveryStatus } from "./delivery.js";
import { logConversation, getConversationHistory } from "./conversations.js";
import { receiveInbound } from "../webhooks/handler.js";
import { listModules, getTemplatesByChannel, getTemplatesByModule, templates } from "../templates/index.js";

export const tools: ToolDefinition[] = [
  sendWhatsApp,
  getWhatsAppTemplates,
  getDeliveryStatus,
  logConversation,
  getConversationHistory,
  receiveInbound,
  {
    name: "list_template_modules",
    description: "List all available template modules (e.g. shipment, payment, support, alerts)",
    schema: {},
    handler: async () => {
      const modules = listModules();
      return {
        content: [{ type: "text", text: `Available Template Modules:\n${modules.map((m) => `  • ${m}`).join("\n")}` }],
      };
    },
  },
  {
    name: "list_templates_by_module",
    description: "List all templates for a specific module",
    schema: { module: z.string().describe("Module name (e.g. shipment, payment, support, alerts, b2b, escalation)") },
    handler: async (args) => {
      const module = args.module as string;
      const tmpls = getTemplatesByModule(module);
      if (tmpls.length === 0) {
        return {
          content: [{ type: "text", text: `No templates found for module: ${module}. Available modules: ${listModules().join(", ")}` }],
        };
      }
      const lines = tmpls.map(
        (t) => `  • ${t.id} [${t.channel}]${t.whatsappTemplateName ? ` → WABA: ${t.whatsappTemplateName}` : ""}\n    ${t.description}\n    Variables: ${t.variables.join(", ")}`
      );
      return {
        content: [{ type: "text", text: `Templates for "${module}":\n\n${lines.join("\n\n")}` }],
      };
    },
  },
  {
    name: "list_all_templates",
    description: "List all available message templates across all modules",
    schema: {},
    handler: async () => {
      const allTemplates = templates;
      const count = allTemplates.length;
      return {
        content: [{ type: "text", text: `Total templates: ${count}\nUse list_template_modules and list_templates_by_module for detailed view.` }],
      };
    },
  },
];
