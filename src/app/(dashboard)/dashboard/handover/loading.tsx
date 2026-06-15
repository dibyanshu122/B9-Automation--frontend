export default function HandoverLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
            <div className="h-11 w-11 shrink-0 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-gray-100" />
              <div className="h-3 w-64 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100" />
            <div className="h-9 w-24 rounded-xl bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
