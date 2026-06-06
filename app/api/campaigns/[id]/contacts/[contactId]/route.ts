import { NextResponse } from "next/server";
import { z } from "zod";
import { handleAuthError } from "@/lib/api/auth-response";
import { getAuthedClient } from "@/lib/api/with-auth";
import { assertCampaignAccess } from "@/lib/supabase/user-db";

type RouteContext = { params: { id: string; contactId: string } };

const patchContactSchema = z.object({
  status: z.enum([
    "not_started",
    "sent",
    "opened",
    "replied",
    "bounced",
    "unsubscribed",
  ]),
});

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchContactSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  try {
    await assertCampaignAccess(supabase, user.id, params.id);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", params.contactId)
    .eq("campaign_id", params.id)
    .select()
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  try {
    await assertCampaignAccess(supabase, user.id, params.id);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", params.contactId)
    .eq("campaign_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
