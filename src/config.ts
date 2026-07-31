import dotenv from "dotenv";
dotenv.config();

export const config = {
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "whatsapp_verify_token",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
  },
  server: {
    transport: (process.env.MCP_TRANSPORT || "stdio") as "stdio" | "http",
    port: parseInt(process.env.MCP_PORT || process.env.WEBHOOK_PORT || "3000", 10),
    mcpPath: process.env.MCP_PATH || "/mcp",
    webhookPath: process.env.WEBHOOK_PATH || "/webhooks/whatsapp",
  },
  storage: {
    conversationsPath: process.env.CONVERSATIONS_DB_PATH || "./data/conversations.json",
  },
};
