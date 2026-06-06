import type Mail from "nodemailer/lib/mailer";
import { resolveAppBaseUrl } from "@/lib/app-url";
import { buildRawMimeMessage, sendRawViaGmailApi } from "@/lib/gmail/send-via-api";
import { refreshAccessToken } from "@/lib/gmail/oauth";
import { createCronClient } from "@/lib/supabase/cron";

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type GmailCredentialsRow = {
  sender_email: string;
  access_token: string | null;
  refresh_token: string;
  token_expiry: string | null;
};

function buildEmailHtml(
  body: string,
  trackingPixelId: string,
  contactId: string,
  baseUrl: string
): string {
  const pixelUrl = `${baseUrl}/api/track/${trackingPixelId}`;
  const unsubUrl = `${baseUrl}/api/unsubscribe/${contactId}`;
  const htmlBody = body.includes("<") ? body : body.replace(/\n/g, "<br>");
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0" alt="" />`;
  const footer = `
<br/><br/>
<hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
<p style="color:#999;font-size:12px;font-family:sans-serif">
  Don't want to hear from us? 
  <a href="${unsubUrl}" style="color:#999">Unsubscribe</a>
</p>`;
  return htmlBody + pixel + footer;
}

export function renderTemplate(
  template: string,
  contact: { name: string; email: string },
  customVars: Record<string, string>
): string {
  return template.replace(VARIABLE_REGEX, (_, key: string) => {
    const lower = key.toLowerCase();
    if (lower === "name") return contact.name ?? "";
    if (lower === "email") return contact.email ?? "";
    return customVars[key] ?? customVars[lower] ?? "";
  });
}

async function getCredentialsRow(userId: string): Promise<GmailCredentialsRow> {
  const supabase = createCronClient();
  const { data, error } = await supabase
    .from("gmail_credentials")
    .select("sender_email, access_token, refresh_token, token_expiry")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.refresh_token) {
    throw new Error("Gmail not connected. Go to Settings to connect.");
  }

  return data as GmailCredentialsRow;
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const row = await getCredentialsRow(userId);
  const expiryMs = row.token_expiry
    ? new Date(row.token_expiry).getTime()
    : 0;
  const needsRefresh = expiryMs < Date.now() + TOKEN_REFRESH_BUFFER_MS;

  if (!needsRefresh && row.access_token) {
    return row.access_token;
  }

  const tokens = await refreshAccessToken(row.refresh_token);
  const tokenExpiry = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000
  ).toISOString();

  const supabase = createCronClient();
  const { error } = await supabase
    .from("gmail_credentials")
    .update({
      access_token: tokens.access_token,
      token_expiry: tokenExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return tokens.access_token!;
}

type SendGmailEmailOptions = {
  userId: string;
  to: string;
  toName?: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
  trackingPixelId: string;
  contactId: string;
  inReplyTo?: string;
  references?: string;
  /** Gmail thread id from step 1 — keeps follow-ups in the same thread. */
  gmailThreadId?: string;
  request?: Request;
};

export async function sendGmailEmail({
  userId,
  to,
  toName,
  subject,
  body,
  senderEmail,
  senderName,
  trackingPixelId,
  contactId,
  inReplyTo,
  references,
  gmailThreadId,
  request,
}: SendGmailEmailOptions): Promise<{ messageId: string; threadId: string }> {
  const credentials = await getCredentialsRow(userId);
  const connectedEmail = credentials.sender_email.trim().toLowerCase();
  const campaignFrom = senderEmail.trim().toLowerCase();

  if (campaignFrom !== connectedEmail) {
    throw new Error(
      `Campaign sender email must match your connected Gmail (${connectedEmail}). Update the campaign or reconnect Gmail in Settings.`
    );
  }

  const accessToken = await getValidAccessToken(userId);
  const baseUrl = resolveAppBaseUrl(request);
  const unsubUrl = `${baseUrl}/api/unsubscribe/${contactId}`;
  const finalBody = buildEmailHtml(body, trackingPixelId, contactId, baseUrl);

  console.log("[Gmail] Sending email via Gmail API", {
    from: connectedEmail,
    to,
    subject,
    pixelUrl: `${baseUrl}/api/track/${trackingPixelId}`,
    unsubUrl: `${baseUrl}/api/unsubscribe/${contactId}`,
    appBaseUrl: baseUrl,
    inReplyTo: inReplyTo ?? undefined,
    gmailThreadId: gmailThreadId ?? undefined,
  });

  const mailOptions: Mail.Options = {
    from: `"${senderName.trim()}" <${connectedEmail}>`,
    to: toName ? `"${toName.trim()}" <${to.trim()}>` : to.trim(),
    subject,
    html: finalBody,
    headers: {
      "List-Unsubscribe": `<mailto:unsubscribe@getfiginbox.com>, <${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };

  if (inReplyTo) {
    mailOptions.inReplyTo = inReplyTo;
  }
  if (references) {
    mailOptions.references = references;
  }

  try {
    const rawMime = await buildRawMimeMessage(mailOptions);
    const result = await sendRawViaGmailApi(
      accessToken,
      rawMime,
      gmailThreadId
    );

    console.log("[Gmail] Send succeeded", result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Gmail] Send failed", { error: message });
    throw new Error(message);
  }
}
