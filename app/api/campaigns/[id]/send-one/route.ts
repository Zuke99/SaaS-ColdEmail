import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedCampaignContext } from "@/lib/api/campaign-route";
import { sendGmailEmail } from "@/lib/gmail";

type RouteContext = { params: { id: string } };

const sendOneSchema = z.object({
  contactId: z.string().uuid(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

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

  const parsed = sendOneSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ctx = await getAuthedCampaignContext(params.id);
  if ("response" in ctx) return ctx.response;
  const { supabase, user } = ctx;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, sender_name, sender_email")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 500 });
  }

  if (!campaign.sender_email?.trim() || !campaign.sender_name?.trim()) {
    return NextResponse.json(
      { error: "Campaign sender name and email are required" },
      { status: 400 }
    );
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, name, email, status")
    .eq("id", parsed.data.contactId)
    .eq("campaign_id", params.id)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (contact.status !== "not_started") {
    return NextResponse.json(
      { error: "Contact has already been sent an email" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { data: logRow, error: insertError } = await supabase
    .from("send_log")
    .insert({
      campaign_id: params.id,
      contact_id: contact.id,
      step_number: 1,
      subject: parsed.data.subject,
      body: parsed.data.body,
      status: "pending",
      scheduled_for: todayDateString(),
    })
    .select("id, tracking_pixel_id")
    .single();

  if (insertError || !logRow?.tracking_pixel_id) {
    return NextResponse.json(
      { error: "Failed to create send log" },
      { status: 500 }
    );
  }

  try {
    const { messageId, threadId } = await sendGmailEmail({
      userId: user.id,
      to: contact.email,
      toName: contact.name ?? undefined,
      subject: parsed.data.subject,
      body: parsed.data.body,
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

    return NextResponse.json({ sent: 1 });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to send email";

    await supabase
      .from("send_log")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", logRow.id);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
