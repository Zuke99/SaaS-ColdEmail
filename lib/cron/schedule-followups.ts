import {
  addDaysToDate,
  dateFromTimestamp,
  todayDateString,
} from "@/lib/cron/dates";
import { createCronClient } from "@/lib/supabase/cron";

export async function runScheduleFollowups(): Promise<{ scheduled: number }> {
  const supabase = createCronClient();
  const today = todayDateString();
  let scheduled = 0;

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("status", "active");

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  for (const campaign of campaigns ?? []) {
    const { data: steps, error: stepsError } = await supabase
      .from("sequence_steps")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("step_number", { ascending: true });

    if (stepsError || !steps?.length) continue;

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id")
      .eq("campaign_id", campaign.id)
      .in("status", ["sent", "opened"]);

    if (contactsError || !contacts?.length) continue;

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
        scheduled++;
      }
    }
  }

  return { scheduled };
}
