import type { ConversationLog } from "../convertway/types.js";

export interface ConversationStore {
  getAll(): ConversationLog[];
  getByCustomer(customerId: string): ConversationLog[];
  getByMessageId(messageId: string): ConversationLog | undefined;
  add(entry: ConversationLog): void;
  updateStatus(messageId: string, status: string): boolean;
}
