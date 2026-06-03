import { PageShell } from "@/components/app/PageShell";

export default function SettingsPage() {
  return (
    <PageShell title="Settings">
      <div className="max-w-lg space-y-4">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            Sending emails via Resend
          </h2>
          <p className="mt-2 text-sm text-muted">
            Configure your sender name and email per campaign
          </p>
        </div>
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          Make sure your sender domain is verified in your Resend dashboard
        </p>
      </div>
    </PageShell>
  );
}
