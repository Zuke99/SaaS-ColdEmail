"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CsvRow = Record<string, string>;

type ImportCsvDialogProps = {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export function ImportCsvDialog({
  campaignId,
  open,
  onOpenChange,
  onImported,
}: ImportCsvDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map">("upload");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [nameColumn, setNameColumn] = useState("");
  const [emailColumn, setEmailColumn] = useState("");
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setColumns([]);
    setNameColumn("");
    setEmailColumn("");
    setImporting(false);
    setDragOver(false);
  }, []);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function parseFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data.filter((row) =>
          Object.values(row).some((v) => String(v ?? "").trim() !== "")
        );

        if (data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const cols = Object.keys(data[0] ?? {});
        const emailGuess =
          cols.find((c) => /email/i.test(c)) ?? cols[0] ?? "";
        const nameGuess =
          cols.find((c) => /name/i.test(c) && !/email/i.test(c)) ??
          cols.find((c) => /name/i.test(c)) ??
          "";

        setRows(data);
        setColumns(cols);
        setEmailColumn(emailGuess);
        setNameColumn(nameGuess);
        setStep("map");
      },
      error: () => {
        toast.error("Failed to parse CSV");
      },
    });
  }

  function handleFileSelect(file: File | undefined) {
    if (file) parseFile(file);
  }

  const previewRows = useMemo(() => rows.slice(0, 3), [rows]);

  const mappedContacts = useMemo(() => {
    if (!emailColumn) return [];
    return rows
      .map((row) => ({
        name: nameColumn ? (row[nameColumn]?.trim() || null) : null,
        email: row[emailColumn]?.trim() ?? "",
      }))
      .filter((c) => c.email.length > 0);
  }, [rows, nameColumn, emailColumn]);

  const firstPreview = mappedContacts[0];

  async function handleImport() {
    if (!emailColumn) {
      toast.error("Select an email column");
      return;
    }

    setImporting(true);
    const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: mappedContacts }),
    });
    const data = await res.json().catch(() => ({}));
    setImporting(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === "string" ? data.error : "Import failed"
      );
      return;
    }

    const inserted = data.inserted ?? 0;
    const skipped = data.skipped ?? 0;

    if (skipped > 0) {
      toast.success(`Imported ${inserted} contacts, ${skipped} skipped`);
    } else {
      toast.success(`Imported ${inserted} contacts`);
    }

    handleOpenChange(false);
    onImported();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Upload a CSV file with your contacts"
              : "Map your CSV columns to contact fields"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div
            role="button"
            tabIndex={0}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={cn(
              "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-10 text-center transition-colors",
              dragOver && "border-foreground/40 bg-surface"
            )}
          >
            <Upload className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">
              Drag and drop your CSV here
            </p>
            <p className="mt-1 text-xs text-muted">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/80">
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 font-medium text-muted"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0"
                    >
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="max-w-[120px] truncate px-3 py-2 text-foreground"
                        >
                          {row[col] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Name column
                </label>
                <select
                  value={nameColumn}
                  onChange={(e) => setNameColumn(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
                >
                  <option value="">— None —</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email column <span className="text-danger">*</span>
                </label>
                <select
                  value={emailColumn}
                  onChange={(e) => setEmailColumn(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border"
                >
                  <option value="">Select column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {firstPreview ? (
              <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted">
                <span className="text-foreground">Preview: </span>
                Name: {firstPreview.name || "—"} | Email: {firstPreview.email}
              </p>
            ) : null}

            <Button
              className="w-full"
              disabled={!emailColumn || importing || mappedContacts.length === 0}
              onClick={handleImport}
            >
              {importing
                ? "Importing…"
                : `Import ${mappedContacts.length} contacts`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
