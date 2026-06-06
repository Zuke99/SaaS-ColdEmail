import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import {
  exchangeCodeForTokens,
  fetchGoogleUserEmail,
} from "@/lib/gmail/oauth";
import { getUserDbContext } from "@/lib/supabase/user-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const settingsUrl = appUrl("/settings");
  const code = new URL(request.url).searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${settingsUrl}?gmail_error=no_code`);
  }

  let user;
  let supabase;

  try {
    const ctx = await getUserDbContext();
    user = ctx.user;
    supabase = ctx.db;
  } catch {
    return NextResponse.redirect(appUrl("/login"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const senderEmail = await fetchGoogleUserEmail(tokens.access_token!);
    const tokenExpiry = new Date(
      Date.now() + (tokens.expires_in ?? 3600) * 1000
    ).toISOString();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("gmail_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    const refreshToken =
      tokens.refresh_token ?? existing?.refresh_token ?? null;

    if (!refreshToken) {
      return NextResponse.redirect(`${settingsUrl}?gmail_error=token_failed`);
    }

    const { error } = await supabase.from("gmail_credentials").upsert(
      {
        user_id: user.id,
        sender_email: senderEmail,
        access_token: tokens.access_token,
        refresh_token: refreshToken,
        token_expiry: tokenExpiry,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("[Gmail OAuth] Upsert failed:", error.message);
      return NextResponse.redirect(`${settingsUrl}?gmail_error=token_failed`);
    }

    return NextResponse.redirect(`${settingsUrl}?gmail_connected=true`);
  } catch (err) {
    console.error("[Gmail OAuth] Callback failed:", err);
    return NextResponse.redirect(`${settingsUrl}?gmail_error=token_failed`);
  }
}
