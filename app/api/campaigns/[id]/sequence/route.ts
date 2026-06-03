import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

const createStepSchema = z.object({
  step_number: z.number().int().min(1).max(4),
  subject: z.string().default(""),
  body: z.string().default(""),
  delay_days: z.number().int().min(0).default(0),
  custom_vars: z.record(z.string(), z.string()).optional().default({}),
});

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sequence_steps")
    .select("*")
    .eq("campaign_id", params.id)
    .order("step_number", { ascending: true });

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

  const parsed = createStepSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { step_number, subject, body: stepBody, custom_vars } = parsed.data;
  const delay_days =
    step_number === 1 ? 0 : Math.max(1, parsed.data.delay_days || 3);

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("sequence_steps")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", params.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= 4) {
    return NextResponse.json(
      { error: "Maximum 4 steps allowed" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sequence_steps")
    .insert({
      campaign_id: params.id,
      step_number,
      subject,
      body: stepBody,
      delay_days,
      custom_vars,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
