#!/usr/bin/env node
import { config } from "./config.js";
import { startStdioServer } from "./server.js";

async function main(): Promise<void> {
  console.error("[Convertway MCP] Initializing...");

  if (!config.convertway.licenseKey) {
    console.error("[Convertway MCP] WARNING: CONVERTWAY_LICENSE_KEY not set. Using development mode (local storage only).");
    console.error("[Convertway MCP] Set CONVERTWAY_LICENSE_KEY in .env file for production use.");
  }

  if (config.server.transport === "sse") {
    console.error("[Convertway MCP] SSE transport not yet implemented, falling back to stdio");
  }

  await startStdioServer();
}

main().catch((err) => {
  console.error("[Convertway MCP] Fatal error:", err);
  process.exit(1);
});
