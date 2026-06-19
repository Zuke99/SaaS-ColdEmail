"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function GmailTokenBanner() {
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    fetch("/api/auth/gmail/status")
      .then((r) => r.json())
      .then((data) => {
        if (data?.token_error) setTokenError(true);
      })
      .catch(() => {});
  }, []);

  if (!tokenError) return null;

  return (
    <div className="flex items-center gap-3 border-b border-red-500/20 bg-red-500/10 px-5 py-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
      <p className="text-sm text-red-400">
        Your Gmail connection has expired — campaigns are paused.{" "}
        <a
          href="/api/auth/gmail/start"
          className="font-medium underline underline-offset-2 hover:text-red-300"
        >
          Reconnect Gmail
        </a>{" "}
        to resume sending.
      </p>
    </div>
  );
}
