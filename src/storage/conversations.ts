import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { config } from "../config.js";
import type { ConversationLog } from "../convertway/types.js";
import type { ConversationStore } from "./types.js";

export class FileConversationStore implements ConversationStore {
  private dbPath: string;
  private conversations: ConversationLog[];

  constructor() {
    this.dbPath = config.storage.conversationsPath;
    this.conversations = this.load();
  }

  getAll(): ConversationLog[] {
    return [...this.conversations];
  }

  getByCustomer(customerId: string): ConversationLog[] {
    return this.conversations.filter((c) => c.customerId === customerId);
  }

  getByMessageId(messageId: string): ConversationLog | undefined {
    return this.conversations.find((c) => c.messageId === messageId);
  }

  add(entry: ConversationLog): void {
    this.conversations.push(entry);
    this.save();
  }

  updateStatus(messageId: string, status: string): boolean {
    const entry = this.conversations.find((c) => c.messageId === messageId);
    if (!entry) return false;
    entry.status = status as ConversationLog["status"];
    this.save();
    return true;
  }

  private load(): ConversationLog[] {
    try {
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      if (!existsSync(this.dbPath)) return [];
      const raw = readFileSync(this.dbPath, "utf-8");
      return JSON.parse(raw) as ConversationLog[];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.dbPath, JSON.stringify(this.conversations, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save conversations:", err);
    }
  }
}

export const store = new FileConversationStore();
