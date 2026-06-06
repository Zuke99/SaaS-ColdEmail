import { NextResponse } from "next/server";
import { z } from "zod";
import { stripInternalCustomVars } from "@/lib/sequence/variables";
import { getAuthedCampaignContext } from "@/lib/api/campaign-route";
import { renderTemplate, sendGmailEmail } from "@/lib/gmail";

type RouteContext = { params: { id: string } };

const sendSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1),
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ctx = await getAuthedCampaignContext(params.id);
  if ("response" in ctx) return ctx.response;
  const { supabase, user } = ctx;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, sender_name, sender_email, daily_limit")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (campaignError) {
    const status = campaignError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: campaignError.message }, { status });
  }

  if (!campaign.sender_email?.trim() || !campaign.sender_name?.trim()) {
    return NextResponse.json(
      { error: "Campaign sender name and email are required" },
      { status: 400 }
    );
  }

  const { data: step, error: stepError } = await supabase
    .from("sequence_steps")
    .select("*")
    .eq("campaign_id", params.id)
    .eq("step_number", 1)
    .single();

  if (stepError || !step) {
    return NextResponse.json(
      { error: "No email sequence found. Add a step first." },
      { status: 400 }
    );
  }

  const customVars = stripInternalCustomVars(
    (step.custom_vars as Record<string, string> | null) ?? {}
  );

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const now = new Date().toISOString();
  const scheduledFor = todayDateString();

  for (let i = 0; i < parsed.data.contactIds.length; i++) {
    const contactId = parsed.data.contactIds[i];

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, email, status")
      .eq("id", contactId)
      .eq("campaign_id", params.id)
      .single();

    if (contactError || !contact) {
      skipped++;
      continue;
    }

    if (contact.status !== "not_started") {
      skipped++;
      continue;
    }

    const contactForTemplate = {
      name: contact.name ?? "",
      email: contact.email,
    };

    const renderedSubject = renderTemplate(
      step.subject,
      contactForTemplate,
      customVars
    );
    const renderedBody = renderTemplate(
      step.body,
      contactForTemplate,
      customVars
    );

    const { data: logRow, error: insertError } = await supabase
      .from("send_log")
      .insert({
        campaign_id: params.id,
        contact_id: contact.id,
        step_number: 1,
        subject: renderedSubject,
        body: renderedBody,
        status: "pending",
        scheduled_for: scheduledFor,
      })
      .select("id, tracking_pixel_id")
      .single();

    if (insertError || !logRow?.tracking_pixel_id) {
      failed++;
      continue;
    }

    try {
      console.log("[Send] sendGmailEmail payload", {
        tracking_pixel_id: logRow.tracking_pixel_id,
        contact_id: contact.id,
        send_log_id: logRow.id,
      });

      const { messageId, threadId } = await sendGmailEmail({
        userId: user.id,
        to: contact.email,
        toName: contact.name ?? undefined,
        subject: renderedSubject,
        body: renderedBody,
        senderEmail: campaign.sender_email,
        senderName: campaign.sender_name,
        trackingPixelId: logRow.tracking_pixel_id,
        contactId: contact.id,
        request,
      });

      await supabase
        .from("send_log")
        .update({
          status: "sent",
          sent_at: now,
          gmail_message_id: messageId,
          gmail_thread_id: threadId,
        })
        .eq("id", logRow.id);

      await supabase
        .from("contacts")
        .update({ status: "sent", updated_at: now })
        .eq("id", contact.id);

      sent++;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send email";

      await supabase
        .from("send_log")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", logRow.id);

      failed++;
    }

    if (i < parsed.data.contactIds.length - 1) {
      await sleep(2000);
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}
