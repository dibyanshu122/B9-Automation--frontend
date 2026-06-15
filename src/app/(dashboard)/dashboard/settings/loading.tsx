export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="h-8 w-32 animate-pulse rounded-xl bg-gray-100" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
          <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
