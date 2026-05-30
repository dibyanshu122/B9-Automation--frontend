export default function AutomationsLoading() {
  return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-3 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
