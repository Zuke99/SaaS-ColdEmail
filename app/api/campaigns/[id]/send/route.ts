import { NextResponse } from "next/server";
import { z } from "zod";
import { stripInternalCustomVars } from "@/lib/sequence/variables";
import { getAuthedCampaignContext } from "@/lib/api/campaign-route";
import { renderTemplate } from "@/lib/gmail";

type RouteContext = { params: { id: string } };

const sendSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1),
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
    .select("id, sender_name, sender_email, daily_limit, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (campaignError) {
    const status = campaignError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: campaignError.message }, { status });
  }

  if (campaign.status !== "active") {
    return NextResponse.json(
      { error: "Activate the campaign before sending emails." },
      { status: 400 }
    );
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

  let queued = 0;
  let skipped = 0;
  const scheduledFor = todayDateString();

  for (const contactId of parsed.data.contactIds) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, name, email, company, status")
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

    const contactForTemplate = { name: contact.name ?? "", email: contact.email, company: contact.company };
    const renderedSubject = renderTemplate(step.subject, contactForTemplate, customVars);
    const renderedBody = renderTemplate(step.body, contactForTemplate, customVars);

    const { error: insertError } = await supabase
      .from("send_log")
      .insert({
        campaign_id: params.id,
        contact_id: contact.id,
        step_number: 1,
        subject: renderedSubject,
        body: renderedBody,
        status: "pending",
        scheduled_for: scheduledFor,
      });

    if (insertError) {
      skipped++;
      continue;
    }

    await supabase
      .from("contacts")
      .update({ status: "queued", updated_at: new Date().toISOString() })
      .eq("id", contact.id);

    queued++;
  }

  return NextResponse.json({ queued, skipped });
}
