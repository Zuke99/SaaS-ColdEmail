"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ComposeEmailSheet } from "@/components/campaigns/ComposeEmailSheet";
import { ContactStatusBadge } from "@/components/campaigns/ContactStatusBadge";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/types/contact";
import type { SendLogEntry } from "@/lib/types/send-log";
import type { SequenceStep } from "@/lib/types/sequence";

type Props = { campaignId: string };

function stepLabel(stepNumber: number): string {
  if (stepNumber === 1) return "Initial Email";
  return `Follow-up ${stepNumber - 1}`;
}

function StepCell({ log }: { log: SendLogEntry | undefined }) {
  if (!log) return <span className="text-xs text-muted">—</span>;

  if (log.status === "pending") {
    return (
      <span className="inline-flex rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-muted">
        Queued
      </span>
    );
  }
  if (log.status === "failed") {
    return (
      <span className="inline-flex rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
        Failed
      </span>
    );
  }
  if (log.status === "sent" && log.opened_at) {
    return (
      <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
        Opened
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-pending/15 px-2 py-0.5 text-xs font-medium text-pending">
      Sent
    </span>
  );
}

export function CampaignDetailsTab({ campaignId }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [logs, setLogs] = useState<SendLogEntry[]>([]);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const [composingContact, setComposingContact] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [contactsRes, logsRes, stepsRes] = await Promise.all([
      fetch(`/api/campaigns/${campaignId}/contacts`),
      fetch(`/api/campaigns/${campaignId}/logs`),
      fetch(`/api/campaigns/${campaignId}/sequence`),
    ]);

    if (!contactsRes.ok || !logsRes.ok || !stepsRes.ok) {
      setError("Failed to load campaign details");
      return;
    }

    const [contactsData, logsData, stepsData] = await Promise.all([
      contactsRes.json(),
      logsRes.json(),
      stepsRes.json(),
    ]);

    setContacts(Array.isArray(contactsData) ? contactsData : []);
    setLogs(Array.isArray(logsData) ? logsData : []);
    setSteps(Array.isArray(stepsData) ? stepsData : []);
  }, [campaignId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const logsByContact = useMemo(() => {
    const map = new Map<string, Map<number, SendLogEntry>>();
    for (const log of logs) {
      if (!map.has(log.contact_id)) map.set(log.contact_id, new Map());
      map.get(log.contact_id)!.set(log.step_number, log);
    }
    return map;
  }, [logs]);

  const activeContacts = useMemo(
    () => contacts.filter((c) => c.status !== "not_started"),
    [contacts]
  );

  const notStartedContacts = useMemo(
    () => contacts.filter((c) => c.status === "not_started"),
    [contacts]
  );

  const step1 = steps.find((s) => s.step_number === 1) ?? null;

  const allNotStartedSelected =
    notStartedContacts.length > 0 &&
    notStartedContacts.every((c) => selectedIds.has(c.id));

  function toggleContact(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allNotStartedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notStartedContacts.map((c) => c.id)));
    }
  }

  async function handleBulkSend() {
    if (selectedIds.size === 0) return;
    setSending(true);
    const res = await fetch(`/api/campaigns/${campaignId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: Array.from(selectedIds) }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to send emails"
      );
      return;
    }

    toast.success(`Sent ${data.sent ?? 0} emails, ${data.failed ?? 0} failed`);
    setSelectedIds(new Set());
    setLoading(true);
    await load();
    setLoading(false);
  }

  async function handleComposeSent() {
    setLoading(true);
    await load();
    setLoading(false);
  }

  if (loading) return <p className="py-6 text-sm text-muted">Loading…</p>;
  if (error) return <p className="py-6 text-sm text-danger">{error}</p>;

  return (
    <>
      <div className="flex flex-col gap-8 py-4">
        {/* In Campaign */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-medium text-foreground">In Campaign</h2>
            <p className="text-xs text-muted">
              {activeContacts.length === 0
                ? "No contacts in sequence yet"
                : `${activeContacts.length} contact${activeContacts.length !== 1 ? "s" : ""} — follow-ups managed by cron`}
            </p>
          </div>

          {activeContacts.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface/50 px-4 py-8 text-center">
              <p className="text-sm text-muted">
                No contacts have been sent the initial email yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/80">
                    <th className="px-4 py-3 font-medium text-muted">Name</th>
                    <th className="px-4 py-3 font-medium text-muted">Email</th>
                    <th className="px-4 py-3 font-medium text-muted">Status</th>
                    {steps.map((step) => (
                      <th key={step.step_number} className="px-4 py-3 font-medium text-muted">
                        {stepLabel(step.step_number)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeContacts.map((contact) => {
                    const contactLogs = logsByContact.get(contact.id);
                    return (
                      <tr key={contact.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">{contact.name || "—"}</td>
                        <td className="px-4 py-3 text-muted">{contact.email}</td>
                        <td className="px-4 py-3">
                          <ContactStatusBadge status={contact.status} />
                        </td>
                        {steps.map((step) => (
                          <td key={step.step_number} className="px-4 py-3">
                            <StepCell log={contactLogs?.get(step.step_number)} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Not Started */}
        <section>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Not Started</h2>
              <p className="text-xs text-muted">
                {notStartedContacts.length === 0
                  ? "All contacts are in the sequence"
                  : `${notStartedContacts.length} contact${notStartedContacts.length !== 1 ? "s" : ""} — select to bulk send, or compose a personalized email per contact`}
              </p>
            </div>
            {notStartedContacts.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                {allNotStartedSelected ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <p className="text-sm text-foreground">
                {selectedIds.size}{" "}
                {selectedIds.size === 1 ? "contact" : "contacts"} selected
              </p>
              <Button size="sm" disabled={sending} onClick={handleBulkSend}>
                {sending ? "Sending…" : "Send Initial Email"}
              </Button>
            </div>
          )}

          {notStartedContacts.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface/50 px-4 py-8 text-center">
              <p className="text-sm text-muted">
                All contacts are already in the campaign sequence.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface/80">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allNotStartedSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        className="h-4 w-4 rounded border-border bg-background accent-foreground"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-muted">Name</th>
                    <th className="px-4 py-3 font-medium text-muted">Email</th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {notStartedContacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          aria-label={`Select ${contact.email}`}
                          className={cn(
                            "h-4 w-4 rounded border-border bg-background accent-foreground"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-foreground">{contact.name || "—"}</td>
                      <td className="px-4 py-3 text-muted">{contact.email}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={() => setComposingContact(contact)}
                        >
                          <Pencil className="h-3 w-3" />
                          Compose
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ComposeEmailSheet
        campaignId={campaignId}
        contact={composingContact}
        step1={step1}
        open={composingContact !== null}
        onOpenChange={(open) => { if (!open) setComposingContact(null); }}
        onSent={handleComposeSent}
      />
    </>
  );
}
