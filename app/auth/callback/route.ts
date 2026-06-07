import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { getPlan } from "@/lib/supabase/getPlan";
import { appUrl } from "@/lib/app-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      appUrl(`/login?error=${encodeURIComponent("Missing authorization code.")}`)
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      appUrl(`/login?error=${encodeURIComponent(error.message)}`)
    );
  }

  if (data.user) {
    await ensureUserProfile(supabase, data.user);
    await getPlan(data.user.id);
  }

  return NextResponse.redirect(appUrl(next));
}
