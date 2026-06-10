import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { tools } from "./tools/index.js";

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
