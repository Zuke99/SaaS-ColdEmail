"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SendLogStatusBadge } from "@/components/campaigns/SendLogStatusBadge";
import type { SendLogEntry } from "@/lib/types/send-log";

type SentLogTabProps = {
  campaignId: string;
};

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function SentLogTab({ campaignId }: SentLogTabProps) {
  const [logs, setLogs] = useState<SendLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadLogs = useCallback(async () => {
    setFetchError(null);
    const res = await fetch(`/api/campaigns/${campaignId}/logs`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFetchError(
        typeof data.error === "string" ? data.error : "Failed to load sent log"
      );
      setLogs([]);
      return;
    }

    setLogs(Array.isArray(data) ? data : []);
  }, [campaignId]);

  useEffect(() => {
    loadLogs().finally(() => setLoading(false));
  }, [loadLogs]);

  async function handleRetryFailed() {
    setRetrying(true);
    const res = await fetch(`/api/campaigns/${campaignId}/logs/retry`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setRetrying(false);

    if (!res.ok) {
      toast.error(typeof data.error === "string" ? data.error : "Retry failed");
      return;
    }

    toast.success(`${data.retried} failed email(s) queued for retry`);
    await loadLogs();
  }

  const stats = useMemo(
    () => ({
      sent: logs.filter((log) => log.status === "sent").length,
      failed: logs.filter((log) => log.status === "failed").length,
      opened: logs.filter((log) => log.opened_at !== null).length,
      cancelled: logs.filter((log) => log.status === "cancelled").length,
    }),
    [logs]
  );

  const statItems = [
    { label: "Total Sent", value: stats.sent },
    { label: "Failed", value: stats.failed },
    { label: "Opened", value: stats.opened },
    { label: "Cancelled", value: stats.cancelled },
  ];

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-surface px-4 py-3"
            >
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 font-mono text-xl font-medium text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>
        {stats.failed > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={retrying}
            onClick={() => void handleRetryFailed()}
            className="shrink-0"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Retrying…" : `Retry ${stats.failed} failed`}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading sent log…</p>
      ) : fetchError ? (
        <p className="text-sm text-danger">{fetchError}</p>
      ) : logs.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-foreground">
            No emails sent yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Send your first email from the Contacts tab
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="px-4 py-3 font-medium text-muted">Contact</th>
                <th className="px-4 py-3 font-medium text-muted">Step</th>
                <th className="px-4 py-3 font-medium text-muted">Subject</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Opened</th>
                <th className="px-4 py-3 font-medium text-muted">Sent At</th>
                <th className="px-4 py-3 font-medium text-muted">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {log.name || "—"}
                    </p>
                    <p className="text-xs text-muted">{log.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted">
                    Step {log.step_number}
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-muted">
                    {truncate(log.subject, 40)}
                  </td>
                  <td className="px-4 py-3">
                    <SendLogStatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3">
                    {log.opened_at ? (
                      <Check
                        className="h-4 w-4 text-success"
                        aria-label="Opened"
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {log.sent_at
                      ? formatDistanceToNow(new Date(log.sent_at), {
                          addSuffix: true,
                        })
                      : "—"}
                  </td>
                  <td className="max-w-[160px] px-4 py-3">
                    {log.status === "failed" && log.error_message ? (
                      <span
                        className="cursor-help truncate text-xs text-danger"
                        title={log.error_message}
                      >
                        {truncate(log.error_message, 40)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
