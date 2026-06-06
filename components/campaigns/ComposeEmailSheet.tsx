"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { Contact } from "@/lib/types/contact";
import type { SequenceStep } from "@/lib/types/sequence";

type Props = {
  campaignId: string;
  contact: Contact | null;
  step1: SequenceStep | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
};

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

function renderTemplate(
  template: string,
  contact: { name: string; email: string }
): string {
  return template.replace(VARIABLE_REGEX, (_, key: string) => {
    const lower = key.toLowerCase();
    if (lower === "name") return contact.name || "";
    if (lower === "email") return contact.email || "";
    return `{{${key}}}`;
  });
}

export function ComposeEmailSheet({
  campaignId,
  contact,
  step1,
  open,
  onOpenChange,
  onSent,
}: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contact) return;
    const contactForRender = { name: contact.name ?? "", email: contact.email };
    setSubject(step1 ? renderTemplate(step1.subject, contactForRender) : "");
    setBody(step1 ? renderTemplate(step1.body, contactForRender) : "");
    setError(null);
  }, [open, contact, step1]);

  async function handleSend() {
    if (!contact) return;
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!body.trim()) {
      setError("Body is required");
      return;
    }

    setSending(true);
    setError(null);

    const res = await fetch(`/api/campaigns/${campaignId}/send-one`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: contact.id, subject, body }),
    });

    const data = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to send");
      return;
    }

    toast.success(`Email sent to ${contact.email}`);
    onOpenChange(false);
    onSent();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Compose Initial Email</SheetTitle>
          <SheetDescription>
            {contact
              ? `To: ${contact.name ? `${contact.name} <${contact.email}>` : contact.email}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="flex flex-1 flex-col space-y-2">
            <Label htmlFor="compose-body">Body</Label>
            <Textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              className="min-h-[320px] flex-1 resize-none font-mono text-sm"
            />
          </div>

          {!step1 && (
            <p className="rounded-md border border-pending/30 bg-pending/10 px-3 py-2 text-xs text-pending">
              No Step 1 template found in the sequence. You can still write a
              custom email above.
            </p>
          )}

          {error && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <SheetFooter className="px-6 pb-6">
          <Button
            className="w-full"
            disabled={sending}
            onClick={handleSend}
          >
            {sending ? "Sending…" : "Send Email"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
