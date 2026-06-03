import { AppSidebar } from "@/components/app/AppSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-60">{children}</div>
    </div>
  );
}
