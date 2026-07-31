#!/usr/bin/env node
import { config } from "./config.js";
import { startStdioServer, startHttpServer } from "./server.js";

async function main(): Promise<void> {
  console.error("[WhatsApp MCP] Initializing...");
  console.error(`[WhatsApp MCP] Transport mode: ${config.server.transport}`);

  if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
    console.error("[WhatsApp MCP] WARNING: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set. Using development/mock mode.");
    console.error("[WhatsApp MCP] Set these variables in your .env file for production use.");
  }

  if (config.server.transport === "http") {
    await startHttpServer();
  } else {
    await startStdioServer();
  }
}

main().catch((err) => {
  console.error("[WhatsApp MCP] Fatal error:", err);
  process.exit(1);
});
