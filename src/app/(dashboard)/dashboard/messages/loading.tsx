export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Contact list skeleton */}
      <div className="w-80 shrink-0 border-r border-gray-100 flex flex-col">
        <div className="border-b border-gray-100 p-3">
          <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="flex-1 overflow-hidden p-2 space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-3 w-8 shrink-0 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
      {/* Chat area skeleton */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-10 animate-pulse rounded-2xl bg-gray-100 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 p-3">
          <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
