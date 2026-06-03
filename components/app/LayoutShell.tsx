"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";

function shouldShowAppShell(pathname: string) {
  return (
    pathname.startsWith("/campaigns") || pathname.startsWith("/settings")
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!shouldShowAppShell(pathname)) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
