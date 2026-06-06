import { NextResponse } from "next/server";
import { getAuthedClient } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const { error } = await supabase
    .from("gmail_credentials")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
