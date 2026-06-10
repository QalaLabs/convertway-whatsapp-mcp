import dotenv from "dotenv";
dotenv.config();

export const config = {
  convertway: {
    baseUrl: process.env.CONVERTWAY_API_BASE_URL || "https://app.theconvertway.com/api/v1",
    licenseKey: process.env.CONVERTWAY_LICENSE_KEY || "",
  },
  server: {
    transport: (process.env.MCP_TRANSPORT || "stdio") as "stdio" | "http",
    port: parseInt(process.env.MCP_PORT || process.env.WEBHOOK_PORT || "3000", 10),
    mcpPath: process.env.MCP_PATH || "/mcp",
    webhookPath: process.env.WEBHOOK_PATH || "/webhooks/convertway",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@example.com",
  },
  storage: {
    conversationsPath: process.env.CONVERSATIONS_DB_PATH || "./data/conversations.json",
  },
};
