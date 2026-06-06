"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type GmailStatus = {
  connected: boolean;
  email: string | null;
  expired: boolean;
  updated_at: string | null;
};

export function GmailColdEmailSection() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/auth/gmail/status");
    const data = (await res.json().catch(() => ({}))) as GmailStatus & {
      error?: string;
    };
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Failed to load Gmail status");
      return;
    }

    setStatus(data);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (searchParams.get("gmail_connected") === "true") {
      toast.success("Gmail connected successfully");
      loadStatus();
    }
    if (searchParams.get("gmail_error") === "token_failed") {
      toast.error("Failed to connect Gmail. Try again.");
    }
    if (searchParams.get("gmail_error") === "no_code") {
      toast.error("Gmail authorization was cancelled.");
    }
  }, [searchParams, loadStatus]);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/auth/gmail/disconnect", { method: "DELETE" });
    setDisconnecting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to disconnect"
      );
      return;
    }

    toast.success("Gmail disconnected");
    await loadStatus();
  }

  const displayEmail = status?.email ?? "your Gmail account";
  const connected = status?.connected ?? false;
  const expired = status?.expired ?? false;

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">Cold Email Sending</h2>
        <p className="mt-1 text-sm text-muted">
          Connect your Gmail account to send cold emails from this app
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading Gmail status…</p>
      ) : !connected ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Connect Gmail</h3>
            <p className="mt-1 text-sm text-muted">
              Sign in with the Gmail account you want to send from
            </p>
          </div>
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <a href="/api/auth/gmail/start">Connect Gmail Account</a>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                expired ? "bg-amber-500" : "bg-emerald-500"
              }`}
              aria-hidden
            />
            <div>
              <p className="font-medium text-foreground">{displayEmail}</p>
              {status?.updated_at ? (
                <p className="mt-1 text-xs text-muted">
                  Last connected{" "}
                  {formatDistanceToNow(new Date(status.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              ) : null}
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  expired
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {expired ? "Token expired" : "Connected"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {expired ? (
              <Button asChild variant="default" className="w-full sm:w-auto">
                <a href="/api/auth/gmail/start">Reconnect</a>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={disconnecting}
                onClick={() => void handleDisconnect()}
              >
                {disconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="border-t border-border pt-4 text-xs text-muted">
        Resend is used for transactional emails (OTPs, notifications). Gmail is
        used for cold outreach only.
      </p>
    </section>
  );
}
