import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Build RFC 822 MIME using nodemailer (no SMTP). */
export async function buildRawMimeMessage(
  mailOptions: Mail.Options
): Promise<string> {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

  const info = await transport.sendMail(mailOptions);
  const message = info.message;

  if (Buffer.isBuffer(message)) {
    return message.toString("utf-8");
  }
  if (typeof message === "string") {
    return message;
  }

  throw new Error("Failed to build email MIME");
}

export async function sendRawViaGmailApi(
  accessToken: string,
  rawMime: string,
  threadId?: string
): Promise<{ messageId: string; threadId: string }> {
  const body: { raw: string; threadId?: string } = {
    raw: base64UrlEncode(Buffer.from(rawMime, "utf-8")),
  };
  if (threadId) {
    body.threadId = threadId;
  }

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await res.json()) as {
    id?: string;
    threadId?: string;
    error?: { message?: string };
  };

  if (!res.ok || !data.id) {
    throw new Error(
      data.error?.message ??
        "Gmail API send failed. Reconnect Gmail in Settings and try again."
    );
  }

  return {
    messageId: data.id,
    threadId: data.threadId ?? "",
  };
}
