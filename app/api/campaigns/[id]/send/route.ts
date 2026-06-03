import { NextResponse } from "next/server";
import { z } from "zod";
import { stripInternalCustomVars } from "@/lib/sequence/variables";
import { renderTemplate, sendEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, sender_name, sender_email, daily_limit")
    .eq("id", params.id)
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

    try {
      await sendEmail({
        to: contact.email,
        toName: contact.name ?? undefined,
        subject: renderedSubject,
        body: renderedBody,
        senderEmail: campaign.sender_email,
        senderName: campaign.sender_name,
      });

      await supabase.from("send_log").insert({
        campaign_id: params.id,
        contact_id: contact.id,
        step_number: 1,
        subject: renderedSubject,
        body: renderedBody,
        status: "sent",
        scheduled_for: scheduledFor,
        sent_at: now,
      });

      await supabase
        .from("contacts")
        .update({ status: "sent", updated_at: now })
        .eq("id", contact.id);

      sent++;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send email";

      await supabase.from("send_log").insert({
        campaign_id: params.id,
        contact_id: contact.id,
        step_number: 1,
        subject: renderedSubject,
        body: renderedBody,
        status: "failed",
        scheduled_for: scheduledFor,
        error_message: errorMessage,
      });

      failed++;
    }

    if (i < parsed.data.contactIds.length - 1) {
      await sleep(2000);
    }
  }

  return NextResponse.json({ sent, failed, skipped });
}
