export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-36 animate-pulse rounded-xl bg-gray-100" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
