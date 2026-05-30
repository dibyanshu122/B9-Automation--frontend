export default function CampaignsLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
