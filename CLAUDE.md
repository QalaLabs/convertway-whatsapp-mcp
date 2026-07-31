# WhatsApp Business API MCP - Developer Guidelines

## Build & Test Commands
- **Build compilation**: `npm run build` (runs `tsc` compilation)
- **Run server (stdio)**: `npm run dev`
- **Run server (HTTP)**: `npm run dev:http`
- **Run test suite**: `npm test` (runs Vitest, automatically triggers build)
- **Run specific test file**: `npx vitest run tests/tools.test.ts`

## Code Style & Architecture
- **Language**: TypeScript 6+ targeting ESM output.
- **Import Extensions**: Relative imports **MUST** end with `.js` extensions (e.g. `import { config } from "./config.js"`).
- **Client Integration**: Directly use the official Meta WhatsApp Business Cloud API Graph endpoint via `WhatsAppClient` in `src/whatsapp/client.ts`. Avoid third-party gateways.
- **Error Handling**: Catch Axios errors in clients and throw detailed messages. Avoid throwing generic or uninformative error strings.
- **Template Parameter Ordering**: The local template definition's `variables` array order must match the numerical placeholder order (`{{1}}`, `{{2}}`, etc.) defined in Meta Business Suite.

## Stdio MCP Environmental Workarounds
- **Dotenv log level**: Stdio-based MCP transport will fail/hang if any non-JSON-RPC output is written to `stdout`. Since newer `dotenv` versions print configuration banners on startup, always set `DOTENV_LOG_LEVEL: "none"` in configuration, test scripts, and process spawners.
- **Logging Safety**: Use `console.error()` for debugging logs; never call `console.log()` inside server execution paths to avoid polluting stdout.
- **Vitest concurrency on Windows**: Windows thread/worker pools may block or deadlock stdio pipes during child process test execution. Always configure `pool: "forks"` in `vitest.config.ts`.
- **MCP Client callTool Signature**: The client `callTool` method expects a single object parameter: `{ name: string, arguments?: Record<string, unknown> }`.
