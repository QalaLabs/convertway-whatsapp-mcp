export type Channel = "whatsapp" | "sms" | "email";
export type MessageDirection = "outbound" | "inbound";
export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "clicked";

export interface SendMessageRequest {
  channel: Channel;
  to: string;
  content: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video";
  subject?: string;
  senderId?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  channel: Channel;
  status: MessageStatus;
  timestamp: string;
  providerResponse?: Record<string, unknown>;
}

export interface InboundMessage {
  id: string;
  channel: Channel;
  from: string;
  to: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryStatusCallback {
  messageId: string;
  channel: Channel;
  status: MessageStatus;
  timestamp: string;
  error?: string;
}

export interface ConversationLog {
  id: string;
  customerId: string;
  channel: Channel;
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  messageId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookPayload {
  event: "message_received" | "delivery_status" | "template_status";
  data: Record<string, unknown>;
  timestamp: string;
}
