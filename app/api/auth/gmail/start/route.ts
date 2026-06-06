import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { requireGmailOAuthEnv } from "@/lib/gmail/oauth";
import { getUserDbContext } from "@/lib/supabase/user-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getUserDbContext();
  } catch {
    return NextResponse.redirect(appUrl("/login"));
  }

  let clientId: string;
  let redirectUri: string;

  try {
    ({ clientId, redirectUri } = requireGmailOAuthEnv());
  } catch {
    return NextResponse.redirect(`${appUrl("/settings")}?gmail_error=token_failed`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent",
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
