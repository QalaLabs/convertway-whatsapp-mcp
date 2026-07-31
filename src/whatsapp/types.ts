export type MessageDirection = "outbound" | "inbound";
export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "clicked";

export interface SendWhatsAppRequest {
  to: string;
  content: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video";
}

export interface SendWhatsAppResponse {
  success: boolean;
  messageId: string;
  status: MessageStatus;
  timestamp: string;
  providerResponse?: Record<string, unknown>;
}

export interface InboundMessage {
  id: string;
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
  status: MessageStatus;
  timestamp: string;
  error?: string;
}

export interface ConversationLog {
  id: string;
  customerId: string;
  channel: "whatsapp";
  direction: MessageDirection;
  content: string;
  status: MessageStatus;
  messageId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
