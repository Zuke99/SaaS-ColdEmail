export function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border px-4 py-3 sm:px-6">
        <h1 className="text-sm font-medium uppercase tracking-wide text-muted">
          {title}
        </h1>
      </header>
      <div className="flex-1 p-4 sm:p-6">{children}</div>
    </div>
  );
}
