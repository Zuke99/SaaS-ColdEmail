import { FEATURES } from "@/config/features";
import { env } from "@/env";
import {
  resolveAppBaseUrl,
  warnIfLocalBaseUrlForOutboundEmail,
} from "@/lib/app-url";
import { Resend } from "resend";

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export const resend = FEATURES.email
  ? new Resend(env.RESEND_API_KEY!)
  : null;

let resendClient: Resend | null = resend;

export function getResend(): Resend {
  if (!FEATURES.email || !resendClient) {
    throw new Error("Email feature is disabled");
  }
  return resendClient;
}

export function renderTemplate(
  template: string,
  contact: { name: string; email: string; company?: string | null },
  customVars: Record<string, string>
): string {
  return template.replace(VARIABLE_REGEX, (_, key: string) => {
    const lower = key.toLowerCase();
    if (lower === "name") return contact.name ?? "";
    if (lower === "email") return contact.email ?? "";
    if (lower === "company") return contact.company ?? "";
    return customVars[key] ?? customVars[lower] ?? "";
  });
}

function buildEmailHtml(
  body: string,
  trackingPixelId: string,
  contactId: string,
  baseUrl: string
): string {
  const pixelUrl = `${baseUrl}/api/track/${trackingPixelId}`;
  const unsubUrl = `${baseUrl}/api/unsubscribe/${contactId}`;

  const htmlBody = body.includes("<") ? body : body.replace(/\n/g, "<br>");

  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="width:1px;height:1px;border:0;margin:0;padding:0" />`;

  const unsubLine = `
<br/><br/>
<hr style="border:none;border-top:1px solid #333;margin:20px 0"/>
<p style="color:#666;font-size:12px;font-family:sans-serif">
  Don't want to hear from us? 
  <a href="${unsubUrl}" style="color:#666">Unsubscribe</a>
</p>`;

  return htmlBody + pixel + unsubLine;
}

type SendEmailOptions = {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  trackingPixelId: string;
  contactId: string;
  /** Pass the API route Request in dev so pixel URLs use the correct localhost port. */
  request?: Request;
};

export async function sendEmail({
  to,
  toName,
  subject,
  body,
  senderEmail,
  senderName,
  trackingPixelId,
  contactId,
  request,
}: SendEmailOptions): Promise<void> {
  const normalizedTo = to.trim().toLowerCase();
  const normalizedFrom = senderEmail.trim().toLowerCase();
  const from = `${senderName.trim()} <${normalizedFrom}>`;
  const baseUrl = resolveAppBaseUrl(request);
  const html = buildEmailHtml(body, trackingPixelId, contactId, baseUrl);
  const pixelUrl = `${baseUrl}/api/track/${trackingPixelId}`;
  const unsubUrl = `${baseUrl}/api/unsubscribe/${contactId}`;

  warnIfLocalBaseUrlForOutboundEmail(baseUrl);

  console.log("[Resend] Tracking URLs", { pixelUrl, unsubUrl, appBaseUrl: baseUrl });
  console.log("[Resend] Sending email", {
    from: normalizedFrom,
    fromFormatted: from,
    to: normalizedTo,
    toName: toName?.trim() || undefined,
    subject,
    trackingPixelId,
    contactId,
    pixelUrl,
    unsubUrl,
    appBaseUrl: baseUrl,
  });

  const { error } = await getResend().emails.send({
    from,
    to: [normalizedTo],
    subject,
    html,
  });

  if (error) {
    console.error("[Resend] Send failed", {
      from: normalizedFrom,
      to: normalizedTo,
      error: error.message,
    });
    throw new Error(error.message ?? "Failed to send email");
  }

  console.log("[Resend] Send succeeded", { from: normalizedFrom, to: normalizedTo });
}
