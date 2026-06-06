"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildReplySubject,
  parseReplyToPrevious,
} from "@/lib/sequence/variables";
import type { SequenceStep } from "@/lib/types/sequence";
import { cn } from "@/lib/utils";

type StepCardProps = {
  step: SequenceStep;
  step1Subject: string;
  isOnlyStep: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function getDisplaySubject(
  step: SequenceStep,
  step1Subject: string
): string {
  if (parseReplyToPrevious(step.custom_vars) && step.step_number > 1) {
    return buildReplySubject(step1Subject);
  }
  return step.subject.trim() || "No subject";
}

function getDisplayBody(step: SequenceStep): string {
  return step.body.trim() || "No body content yet";
}

export function StepCard({
  step,
  step1Subject,
  isOnlyStep,
  isEditing,
  onEdit,
  onDelete,
}: StepCardProps) {
  const showDelete = !(step.step_number === 1 && isOnlyStep);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit();
      }}
      className={cn(
        "rounded-lg border border-border bg-surface transition-colors hover:border-foreground/20",
        isEditing && "border-foreground/30 ring-1 ring-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {step.step_number === 1 ? "Initial Email" : `Follow-up ${step.step_number - 1}`}
          </span>
          {step.step_number > 1 ? (
            <span className="rounded-full bg-border px-2 py-0.5 text-xs font-mono text-muted">
              Day {step.delay_days}
            </span>
          ) : null}
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted"
            onClick={onEdit}
            aria-label="Edit step"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {showDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted hover:text-danger"
              onClick={onDelete}
              aria-label="Delete step"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 px-4 py-3">
        <p className="truncate text-sm text-muted">
          {getDisplaySubject(step, step1Subject)}
        </p>
        <p className="line-clamp-2 text-sm text-muted/80">
          {getDisplayBody(step)}
        </p>
      </div>
    </div>
  );
}
