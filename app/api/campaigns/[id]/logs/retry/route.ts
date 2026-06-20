import { NextResponse } from "next/server";
import { getAuthedCampaignContext } from "@/lib/api/campaign-route";
import { todayDateString } from "@/lib/cron/dates";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  const ctx = await getAuthedCampaignContext(params.id);
  if ("response" in ctx) return ctx.response;
  const { supabase } = ctx;

  const { data: failed, error: fetchError } = await supabase
    .from("send_log")
    .select("id")
    .eq("campaign_id", params.id)
    .eq("status", "failed");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!failed?.length) {
    return NextResponse.json({ retried: 0 });
  }

  const ids = failed.map((r) => r.id);

  const { error: updateError } = await supabase
    .from("send_log")
    .update({
      status: "pending",
      error_message: null,
      scheduled_for: todayDateString(),
    })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ retried: ids.length });
}
