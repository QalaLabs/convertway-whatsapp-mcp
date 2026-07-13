import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    env: {
      CONVERSATIONS_DB_PATH: "./data/test_conversations.json",
      CONVERTWAY_LICENSE_KEY: "test_key",
      DOTENV_LOG_LEVEL: "none",
    },
  },
});
