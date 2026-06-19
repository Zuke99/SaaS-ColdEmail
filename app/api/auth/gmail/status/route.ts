import { NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("gmail_credentials")
    .select("sender_email, token_expiry, token_error, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      connected: false,
      email: null,
      expired: false,
      token_error: false,
      updated_at: null,
    });
  }

  const expired = data.token_expiry
    ? new Date(data.token_expiry).getTime() < Date.now()
    : true;

  return NextResponse.json({
    connected: true,
    email: data.sender_email,
    expired,
    token_error: data.token_error ?? false,
    updated_at: data.updated_at,
  });
}
