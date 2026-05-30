export default function LeadsLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
