import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthedClient } from "@/lib/api/with-auth";

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  sender_name: z.string().trim().min(1, "sender_name is required"),
  sender_email: z
    .string()
    .trim()
    .min(1, "sender_email is required")
    .email("sender_email must be a valid email"),
  daily_limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export async function GET() {
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, sender_name, sender_email, daily_limit } = parsed.data;
  const auth = await getAuthedClient();
  if (auth instanceof Response) return auth;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      name,
      sender_name,
      sender_email,
      daily_limit,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
