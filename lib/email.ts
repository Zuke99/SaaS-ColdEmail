import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { FEATURES } from "@/config/features";
import { getEmailConfig } from "@/config/email";
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
  if (!FEATURES.email) {
    return { success: false, error: "Email feature is disabled" };
  }

  try {
    const emailConfig = getEmailConfig();
    const html = await render(template);

    const { data, error } = await getResend().emails.send({
      from: emailConfig.from,
      replyTo: emailConfig.replyTo,
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
