import {
  buildReplySubject,
  parseReplyToPrevious,
  stripInternalCustomVars,
} from "@/lib/sequence/variables";
import { randomSendDelayMs, sleep, todayDateString } from "@/lib/cron/dates";
import { GmailTokenError, renderTemplate, sendGmailEmail } from "@/lib/gmail";
import { createCronClient } from "@/lib/supabase/cron";

type SequenceStepRow = {
  step_number: number;
  subject: string;
  body: string;
  custom_vars: Record<string, string> | null;
};

function isReplyThreadStep(step: SequenceStepRow): boolean {
  if (parseReplyToPrevious(step.custom_vars)) return true;
  return step.subject.trim().toLowerCase().startsWith("re:");
}

const LOG = "[Cron][send-emails]";

export async function runSendEmails(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  console.log(`${LOG} run started`);

  const supabase = createCronClient();
  const today = todayDateString();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("id, sender_name, sender_email, daily_limit, user_id")
    .eq("status", "active");

  if (campaignsError) {
    console.error(`${LOG} failed to fetch campaigns:`, campaignsError.message);
    throw new Error(campaignsError.message);
  }

  const activeCampaigns = campaigns ?? [];
  console.log(`${LOG} active campaigns: ${activeCampaigns.length}`);

  if (activeCampaigns.length === 0) {
    console.log(`${LOG} no active campaigns — nothing to do`);
    return { sent, failed, skipped };
  }

  const tokenFailedUserIds = new Set<string>();

  for (const campaign of activeCampaigns) {
    if (
      !campaign.user_id ||
      !campaign.sender_email?.trim() ||
      !campaign.sender_name?.trim()
    ) {
      console.warn(`${LOG} campaign ${campaign.id}: missing sender config — skipping`);
      skipped++;
      continue;
    }

    if (tokenFailedUserIds.has(campaign.user_id)) {
      console.warn(`${LOG} campaign ${campaign.id}: user token already failed this run — skipping`);
      skipped++;
      continue;
    }

    const { count: alreadySentToday, error: countError } = await supabase
      .from("send_log")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("scheduled_for", today)
      .eq("status", "sent")
      .eq("sent_by_cron", true);

    if (countError) {
      console.error(`${LOG} campaign ${campaign.id}: failed to count sent today:`, countError.message);
      continue;
    }

    const sentToday = alreadySentToday ?? 0;
    if (sentToday >= campaign.daily_limit) {
      console.log(`${LOG} campaign ${campaign.id}: daily limit reached (${sentToday}/${campaign.daily_limit}) — skipping`);
      skipped++;
      continue;
    }

    const remaining = campaign.daily_limit - sentToday;
    const batchLimit = Math.min(remaining, 3);

    console.log(`${LOG} campaign ${campaign.id}: sent today ${sentToday}/${campaign.daily_limit}, fetching up to ${batchLimit} pending`);

    // Use lte so overdue pending rows (scheduled_for in the past) are picked up
    const { data: pendingRows, error: pendingError } = await supabase
      .from("send_log")
      .select("*")
      .eq("campaign_id", campaign.id)
      .lte("scheduled_for", today)
      .eq("status", "pending")
      .order("scheduled_for", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(batchLimit);

    if (pendingError) {
      console.error(`${LOG} campaign ${campaign.id}: failed to fetch pending rows:`, pendingError.message);
      continue;
    }

    if (!pendingRows?.length) {
      console.log(`${LOG} campaign ${campaign.id}: no pending emails due today`);
      continue;
    }

    console.log(`${LOG} campaign ${campaign.id}: ${pendingRows.length} pending email(s) to send`);

    for (let i = 0; i < pendingRows.length; i++) {
      const row = pendingRows[i];

      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("id, name, email, company, status")
        .eq("id", row.contact_id)
        .single();

      if (contactError || !contact) {
        console.error(`${LOG} campaign ${campaign.id}: contact ${row.contact_id} not found — skipping`);
        skipped++;
        continue;
      }

      if (["replied", "unsubscribed", "bounced"].includes(contact.status)) {
        console.log(`${LOG} campaign ${campaign.id}: contact ${contact.email} has status "${contact.status}" — skipping`);
        skipped++;
        continue;
      }

      const { data: sequenceStep, error: stepError } = await supabase
        .from("sequence_steps")
        .select("step_number, subject, body, custom_vars")
        .eq("campaign_id", campaign.id)
        .eq("step_number", row.step_number)
        .single();

      if (stepError || !sequenceStep) {
        console.error(`${LOG} campaign ${campaign.id}: step ${row.step_number} not found — skipping`);
        skipped++;
        continue;
      }

      const customVars = stripInternalCustomVars(
        (sequenceStep.custom_vars as Record<string, string> | null) ?? {}
      );

      const contactForTemplate = {
        name: contact.name ?? "",
        email: contact.email,
        company: contact.company,
      };

      let renderedSubject: string;

      if (isReplyThreadStep(sequenceStep)) {
        const { data: step1Log } = await supabase
          .from("send_log")
          .select("subject")
          .eq("campaign_id", campaign.id)
          .eq("contact_id", contact.id)
          .eq("step_number", 1)
          .eq("status", "sent")
          .single();

        renderedSubject = buildReplySubject(step1Log?.subject ?? "");
      } else {
        renderedSubject = renderTemplate(
          row.subject,
          contactForTemplate,
          customVars
        );
      }

      const renderedBody = renderTemplate(
        row.body,
        contactForTemplate,
        customVars
      );

      const now = new Date().toISOString();

      if (!row.tracking_pixel_id) {
        console.error(`${LOG} campaign ${campaign.id}: send_log row ${row.id} missing tracking_pixel_id — skipping`);
        skipped++;
        continue;
      }

      let inReplyTo: string | undefined;
      let references: string | undefined;
      let gmailThreadId: string | undefined;

      if (row.step_number > 1) {
        const { data: step1Log } = await supabase
          .from("send_log")
          .select("gmail_message_id, gmail_thread_id")
          .eq("contact_id", contact.id)
          .eq("step_number", 1)
          .eq("status", "sent")
          .limit(1)
          .maybeSingle();

        if (step1Log?.gmail_message_id) {
          inReplyTo = step1Log.gmail_message_id;
          references = step1Log.gmail_message_id;
        }
        if (step1Log?.gmail_thread_id) {
          gmailThreadId = step1Log.gmail_thread_id;
        }
      }

      console.log(`${LOG} campaign ${campaign.id}: sending step ${row.step_number} to ${contact.email}`);

      try {
        const { messageId, threadId } = await sendGmailEmail({
          userId: campaign.user_id,
          to: contact.email,
          toName: contact.name ?? undefined,
          subject: renderedSubject,
          body: renderedBody,
          senderEmail: campaign.sender_email,
          senderName: campaign.sender_name,
          trackingPixelId: row.tracking_pixel_id,
          contactId: contact.id,
          inReplyTo,
          references,
          gmailThreadId,
        });

        console.log(`${LOG} campaign ${campaign.id}: sent to ${contact.email} (messageId: ${messageId})`);

        await supabase
          .from("send_log")
          .update({
            status: "sent",
            sent_at: now,
            subject: renderedSubject,
            body: renderedBody,
            gmail_message_id: messageId,
            gmail_thread_id: threadId,
            sent_by_cron: true,
          })
          .eq("id", row.id);

        if (contact.status !== "opened") {
          await supabase
            .from("contacts")
            .update({ status: "sent", updated_at: now })
            .eq("id", contact.id);
        }

        sent++;
      } catch (err) {
        if (err instanceof GmailTokenError) {
          console.error(`${LOG} campaign ${campaign.id}: Gmail token error for user ${campaign.user_id} — pausing all campaigns for this user:`, err.message);
          tokenFailedUserIds.add(campaign.user_id);
          break;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to send email";

        console.error(`${LOG} campaign ${campaign.id}: failed to send to ${contact.email}:`, errorMessage);

        await supabase
          .from("send_log")
          .update({
            status: "failed",
            error_message: errorMessage,
            subject: renderedSubject,
            body: renderedBody,
          })
          .eq("id", row.id);

        failed++;
      }

      if (i < pendingRows.length - 1) {
        await sleep(randomSendDelayMs());
      }
    }
  }

  const summary = { sent, failed, skipped };
  console.log(`${LOG} run complete`, summary);
  return summary;
}
