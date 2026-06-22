import { z } from "zod";
import { convertway } from "../convertway/client.js";
import { store } from "../storage/conversations.js";
import type { ToolDefinition } from "./index.js";

export const sendEmailSchema = {
  to: z.string().email().describe("Recipient email address"),
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body content (plain text or HTML)"),
  cc: z.array(z.string().email()).optional().describe("CC recipients"),
  bcc: z.array(z.string().email()).optional().describe("BCC recipients"),
  templateId: z.string().optional().describe("Template ID for pre-formatted emails (e.g. mis_daily_report)"),
  templateParams: z.record(z.string(), z.string()).optional().describe("Template variable values"),
};

export const sendEmail: ToolDefinition = {
  name: "send_email",
  description: "Send an email via Convertway — supports plain text, HTML, CC/BCC, and templates",
  schema: sendEmailSchema,
  handler: async (args) => {
    const to = args.to as string;
    const subject = args.subject as string;
    const body = args.body as string;
    const cc = args.cc as string[] | undefined;
    const bcc = args.bcc as string[] | undefined;

    const result = await convertway.sendMessage({
      channel: "email",
      to,
      content: body,
      subject,
      cc,
      bcc,
    });

    store.add({
      id: `conv_${Date.now()}`,
      customerId: to,
      channel: "email",
      direction: "outbound",
      content: body,
      status: result.status,
      messageId: result.messageId,
      timestamp: result.timestamp,
      metadata: { subject, cc, bcc },
    });

    if (!result.success) {
      return {
        content: [{ type: "text", text: `Failed to send email: ${JSON.stringify(result.providerResponse)}` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: "text",
        text: `Email sent successfully.\nMessage ID: ${result.messageId}\nTo: ${to}\nSubject: ${subject}`,
      }],
    };
  },
};
