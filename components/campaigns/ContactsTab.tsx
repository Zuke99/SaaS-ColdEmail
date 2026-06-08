"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "@/components/campaigns/AddContactDialog";
import { ComposeEmailSheet } from "@/components/campaigns/ComposeEmailSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactStatusBadge } from "@/components/campaigns/ContactStatusBadge";
import { ImportCsvDialog } from "@/components/campaigns/ImportCsvDialog";
import type { Contact } from "@/lib/types/contact";
import type { SequenceStep } from "@/lib/types/sequence";
import { cn } from "@/lib/utils";

type ContactsTabProps = {
  campaignId: string;
};

export function ContactsTab({ campaignId }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [step1, setStep1] = useState<SequenceStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [composingContact, setComposingContact] = useState<Contact | null>(null);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    setFetchError(null);
    const [contactsRes, stepsRes] = await Promise.all([
      fetch(`/api/campaigns/${campaignId}/contacts`),
      fetch(`/api/campaigns/${campaignId}/sequence`),
    ]);
    const contactsData = await contactsRes.json().catch(() => ({}));

    if (!contactsRes.ok) {
      setFetchError(
        typeof contactsData.error === "string" ? contactsData.error : "Failed to load contacts"
      );
      setContacts([]);
      return;
    }

    setContacts(Array.isArray(contactsData) ? contactsData : []);

    if (stepsRes.ok) {
      const stepsData: SequenceStep[] = await stepsRes.json().catch(() => []);
      setStep1(stepsData.find((s) => s.step_number === 1) ?? null);
    }
  }, [campaignId]);

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, [loadContacts]);

  const selectableContacts = useMemo(
    () => contacts.filter((contact) => contact.status === "not_started"),
    [contacts]
  );

  const allSelectableSelected =
    selectableContacts.length > 0 &&
    selectableContacts.every((contact) => selectedIds.has(contact.id));

  function toggleContact(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableContacts.map((contact) => contact.id)));
  }

  async function updateStatus(contactId: string, status: "replied" | "bounced") {
    const res = await fetch(
      `/api/campaigns/${campaignId}/contacts/${contactId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to update contact"
      );
      return;
    }

    toast.success(
      status === "replied" ? "Marked as replied" : "Marked as bounced"
    );
    void loadContacts();
  }

  async function removeContact(contactId: string) {
    const res = await fetch(
      `/api/campaigns/${campaignId}/contacts/${contactId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data.error === "string" ? data.error : "Failed to remove contact"
      );
      return;
    }

    toast.success("Contact removed");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(contactId);
      return next;
    });
    void loadContacts();
  }

  async function handleSendInitialEmail() {
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

    const queued = data.queued ?? 0;
    const skipped = data.skipped ?? 0;

    const msg = skipped > 0
      ? `${queued} email${queued !== 1 ? "s" : ""} queued — they'll be sent within the hour (${skipped} skipped)`
      : `${queued} email${queued !== 1 ? "s" : ""} queued — they'll be sent within the hour`;
    toast.success(msg);
    setSelectedIds(new Set());
    void loadContacts();
  }

  const countLabel =
    contacts.length === 1 ? "1 contact" : `${contacts.length} contacts`;

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-sm text-muted">{countLabel}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAddContactOpen(true)}>
            Add Contact
          </Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            {selectedIds.size}{" "}
            {selectedIds.size === 1 ? "contact" : "contacts"} selected
          </p>
          <Button size="sm" disabled={sending} onClick={handleSendInitialEmail}>
            {sending ? "Sending…" : "Send Initial Email"}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted">Loading contacts…</p>
      ) : fetchError ? (
        <p className="text-sm text-danger">{fetchError}</p>
      ) : contacts.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <p className="text-base font-medium text-foreground">
            No contacts yet
          </p>
          <p className="mt-2 text-sm text-muted">
            Import a CSV to get started
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-6"
            onClick={() => setImportOpen(true)}
          >
            Import CSV
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleSelectAll}
                    disabled={selectableContacts.length === 0}
                    aria-label="Select all contacts"
                    className="h-4 w-4 rounded border-border bg-background accent-foreground disabled:opacity-40"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Email</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Added</th>
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const selectable = contact.status === "not_started";

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        disabled={!selectable}
                        aria-label={`Select ${contact.email}`}
                        className={cn(
                          "h-4 w-4 rounded border-border bg-background accent-foreground disabled:cursor-not-allowed disabled:opacity-40",
                          !selectable && "opacity-40"
                        )}
                      />
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-foreground",
                        !selectable && "opacity-60"
                      )}
                    >
                      {contact.name || "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-muted",
                        !selectable && "opacity-60"
                      )}
                    >
                      {contact.email}
                    </td>
                    <td className="px-4 py-3">
                      <ContactStatusBadge status={contact.status} />
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-muted",
                        !selectable && "opacity-60"
                      )}
                    >
                      {formatDistanceToNow(new Date(contact.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {selectable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 px-2 text-xs"
                            onClick={() => setComposingContact(contact)}
                          >
                            <Pencil className="h-3 w-3" />
                            Compose
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted"
                              aria-label="Contact actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus(contact.id, "replied")
                              }
                            >
                              Mark as Replied
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus(contact.id, "bounced")
                              }
                            >
                              Mark as Bounced
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-danger focus:text-danger"
                              onClick={() => removeContact(contact.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddContactDialog
        campaignId={campaignId}
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        onAdded={() => void loadContacts()}
      />

      <ImportCsvDialog
        campaignId={campaignId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setLoading(false);
          void loadContacts();
        }}
      />

      <ComposeEmailSheet
        campaignId={campaignId}
        contact={composingContact}
        step1={step1}
        open={composingContact !== null}
        onOpenChange={(open) => { if (!open) setComposingContact(null); }}
        onSent={() => void loadContacts()}
      />
    </div>
  );
}
