export interface MessageTemplate {
  id: string;
  module: string;
  channel: "whatsapp";
  name: string;
  whatsappTemplateName?: string;
  body: string;
  variables: string[];
  description: string;
}

export interface RenderedMessage {
  content: string;
}

function renderTemplate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] || `{{${key}}}`);
}

export function render(template: MessageTemplate, params: Record<string, string>): RenderedMessage {
  return {
    content: renderTemplate(template.body, params),
  };
}

export const templates: MessageTemplate[] = [
  {
    id: "shipment_dispatched",
    module: "shipment",
    channel: "whatsapp",
    name: "shipment_dispatched",
    whatsappTemplateName: "shipment_dispatched",
    body: "📦 *Your order is on the way!*\n\nHi {{customer_name}},\n\nYour order #{{order_id}} has been dispatched via {{courier}}.\n\n🔗 Track: {{tracking_url}}\n📮 AWB: {{awb_number}}\n\nEstimated delivery: {{estimated_date}}\n\nThank you for shopping with us!",
    variables: ["customer_name", "order_id", "courier", "tracking_url", "awb_number", "estimated_date"],
    description: "Sent when shipment is dispatched from warehouse",
  },
  {
    id: "shipment_out_for_delivery",
    module: "shipment",
    channel: "whatsapp",
    name: "shipment_out_for_delivery",
    whatsappTemplateName: "shipment_out_for_delivery",
    body: "🚚 *Out for Delivery!*\n\nHi {{customer_name}},\n\nYour order #{{order_id}} is out for delivery today.\n\n📮 AWB: {{awb_number}}\n👨‍🔧 Delivery Partner: {{courier}}\n\nPlease keep your phone handy. Expected by {{delivery_window}}.",
    variables: ["customer_name", "order_id", "awb_number", "courier", "delivery_window"],
    description: "Sent when shipment is out for delivery",
  },
  {
    id: "shipment_delivered",
    module: "shipment",
    channel: "whatsapp",
    name: "shipment_delivered",
    whatsappTemplateName: "shipment_delivered",
    body: "✅ *Order Delivered!*\n\nHi {{customer_name}},\n\nYour order #{{order_id}} has been delivered successfully.\n\nWe hope you love your purchase! If you have any questions, reply to this message.\n\n⭐ Loved it? Leave a review: {{review_link}}",
    variables: ["customer_name", "order_id", "review_link"],
    description: "Sent when shipment is delivered",
  },
  {
    id: "payment_reminder",
    module: "payment",
    channel: "whatsapp",
    name: "payment_reminder",
    whatsappTemplateName: "payment_reminder",
    body: "⏰ *Payment Reminder*\n\nHi {{customer_name}},\n\nThis is a reminder that your payment of ₹{{amount}} for {{description}} is due on {{due_date}}.\n\n🔗 Pay now: {{payment_link}}\n\nLate payment may result in {{late_fee_penalty}}.",
    variables: ["customer_name", "amount", "description", "due_date", "payment_link", "late_fee_penalty"],
    description: "Sent as payment due reminder",
  },
  {
    id: "payment_confirmation",
    module: "payment",
    channel: "whatsapp",
    name: "payment_confirmation",
    whatsappTemplateName: "payment_confirmation",
    body: "✅ *Payment Received!*\n\nHi {{customer_name}},\n\nWe've received your payment of ₹{{amount}} for {{description}}.\n\n📄 Receipt: {{receipt_link}}\n📅 Date: {{payment_date}}\n💳 Method: {{payment_method}}\n\nThank you for your prompt payment!",
    variables: ["customer_name", "amount", "description", "receipt_link", "payment_date", "payment_method"],
    description: "Sent when payment is successfully received",
  },
  {
    id: "payment_overdue",
    module: "payment",
    channel: "whatsapp",
    name: "payment_overdue",
    whatsappTemplateName: "payment_overdue",
    body: "⚠️ *Payment Overdue*\n\nHi {{customer_name}},\n\nYour payment of ₹{{amount}} was due on {{due_date}} and is now {{days_overdue}} days overdue.\n\nPlease pay immediately to avoid service disruption.\n\n🔗 Pay now: {{payment_link}}",
    variables: ["customer_name", "amount", "due_date", "days_overdue", "payment_link"],
    description: "Sent when payment is overdue",
  },
  {
    id: "support_ai_reply_whatsapp",
    module: "support",
    channel: "whatsapp",
    name: "support_ai_reply",
    whatsappTemplateName: "support_ai_reply",
    body: "👋 *Hi {{customer_name}}!*\n\nThank you for reaching out. Here's what I found:\n\n{{ai_response}}\n\n📌 *Ticket ID:* {{ticket_id}}\n\nIf you need more help, just reply to this message and I'll assist you right away!",
    variables: ["customer_name", "ai_response", "ticket_id"],
    description: "AI-generated support reply sent via WhatsApp",
  },
  {
    id: "price_alert",
    module: "alerts",
    channel: "whatsapp",
    name: "price_alert",
    whatsappTemplateName: "price_alert",
    body: "💰 *Price Drop Alert!*\n\nHi {{customer_name}},\n\nThe product you liked is now at a lower price!\n\n🛍️ *{{product_name}}*\n~~₹{{old_price}}~~ → *₹{{new_price}}*\n📉 You save ₹{{savings}} ({{discount_percent}}% off)\n\n🛒 Grab it now: {{product_link}}",
    variables: ["customer_name", "product_name", "old_price", "new_price", "savings", "discount_percent", "product_link"],
    description: "Sent when a saved/wishlisted product drops in price",
  },
  {
    id: "b2b_follow_up",
    module: "b2b",
    channel: "whatsapp",
    name: "b2b_follow_up",
    whatsappTemplateName: "b2b_follow_up",
    body: "📋 *B2B Follow-up*\n\nHi {{contact_name}},\n\nThis is a follow-up regarding {{deal_description}}.\n\n📅 Last contact: {{last_contact_date}}\n📋 Status: {{deal_status}}\n\nWould you like to schedule a call or discuss further?\n\nReply YES to connect with our team.",
    variables: ["contact_name", "deal_description", "last_contact_date", "deal_status"],
    description: "B2B sales follow-up reminder",
  },
  {
    id: "escalation_alert",
    module: "escalation",
    channel: "whatsapp",
    name: "escalation_alert",
    whatsappTemplateName: "escalation_alert",
    body: "🚨 *Escalation Alert*\n\n⚠️ Ticket #{{ticket_id}} has been escalated.\n\n👤 Customer: {{customer_name}}\n⏱️ Open since: {{opened_at}}\n📋 Issue: {{issue_summary}}\n📌 Priority: {{priority}}\n\n👉 Assigned to: {{assigned_to}}\n🔗 View: {{dashboard_link}}",
    variables: ["ticket_id", "customer_name", "opened_at", "issue_summary", "priority", "assigned_to", "dashboard_link"],
    description: "Alert sent when a support ticket is escalated",
  },
  {
    id: "abandoned_cart",
    module: "alerts",
    channel: "whatsapp",
    name: "abandoned_cart",
    whatsappTemplateName: "abandoned_cart",
    body: "🛒 *Items waiting in your cart!*\n\nHi {{customer_name}},\n\nYou left some items in your cart:\n\n{{cart_items}}\n\n📦 *Total:* ₹{{cart_total}}\n\n🚀 Complete your purchase now:\n{{checkout_link}}",
    variables: ["customer_name", "cart_items", "cart_total", "checkout_link"],
    description: "Abandoned cart recovery message",
  },
  {
    id: "order_confirmation",
    module: "shipment",
    channel: "whatsapp",
    name: "order_confirmation",
    whatsappTemplateName: "order_confirmation",
    body: "🎉 *Order Confirmed!*\n\nHi {{customer_name}},\n\nYour order #{{order_id}} has been confirmed.\n\n📦 Items: {{item_count}}\n💰 Total: ₹{{total_amount}}\n📍 Delivery: {{delivery_address}}\n📅 Expected: {{expected_date}}\n\nWe'll keep you updated on your order status.",
    variables: ["customer_name", "order_id", "item_count", "total_amount", "delivery_address", "expected_date"],
    description: "Sent when order is successfully placed",
  },
];

export function getTemplate(id: string): MessageTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByModule(module: string): MessageTemplate[] {
  return templates.filter((t) => t.module === module);
}

export function getTemplatesByChannel(channel: "whatsapp"): MessageTemplate[] {
  return templates.filter((t) => t.channel === channel);
}

export function listModules(): string[] {
  return [...new Set(templates.map((t) => t.module))];
}
