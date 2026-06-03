import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

const emailSchema = z.string().trim().email();

const contactInputSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().trim().min(1),
});

const importContactsSchema = z.object({
  contacts: z.array(contactInputSchema).min(1),
});

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("campaign_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importContactsSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("contacts")
    .select("email")
    .eq("campaign_id", params.id);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingEmails = new Set(
    (existing ?? []).map((row) => row.email.toLowerCase())
  );
  const batchEmails = new Set<string>();
  const toInsert: { campaign_id: string; name: string | null; email: string }[] =
    [];
  let skipped = 0;

  for (const contact of parsed.data.contacts) {
    const emailParsed = emailSchema.safeParse(contact.email);
    if (!emailParsed.success) {
      skipped++;
      continue;
    }

    const email = emailParsed.data.toLowerCase();
    const name = contact.name?.trim() || null;

    if (existingEmails.has(email) || batchEmails.has(email)) {
      skipped++;
      continue;
    }

    batchEmails.add(email);
    toInsert.push({
      campaign_id: params.id,
      name,
      email,
    });
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("contacts")
      .insert(toInsert);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    inserted: toInsert.length,
    skipped,
  });
}
