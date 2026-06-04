import type { CampaignStats } from "@/lib/types/contact";

type CampaignStatsStripProps = {
  stats: CampaignStats;
};

const items: { key: keyof CampaignStats; label: string }[] = [
  { key: "total_contacts", label: "Contacts" },
  { key: "sent", label: "Sent" },
  { key: "opened", label: "Opened" },
  { key: "replied", label: "Replied" },
];

export function CampaignStatsStrip({ stats }: CampaignStatsStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border px-4 py-3 sm:px-6">
      {items.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-muted">{label}</span>
          <span className="font-mono text-sm font-medium text-foreground">
            {stats[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
