"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type JobResult = Record<string, unknown> | null;

export function CampaignCronDevTools() {
  const [scheduleResult, setScheduleResult] = useState<JobResult>(null);
  const [sendResult, setSendResult] = useState<JobResult>(null);
  const [loadingJob, setLoadingJob] = useState<string | null>(null);

  async function runJob(job: "schedule-followups" | "send-emails") {
    setLoadingJob(job);
    if (job === "schedule-followups") setScheduleResult(null);
    else setSendResult(null);

    const res = await fetch(`/api/dev/cron/${job}`);
    const data = await res.json().catch(() => ({}));

    if (job === "schedule-followups") {
      setScheduleResult(data as JobResult);
    } else {
      setSendResult(data as JobResult);
    }

    setLoadingJob(null);
  }

  return (
    <div className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <h3 className="text-sm font-medium text-foreground">Dev Tools</h3>
      <p className="mt-1 text-xs text-muted">
        Test cron jobs locally (development only). Run Schedule first, then
        Send.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loadingJob !== null}
          onClick={() => runJob("schedule-followups")}
        >
          {loadingJob === "schedule-followups"
            ? "Running…"
            : "Run Schedule Job"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loadingJob !== null}
          onClick={() => runJob("send-emails")}
        >
          {loadingJob === "send-emails" ? "Running…" : "Run Send Job"}
        </Button>
      </div>

      {scheduleResult ? (
        <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-background p-3 text-xs text-muted">
          {JSON.stringify(scheduleResult, null, 2)}
        </pre>
      ) : null}

      {sendResult ? (
        <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-background p-3 text-xs text-muted">
          {JSON.stringify(sendResult, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
