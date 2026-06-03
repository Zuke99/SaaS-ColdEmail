import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { EMAIL_CONFIG } from "@/config/email";
import { getResend } from "@/lib/resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<{
  success: boolean;
  id?: string;
  error?: unknown;
}> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY is not configured");
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }

    const html = await render(template);

    const { data, error } = await getResend().emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.replyTo,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error };
    }

    console.log("[Email] Sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}
