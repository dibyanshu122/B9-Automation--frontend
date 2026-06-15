export default function TemplatesLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gray-100" />
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
