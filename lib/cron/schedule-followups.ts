import {
  addDaysToDate,
  dateFromTimestamp,
  todayDateString,
} from "@/lib/cron/dates";
import { createCronClient } from "@/lib/supabase/cron";

const LOG = "[Cron][schedule-followups]";

export async function runScheduleFollowups(): Promise<{ scheduled: number }> {
  console.log(`${LOG} run started`);

  const supabase = createCronClient();
  const today = todayDateString();
  let scheduled = 0;

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("status", "active");

  if (campaignsError) {
    console.error(`${LOG} failed to fetch campaigns:`, campaignsError.message);
    throw new Error(campaignsError.message);
  }

  const activeCampaigns = campaigns ?? [];
  console.log(`${LOG} active campaigns: ${activeCampaigns.length}`);

  if (activeCampaigns.length === 0) {
    console.log(`${LOG} no active campaigns — nothing to do`);
    return { scheduled };
  }

  for (const campaign of activeCampaigns) {
    const { data: steps, error: stepsError } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("step_number", { ascending: true });

    if (stepsError) {
      console.error(`${LOG} campaign ${campaign.id}: failed to fetch steps:`, stepsError.message);
      continue;
    }
    if (!steps?.length) {
      console.log(`${LOG} campaign ${campaign.id}: no sequence steps — skipping`);
      continue;
    }

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id")
      .eq("campaign_id", campaign.id)
      .in("status", ["sent", "opened"]);

    if (contactsError) {
      console.error(`${LOG} campaign ${campaign.id}: failed to fetch eligible contacts:`, contactsError.message);
      continue;
    }
    if (!contacts?.length) {
      console.log(`${LOG} campaign ${campaign.id}: no eligible contacts for follow-ups`);
      continue;
    }

    console.log(`${LOG} campaign ${campaign.id}: checking ${contacts.length} contact(s) for due follow-ups`);

    for (const contact of contacts) {
      const { data: lastSentLogs, error: lastSentError } = await supabase
        .from("send_log")
        .select("step_number, sent_at")
        .eq("contact_id", contact.id)
        .eq("status", "sent")
        .order("step_number", { ascending: false })
        .limit(1);

      if (lastSentError || !lastSentLogs?.length || !lastSentLogs[0].sent_at) {
        continue;
      }

      const lastSent = lastSentLogs[0];
      const nextStep = steps.find(
        (step) => step.step_number === lastSent.step_number + 1
      );

      if (!nextStep) continue;

      const lastSentDate = dateFromTimestamp(lastSent.sent_at);
      const scheduledDate = addDaysToDate(lastSentDate, nextStep.delay_days);

      if (scheduledDate > today) continue;

      const { data: existing } = await supabase
        .from("send_log")
        .select("id")
        .eq("contact_id", contact.id)
        .eq("step_number", nextStep.step_number)
        .maybeSingle();

      if (existing) continue;

      const { error: insertError } = await supabase.from("send_log").insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        step_number: nextStep.step_number,
        subject: nextStep.subject,
        body: nextStep.body,
        status: "pending",
        scheduled_for: today,
      });

      if (!insertError) {
        console.log(`${LOG} campaign ${campaign.id}: queued step ${nextStep.step_number} for contact ${contact.id}`);
        scheduled++;
      } else {
        console.error(`${LOG} campaign ${campaign.id}: failed to queue step ${nextStep.step_number} for contact ${contact.id}:`, insertError.message);
      }
    }
  }

  const summary = { scheduled };
  console.log(`${LOG} run complete`, summary);
  return summary;
}
