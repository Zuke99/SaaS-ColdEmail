import { NextResponse } from "next/server";
import { getAuthedCampaignContext } from "@/lib/api/campaign-route";
import type { SendLogEntry } from "@/lib/types/send-log";

type RouteContext = { params: { id: string } };

function getContactFromRow(
  contacts: { name: string | null; email: string } | { name: string | null; email: string }[] | null
) {
  if (!contacts) return { name: null, email: "" };
  if (Array.isArray(contacts)) return contacts[0] ?? { name: null, email: "" };
  return contacts;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const ctx = await getAuthedCampaignContext(params.id);
  if ("response" in ctx) return ctx.response;
  const { supabase } = ctx;

  const { data, error } = await supabase
    .from("send_log")
    .select(
      `
      id,
      campaign_id,
      contact_id,
      step_number,
      subject,
      body,
      status,
      scheduled_for,
      sent_at,
      error_message,
      tracking_pixel_id,
      opened_at,
      sent_by_cron,
      created_at,
      contacts (
        name,
        email
      )
    `
    )
    .eq("campaign_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logs: SendLogEntry[] = (data ?? []).map((row) => {
    const contact = getContactFromRow(row.contacts);
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      contact_id: row.contact_id,
      step_number: row.step_number,
      subject: row.subject,
      body: row.body,
      status: row.status as SendLogEntry["status"],
      scheduled_for: row.scheduled_for,
      sent_at: row.sent_at,
      error_message: row.error_message,
      tracking_pixel_id: row.tracking_pixel_id,
      opened_at: row.opened_at,
      sent_by_cron: row.sent_by_cron ?? false,
      created_at: row.created_at,
      name: contact.name,
      email: contact.email,
    };
  });

  return NextResponse.json(logs);
}
