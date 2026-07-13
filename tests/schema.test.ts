import { describe, it, expect } from "vitest";
import { tools } from "../src/tools/index.js";
import { z } from "zod";

describe("MCP Tool Schemas", () => {
  it("should define an array of tools", () => {
    expect(tools).toBeDefined();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it("should ensure all tools have a valid name and description", () => {
    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.name).toMatch(/^[a-z0-9_]+$/); // MCP tool naming standard

      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe("string");
      expect(tool.description.length).toBeGreaterThan(15);
    }
  });

  it("should ensure all tool schemas are valid Zod definitions", () => {
    for (const tool of tools) {
      expect(tool.schema).toBeDefined();
      expect(typeof tool.schema).toBe("object");

      for (const [key, fieldSchema] of Object.entries(tool.schema)) {
        expect(fieldSchema).toBeInstanceOf(z.ZodType);
      }
    }
  });
});
