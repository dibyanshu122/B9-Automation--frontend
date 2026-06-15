export default function BillingLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-28 animate-pulse rounded-xl bg-gray-100" />
      {/* Current plan card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-gray-100" />
            <div className="h-8 w-24 rounded bg-gray-100" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-gray-100" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
      {/* Plan options */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3 animate-pulse">
            <div className="h-5 w-24 rounded bg-gray-100" />
            <div className="h-8 w-20 rounded bg-gray-100" />
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 w-full rounded bg-gray-100" />
              ))}
            </div>
            <div className="h-10 w-full rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
