import axios, { AxiosInstance, AxiosError } from "axios";
import { config } from "../config.js";
import { templates } from "../templates/index.js";
import type {
  SendWhatsAppRequest,
  SendWhatsAppResponse,
} from "./types.js";

export class WhatsAppClient {
  private http: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${config.whatsapp.phoneNumberId}`;
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        "User-Agent": "WhatsApp-MCP-Server/1.0",
      },
      timeout: 30000,
    });

    this.http.interceptors.response.use(
      (res) => res,
      (err: AxiosError) => {
        const status = err.response?.status;
        const data = err.response?.data as Record<string, unknown> | undefined;
        const errorDetail = (data?.error as Record<string, unknown>) || {};
        const msg = errorDetail.message || err.message;
        return Promise.reject(new Error(`WhatsApp Cloud API ${status}: ${msg}`));
      }
    );
  }

  async sendMessage(req: SendWhatsAppRequest): Promise<SendWhatsAppResponse> {
    const payload = this.buildPayload(req);

    try {
      const response = await this.http.post("/messages", payload);
      const messageId = response.data?.messages?.[0]?.id || `wa_${Date.now()}`;

      return {
        success: true,
        messageId,
        status: "sent",
        timestamp: new Date().toISOString(),
        providerResponse: response.data as Record<string, unknown>,
      };
    } catch (err) {
      const error = err as Error;
      return {
        success: false,
        messageId: `failed_${Date.now()}`,
        status: "failed",
        timestamp: new Date().toISOString(),
        providerResponse: { error: error.message },
      };
    }
  }

  private buildPayload(req: SendWhatsAppRequest): Record<string, unknown> {
    const cleanedTo = req.to.replace(/\D/g, "");

    const base: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanedTo,
    };

    if (req.templateName) {
      const tmpl = templates.find((t) => t.whatsappTemplateName === req.templateName);
      const parameters: Array<Record<string, unknown>> = [];

      if (tmpl && req.templateParams) {
        for (const variable of tmpl.variables) {
          parameters.push({
            type: "text",
            text: req.templateParams[variable] || "",
          });
        }
      }

      base.type = "template";
      base.template = {
        name: req.templateName,
        language: {
          code: "en_US",
        },
        components: parameters.length > 0 ? [
          {
            type: "body",
            parameters,
          },
        ] : [],
      };
    } else if (req.mediaUrl) {
      const mediaType = req.mediaType || "image";
      base.type = mediaType;
      base[mediaType] = {
        link: req.mediaUrl,
        ...(req.content ? { caption: req.content } : {}),
      };
    } else {
      base.type = "text";
      base.text = {
        body: req.content,
      };
    }

    return base;
  }
}

export const whatsapp = new WhatsAppClient();
