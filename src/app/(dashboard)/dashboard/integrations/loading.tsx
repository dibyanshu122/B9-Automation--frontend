export default function IntegrationsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gray-100" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 rounded bg-gray-100" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-9 w-full rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
