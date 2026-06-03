import { FEATURES } from "@/config/features";
import { env } from "@/env";
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

type SendEmailOptions = {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
};

export async function sendEmail({
  to,
  toName,
  subject,
  body,
  senderEmail,
  senderName,
}: SendEmailOptions): Promise<void> {
  const normalizedTo = to.trim().toLowerCase();
  const normalizedFrom = senderEmail.trim().toLowerCase();
  const from = `${senderName.trim()} <${normalizedFrom}>`;
  const html = body.includes("<") ? body : body.replace(/\n/g, "<br>");

  console.log("[Resend] Sending email", {
    from: normalizedFrom,
    fromFormatted: from,
    to: normalizedTo,
    toName: toName?.trim() || undefined,
    subject,
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
