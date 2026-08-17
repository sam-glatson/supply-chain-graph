export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

export function DbStatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        connected
          ? "bg-emerald-100 text-emerald-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {connected ? "CognoDB connected" : "Database unavailable"}
    </span>
  );
}
