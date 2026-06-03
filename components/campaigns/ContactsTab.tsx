"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContactStatusBadge } from "@/components/campaigns/ContactStatusBadge";
import { ImportCsvDialog } from "@/components/campaigns/ImportCsvDialog";
import type { Contact } from "@/lib/types/contact";

type ContactsTabProps = {
  campaignId: string;
};

export function ContactsTab({ campaignId }: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    setFetchError(null);
    const res = await fetch(`/api/campaigns/${campaignId}/contacts`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFetchError(
        typeof data.error === "string" ? data.error : "Failed to load contacts"
      );
      setContacts([]);
      return;
    }

    setContacts(Array.isArray(data) ? data : []);
  }, [campaignId]);

  useEffect(() => {
    loadContacts().finally(() => setLoading(false));
  }, [loadContacts]);

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
    void loadContacts();
  }

  const countLabel =
    contacts.length === 1 ? "1 contact" : `${contacts.length} contacts`;

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-sm text-muted">{countLabel}</p>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          Import CSV
        </Button>
      </div>

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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/80">
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
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-foreground">
                    {contact.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{contact.email}</td>
                  <td className="px-4 py-3">
                    <ContactStatusBadge status={contact.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDistanceToNow(new Date(contact.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ImportCsvDialog
        campaignId={campaignId}
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setLoading(false);
          void loadContacts();
        }}
      />
    </div>
  );
}
