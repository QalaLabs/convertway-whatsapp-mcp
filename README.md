# Convertway WhatsApp MCP Server

MCP Server for WhatsApp Business API via [Convertway by Unicommerce](https://app.theconvertway.com) — omnichannel communication layer for WhatsApp, SMS, and Email. Built for AI coding tools (Claude Code, Cursor, etc.).

## Features

- **3 Channels** — WhatsApp (text/template/media), SMS, Email (CC/BCC)
- **11 MCP Tools** — send, receive, list templates, check delivery, log conversations
- **15 Message Templates** — across 7 modules: shipment, payment, mis, support, alerts, b2b, escalation
- **Dual Transport** — stdio (local CLI) or HTTP (remote server)
- **Inbound Webhooks** — receive and process incoming messages
- **Conversation Store** — file-based persistence

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env: set CONVERTWAY_LICENSE_KEY
npm run dev          # stdio mode (local)
npm run dev:http     # HTTP mode (remote)
```

## Remote Server Mode

Run as a remote MCP server for Claude Code, Cursor, or any MCP client:

```bash
npm run start:http
```

The server exposes a unified Express app on a single port:

| Endpoint | Method | Purpose |
|---|---|---|
| `/mcp` | POST / GET | MCP Streamable HTTP endpoint |
| `/webhooks/convertway` | POST | Convertway webhook callbacks |
| `/health` | GET | Health check |

### MCP Client Config

```json
{
  "mcpServers": {
    "convertway": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Tools

| Tool | Description |
|---|---|
| `send_whatsapp` | Send WhatsApp text, template, or media messages |
| `get_whatsapp_templates` | List approved WhatsApp templates |
| `send_sms` | Send SMS with sender ID |
| `send_email` | Send email with CC/BCC |
| `get_delivery_status` | Check delivery status by message ID |
| `receive_inbound` | Pull inbound messages from webhook queue |
| `log_conversation` | Log a conversation record |
| `get_conversation_history` | Retrieve conversation history |
| `list_template_modules` | List all template modules |
| `list_templates_by_module` | List templates for a specific module |
| `list_all_templates` | List all templates across modules |

## Environment

| Variable | Default | Description |
|---|---|---|
| `CONVERTWAY_LICENSE_KEY` | — | Convertway API license key |
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_PORT` | `3000` | HTTP server port |
| `MCP_PATH` | `/mcp` | MCP endpoint path |
| `WEBHOOK_PATH` | `/webhooks/convertway` | Webhook callback path |
| `SMTP_HOST` | — | SMTP server for email fallback |

## Architecture

```
src/
├── config.ts              # Env-based configuration
├── server.ts              # McpServer setup (stdio + HTTP)
├── index.ts               # Entry point
├── convertway/
│   ├── client.ts          # Convertway API client (Axios, Basic Auth)
│   └── types.ts           # TypeScript types
├── templates/
│   └── index.ts           # 15 templates with variable interpolation
├── tools/
│   ├── index.ts           # Tool registry (11 tools)
│   ├── whatsapp.ts        # WhatsApp send + template listing
│   ├── sms.ts             # SMS send
│   ├── email.ts           # Email send
│   ├── delivery.ts        # Delivery status
│   └── conversations.ts   # Conversation CRUD
├── webhooks/
│   ├── handler.ts         # Inbound message queue
│   ├── router.ts          # Express webhook routes
│   └── server.ts          # Standalone webhook server
└── storage/
    └── conversations.ts   # File-based conversation store
```

## Docker

```bash
docker build -t convertway-mcp .
docker run -e CONVERTWAY_LICENSE_KEY=cw_your_key -e MCP_TRANSPORT=http -p 3000:3000 convertway-mcp
```
