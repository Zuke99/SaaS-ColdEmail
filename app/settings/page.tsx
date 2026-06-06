import { Suspense } from "react";
import { PageShell } from "@/components/app/PageShell";
import { GmailColdEmailSection } from "@/components/settings/GmailColdEmailSection";

export default function SettingsPage() {
  return (
    <PageShell title="Settings">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
              Loading Gmail settings…
            </div>
          }
        >
          <GmailColdEmailSection />
        </Suspense>

        <section className="space-y-4 rounded-lg border border-border bg-surface p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-medium text-foreground">
              Transactional email (Resend)
            </h2>
            <p className="mt-2 text-sm text-muted">
              Configure your sender name and email per campaign for cold
              outreach. Resend handles OTPs and app notifications separately.
            </p>
          </div>
          <p className="rounded-md border border-border bg-background px-4 py-3 text-sm text-muted">
            Make sure your sender domain is verified in your Resend dashboard
            for transactional mail.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
