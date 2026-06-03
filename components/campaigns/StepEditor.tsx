"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  SPREADSHEET_VARIABLES,
  buildReplySubject,
  extractVariablesFromTexts,
  getCustomVariablesFromTexts,
  parseReplyToPrevious,
  REPLY_TO_PREVIOUS_KEY,
  stripInternalCustomVars,
  substituteVariables,
} from "@/lib/sequence/variables";
import type { SequenceStep } from "@/lib/types/sequence";

type StepEditorProps = {
  campaignId: string;
  step: SequenceStep;
  step1Subject: string;
  onSaved: (step: SequenceStep) => void;
};

export function StepEditor({
  campaignId,
  step,
  step1Subject,
  onSaved,
}: StepEditorProps) {
  const storedCustomVars = stripInternalCustomVars(step.custom_vars ?? {});
  const [subject, setSubject] = useState(step.subject);
  const [body, setBody] = useState(step.body);
  const [delayDays, setDelayDays] = useState(
    step.step_number === 1 ? 0 : Math.max(1, step.delay_days || 3)
  );
  const [replyToPrevious, setReplyToPrevious] = useState(
    parseReplyToPrevious(step.custom_vars)
  );
  const [customVars, setCustomVars] =
    useState<Record<string, string>>(storedCustomVars);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSubject(step.subject);
    setBody(step.body);
    setDelayDays(
      step.step_number === 1 ? 0 : Math.max(1, step.delay_days || 3)
    );
    setReplyToPrevious(parseReplyToPrevious(step.custom_vars));
    setCustomVars(stripInternalCustomVars(step.custom_vars ?? {}));
    setShowPreview(false);
  }, [step]);

  const debouncedSubject = useDebouncedValue(subject, 300);
  const debouncedBody = useDebouncedValue(body, 300);
  const variableSourceTexts = useMemo(() => {
    const texts = [debouncedSubject, debouncedBody];
    if (replyToPrevious && step.step_number > 1) {
      texts.push(step1Subject);
    }
    return texts;
  }, [
    debouncedSubject,
    debouncedBody,
    replyToPrevious,
    step.step_number,
    step1Subject,
  ]);
  const allVariables = useMemo(
    () => extractVariablesFromTexts(...variableSourceTexts),
    [variableSourceTexts]
  );
  const detectedVariables = useMemo(
    () => getCustomVariablesFromTexts(...variableSourceTexts),
    [variableSourceTexts]
  );

  useEffect(() => {
    setCustomVars((prev) => {
      const next: Record<string, string> = {};
      for (const variable of detectedVariables) {
        const lower = variable.toLowerCase();
        next[variable] =
          prev[variable] ??
          prev[lower] ??
          Object.entries(prev).find(([key]) => key.toLowerCase() === lower)?.[1] ??
          "";
      }
      return next;
    });
  }, [detectedVariables]);

  const effectiveSubject =
    replyToPrevious && step.step_number > 1
      ? buildReplySubject(step1Subject)
      : subject;

  const previewSubject = showPreview
    ? substituteVariables(effectiveSubject, customVars)
    : effectiveSubject;

  const previewBody = showPreview
    ? substituteVariables(body, customVars)
    : body;

  async function handleSave() {
    setSaving(true);

    const payload = {
      subject:
        replyToPrevious && step.step_number > 1
          ? buildReplySubject(step1Subject)
          : subject,
      body,
      delay_days: step.step_number === 1 ? 0 : delayDays,
      custom_vars: {
        ...customVars,
        [REPLY_TO_PREVIOUS_KEY]: replyToPrevious ? "true" : "false",
      },
    };

    const res = await fetch(
      `/api/campaigns/${campaignId}/sequence/${step.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to save step"
      );
      return;
    }

    toast.success("Step saved");
    onSaved(data as SequenceStep);
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-4 sm:p-5">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor={`subject-${step.id}`}>Subject line</Label>
          {step.step_number > 1 ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
              <div>
                <p className="text-sm text-foreground">Reply to previous email</p>
                {replyToPrevious ? (
                  <p className="mt-1 text-xs text-muted">
                    Preview: {buildReplySubject(step1Subject)}
                  </p>
                ) : null}
              </div>
              <Switch
                checked={replyToPrevious}
                onCheckedChange={setReplyToPrevious}
              />
            </div>
          ) : null}
          <Input
            id={`subject-${step.id}`}
            value={replyToPrevious && step.step_number > 1 ? effectiveSubject : subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick question about {{company}}"
            disabled={replyToPrevious && step.step_number > 1}
          />
          <p className="text-xs text-muted">
            Type {"{{anything}}"} in the subject to create a custom placeholder
          </p>
        </div>

        {step.step_number > 1 ? (
          <div className="space-y-2">
            <Label htmlFor={`delay-${step.id}`}>
              Send days after previous email
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`delay-${step.id}`}
                type="number"
                min={1}
                value={delayDays}
                onChange={(e) =>
                  setDelayDays(Math.max(1, Number(e.target.value) || 1))
                }
                className="max-w-[120px] font-mono"
              />
              <span className="text-sm text-muted">days</span>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`body-${step.id}`}>Body</Label>
          <Textarea
            id={`body-${step.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Write your email body here. Use {{name}} or {{email}} to personalize."
          />
          <p className="text-xs text-muted">
            Type {"{{anything}}"} to create a custom placeholder
          </p>
        </div>

        {allVariables.length > 0 ? (
          <div className="space-y-3 rounded-md border border-border bg-surface p-4">
            <p className="text-sm font-medium text-foreground">
              Variables detected in your email
            </p>
            <div className="space-y-3">
              {allVariables.map((variable) => {
                const lower = variable.toLowerCase();
                if (SPREADSHEET_VARIABLES.has(lower)) {
                  return (
                    <div
                      key={variable}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                    >
                      <span className="text-sm text-foreground">
                        {`{{${variable}}}`}
                      </span>
                      <span className="text-xs text-success">
                        ✓ From spreadsheet
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={`var-${step.id}-${variable}`}>
                      {`{{${variable}}}`}
                    </Label>
                    <Input
                      id={`var-${step.id}-${variable}`}
                      value={customVars[variable] ?? ""}
                      onChange={(e) =>
                        setCustomVars((prev) => ({
                          ...prev,
                          [variable]: e.target.value,
                        }))
                      }
                      placeholder="Enter value for all contacts"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>

          {showPreview ? (
            <div className="overflow-hidden rounded-md border border-border">
              <div className="border-b border-border bg-[#f4f4f5] px-4 py-2">
                <p className="text-sm font-medium text-[#18181b]">
                  {previewSubject || "No subject"}
                </p>
              </div>
              <div className="whitespace-pre-wrap bg-white px-4 py-4 text-sm leading-relaxed text-[#18181b]">
                {previewBody || "No body content"}
              </div>
            </div>
          ) : null}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save Step"}
        </Button>
      </div>
    </div>
  );
}
