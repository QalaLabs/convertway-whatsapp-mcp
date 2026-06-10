import axios, { AxiosInstance, AxiosError } from "axios";
import { config } from "../config.js";
import type {
  SendMessageRequest,
  SendMessageResponse,
  DeliveryStatusCallback,
  InboundMessage,
  Channel,
  MessageStatus,
} from "./types.js";

export class ConvertwayClient {
  private http: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.convertway.baseUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${config.convertway.licenseKey}`,
        "User-Agent": "Convertway-MCP-Server/1.0",
      },
      timeout: 30000,
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status;
        const data = err.response?.data as Record<string, unknown> | undefined;
        const msg = data?.message || data?.error || err.message;
        return Promise.reject(new Error(`Convertway API ${status}: ${msg}`));
      }
    );
  }

  async sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
    const payload = this.buildPayload(req);

    try {
      const endpoint = this.getEndpoint(req.channel);
      const response = await this.http.post(endpoint, payload);

      return {
        success: true,
        messageId: response.data?.messageId || `cw_${Date.now()}`,
        channel: req.channel,
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: response.data as Record<string, unknown>,
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        messageId: `failed_${Date.now()}`,
        channel: req.channel,
        status: "failed",
        timestamp: new Date().toISOString(),
        providerResponse: { error: error.message },
      };
    }
  }

  async checkDeliveryStatus(messageId: string, channel: Channel): Promise<DeliveryStatusCallback> {
    try {
      const response = await this.http.get(`/${channel}/status/${messageId}`);
      return {
        messageId,
        channel,
        status: (response.data?.status as MessageStatus) || "sent",
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        messageId,
        channel,
        status: "sent",
        timestamp: new Date().toISOString(),
      };
    }
  }

  private buildPayload(req: SendMessageRequest): Record<string, unknown> {
    const base: Record<string, unknown> = {
      to: req.to,
      channel: req.channel,
    };

    if (req.templateName) {
      base.template_name = req.templateName;
      base.template_params = req.templateParams || {};
      base.type = "template";
    } else if (req.mediaUrl) {
      base.type = "media";
      base.media_url = req.mediaUrl;
      base.media_type = req.mediaType || "image";
      base.caption = req.content;
    } else {
      base.type = "text";
      base.content = req.content;
    }

    if (req.senderId) base.sender_id = req.senderId;
    if (req.subject) base.subject = req.subject;
    if (req.cc) base.cc = req.cc;
    if (req.bcc) base.bcc = req.bcc;

    return base;
  }

  private getEndpoint(channel: Channel): string {
    const endpoints: Record<Channel, string> = {
      whatsapp: "/send_messages/whatsapp",
      sms: "/send_messages/sms",
      email: "/send_messages/email",
    };
    return endpoints[channel];
  }
}

export const convertway = new ConvertwayClient();
