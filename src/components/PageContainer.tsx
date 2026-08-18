export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:py-8 lg:pb-8">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
