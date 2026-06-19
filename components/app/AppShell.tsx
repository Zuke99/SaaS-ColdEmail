import { AppSidebar } from "@/components/app/AppSidebar";
import { GmailTokenBanner } from "@/components/app/GmailTokenBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-60">
        <GmailTokenBanner />
        {children}
      </div>
    </div>
  );
}
