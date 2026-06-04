import { NextResponse } from "next/server";
import { z } from "zod";
import { patchCampaignSchema } from "@/lib/validators/campaign";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  const [
    { count: totalContacts, error: totalContactsError },
    { count: sentContacts, error: sentContactsError },
    { count: repliedContacts, error: repliedContactsError },
    { count: openedLogs, error: openedLogsError },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", params.id),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", params.id)
      .neq("status", "not_started"),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", params.id)
      .eq("status", "replied"),
    supabase
      .from("send_log")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", params.id)
      .not("opened_at", "is", null),
  ]);

  const statsError =
    totalContactsError ??
    sentContactsError ??
    repliedContactsError ??
    openedLogsError;

  if (statsError) {
    return NextResponse.json({ error: statsError.message }, { status: 500 });
  }

  const total_contacts = totalContacts ?? 0;

  return NextResponse.json({
    ...campaign,
    contacts_count: total_contacts,
    stats: {
      total_contacts,
      sent: sentContacts ?? 0,
      opened: openedLogs ?? 0,
      replied: repliedContacts ?? 0,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchCampaignSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createClient();
  const updatePayload =
    "name" in parsed.data
      ? { ...parsed.data, updated_at: new Date().toISOString() }
      : { status: parsed.data.status, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("campaigns")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    const httpStatus = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status: httpStatus });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
