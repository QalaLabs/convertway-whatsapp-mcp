import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

describe("MCP Server Integration Tests", () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Ensure the dist directory exists by verifying compiled output
    const distIndex = path.resolve(process.cwd(), "dist/index.js");
    if (!fs.existsSync(distIndex)) {
      throw new Error(`Compiled server index not found at ${distIndex}. Please run build first.`);
    }

    // Set test database path to avoid polluting real database during integration test
    const testDbPath = path.resolve(process.cwd(), "data/test_conversations.json");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/index.js"],
      env: {
        ...process.env,
        CONVERSATIONS_DB_PATH: testDbPath,
        WHATSAPP_ACCESS_TOKEN: "test_access_token",
        WHATSAPP_PHONE_NUMBER_ID: "test_phone_number_id",
        MCP_TRANSPORT: "stdio",
        DOTENV_LOG_LEVEL: "none",
      },
    });

    client = new Client(
      { name: "integration-test-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(transport);
  });

  afterAll(async () => {
    await client.close();
    const testDbPath = path.resolve(process.cwd(), "data/test_conversations.json");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it("should list all available tools and execute a simple read tool", async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await client.listTools();
    
    expect(response).toBeDefined();
    expect(response.tools).toBeDefined();
    expect(response.tools.length).toBeGreaterThan(0);

    const toolNames = response.tools.map((t) => t.name);
    expect(toolNames).toContain("send_whatsapp");
    expect(toolNames).not.toContain("send_sms");
    expect(toolNames).not.toContain("send_email");
    expect(toolNames).toContain("list_template_modules");

    const callResponse = await client.callTool({ name: "list_template_modules" });

    expect(callResponse).toBeDefined();
    expect(callResponse.content).toBeDefined();
    expect(callResponse.content[0].type).toBe("text");
    expect(callResponse.content[0].text).toContain("Available Template Modules");
  }, 20000);
});
