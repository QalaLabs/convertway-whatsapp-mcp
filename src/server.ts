import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import { config } from "./config.js";
import { tools } from "./tools/index.js";
import { createWebhookRouter } from "./webhooks/router.js";
import { randomUUID } from "node:crypto";

function registerTools(server: McpServer): void {
  for (const tool of tools) {
    const schemaEntries = Object.entries(tool.schema);

    const cb = async (_args: Record<string, unknown>) => {
      const result = await tool.handler(_args);
      return {
        content: result.content.map((c) => ({ type: "text" as const, text: c.text })),
        isError: result.isError,
      } as any;
    };

    if (schemaEntries.length === 0) {
      server.tool(tool.name, tool.description, cb);
      continue;
    }

    const shape: Record<string, z.ZodType> = {};
    for (const [key, schema] of schemaEntries) {
      shape[key] = schema as z.ZodType;
    }

    server.tool(tool.name, tool.description, shape, cb);
  }
}

export async function createServer(): Promise<McpServer> {
  const server = new McpServer({
    name: "Convertway WhatsApp MCP",
    version: "1.0.0",
    description: "MCP Server for WhatsApp Business API via Convertway by Unicommerce — omnichannel communication layer supporting WhatsApp, SMS, and Email",
  });

  registerTools(server);
  return server;
}

export async function startStdioServer(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();
  console.error("[Convertway MCP] Starting server in stdio mode...");
  await server.connect(transport);
}

export async function startHttpServer(): Promise<void> {
  const mcpServer = await createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  const app = express();
  app.use(express.json());

  app.all(config.server.mcpPath, (req, res) => {
    transport.handleRequest(req, res, req.body).catch((err) => {
      console.error("[Convertway MCP] MCP transport error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  app.use("/", createWebhookRouter());

  const port = config.server.port;
  app.listen(port, () => {
    console.error(`[Convertway MCP] HTTP server listening on port ${port}`);
    console.error(`[Convertway MCP] MCP endpoint: http://localhost:${port}${config.server.mcpPath}`);
    console.error(`[Convertway MCP] Webhook endpoint: POST http://localhost:${port}${config.server.webhookPath}`);
    console.error(`[Convertway MCP] Health check: GET http://localhost:${port}/health`);
  });
}
