"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { StepCard } from "@/components/campaigns/StepCard";
import { StepEditor } from "@/components/campaigns/StepEditor";
import { Button } from "@/components/ui/button";
import { MAX_SEQUENCE_STEPS } from "@/lib/sequence/variables";
import type { SequenceStep } from "@/lib/types/sequence";

type SequenceTabProps = {
  campaignId: string;
};

export function SequenceTab({ campaignId }: SequenceTabProps) {
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [addingStep, setAddingStep] = useState(false);

  const loadSteps = useCallback(async () => {
    setFetchError(null);
    const res = await fetch(`/api/campaigns/${campaignId}/sequence`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFetchError(
        typeof data.error === "string" ? data.error : "Failed to load sequence"
      );
      setSteps([]);
      return;
    }

    setSteps(Array.isArray(data) ? data : []);
  }, [campaignId]);

  useEffect(() => {
    loadSteps().finally(() => setLoading(false));
  }, [loadSteps]);

  const step1Subject = steps.find((s) => s.step_number === 1)?.subject ?? "";
  const atMaxSteps = steps.length >= MAX_SEQUENCE_STEPS;

  async function handleAddStep() {
    if (atMaxSteps) return;

    setAddingStep(true);
    const nextStepNumber =
      steps.length === 0 ? 1 : Math.max(...steps.map((s) => s.step_number)) + 1;

    const res = await fetch(`/api/campaigns/${campaignId}/sequence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step_number: nextStepNumber,
        subject: "",
        body: "",
        delay_days: nextStepNumber === 1 ? 0 : 3,
        custom_vars: {},
      }),
    });

    const data = await res.json().catch(() => ({}));
    setAddingStep(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to add step"
      );
      return;
    }

    const created = data as SequenceStep;
    await loadSteps();
    setEditingStepId(created.id);
  }

  async function handleDeleteStep(stepId: string) {
    const res = await fetch(
      `/api/campaigns/${campaignId}/sequence/${stepId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to delete step"
      );
      return;
    }

    if (editingStepId === stepId) {
      setEditingStepId(null);
    }

    toast.success("Step deleted");
    await loadSteps();
  }

  function handleStepSaved(updated: SequenceStep) {
    setSteps((prev) =>
      prev.map((step) => (step.id === updated.id ? updated : step))
    );
    setEditingStepId(null);
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium text-foreground">Email Sequence</h2>
        <span title={atMaxSteps ? "Maximum 4 steps" : undefined}>
          <Button
            size="sm"
            disabled={atMaxSteps || addingStep}
            onClick={handleAddStep}
          >
            {addingStep ? "Adding…" : "Add Step"}
          </Button>
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading sequence…</p>
      ) : fetchError ? (
        <p className="text-sm text-danger">{fetchError}</p>
      ) : steps.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-foreground">
            No sequence yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Add your first email to get started
          </p>
          <Button
            size="sm"
            className="mt-6"
            disabled={addingStep}
            onClick={handleAddStep}
          >
            {addingStep ? "Adding…" : "Add Step"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id}>
              <StepCard
                step={step}
                step1Subject={step1Subject}
                isOnlyStep={steps.length === 1}
                isEditing={editingStepId === step.id}
                onEdit={() => setEditingStepId(step.id)}
                onDelete={() => handleDeleteStep(step.id)}
              />
              {editingStepId === step.id ? (
                <StepEditor
                  campaignId={campaignId}
                  step={step}
                  step1Subject={step1Subject}
                  onSaved={handleStepSaved}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
