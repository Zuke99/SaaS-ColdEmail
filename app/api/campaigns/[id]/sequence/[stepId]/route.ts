import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string; stepId: string } };

const patchStepSchema = z.object({
  subject: z.string(),
  body: z.string(),
  delay_days: z.number().int().min(0),
  custom_vars: z.record(z.string(), z.string()).optional().default({}),
});

async function renumberSteps(campaignId: string) {
  const supabase = await createClient();

  const { data: steps, error } = await supabase
    .from("sequence_steps")
    .select("id, step_number")
    .eq("campaign_id", campaignId)
    .order("step_number", { ascending: true });

  if (error || !steps?.length) return;

  for (let i = 0; i < steps.length; i++) {
    const tempNumber = 1000 + i;
    if (steps[i].step_number !== tempNumber) {
      await supabase
        .from("sequence_steps")
        .update({ step_number: tempNumber })
        .eq("id", steps[i].id);
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const nextNumber = i + 1;
    await supabase
      .from("sequence_steps")
      .update({ step_number: nextNumber })
      .eq("id", steps[i].id);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchStepSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("sequence_steps")
    .select("step_number")
    .eq("id", params.stepId)
    .eq("campaign_id", params.id)
    .single();

  if (existingError) {
    const status = existingError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: existingError.message }, { status });
  }

  const delay_days =
    existing.step_number === 1
      ? 0
      : Math.max(1, parsed.data.delay_days);

  const { data, error } = await supabase
    .from("sequence_steps")
    .update({
      subject: parsed.data.subject,
      body: parsed.data.body,
      delay_days,
      custom_vars: parsed.data.custom_vars,
    })
    .eq("id", params.stepId)
    .eq("campaign_id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sequence_steps")
    .delete()
    .eq("id", params.stepId)
    .eq("campaign_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await renumberSteps(params.id);

  return NextResponse.json({ success: true });
}
